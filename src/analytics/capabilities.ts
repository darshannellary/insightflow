import type { CapabilityFlags, EventRecord } from '../types/dataset'

export function deriveCapabilities(headers: string[], events: EventRecord[]): CapabilityFlags {
  const has = (col: string) => headers.includes(col)

  const eventNames = new Set(events.map((e) => e.event))
  const featureEventNames = [...eventNames].filter((name) => name.startsWith('feature_')).sort()

  const hasTimestamp = has('timestamp') && events.some((e) => e.timestamp !== null)
  const hasRevenue = has('revenue') && events.some((e) => e.revenue !== undefined && e.revenue > 0)

  return {
    hasEvent: has('event'),
    hasTimestamp,
    hasPlan: has('plan') && events.some((e) => !!e.plan),
    hasDevice: has('device') && events.some((e) => !!e.device),
    hasCountry: has('country') && events.some((e) => !!e.country),
    hasRevenue,
    hasSignup: eventNames.has('signup'),
    hasOnboarding: eventNames.has('onboarding_complete'),
    hasPurchase: eventNames.has('purchase') || eventNames.has('subscription'),
    hasFeatureEvents: featureEventNames.length > 0,
    featureEventNames,
  }
}
