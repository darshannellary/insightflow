import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowRight, Target } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { useInsights } from '../../context/useAnalyticsBundle'
import { computeKPIs, computeTimeSeries, type TimeSeriesMetric } from '../../analytics/metrics'
import { KPICard } from '../../components/KPICard/KPICard'
import { ChartCard } from '../../components/ChartCard/ChartCard'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { CHART_AXIS, CHART_GRID } from '../../styles/chartColors'
import styles from './Dashboard.module.css'

const METRIC_OPTIONS: { value: TimeSeriesMetric; label: string }[] = [
  { value: 'dau', label: 'DAU' },
  { value: 'wau', label: 'WAU' },
  { value: 'newUsers', label: 'New Users' },
  { value: 'events', label: 'Events' },
]

function formatTick(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function Dashboard() {
  const { dataset, range } = useDataset()
  const [metric, setMetric] = useState<TimeSeriesMetric>('dau')
  const { insights } = useInsights(range)

  const kpis = useMemo(() => (dataset ? computeKPIs(dataset, range) : []), [dataset, range])
  const series = useMemo(
    () => (dataset ? computeTimeSeries(dataset, metric, range) : []),
    [dataset, metric, range],
  )

  if (!dataset) return null

  return (
    <div className={styles.page}>
      {dataset.meta.isSample && (
        <InlineNotice>
          You&apos;re viewing the built-in <strong>Demo Dataset</strong>. Upload your own CSV any time
          from the top-right button.
        </InlineNotice>
      )}

      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <KPICard key={kpi.key} kpi={kpi} />
        ))}
      </div>

      <ChartCard
        title="User Activity"
        subtitle="Track how usage is trending over the selected date range."
        height={300}
        actions={
          <div className={styles.metricToggle} role="group" aria-label="Chart metric">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={metric === opt.value ? styles.metricActive : styles.metricButton}
                onClick={() => setMetric(opt.value)}
                aria-pressed={metric === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      >
        {series.length === 0 ? (
          <InlineNotice>
            This dataset doesn&apos;t contain a usable timestamp column, so activity trends
            aren&apos;t available.
          </InlineNotice>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatTick}
                stroke={CHART_AXIS}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis stroke={CHART_AXIS} fontSize={12} tickLine={false} axisLine={false} width={40} />
              <RechartsTooltip
                labelFormatter={(label) => formatTick(String(label))}
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#dashboardArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <section className={styles.decisionCenter}>
        <div className={styles.decisionHeader}>
          <Target size={18} aria-hidden="true" />
          <h2>Where should I focus?</h2>
        </div>
        {insights.length === 0 ? (
          <InlineNotice>
            No strong opportunities were detected yet. As more data comes in, this section will
            surface the biggest ones automatically.
          </InlineNotice>
        ) : (
          <ol className={styles.opportunityList}>
            {insights.slice(0, 3).map((insight) => (
              <li key={insight.id} className={styles.opportunityItem}>
                <div className={styles.opportunityTitle}>{insight.title}</div>
                <div className={styles.opportunityMeta}>
                  <span className={styles.opportunityLabel}>Impact</span>
                  <span>{insight.severity === 'HIGH' ? 'High' : insight.severity === 'MEDIUM' ? 'Medium' : 'Positive'}</span>
                </div>
                <p className={styles.opportunityEvidence}>{insight.finding}</p>
                <p className={styles.opportunityAction}>
                  <ArrowRight size={14} aria-hidden="true" />
                  <span>{insight.recommendation}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
