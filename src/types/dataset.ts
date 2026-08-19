export interface EventRecord {
  userId: string
  event: string
  timestamp: Date | null
  plan?: string
  device?: string
  country?: string
  revenue?: number
}

export interface CapabilityFlags {
  hasEvent: boolean
  hasTimestamp: boolean
  hasPlan: boolean
  hasDevice: boolean
  hasCountry: boolean
  hasRevenue: boolean
  hasSignup: boolean
  hasOnboarding: boolean
  hasPurchase: boolean
  hasFeatureEvents: boolean
  featureEventNames: string[]
}

export interface DatasetMeta {
  fileName: string
  rowCount: number
  userCount: number
  eventCount: number
  isSample: boolean
}

export interface Dataset {
  events: EventRecord[]
  users: string[]
  userFirstSeen: Map<string, Date>
  dateRange: { min: Date; max: Date } | null
  columns: string[]
  capabilities: CapabilityFlags
  meta: DatasetMeta
}

export type RangePreset = '7d' | '30d' | '90d' | 'all'

export type TrendDirection = 'up' | 'down' | 'flat'

export interface TimeSeriesPoint {
  date: string
  value: number
}
