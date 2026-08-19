import type { Dataset, RangePreset, TimeSeriesPoint, TrendDirection } from '../types/dataset'
import { addDays, dayKey, diffInDays, resolveRange, startOfWeek } from '../utils/dateUtils'

export interface KPIValue {
  key: string
  label: string
  value: number
  format: 'number' | 'percent' | 'currency'
  change: number | null
  trend: TrendDirection
  available: boolean
  unavailableReason?: string
}

function trendFromChange(change: number | null): TrendDirection {
  if (change === null) return 'flat'
  if (change > 0.5) return 'up'
  if (change < -0.5) return 'down'
  return 'flat'
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return ((current - previous) / previous) * 100
}

function previousWindow(start: Date, end: Date): { start: Date; end: Date } {
  const lengthDays = diffInDays(end, start) + 1
  const prevEnd = addDays(start, -1)
  const prevStart = addDays(prevEnd, -(lengthDays - 1))
  return { start: prevStart, end: prevEnd }
}

function inWindow(timestamp: Date | null, start: Date, end: Date): boolean {
  if (!timestamp) return false
  return timestamp.getTime() >= start.getTime() && timestamp.getTime() <= addDays(end, 1).getTime()
}

function uniqueUsersInWindow(dataset: Dataset, start: Date, end: Date): Set<string> {
  const users = new Set<string>()
  for (const event of dataset.events) {
    if (inWindow(event.timestamp, start, end)) users.add(event.userId)
  }
  return users
}

function newUsersInWindow(dataset: Dataset, start: Date, end: Date): Set<string> {
  const users = new Set<string>()
  for (const [userId, firstSeen] of dataset.userFirstSeen.entries()) {
    if (inWindow(firstSeen, start, end)) users.add(userId)
  }
  return users
}

function totalUsersUpTo(dataset: Dataset, end: Date): number {
  let count = 0
  for (const firstSeen of dataset.userFirstSeen.values()) {
    if (firstSeen.getTime() <= addDays(end, 1).getTime()) count++
  }
  return count
}

function usersWithEvent(users: Iterable<string>, dataset: Dataset, eventNames: string[]): Set<string> {
  const userSet = new Set(users)
  const matched = new Set<string>()
  for (const event of dataset.events) {
    if (userSet.has(event.userId) && eventNames.includes(event.event)) matched.add(event.userId)
  }
  return matched
}

function revenueInWindow(dataset: Dataset, start: Date, end: Date): number {
  let total = 0
  for (const event of dataset.events) {
    if (event.revenue && inWindow(event.timestamp, start, end)) total += event.revenue
  }
  return total
}

export function computeKPIs(dataset: Dataset, range: RangePreset): KPIValue[] {
  const resolved = resolveRange(range, dataset.dateRange)
  const kpis: KPIValue[] = []

  if (!resolved || !dataset.capabilities.hasTimestamp) {
    kpis.push({
      key: 'totalUsers',
      label: 'Total Users',
      value: dataset.users.length,
      format: 'number',
      change: null,
      trend: 'flat',
      available: true,
    })
    return kpis
  }

  const { start, end } = resolved
  const prev = previousWindow(start, end)
  const isAllRange = range === 'all'

  const activeUsers = uniqueUsersInWindow(dataset, start, end)
  const prevActiveUsers = uniqueUsersInWindow(dataset, prev.start, prev.end)
  const newUsers = newUsersInWindow(dataset, start, end)
  const prevNewUsers = newUsersInWindow(dataset, prev.start, prev.end)

  const totalUsersNow = totalUsersUpTo(dataset, end)
  const totalUsersPrev = totalUsersUpTo(dataset, prev.end)

  kpis.push({
    key: 'totalUsers',
    label: 'Total Users',
    value: totalUsersNow,
    format: 'number',
    change: isAllRange ? null : pctChange(totalUsersNow, totalUsersPrev),
    trend: isAllRange ? 'flat' : trendFromChange(pctChange(totalUsersNow, totalUsersPrev)),
    available: true,
  })

  kpis.push({
    key: 'activeUsers',
    label: 'Active Users',
    value: activeUsers.size,
    format: 'number',
    change: isAllRange ? null : pctChange(activeUsers.size, prevActiveUsers.size),
    trend: isAllRange ? 'flat' : trendFromChange(pctChange(activeUsers.size, prevActiveUsers.size)),
    available: true,
  })

  kpis.push({
    key: 'newUsers',
    label: 'New Users',
    value: newUsers.size,
    format: 'number',
    change: isAllRange ? null : pctChange(newUsers.size, prevNewUsers.size),
    trend: isAllRange ? 'flat' : trendFromChange(pctChange(newUsers.size, prevNewUsers.size)),
    available: true,
  })

  if (dataset.capabilities.hasOnboarding) {
    const activated = usersWithEvent(newUsers, dataset, ['onboarding_complete'])
    const activationRate = newUsers.size > 0 ? (activated.size / newUsers.size) * 100 : 0
    const prevActivated = usersWithEvent(prevNewUsers, dataset, ['onboarding_complete'])
    const prevActivationRate = prevNewUsers.size > 0 ? (prevActivated.size / prevNewUsers.size) * 100 : 0
    kpis.push({
      key: 'activationRate',
      label: 'Activation Rate',
      value: activationRate,
      format: 'percent',
      change: isAllRange ? null : pctChange(activationRate, prevActivationRate),
      trend: isAllRange ? 'flat' : trendFromChange(pctChange(activationRate, prevActivationRate)),
      available: true,
    })
  }

  if (dataset.capabilities.hasPurchase) {
    const purchaseEvents = ['purchase', 'subscription']
    const converted = usersWithEvent(newUsers, dataset, purchaseEvents)
    const conversionRate = newUsers.size > 0 ? (converted.size / newUsers.size) * 100 : 0
    const prevConverted = usersWithEvent(prevNewUsers, dataset, purchaseEvents)
    const prevConversionRate =
      prevNewUsers.size > 0 ? (prevConverted.size / prevNewUsers.size) * 100 : 0
    kpis.push({
      key: 'conversionRate',
      label: 'Conversion Rate',
      value: conversionRate,
      format: 'percent',
      change: isAllRange ? null : pctChange(conversionRate, prevConversionRate),
      trend: isAllRange ? 'flat' : trendFromChange(pctChange(conversionRate, prevConversionRate)),
      available: true,
    })
  }

  if (!isAllRange && prevActiveUsers.size > 0) {
    let retained = 0
    for (const userId of prevActiveUsers) if (activeUsers.has(userId)) retained++
    const retentionRate = (retained / prevActiveUsers.size) * 100
    kpis.push({
      key: 'retention',
      label: 'Retention',
      value: retentionRate,
      format: 'percent',
      change: null,
      trend: 'flat',
      available: true,
    })
  }

  if (dataset.capabilities.hasRevenue) {
    const revenue = revenueInWindow(dataset, start, end)
    const prevRevenue = revenueInWindow(dataset, prev.start, prev.end)
    kpis.push({
      key: 'revenue',
      label: 'Revenue',
      value: revenue,
      format: 'currency',
      change: isAllRange ? null : pctChange(revenue, prevRevenue),
      trend: isAllRange ? 'flat' : trendFromChange(pctChange(revenue, prevRevenue)),
      available: true,
    })

    const arpu = activeUsers.size > 0 ? revenue / activeUsers.size : 0
    const prevArpu = prevActiveUsers.size > 0 ? prevRevenue / prevActiveUsers.size : 0
    kpis.push({
      key: 'arpu',
      label: 'ARPU',
      value: arpu,
      format: 'currency',
      change: isAllRange ? null : pctChange(arpu, prevArpu),
      trend: isAllRange ? 'flat' : trendFromChange(pctChange(arpu, prevArpu)),
      available: true,
    })
  }

  return kpis
}

