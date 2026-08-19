import type { Dataset } from '../types/dataset'
import { addDays, dayKey, startOfWeek } from '../utils/dateUtils'
import { formatWeekLabel } from '../utils/dateUtils'

export interface CohortRow {
  cohortLabel: string
  cohortStart: Date
  cohortSize: number
  /** Percent retained per period; index 0 is always 100. `null` = period hasn't happened yet. */
  retention: (number | null)[]
}

export interface CohortTable {
  rows: CohortRow[]
  periods: number
}

export function computeCohortRetention(dataset: Dataset, periods = 5): CohortTable {
  if (!dataset.capabilities.hasTimestamp || !dataset.dateRange) return { rows: [], periods }

  const cohortUsers = new Map<string, Set<string>>() // weekKey -> userIds
  const cohortStarts = new Map<string, Date>()
  for (const [userId, firstSeen] of dataset.userFirstSeen.entries()) {
    const weekStart = startOfWeek(firstSeen)
    const key = dayKey(weekStart)
    if (!cohortUsers.has(key)) {
      cohortUsers.set(key, new Set())
      cohortStarts.set(key, weekStart)
    }
    cohortUsers.get(key)!.add(userId)
  }

  const activeWeeks = new Map<string, Set<string>>() // weekKey -> userIds active that week
  for (const event of dataset.events) {
    if (!event.timestamp) continue
    const key = dayKey(startOfWeek(event.timestamp))
    if (!activeWeeks.has(key)) activeWeeks.set(key, new Set())
    activeWeeks.get(key)!.add(event.userId)
  }

  const datasetMaxWeek = startOfWeek(dataset.dateRange.max)

  const rows: CohortRow[] = [...cohortStarts.entries()]
    .sort(([, a], [, b]) => a.getTime() - b.getTime())
    .map(([key, cohortStart]) => {
      const users = cohortUsers.get(key)!
      const retention: (number | null)[] = []
      for (let p = 0; p < periods; p++) {
        if (p === 0) {
          retention.push(100)
          continue
        }
        const targetWeekStart = addDays(cohortStart, p * 7)
        if (targetWeekStart.getTime() > datasetMaxWeek.getTime()) {
          retention.push(null)
          continue
        }
        const activeSet = activeWeeks.get(dayKey(targetWeekStart)) ?? new Set<string>()
        let retained = 0
        for (const userId of users) if (activeSet.has(userId)) retained++
        retention.push(users.size > 0 ? (retained / users.size) * 100 : 0)
      }
      return {
        cohortLabel: formatWeekLabel(cohortStart),
        cohortStart,
        cohortSize: users.size,
        retention,
      }
    })

  return { rows, periods }
}

/** Compares cohorts using Week 1 retention, the earliest period observable for nearly every cohort. */
export function getBestWorstCohort(table: CohortTable): { best: CohortRow | null; worst: CohortRow | null } {
  let best: CohortRow | null = null
  let worst: CohortRow | null = null
  for (const row of table.rows) {
    const w1 = row.retention[1]
    if (w1 === null || w1 === undefined) continue
    if (!best || w1 > (best.retention[1] as number)) best = row
    if (!worst || w1 < (worst.retention[1] as number)) worst = row
  }
  return { best, worst }
}

export function getAverageRetention(table: CohortTable, periodIndex: number): number | null {
  const values = table.rows
    .map((row) => row.retention[periodIndex])
    .filter((v): v is number => v !== null && v !== undefined)
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}
