import type { Dataset, TimeSeriesPoint } from '../types/dataset'
import { dayKey, startOfWeek } from '../utils/dateUtils'
import { titleCase } from '../utils/formatting'
import type { FunnelResult } from './funnel'
import type { CohortTable } from './retention'
import { getAverageRetention, getBestWorstCohort } from './retention'
import type { SegmentDimension, SegmentStat } from './segmentation'
import type { FeatureStat } from './featureAnalysis'
import { classifyOpportunity } from './featureAnalysis'
import { computeTrend } from './trends'

export type InsightSeverity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface Insight {
  id: string
  severity: InsightSeverity
  category: string
  icon: string
  title: string
  finding: string
  evidence: string
  recommendation: string
}

export interface InsightContext {
  dataset: Dataset
  dauSeries: TimeSeriesPoint[]
  funnelResult: FunnelResult
  cohortTable: CohortTable
  segmentStatsByDimension: Partial<Record<SegmentDimension, SegmentStat[]>>
  featureStats: FeatureStat[]
}

type InsightRule = {
  id: string
  evaluate: (ctx: InsightContext) => Insight | Insight[] | null
}

const SEVERITY_RANK: Record<InsightSeverity, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 }

function meaningfulSegments(stats: SegmentStat[]): SegmentStat[] {
  return stats.filter((s) => s.users >= 10)
}

// RULE 1: significant conversion gap between the top and bottom value of a segment dimension.
const ruleSegmentConversionGap: InsightRule = {
  id: 'segment-conversion-gap',
  evaluate(ctx) {
    const insights: Insight[] = []
    for (const [dimension, stats] of Object.entries(ctx.segmentStatsByDimension) as [
      SegmentDimension,
      SegmentStat[],
    ][]) {
      // Plan is usually assigned *because* a user converted, so "conversion by plan" is
      // close to tautological rather than a genuine discovered pattern.
      if (dimension === 'plan') continue
      const segments = meaningfulSegments(stats)
      if (segments.length < 2) continue
      const sorted = [...segments].sort((a, b) => b.conversionRate - a.conversionRate)
      const top = sorted[0]
      const bottom = sorted[sorted.length - 1]
      if (top.conversionRate <= 0) continue
      const relativeGap = ((top.conversionRate - bottom.conversionRate) / top.conversionRate) * 100
      if (relativeGap < 20) continue

      const totalUsers = segments.reduce((sum, s) => sum + s.users, 0)
      const bottomShare = totalUsers > 0 ? (bottom.users / totalUsers) * 100 : 0

      insights.push({
        id: `segment-conversion-gap-${dimension}`,
        severity: relativeGap >= 50 ? 'HIGH' : 'MEDIUM',
        category: 'Conversion',
        icon: 'TrendingDown',
        title: `${titleCase(dimension)} conversion gap`,
        finding: `${titleCase(top.value)} users convert at ${top.conversionRate.toFixed(1)}%, compared with ${bottom.conversionRate.toFixed(1)}% for ${titleCase(bottom.value)} users.`,
        evidence: `${titleCase(bottom.value)} represents ${bottomShare.toFixed(0)}% of users in this dataset, so closing this gap could be a significant growth opportunity.`,
        recommendation: `Investigate the ${titleCase(bottom.value)} onboarding and conversion experience.`,
      })
    }
    return insights
  },
}

// RULE 2: high-adoption features correlated with stronger conversion, and low-adoption
// features that already show a strong conversion link (an adoption opportunity).
const ruleFeatureOpportunity: InsightRule = {
  id: 'feature-opportunity',
  evaluate(ctx) {
    const insights: Insight[] = []
    for (const stat of ctx.featureStats) {
      const opportunity = classifyOpportunity(stat)
      if (!opportunity || stat.conversionCorrelation === null) continue

      if (opportunity === 'HIGH_ADOPTION_HIGH_CORRELATION') {
        insights.push({
          id: `feature-high-value-${stat.name}`,
          severity: 'MEDIUM',
          category: 'Features',
          icon: 'Sparkles',
          title: `${stat.label} is a high-value feature`,
          finding: `${stat.label} is used by ${stat.usagePct.toFixed(0)}% of users and is associated with a ${((stat.conversionCorrelation - 1) * 100).toFixed(0)}% higher conversion rate.`,
          evidence: `Users of ${stat.label} convert ${stat.conversionCorrelation.toFixed(1)}× more often than users who haven't used it.`,
          recommendation: `Promote ${stat.label} earlier in onboarding to drive more users toward it.`,
        })
      } else {
        insights.push({
          id: `feature-low-adoption-${stat.name}`,
          severity: 'HIGH',
          category: 'Features',
          icon: 'Lightbulb',
          title: `${stat.label} adoption opportunity`,
          finding: `Only ${stat.usagePct.toFixed(0)}% of users have tried ${stat.label}, yet the users who do convert ${stat.conversionCorrelation.toFixed(1)}× more often.`,
          evidence: `${stat.label} is strongly linked to conversion but remains undiscovered by most users.`,
          recommendation: `Surface ${stat.label} more prominently in the product to drive adoption.`,
        })
      }
    }
    return insights
  },
}

