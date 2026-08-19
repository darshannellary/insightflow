import { deriveCapabilities } from '../analytics/capabilities'
import type { Dataset, EventRecord } from '../types/dataset'

function cleanString(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseTimestamp(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null
  const parsed = new Date(value.trim())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function parseRevenue(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

export class DatasetBuildError extends Error {}

export function buildDataset(
  rows: Record<string, string>[],
  headers: string[],
  fileName: string,
  isSample: boolean,
): Dataset {
  if (!headers.includes('user_id')) {
    throw new DatasetBuildError(
      'This file has no "user_id" column. InsightFlow needs a user_id column to identify users.',
    )
  }

  const events: EventRecord[] = []
  const userFirstSeen = new Map<string, Date>()
  let minDate: Date | null = null
  let maxDate: Date | null = null

  for (const row of rows) {
    const userId = cleanString(row.user_id)
    if (!userId) continue

    const timestamp = parseTimestamp(row.timestamp)
    const record: EventRecord = {
      userId,
      event: cleanString(row.event) ?? 'event',
      timestamp,
      plan: cleanString(row.plan),
      device: cleanString(row.device),
      country: cleanString(row.country),
      revenue: parseRevenue(row.revenue),
    }
    events.push(record)

    if (timestamp) {
      const existing = userFirstSeen.get(userId)
      if (!existing || timestamp.getTime() < existing.getTime()) {
        userFirstSeen.set(userId, timestamp)
      }
      if (!minDate || timestamp.getTime() < minDate.getTime()) minDate = timestamp
      if (!maxDate || timestamp.getTime() > maxDate.getTime()) maxDate = timestamp
    }
  }

  if (events.length === 0) {
    throw new DatasetBuildError('No valid rows with a user_id were found in this file.')
  }

  const users: string[] = []
  const seenUsers = new Set<string>()
  for (const event of events) {
    if (!seenUsers.has(event.userId)) {
      seenUsers.add(event.userId)
      users.push(event.userId)
    }
  }

  const capabilities = deriveCapabilities(headers, events)

  return {
    events,
    users,
    userFirstSeen,
    dateRange: minDate && maxDate ? { min: minDate, max: maxDate } : null,
    columns: headers,
    capabilities,
    meta: {
      fileName,
      rowCount: rows.length,
      userCount: users.length,
      eventCount: events.length,
      isSample,
    },
  }
}