export type TimeSeriesMetric = 'dau' | 'wau' | 'newUsers' | 'events'

export function computeTimeSeries(
  dataset: Dataset,
  metric: TimeSeriesMetric,
  range: RangePreset,
): TimeSeriesPoint[] {
  const resolved = resolveRange(range, dataset.dateRange)
  if (!resolved || !dataset.capabilities.hasTimestamp) return []
  const { start, end } = resolved

  if (metric === 'wau') {
    const buckets = new Map<string, Set<string>>()
    let cursor = startOfWeek(start)
    while (cursor.getTime() <= end.getTime()) {
      buckets.set(dayKey(cursor), new Set())
      cursor = addDays(cursor, 7)
    }
    for (const event of dataset.events) {
      if (!event.timestamp || !inWindow(event.timestamp, start, end)) continue
      const key = dayKey(startOfWeek(event.timestamp))
      if (!buckets.has(key)) buckets.set(key, new Set())
      buckets.get(key)!.add(event.userId)
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, users]) => ({ date, value: users.size }))
  }

  const dayBuckets = new Map<string, Set<string> | number>()
  let cursor = start
  while (cursor.getTime() <= end.getTime()) {
    dayBuckets.set(dayKey(cursor), metric === 'events' ? 0 : new Set<string>())
    cursor = addDays(cursor, 1)
  }

  for (const event of dataset.events) {
    if (!event.timestamp || !inWindow(event.timestamp, start, end)) continue
    const key = dayKey(event.timestamp)
    if (!dayBuckets.has(key)) continue

    if (metric === 'events') {
      dayBuckets.set(key, (dayBuckets.get(key) as number) + 1)
    } else if (metric === 'dau') {
      ;(dayBuckets.get(key) as Set<string>).add(event.userId)
    } else if (metric === 'newUsers') {
      const firstSeen = dataset.userFirstSeen.get(event.userId)
      if (firstSeen && dayKey(firstSeen) === key) {
        ;(dayBuckets.get(key) as Set<string>).add(event.userId)
      }
    }
  }

  return [...dayBuckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: typeof value === 'number' ? value : value.size }))
}

export interface EventBreakdownRow {
  event: string
  count: number
  uniqueUsers: number
  pctOfEvents: number
}

export function computeEventBreakdown(dataset: Dataset, range: RangePreset): EventBreakdownRow[] {
  const resolved = resolveRange(range, dataset.dateRange)
  const counts = new Map<string, number>()
  const users = new Map<string, Set<string>>()
  let total = 0

  for (const event of dataset.events) {
    if (resolved && !inWindow(event.timestamp, resolved.start, resolved.end)) continue
    counts.set(event.event, (counts.get(event.event) ?? 0) + 1)
    if (!users.has(event.event)) users.set(event.event, new Set())
    users.get(event.event)!.add(event.userId)
    total++
  }

  return [...counts.entries()]
    .map(([event, count]) => ({
      event,
      count,
      uniqueUsers: users.get(event)?.size ?? 0,
      pctOfEvents: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}
