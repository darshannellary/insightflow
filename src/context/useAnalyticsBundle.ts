import { useMemo } from 'react'
import { useDataset } from './DatasetContext'
import { computeFunnel, buildDefaultFunnelSteps } from '../analytics/funnel'
import { computeCohortRetention } from '../analytics/retention'
import { detectDimensions, computeSegmentStats, type SegmentDimension, type SegmentStat } from '../analytics/segmentation'
import { computeFeatureStats } from '../analytics/featureAnalysis'
import { computeTimeSeries } from '../analytics/metrics'
import { runInsightEngine, type Insight, type InsightContext } from '../analytics/insightEngine'
import type { RangePreset } from '../types/dataset'

/** Expensive derived analytics, computed once per dataset change (independent of the date range). */
export function useAnalyticsBundle() {
  const { dataset } = useDataset()

  return useMemo(() => {
    if (!dataset) {
      return {
        funnelResult: { steps: [] },
        cohortTable: { rows: [], periods: 5 },
        segmentStatsByDimension: {} as Partial<Record<SegmentDimension, SegmentStat[]>>,
        featureStats: [],
      }
    }

    const funnelSteps = buildDefaultFunnelSteps(dataset)
    const funnelResult = computeFunnel(dataset.events, funnelSteps)
    const cohortTable = computeCohortRetention(dataset)
    const dimensions = detectDimensions(dataset)
    const segmentStatsByDimension: Partial<Record<SegmentDimension, SegmentStat[]>> = {}
    for (const dim of dimensions) segmentStatsByDimension[dim] = computeSegmentStats(dataset, dim)
    const featureStats = computeFeatureStats(dataset)

    return { funnelResult, cohortTable, segmentStatsByDimension, featureStats }
  }, [dataset])
}

/** Runs the deterministic insight engine for the current dataset + range. */
export function useInsights(range: RangePreset): { insights: Insight[]; context: InsightContext | null } {
  const { dataset } = useDataset()
  const bundle = useAnalyticsBundle()

  return useMemo(() => {
    if (!dataset) return { insights: [], context: null }
    const dauSeries = computeTimeSeries(dataset, 'dau', range)
    const context: InsightContext = { dataset, dauSeries, ...bundle }
    return { insights: runInsightEngine(context), context }
  }, [dataset, range, bundle])
}
