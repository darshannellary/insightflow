import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useDataset } from '../../context/DatasetContext'
import { computeTimeSeries, computeEventBreakdown } from '../../analytics/metrics'
import { titleCase } from '../../utils/formatting'
import { ChartCard } from '../../components/ChartCard/ChartCard'
import { DataTable, type DataTableColumn } from '../../components/DataTable/DataTable'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { CHART_AXIS, CHART_GRID } from '../../styles/chartColors'
import { formatNumber, formatPercent } from '../../utils/formatting'
import styles from './Analytics.module.css'

function formatTick(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

interface CombinedPoint {
  date: string
  activeUsers: number
  newUsers: number
}

export function Analytics() {
  const { dataset, range } = useDataset()

  const combined = useMemo<CombinedPoint[]>(() => {
    if (!dataset) return []
    const dau = computeTimeSeries(dataset, 'dau', range)
    const newUsers = computeTimeSeries(dataset, 'newUsers', range)
    const newUsersByDate = new Map(newUsers.map((p) => [p.date, p.value]))
    return dau.map((p) => ({ date: p.date, activeUsers: p.value, newUsers: newUsersByDate.get(p.date) ?? 0 }))
  }, [dataset, range])

  const breakdown = useMemo(
    () => (dataset ? computeEventBreakdown(dataset, range) : []),
    [dataset, range],
  )

  if (!dataset) return null

  const columns: DataTableColumn<(typeof breakdown)[number]>[] = [
    { key: 'event', label: 'Event', render: (row) => titleCase(row.event) },
    { key: 'count', label: 'Events', align: 'right', render: (row) => formatNumber(row.count) },
    {
      key: 'uniqueUsers',
      label: 'Unique Users',
      align: 'right',
      render: (row) => formatNumber(row.uniqueUsers),
    },
    {
      key: 'pctOfEvents',
      label: '% of Events',
      align: 'right',
      render: (row) => formatPercent(row.pctOfEvents),
    },
  ]

  return (
    <div className={styles.page}>
      <ChartCard
        title="Active Users vs. New Users"
        subtitle="Compare overall activity against new user growth for the selected date range."
        height={300}
      >
        {combined.length === 0 ? (
          <InlineNotice>
            This dataset doesn&apos;t contain a usable timestamp column, so trends aren&apos;t
            available.
          </InlineNotice>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combined} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="newUsers" name="New Users" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Event Breakdown" subtitle="All recorded event types for the selected date range.">
        {breakdown.length === 0 ? (
          <InlineNotice>No events found in the selected date range.</InlineNotice>
        ) : (
          <DataTable columns={columns} rows={breakdown} getRowKey={(row) => row.event} />
        )}
      </ChartCard>
    </div>
  )
}
