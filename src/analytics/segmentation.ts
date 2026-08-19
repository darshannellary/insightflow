import type { Dataset, EventRecord } from '../types/dataset'
import { addDays, dayKey, startOfWeek } from '../utils/dateUtils'
import { titleCase } from '../utils/formatting'

export type SegmentDimension = 'plan' | 'device' | 'country'

export interface SegmentStat {
  dimension: SegmentDimension
  value: string
  users: number
  activationRate: number
  conversionRate: number
  retentionW1: number | null
  revenue: number
  arpu: number
}

export function detectDimensions(dataset: Dataset): SegmentDimension[] {
  const dims: SegmentDimension[] = []
  if (dataset.capabilities.hasPlan) dims.push('plan')
  if (dataset.capabilities.hasDevice) dims.push('device')
  if (dataset.capabilities.hasCountry) dims.push('country')
  return dims
}

function dimensionValue(event: EventRecord, dimension: SegmentDimension): string | undefined {
  return event[dimension]
}

/** Each user's representative value for a dimension is the most common non-empty value across their events. */
function perUserDimensionValue(dataset: Dataset, dimension: SegmentDimension): Map<string, string> {
  const counts = new Map<string, Map<string, number>>() // userId -> value -> count
  for (const event of dataset.events) {
    const value = dimensionValue(event, dimension)
    if (!value) continue
    if (!counts.has(event.userId)) counts.set(event.userId, new Map())
    const userCounts = counts.get(event.userId)!
    userCounts.set(value, (userCounts.get(value) ?? 0) + 1)
  }

  const result = new Map<string, string>()
  for (const [userId, userCounts] of counts.entries()) {
    let bestValue = ''
    let bestCount = -1
    for (const [value, count] of userCounts.entries()) {
      // >= so that on a tie, the most-recently-encountered value wins (e.g. a user
      // tagged 'free' at signup and 'pro' once at purchase should count as 'pro').
      if (count >= bestCount) {
        bestValue = value
        bestCount = count
      }
    }
    result.set(userId, bestValue)
  }
  return result
}

function buildWeek1RetentionMap(dataset: Dataset): Map<string, boolean> {
  const retained = new Map<string, boolean>()
  if (!dataset.dateRange) return retained

  const activeWeeks = new Map<string, Set<string>>()
  for (const event of dataset.events) {
    if (!event.timestamp) continue
    const key = dayKey(startOfWeek(event.timestamp))
    if (!activeWeeks.has(key)) activeWeeks.set(key, new Set())
    activeWeeks.get(key)!.add(event.userId)
  }

  const datasetMaxWeek = startOfWeek(dataset.dateRange.max)

  for (const [userId, firstSeen] of dataset.userFirstSeen.entries()) {
    const w1Start = addDays(startOfWeek(firstSeen), 7)
    if (w1Start.getTime() > datasetMaxWeek.getTime()) continue // not enough time has passed
    const activeSet = activeWeeks.get(dayKey(w1Start))
    retained.set(userId, activeSet?.has(userId) ?? false)
  }
  return retained
}

export function computeSegmentStats(dataset: Dataset, dimension: SegmentDimension): SegmentStat[] {
  const userValue = perUserDimensionValue(dataset, dimension)
  const week1Retention = buildWeek1RetentionMap(dataset)

  const groups = new Map<string, Set<string>>()
  for (const [userId, value] of userValue.entries()) {
    if (!groups.has(value)) groups.set(value, new Set())
    groups.get(value)!.add(userId)
  }

  const activatedUsers = new Set<string>()
  const convertedUsers = new Set<string>()
  const revenueByUser = new Map<string, number>()
  for (const event of dataset.events) {
    if (event.event === 'onboarding_complete') activatedUsers.add(event.userId)
    if (event.event === 'purchase' || event.event === 'subscription') convertedUsers.add(event.userId)
    if (event.revenue) revenueByUser.set(event.userId, (revenueByUser.get(event.userId) ?? 0) + event.revenue)
  }

  const stats: SegmentStat[] = []
  for (const [value, users] of groups.entries()) {
    let activated = 0
    let converted = 0
    let revenue = 0
    let retainedCount = 0
    let retainedKnown = 0

    for (const userId of users) {
      if (activatedUsers.has(userId)) activated++
      if (convertedUsers.has(userId)) converted++
      revenue += revenueByUser.get(userId) ?? 0
      const retained = week1Retention.get(userId)
      if (retained !== undefined) {
        retainedKnown++
        if (retained) retainedCount++
      }
    }

    stats.push({
      dimension,
      value,
      users: users.size,
      activationRate: users.size > 0 ? (activated / users.size) * 100 : 0,
      conversionRate: users.size > 0 ? (converted / users.size) * 100 : 0,
      retentionW1: retainedKnown > 0 ? (retainedCount / retainedKnown) * 100 : null,
      revenue,
      arpu: users.size > 0 ? revenue / users.size : 0,
    })
  }

  return stats.sort((a, b) => b.users - a.users)
}

export function generateComparativeSentences(stats: SegmentStat[]): string[] {
  const meaningful = stats.filter((s) => s.users >= 10)
  if (meaningful.length < 2) return []

  const sentences: string[] = []

  // "Conversion by plan" is close to tautological — plan is usually assigned *because*
  // a user converted, so it isn't a meaningful comparison the way device/country are.
  const isPlanDimension = stats[0]?.dimension === 'plan'

  const byConversion = [...meaningful].sort((a, b) => b.conversionRate - a.conversionRate)
  const topConv = byConversion[0]
  const bottomConv = byConversion[byConversion.length - 1]
  if (!isPlanDimension && topConv.value !== bottomConv.value) {
    if (topConv.conversionRate > 0 && bottomConv.conversionRate > 0) {
      const ratio = topConv.conversionRate / bottomConv.conversionRate
      if (ratio >= 1.15) {
        sentences.push(
          `${titleCase(topConv.value)} users convert ${ratio.toFixed(2)}× more often than ${titleCase(bottomConv.value)} users.`,
        )
      }
    } else if (topConv.conversionRate > 0 && bottomConv.conversionRate === 0) {
      sentences.push(
        `${titleCase(topConv.value)} users convert at ${topConv.conversionRate.toFixed(1)}%, while ${titleCase(bottomConv.value)} users have not converted yet.`,
      )
    }
  }

  const byArpu = [...meaningful].sort((a, b) => b.arpu - a.arpu)
  const topArpu = byArpu[0]
  const bottomArpu = byArpu[byArpu.length - 1]
  if (topArpu.value !== bottomArpu.value && topArpu.arpu > 0) {
    if (bottomArpu.arpu > 0) {
      const ratio = topArpu.arpu / bottomArpu.arpu
      if (ratio >= 1.15) {
        sentences.push(
          `${titleCase(topArpu.value)} users generate ${ratio.toFixed(2)}× more revenue per user than ${titleCase(bottomArpu.value)} users.`,
        )
      }
    } else {
      sentences.push(`${titleCase(topArpu.value)} users generate the most revenue per user.`)
    }
  }

  return sentences
}
