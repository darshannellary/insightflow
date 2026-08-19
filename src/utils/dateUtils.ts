import type { RangePreset } from '../types/dataset'

const DAY_MS = 24 * 60 * 60 * 1000

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Monday-anchored start of the ISO week containing `date`. */
export function startOfWeek(date: Date): Date {
  const d = startOfDay(date)
  const day = d.getUTCDay() // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

export function diffInDays(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS)
}

export function diffInWeeks(a: Date, b: Date): number {
  return Math.floor(diffInDays(startOfWeek(a), startOfWeek(b)) / 7)
}

export function rangePresetDays(preset: RangePreset): number | null {
  switch (preset) {
    case '7d':
      return 7
    case '30d':
      return 30
    case '90d':
      return 90
    case 'all':
      return null
  }
}

/** Resolves a range preset against a dataset's max date into [start, end] inclusive day bounds. */
export function resolveRange(
  preset: RangePreset,
  dateRange: { min: Date; max: Date } | null,
): { start: Date; end: Date } | null {
  if (!dateRange) return null
  const end = startOfDay(dateRange.max)
  const days = rangePresetDays(preset)
  if (days === null) return { start: startOfDay(dateRange.min), end }
  const start = addDays(end, -(days - 1))
  const clampedStart = start.getTime() < dateRange.min.getTime() ? startOfDay(dateRange.min) : start
  return { start: clampedStart, end }
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
