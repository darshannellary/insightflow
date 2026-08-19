export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
] as const

export const SEMANTIC_COLORS = {
  positive: 'var(--color-positive)',
  negative: 'var(--color-negative)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
} as const

export const CHART_GRID = 'var(--chart-grid)'
export const CHART_AXIS = 'var(--chart-axis)'

export function chartColorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}