// RULE 3: a cohort's retention has deteriorated well below the dataset average.
const ruleRetentionDrop: InsightRule = {
  id: 'retention-drop',
  evaluate(ctx) {
    const avgW1 = getAverageRetention(ctx.cohortTable, 1)
    if (avgW1 === null) return null

    const insights: Insight[] = []
    for (const row of ctx.cohortTable.rows) {
      const w1 = row.retention[1]
      if (w1 === null || w1 === undefined || row.cohortSize < 20) continue
      const drop = avgW1 - w1
      if (drop <= 10) continue
      insights.push({
        id: `retention-drop-${row.cohortLabel}`,
        severity: drop >= 20 ? 'HIGH' : 'MEDIUM',
        category: 'Retention',
        icon: 'TrendingDown',
        title: 'Retention deterioration detected',
        finding: `The cohort that signed up in the week of ${row.cohortLabel} retained only ${w1.toFixed(1)}% into Week 1, compared with a ${avgW1.toFixed(1)}% average across other cohorts.`,
        evidence: `That's a ${drop.toFixed(1)} percentage point drop versus the dataset average, across ${row.cohortSize} users.`,
        recommendation: `Review what changed in onboarding or product experience around ${row.cohortLabel}.`,
      })
    }
    return insights.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]).slice(0, 2)
  },
}

// RULE 4: a large drop-off at a single funnel step.
const ruleFunnelDropOff: InsightRule = {
  id: 'funnel-drop-off',
  evaluate(ctx) {
    let biggest: FunnelResult['steps'][number] | null = null
    let biggestIndex = -1
    ctx.funnelResult.steps.forEach((step, i) => {
      if (i === 0) return
      if (!biggest || step.dropOffFromPrevious > biggest.dropOffFromPrevious) {
        biggest = step
        biggestIndex = i
      }
    })
    if (!biggest || biggestIndex <= 0) return null
    const step = biggest as FunnelResult['steps'][number]
    if (step.dropOffFromPrevious < 50) return null
    const previousStep = ctx.funnelResult.steps[biggestIndex - 1]

    return {
      id: 'funnel-drop-off',
      severity: step.dropOffFromPrevious >= 70 ? 'HIGH' : 'MEDIUM',
      category: 'Funnel',
      icon: 'GitBranch',
      title: 'Major funnel drop-off detected',
      finding: `Your largest drop-off occurs between ${previousStep.name} and ${step.name}, where ${step.dropOffFromPrevious.toFixed(0)}% of users are lost.`,
      evidence: `Only ${step.users.toLocaleString()} of ${previousStep.users.toLocaleString()} users who reached "${previousStep.name}" went on to "${step.name}".`,
      recommendation: `Investigate friction between "${previousStep.name}" and "${step.name}" — this is likely your biggest growth opportunity.`,
    }
  },
}

// RULE 5: one segment generates significantly higher revenue per user (ARPU).
const ruleSegmentRevenueGap: InsightRule = {
  id: 'segment-revenue-gap',
  evaluate(ctx) {
    if (!ctx.dataset.capabilities.hasRevenue) return null
    const insights: Insight[] = []
    for (const [dimension, stats] of Object.entries(ctx.segmentStatsByDimension) as [
      SegmentDimension,
      SegmentStat[],
    ][]) {
      const segments = meaningfulSegments(stats).filter((s) => s.arpu > 0)
      if (segments.length < 2) continue
      const sorted = [...segments].sort((a, b) => b.arpu - a.arpu)
      const top = sorted[0]
      const bottom = sorted[sorted.length - 1]
      if (bottom.arpu <= 0) continue
      const ratio = top.arpu / bottom.arpu
      if (ratio < 1.5) continue

      insights.push({
        id: `segment-revenue-gap-${dimension}`,
        severity: ratio >= 2.5 ? 'HIGH' : 'MEDIUM',
        category: 'Revenue',
        icon: 'DollarSign',
        title: `${titleCase(top.value)} is your highest-value segment`,
        finding: `${titleCase(top.value)} users generate $${top.arpu.toFixed(0)} ARPU, compared with $${bottom.arpu.toFixed(0)} for ${titleCase(bottom.value)} users — ${ratio.toFixed(1)}× higher.`,
        evidence: `Across ${top.users} ${titleCase(top.value)} users, this segment contributes disproportionately to revenue.`,
        recommendation: `Consider tailoring acquisition and retention efforts toward ${titleCase(top.value)} users.`,
      })
    }
    return insights
  },
}

