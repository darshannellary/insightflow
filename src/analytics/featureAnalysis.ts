import type { Dataset, TimeSeriesPoint } from '../types/dataset'
import { dayKey, startOfWeek } from '../utils/dateUtils'
import { featureLabel } from '../utils/formatting'
import { computeTrend } from './trends'

export interface FeatureStat {
  name: string
  label: string
  uniqueUsers: number
  usagePct: number
  avgUsagePerUser: number
  conversionCorrelation: number | null
  trend: 'up' | 'down' | 'flat'
}

export type FeatureOpportunity = 'HIGH_ADOPTION_HIGH_CORRELATION' | 'LOW_ADOPTION_HIGH_CORRELATION'

export function detectFeatureEvents(dataset: Dataset): string[] {
  return dataset.capabilities.featureEventNames
}

export function computeFeatureStats(dataset: Dataset): FeatureStat[] {
  const featureNames = detectFeatureEvents(dataset)
  if (featureNames.length === 0 || dataset.users.length === 0) return []

  const convertedUsers = new Set<string>()
  for (const event of dataset.events) {
    if (event.event === 'purchase' || event.event === 'subscription') convertedUsers.add(event.userId)
  }
  const hasConversionData = dataset.capabilities.hasPurchase

  return featureNames.map((name) => {
    const usersOfFeature = new Set<string>()
    const usageCounts = new Map<string, number>()
    const weeklyBuckets = new Map<string, number>()

    for (const event of dataset.events) {
      if (event.event !== name) continue
      usersOfFeature.add(event.userId)
      usageCounts.set(event.userId, (usageCounts.get(event.userId) ?? 0) + 1)
      if (event.timestamp) {
        const key = dayKey(startOfWeek(event.timestamp))
        weeklyBuckets.set(key, (weeklyBuckets.get(key) ?? 0) + 1)
      }
    }

    const series: TimeSeriesPoint[] = [...weeklyBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }))

    let conversionCorrelation: number | null = null
    if (hasConversionData) {
      let convertedWithFeature = 0
      for (const userId of usersOfFeature) if (convertedUsers.has(userId)) convertedWithFeature++
      const convRateWith = usersOfFeature.size > 0 ? convertedWithFeature / usersOfFeature.size : 0

      let convertedWithout = 0
      let withoutCount = 0
      for (const userId of dataset.users) {
        if (usersOfFeature.has(userId)) continue
        withoutCount++
        if (convertedUsers.has(userId)) convertedWithout++
      }
      const convRateWithout = withoutCount > 0 ? convertedWithout / withoutCount : 0
      conversionCorrelation = convRateWithout > 0 ? convRateWith / convRateWithout : null
    }

    const totalUsage = [...usageCounts.values()].reduce((sum, n) => sum + n, 0)

    return {
      name,
      label: featureLabel(name),
      uniqueUsers: usersOfFeature.size,
      usagePct: (usersOfFeature.size / dataset.users.length) * 100,
      avgUsagePerUser: usersOfFeature.size > 0 ? totalUsage / usersOfFeature.size : 0,
      conversionCorrelation,
      trend: computeTrend(series).direction,
    }
  })
}

export function classifyOpportunity(stat: FeatureStat): FeatureOpportunity | null {
  if (stat.conversionCorrelation === null) return null
  if (stat.usagePct > 50 && stat.conversionCorrelation > 1.3) return 'HIGH_ADOPTION_HIGH_CORRELATION'
  if (stat.usagePct < 25 && stat.conversionCorrelation > 1.3) return 'LOW_ADOPTION_HIGH_CORRELATION'
  return null
}
