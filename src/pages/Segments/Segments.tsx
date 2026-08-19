import { Lightbulb } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { useAnalyticsBundle } from '../../context/useAnalyticsBundle'
import { generateComparativeSentences, type SegmentStat } from '../../analytics/segmentation'
import { DataTable, type DataTableColumn } from '../../components/DataTable/DataTable'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { formatCurrency, formatNumber, formatPercent, titleCase } from '../../utils/formatting'
import styles from './Segments.module.css'

export function Segments() {
  const { dataset } = useDataset()
  const { segmentStatsByDimension } = useAnalyticsBundle()

  if (!dataset) return null

  const dimensions = Object.entries(segmentStatsByDimension)

  if (dimensions.length === 0) {
    return (
      <InlineNotice>
        Segment analysis needs at least one of a <code>plan</code>, <code>device</code> or{' '}
        <code>country</code> column. This dataset doesn&apos;t have any of those.
      </InlineNotice>
    )
  }

  return (
    <div className={styles.page}>
      {dimensions.map(([dimension, stats]) => {
        const columns: DataTableColumn<SegmentStat>[] = [
          { key: 'value', label: titleCase(dimension), render: (row) => <strong>{titleCase(row.value)}</strong> },
          { key: 'users', label: 'Users', align: 'right', render: (row) => formatNumber(row.users) },
          {
            key: 'activation',
            label: 'Activation',
            align: 'right',
            render: (row) => (dataset.capabilities.hasOnboarding ? formatPercent(row.activationRate) : '—'),
          },
          {
            key: 'conversion',
            label: 'Conversion',
            align: 'right',
            render: (row) => (dataset.capabilities.hasPurchase ? formatPercent(row.conversionRate) : '—'),
          },
          {
            key: 'retention',
            label: 'Retention (W1)',
            align: 'right',
            render: (row) => (row.retentionW1 !== null ? formatPercent(row.retentionW1) : '—'),
          },
          {
            key: 'revenue',
            label: 'Revenue',
            align: 'right',
            render: (row) => (dataset.capabilities.hasRevenue ? formatCurrency(row.revenue) : '—'),
          },
          {
            key: 'arpu',
            label: 'ARPU',
            align: 'right',
            render: (row) => (dataset.capabilities.hasRevenue ? formatCurrency(row.arpu) : '—'),
          },
        ]

        const sentences = generateComparativeSentences(stats)

        return (
          <section key={dimension} className={styles.section}>
            <h2 className={styles.sectionTitle}>{titleCase(dimension)}</h2>
            <div className={styles.card}>
              <DataTable columns={columns} rows={stats} getRowKey={(row) => row.value} />
            </div>
            {sentences.length > 0 && (
              <ul className={styles.sentenceList}>
                {sentences.map((sentence) => (
                  <li key={sentence} className={styles.sentence}>
                    <Lightbulb size={14} aria-hidden="true" />
                    <span>{sentence}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
