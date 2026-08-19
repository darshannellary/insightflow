import type { TimeSeriesPoint, TrendDirection } from '../types/dataset'

export interface Trend {
  direction: TrendDirection
  pctChange: number
}

/** Compares the average of the first half of the series to the second half. */
export function computeTrend(series: TimeSeriesPoint[]): Trend {
  if (series.length < 4) return { direction: 'flat', pctChange: 0 }

  const mid = Math.floor(series.length / 2)
  const firstHalf = series.slice(0, mid)
  const secondHalf = series.slice(mid)

  const avg = (points: TimeSeriesPoint[]) =>
    points.reduce((sum, p) => sum + p.value, 0) / points.length

  const firstAvg = avg(firstHalf)
  const secondAvg = avg(secondHalf)

  if (firstAvg === 0) return { direction: 'flat', pctChange: 0 }

  const pctChange = ((secondAvg - firstAvg) / firstAvg) * 100
  const direction: TrendDirection = pctChange > 5 ? 'up' : pctChange < -5 ? 'down' : 'flat'
  return { direction, pctChange }
}