// RULE 6: overall user activity is trending downward.
const ruleActivityDecline: InsightRule = {
  id: 'activity-decline',
  evaluate(ctx) {
    const trend = computeTrend(ctx.dauSeries)
    if (trend.direction !== 'down') return null
    return {
      id: 'activity-decline',
      severity: trend.pctChange <= -20 ? 'HIGH' : 'MEDIUM',
      category: 'Activity',
      icon: 'TrendingDown',
      title: 'User activity is trending downward',
      finding: `Daily active users are down ${Math.abs(trend.pctChange).toFixed(0)}% comparing the recent period to the one before it.`,
      evidence: `This trend is measured across the currently selected date range.`,
      recommendation: `Look for recent product changes, pricing changes, or acquisition slowdowns that coincide with this decline.`,
    }
  },
}

// RULE 7: conversion is improving.
const ruleConversionImprovement: InsightRule = {
  id: 'conversion-improvement',
  evaluate(ctx) {
    if (!ctx.dataset.capabilities.hasPurchase || !ctx.dataset.dateRange) return null
    const weekly = new Map<string, number>()
    for (const event of ctx.dataset.events) {
      if ((event.event !== 'purchase' && event.event !== 'subscription') || !event.timestamp) continue
      const key = dayKey(startOfWeek(event.timestamp))
      weekly.set(key, (weekly.get(key) ?? 0) + 1)
    }
    const series: TimeSeriesPoint[] = [...weekly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }))

    const trend = computeTrend(series)
    if (trend.direction !== 'up') return null

    return {
      id: 'conversion-improvement',
      severity: 'LOW',
      category: 'Conversion',
      icon: 'TrendingUp',
      title: 'Conversion is improving',
      finding: `Purchase activity is up ${trend.pctChange.toFixed(0)}% comparing the recent period to the one before it.`,
      evidence: `This is a positive signal worth understanding and reinforcing.`,
      recommendation: `Identify what changed recently (features, pricing, campaigns) and double down on it.`,
    }
  },
}

export const insightRules: InsightRule[] = [
  ruleFunnelDropOff,
  ruleSegmentConversionGap,
  ruleRetentionDrop,
  ruleFeatureOpportunity,
  ruleSegmentRevenueGap,
  ruleActivityDecline,
  ruleConversionImprovement,
]

export function runInsightEngine(ctx: InsightContext): Insight[] {
  const results: Insight[] = []
  for (const rule of insightRules) {
    const output = rule.evaluate(ctx)
    if (!output) continue
    if (Array.isArray(output)) results.push(...output)
    else results.push(output)
  }
  return results.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}

// ---------------------------------------------------------------------------
// Ask the Analyst — plain keyword matching over the same computed context.
// No NLP, no external service: honest, deterministic intent detection.
// ---------------------------------------------------------------------------

export interface AskResult {
  matched: boolean
  title: string
  body: string[]
  relatedInsights: Insight[]
}

interface KeywordGroup {
  keywords: string[]
  title: string
  category?: string
  handler: (ctx: InsightContext, insights: Insight[]) => string[]
}

