export interface RiceItem {
  id: string
  feature: string
  reach: number
  impact: number
  confidence: number
  effort: number
}

export type RicePriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface RankedRiceItem extends RiceItem {
  rank: number
  score: number
  priority: RicePriority
}

export function computeRiceScore(item: RiceItem): number {
  if (item.effort <= 0) return 0
  return (item.reach * item.impact * item.confidence) / item.effort
}

export function rankRiceItems(items: RiceItem[]): RankedRiceItem[] {
  const scored = items
    .map((item) => ({ ...item, score: computeRiceScore(item) }))
    .sort((a, b) => b.score - a.score)

  const total = scored.length
  return scored.map((item, index) => {
    const percentile = total > 1 ? index / (total - 1) : 0
    const priority: RicePriority = percentile <= 1 / 3 ? 'HIGH' : percentile <= 2 / 3 ? 'MEDIUM' : 'LOW'
    return { ...item, rank: index + 1, priority }
  })
}

const STORAGE_KEY = 'insightflow.rice.v1'

export function loadRiceItems(): RiceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RICE_ITEMS
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : DEFAULT_RICE_ITEMS
  } catch {
    return DEFAULT_RICE_ITEMS
  }
}

export function saveRiceItems(items: RiceItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // localStorage unavailable (e.g. private browsing) — priorities just won't persist.
  }
}

export const DEFAULT_RICE_ITEMS: RiceItem[] = [
  { id: 'dark-mode', feature: 'Dark Mode', reach: 6000, impact: 1, confidence: 80, effort: 3 },
  { id: 'mobile-app', feature: 'Mobile App', reach: 4000, impact: 3, confidence: 60, effort: 13 },
  { id: 'export-reports', feature: 'Export Reports', reach: 2500, impact: 2, confidence: 90, effort: 2 },
  { id: 'slack-integration', feature: 'Slack Integration', reach: 1800, impact: 2, confidence: 70, effort: 5 },
  { id: 'custom-dashboards', feature: 'Custom Dashboards', reach: 3000, impact: 3, confidence: 50, effort: 8 },
]
