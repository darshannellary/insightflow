import type { Dataset, EventRecord } from '../types/dataset'
import { featureLabel, titleCase } from '../utils/formatting'

export interface FunnelStepResult {
  key: string
  name: string
  users: number
  conversionFromStart: number
  dropOffFromPrevious: number
}

export interface FunnelResult {
  steps: FunnelStepResult[]
}

const DEFAULT_STEP_ORDER = ['signup', 'onboarding_complete', '__feature__', 'purchase']

export function buildDefaultFunnelSteps(dataset: Dataset): string[] {
  const steps: string[] = []
  if (dataset.capabilities.hasSignup) steps.push('signup')
  if (dataset.capabilities.hasOnboarding) steps.push('onboarding_complete')
  if (dataset.capabilities.hasFeatureEvents) steps.push(dataset.capabilities.featureEventNames[0])
  if (dataset.capabilities.hasPurchase) {
    steps.push(dataset.events.some((e) => e.event === 'purchase') ? 'purchase' : 'subscription')
  }
  return steps.length > 0 ? steps : DEFAULT_STEP_ORDER.filter((s) => s !== '__feature__')
}

export function stepLabel(eventName: string): string {
  if (eventName.startsWith('feature_')) return `Used ${featureLabel(eventName)}`
  return titleCase(eventName)
}

export function computeFunnel(events: EventRecord[], steps: string[]): FunnelResult {
  if (steps.length === 0) return { steps: [] }

  // Users who reached step N must have also reached step N-1 (strict funnel).
  let eligible: Set<string> | null = null
  const results: FunnelStepResult[] = []
  let startCount = 0

  for (let i = 0; i < steps.length; i++) {
    const stepEvent = steps[i]
    const usersAtStep = new Set<string>()
    for (const event of events) {
      if (event.event !== stepEvent) continue
      if (eligible && !eligible.has(event.userId)) continue
      usersAtStep.add(event.userId)
    }

    if (i === 0) startCount = usersAtStep.size
    const previousCount = i === 0 ? usersAtStep.size : results[i - 1].users

    results.push({
      key: stepEvent,
      name: stepLabel(stepEvent),
      users: usersAtStep.size,
      conversionFromStart: startCount > 0 ? (usersAtStep.size / startCount) * 100 : 0,
      dropOffFromPrevious: previousCount > 0 ? (1 - usersAtStep.size / previousCount) * 100 : 0,
    })

    eligible = usersAtStep
  }

  return { steps: results }
}

export function getBiggestDropOff(result: FunnelResult): FunnelStepResult | null {
  let biggest: FunnelStepResult | null = null
  for (let i = 1; i < result.steps.length; i++) {
    const step = result.steps[i]
    if (!biggest || step.dropOffFromPrevious > biggest.dropOffFromPrevious) biggest = step
  }
  return biggest
}
