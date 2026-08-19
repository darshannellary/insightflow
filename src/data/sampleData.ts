import { buildDataset } from '../utils/datasetBuilder'
import type { Dataset } from '../types/dataset'

/**
 * Deterministic mulberry32 PRNG so the sample dataset is reproducible
 * (same seed always produces the same dataset).
 */
function mulberry32(seed: number): () => number {
  let a = seed | 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

function weightedIndex(weights: number[], rand: () => number): number {
  const total = weights.reduce((sum, w) => sum + w, 0)
  let r = rand() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

// ---------------------------------------------------------------------------
// Population parameters
// ---------------------------------------------------------------------------

const NUM_USERS = 1200
const WEEKS = 9 // dataset spans weeks 0..8
const DAY_MS = 24 * 60 * 60 * 1000
const DATASET_START = Date.UTC(2026, 5, 15) // 2026-06-15
const DATASET_END = DATASET_START + (WEEKS * 7 - 1) * DAY_MS

// Growing signup volume week over week, to look like an early-stage startup.
const SIGNUP_WEEK_WEIGHTS = [0.8, 0.9, 1.0, 1.0, 1.1, 1.1, 1.15, 1.15, 1.2]

const DEVICES = ['desktop', 'mobile', 'tablet'] as const
const DEVICE_WEIGHTS = [0.55, 0.35, 0.1]

const COUNTRIES = ['United States', 'India', 'United Kingdom', 'Germany', 'Brazil', 'Australia']
const COUNTRY_WEIGHTS = [0.32, 0.22, 0.14, 0.12, 0.12, 0.08]

const FEATURES = [
  { name: 'feature_dashboard', adoption: 0.8, conversionMultiplier: 1.8 },
  { name: 'feature_reports', adoption: 0.4, conversionMultiplier: 1.0 },
  { name: 'feature_export', adoption: 0.15, conversionMultiplier: 1.0 },
]
/** Non-onboarded users still explore features, just less often. */
const NON_ONBOARDED_FEATURE_FACTOR = 0.35

// ---------------------------------------------------------------------------
// Embedded pattern constants — each one is deliberately tuned to be strong
// enough for the deterministic insight engine to detect it.
// ---------------------------------------------------------------------------

/** Pattern 1: mobile users convert far less often than desktop users. */
const DEVICE_CONVERSION_MULTIPLIER: Record<string, number> = {
  desktop: 1.0,
  tablet: 0.8,
  mobile: 0.5,
}

/** Pattern 2: users who complete onboarding convert much more often. */
const ONBOARDING_CONVERSION_MULTIPLIER = 3.0
const BASE_ONBOARDING_RATE = 0.62

/** Pattern 4: a calendar week where purchase probability collapses. */
const DIP_WEEK = 6
const DIP_MULTIPLIER = 0.3

/** Pattern 5: the week-3 signup cohort returns far less than its neighbors. */
const COHORT_DIP_WEEK = 3
const COHORT_DIP_MULTIPLIER = 0.5

/** Pattern 6: enterprise purchases are priced well above the base rate. */
const REVENUE_MULTIPLIER = 2.5
const PRICES = { pro: 49, enterprise: Math.round(49 * REVENUE_MULTIPLIER) }

/** Pattern 7: a share of purchasers renew multiple times (repeat revenue). */
const REPEAT_PURCHASER_RATE = 0.18
const CANCELLATION_RATE = 0.1

const BASE_PURCHASE_PROB = 0.03
const BASE_WEEKLY_RETURN = [0.55, 0.42, 0.34, 0.28] // relative weeks 1..4 after signup

interface DraftEvent {
  event: string
  timestamp: number
  revenue: number
  explicitPlan?: 'free' | 'pro' | 'enterprise'
}

function weekStart(week: number): number {
  return DATASET_START + week * 7 * DAY_MS
}

function dateWithinWeek(week: number, rand: () => number): number {
  return weekStart(week) + randInt(rand, 0, 6) * DAY_MS + randInt(rand, 0, 86_399_000)
}

function clampToDataset(timestamp: number): number {
  return Math.min(Math.max(timestamp, DATASET_START), DATASET_END)
}

interface GeneratedRow {
  [key: string]: string
  user_id: string
  event: string
  timestamp: string
  plan: string
  device: string
  country: string
  revenue: string
}

export function generateSampleDataset(seed = 42): GeneratedRow[] {
  const rand = mulberry32(seed)
  const rows: GeneratedRow[] = []

  for (let i = 1; i <= NUM_USERS; i++) {
    const userId = `U${String(i).padStart(5, '0')}`
    const signupWeek = weightedIndex(SIGNUP_WEEK_WEIGHTS, rand)
    const signupDate = clampToDataset(dateWithinWeek(signupWeek, rand))
    const device = DEVICES[weightedIndex(DEVICE_WEIGHTS, rand)]
    const country = COUNTRIES[weightedIndex(COUNTRY_WEIGHTS, rand)]

    const draft: DraftEvent[] = [
      { event: 'signup', timestamp: signupDate, revenue: 0, explicitPlan: 'free' },
    ]

    const onboarded = rand() < BASE_ONBOARDING_RATE
    if (onboarded) {
      const onboardingDate = clampToDataset(signupDate + randInt(rand, 1, 48) * 60 * 60 * 1000)
      draft.push({ event: 'onboarding_complete', timestamp: onboardingDate, revenue: 0 })
    }

    // Feature usage — adoption probability + usage frequency per feature.
    let usesDashboard = false
    for (const feature of FEATURES) {
      const adoptionProb = feature.adoption * (onboarded ? 1.0 : NON_ONBOARDED_FEATURE_FACTOR)
      if (rand() >= adoptionProb) continue
      if (feature.name === 'feature_dashboard') usesDashboard = true

      const usageCount = randInt(rand, 1, 3)
      const remainingWeeks = Math.max(0, WEEKS - 1 - signupWeek)
      for (let k = 0; k < usageCount; k++) {
        const targetWeek = signupWeek + randInt(rand, 0, remainingWeeks)
        const timestamp = clampToDataset(
          Math.max(signupDate + 30 * 60 * 1000, dateWithinWeek(targetWeek, rand)),
        )
        draft.push({ event: feature.name, timestamp, revenue: 0 })
      }
    }

    // Purchase decision.
    const deviceMult = DEVICE_CONVERSION_MULTIPLIER[device]
    const onboardingMult = onboarded ? ONBOARDING_CONVERSION_MULTIPLIER : 1.0
    const dashboardMult = usesDashboard ? FEATURES[0].conversionMultiplier : 1.0
    const maxOffset = Math.max(0, WEEKS - 1 - signupWeek)
    const candidateOffset = Math.floor(rand() * rand() * (maxOffset + 1))
    const candidateWeek = Math.min(signupWeek + candidateOffset, WEEKS - 1)
    const dipMult = candidateWeek === DIP_WEEK ? DIP_MULTIPLIER : 1.0

    const purchaseProb = BASE_PURCHASE_PROB * deviceMult * onboardingMult * dashboardMult * dipMult

    if (rand() < purchaseProb) {
      const purchaseDate = clampToDataset(
        candidateWeek === signupWeek
          ? signupDate + randInt(rand, 1, 72) * 60 * 60 * 1000
          : dateWithinWeek(candidateWeek, rand),
      )
      const chosenPlan: 'pro' | 'enterprise' = rand() < 0.75 ? 'pro' : 'enterprise'
      const amount = chosenPlan === 'pro' ? PRICES.pro : PRICES.enterprise
      draft.push({
        event: 'purchase',
        timestamp: purchaseDate,
        revenue: amount,
        explicitPlan: chosenPlan,
      })
      let lastRevenueEventDate = purchaseDate

      const isRepeat = rand() < REPEAT_PURCHASER_RATE
      if (isRepeat) {
        const repeatCount = randInt(rand, 1, 3)
        let cursor = purchaseDate
        for (let r = 0; r < repeatCount; r++) {
          const next = cursor + randInt(rand, 21, 35) * DAY_MS
          if (next > DATASET_END) break
          draft.push({
            event: 'subscription',
            timestamp: next,
            revenue: amount,
            explicitPlan: chosenPlan,
          })
          cursor = next
          lastRevenueEventDate = next
        }
      }

      if (rand() < CANCELLATION_RATE) {
        const cancelDate = lastRevenueEventDate + randInt(rand, 7, 60) * DAY_MS
        if (cancelDate <= DATASET_END) {
          draft.push({
            event: 'cancellation',
            timestamp: cancelDate,
            revenue: 0,
            explicitPlan: 'free',
          })
        }
      }
    }

    // Weekly return activity, feeding the retention cohort model.
    const cohortDip = signupWeek === COHORT_DIP_WEEK
    for (let relWeek = 1; relWeek <= 4; relWeek++) {
      const calendarWeek = signupWeek + relWeek
      if (calendarWeek > WEEKS - 1) break
      const prob = BASE_WEEKLY_RETURN[relWeek - 1] * (cohortDip ? COHORT_DIP_MULTIPLIER : 1.0)
      if (rand() >= prob) continue
      const opens = rand() < 0.4 ? 2 : 1
      for (let n = 0; n < opens; n++) {
        draft.push({ event: 'app_open', timestamp: dateWithinWeek(calendarWeek, rand), revenue: 0 })
      }
    }

    const finalPlan: 'free' | 'pro' | 'enterprise' =
      draft
        .filter((e) => e.explicitPlan)
        .slice(-1)[0]?.explicitPlan === 'enterprise'
        ? 'enterprise'
        : draft.some((e) => e.explicitPlan === 'pro')
          ? 'pro'
          : 'free'

    for (const event of draft) {
      rows.push({
        user_id: userId,
        event: event.event,
        timestamp: new Date(event.timestamp).toISOString(),
        plan: event.explicitPlan ?? finalPlan,
        device,
        country,
        revenue: String(event.revenue),
      })
    }
  }

  return rows
}

let cachedDataset: Dataset | null = null

export function getSampleDataset(): Dataset {
  if (cachedDataset) return cachedDataset
  const rows = generateSampleDataset()
  const headers = ['user_id', 'event', 'timestamp', 'plan', 'device', 'country', 'revenue']
  cachedDataset = buildDataset(rows, headers, 'sample-dataset.csv', true)
  return cachedDataset
}