const KEYWORD_GROUPS: KeywordGroup[] = [
  {
    keywords: ['funnel', 'drop off', 'dropoff', 'drop-off', 'dropping', 'drop'],
    title: 'Where users are dropping off',
    category: 'Funnel',
    handler: (ctx) => {
      const steps = ctx.funnelResult.steps
      if (steps.length === 0) return ['No funnel data is available for this dataset.']
      const lines = steps.map(
        (s, i) => `${s.name}: ${s.users.toLocaleString()} users${i > 0 ? ` (${s.dropOffFromPrevious.toFixed(0)}% drop-off from the previous step)` : ''}`,
      )
      let biggest = steps[1]
      for (const s of steps.slice(1)) if (s.dropOffFromPrevious > biggest.dropOffFromPrevious) biggest = s
      lines.push(`Biggest opportunity: the step ending at "${biggest.name}" loses the most users.`)
      return lines
    },
  },
  {
    keywords: ['opportunity', 'growth', 'focus', 'prioritize'],
    title: 'Where to focus',
    handler: (_ctx, insights) => {
      if (insights.length === 0) return ['No strong opportunities were detected in the current data.']
      return insights.slice(0, 3).map((i) => `${i.title}: ${i.finding}`)
    },
  },
  {
    keywords: ['convert', 'conversion'],
    title: 'Conversion analysis',
    category: 'Conversion',
    handler: (ctx) => {
      const lines: string[] = []
      if (!ctx.dataset.capabilities.hasPurchase) {
        return ['This dataset does not contain purchase or subscription events to analyze conversion.']
      }
      for (const [dimension, stats] of Object.entries(ctx.segmentStatsByDimension)) {
        if (dimension === 'plan') continue // plan is assigned *because* a user converted
        const segments = meaningfulSegments(stats as SegmentStat[])
        if (segments.length === 0) continue
        const best = [...segments].sort((a, b) => b.conversionRate - a.conversionRate)[0]
        lines.push(`Best-converting ${dimension}: ${titleCase(best.value)} at ${best.conversionRate.toFixed(1)}%.`)
      }
      return lines.length > 0 ? lines : ['Not enough segmented data to compare conversion.']
    },
  },
  {
    keywords: ['retention', 'churn'],
    title: 'Retention analysis',
    category: 'Retention',
    handler: (ctx) => {
      const { best, worst } = getBestWorstCohort(ctx.cohortTable)
      const avgW4 = getAverageRetention(ctx.cohortTable, 4)
      const lines: string[] = []
      if (best) lines.push(`Best cohort: week of ${best.cohortLabel} (${(best.retention[1] as number).toFixed(1)}% Week 1 retention).`)
      if (worst) lines.push(`Worst cohort: week of ${worst.cohortLabel} (${(worst.retention[1] as number).toFixed(1)}% Week 1 retention).`)
      if (avgW4 !== null) lines.push(`Average Week 4 retention: ${avgW4.toFixed(1)}%.`)
      return lines.length > 0 ? lines : ['Not enough historical data yet to compute retention.']
    },
  },
  {
    keywords: ['feature', 'adoption'],
    title: 'Feature analysis',
    category: 'Features',
    handler: (ctx) => {
      if (ctx.featureStats.length === 0) return ['No feature-usage events were detected in this dataset.']
      return [...ctx.featureStats]
        .sort((a, b) => b.usagePct - a.usagePct)
        .map((f) => `${f.label}: ${f.usagePct.toFixed(0)}% adoption${f.conversionCorrelation !== null ? `, ${f.conversionCorrelation.toFixed(1)}× conversion correlation` : ''}.`)
    },
  },
  {
    keywords: ['segment', 'country', 'device', 'plan'],
    title: 'Segment analysis',
    handler: (ctx) => {
      const lines: string[] = []
      for (const [dimension, stats] of Object.entries(ctx.segmentStatsByDimension)) {
        const segments = meaningfulSegments(stats as SegmentStat[])
        for (const s of segments) {
          lines.push(`${titleCase(dimension)} — ${titleCase(s.value)}: ${s.users} users, ${s.conversionRate.toFixed(1)}% conversion.`)
        }
      }
      return lines.length > 0 ? lines : ['No segment dimensions are available in this dataset.']
    },
  },
  {
    keywords: ['revenue', 'money', 'arpu'],
    title: 'Revenue analysis',
    category: 'Revenue',
    handler: (ctx) => {
      if (!ctx.dataset.capabilities.hasRevenue) return ['This dataset does not contain a revenue column.']
      const lines: string[] = []
      for (const [dimension, stats] of Object.entries(ctx.segmentStatsByDimension)) {
        const segments = meaningfulSegments(stats as SegmentStat[]).filter((s) => s.arpu > 0)
        if (segments.length === 0) continue
        const best = [...segments].sort((a, b) => b.arpu - a.arpu)[0]
        lines.push(`Highest ARPU by ${dimension}: ${titleCase(best.value)} at $${best.arpu.toFixed(0)}.`)
      }
      return lines.length > 0 ? lines : ['Not enough revenue data to compare segments.']
    },
  },
  {
    keywords: ['trend', 'changed', 'change', 'recent'],
    title: 'What changed recently',
    handler: (ctx) => {
      const trend = computeTrend(ctx.dauSeries)
      return [
        `Daily active users are ${trend.direction === 'up' ? 'up' : trend.direction === 'down' ? 'down' : 'roughly flat'} ${Math.abs(trend.pctChange).toFixed(0)}% comparing the recent period to the one before it.`,
      ]
    },
  },
]

const FALLBACK_MESSAGE =
  'I can currently analyze conversion, retention, funnels, features, segments, revenue and user activity. Try asking about one of those.'

export function answerQuery(query: string, ctx: InsightContext, insights: Insight[]): AskResult {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return { matched: false, title: 'Ask a question', body: [FALLBACK_MESSAGE], relatedInsights: [] }
  }

  for (const group of KEYWORD_GROUPS) {
    if (group.keywords.some((kw) => normalized.includes(kw))) {
      return {
        matched: true,
        title: group.title,
        body: group.handler(ctx, insights),
        relatedInsights: group.category
          ? insights.filter((i) => i.category === group.category).slice(0, 2)
          : insights.slice(0, 2),
      }
    }
  }

  return { matched: false, title: "I'm not sure about that", body: [FALLBACK_MESSAGE], relatedInsights: [] }
}
