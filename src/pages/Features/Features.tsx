import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { useAnalyticsBundle } from '../../context/useAnalyticsBundle'
import { classifyOpportunity, type FeatureStat } from '../../analytics/featureAnalysis'
import { DataTable, type DataTableColumn } from '../../components/DataTable/DataTable'
import { Badge } from '../../components/Badge/Badge'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { formatMultiplier, formatNumber, formatPercent } from '../../utils/formatting'
import styles from './Features.module.css'

const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus }

function OpportunityBadge({ stat }: { stat: FeatureStat }) {
  const opportunity = classifyOpportunity(stat)
  if (!opportunity) return <span className={styles.noOpportunity}>—</span>
  if (opportunity === 'HIGH_ADOPTION_HIGH_CORRELATION') {
    return (
      <div className={styles.badgeStack}>
        <Badge tone="positive">High adoption</Badge>
        <Badge tone="info">High correlation</Badge>
      </div>
    )
  }
  return (
    <div className={styles.badgeStack}>
      <Badge tone="warning">Low adoption</Badge>
      <Badge tone="info">High correlation</Badge>
    </div>
  )
}

export function Features() {
  const { dataset } = useDataset()
  const { featureStats } = useAnalyticsBundle()

  if (!dataset) return null

  if (featureStats.length === 0) {
    return (
      <InlineNotice>
        No feature-usage events were detected. InsightFlow looks for events named like{' '}
        <code>feature_*</code> (e.g. <code>feature_dashboard</code>) to build this page.
      </InlineNotice>
    )
  }

  const columns: DataTableColumn<FeatureStat>[] = [
    { key: 'label', label: 'Feature', render: (row) => <span className={styles.featureName}>{row.label}</span> },
    { key: 'users', label: 'Unique Users', align: 'right', render: (row) => formatNumber(row.uniqueUsers) },
    { key: 'usage', label: 'Adoption', align: 'right', render: (row) => formatPercent(row.usagePct) },
    {
      key: 'freq',
      label: 'Uses / User',
      align: 'right',
      render: (row) => row.avgUsagePerUser.toFixed(1),
    },
    {
      key: 'correlation',
      label: 'Conversion Correlation',
      align: 'right',
      render: (row) => (row.conversionCorrelation !== null ? formatMultiplier(row.conversionCorrelation) : '—'),
    },
    {
      key: 'trend',
      label: 'Trend',
      align: 'center',
      render: (row) => {
        const Icon = TREND_ICON[row.trend]
        return (
          <span className={`${styles.trend} ${styles[row.trend]}`}>
            <Icon size={14} aria-hidden="true" />
            <span className="visually-hidden">{row.trend}</span>
          </span>
        )
      },
    },
    { key: 'opportunity', label: 'Opportunity', render: (row) => <OpportunityBadge stat={row} /> },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <DataTable columns={columns} rows={featureStats} getRowKey={(row) => row.name} />
      </div>
    </div>
  )
}
