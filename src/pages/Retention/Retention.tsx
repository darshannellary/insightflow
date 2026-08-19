import { useDataset } from '../../context/DatasetContext'
import { useAnalyticsBundle } from '../../context/useAnalyticsBundle'
import { getAverageRetention, getBestWorstCohort } from '../../analytics/retention'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { formatNumber, formatPercent } from '../../utils/formatting'
import styles from './Retention.module.css'

const LIGHT = [238, 242, 255] // indigo-50
const DARK = [67, 56, 202] // indigo-700

function retentionColor(pct: number): { background: string; color: string } {
  const t = Math.min(Math.max(pct / 100, 0), 1)
  const rgb = LIGHT.map((c, i) => Math.round(c + (DARK[i] - c) * t))
  return {
    background: `rgb(${rgb.join(',')})`,
    color: t > 0.55 ? '#ffffff' : 'var(--color-text)',
  }
}

export function Retention() {
  const { dataset } = useDataset()
  const { cohortTable } = useAnalyticsBundle()

  if (!dataset) return null

  if (!dataset.capabilities.hasTimestamp || cohortTable.rows.length === 0) {
    return (
      <InlineNotice>
        Retention analysis needs a usable <code>timestamp</code> column to group users into
        weekly signup cohorts. This dataset doesn&apos;t have one.
      </InlineNotice>
    )
  }

  const { best, worst } = getBestWorstCohort(cohortTable)
  const avgW4 = getAverageRetention(cohortTable, 4)

  return (
    <div className={styles.page}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Cohort (signup week)</th>
              <th scope="col">Users</th>
              {Array.from({ length: cohortTable.periods }, (_, i) => (
                <th scope="col" key={i}>
                  W{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohortTable.rows.map((row) => (
              <tr key={row.cohortLabel}>
                <th scope="row" className={styles.cohortLabel}>
                  {row.cohortLabel}
                </th>
                <td className={styles.cohortSize}>{formatNumber(row.cohortSize)}</td>
                {row.retention.map((value, i) => (
                  <td key={i} className={styles.cell}>
                    {value === null ? (
                      <span className={styles.pending}>—</span>
                    ) : (
                      <span className={styles.cellValue} style={retentionColor(value)}>
                        {formatPercent(value, 0)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Best cohort</div>
          <div className={styles.summaryValue}>{best ? best.cohortLabel : '—'}</div>
          {best && <div className={styles.summarySub}>{formatPercent(best.retention[1] as number)} W1 retention</div>}
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Worst cohort</div>
          <div className={styles.summaryValue}>{worst ? worst.cohortLabel : '—'}</div>
          {worst && <div className={styles.summarySub}>{formatPercent(worst.retention[1] as number)} W1 retention</div>}
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>Average Week 4 retention</div>
          <div className={styles.summaryValue}>{avgW4 !== null ? formatPercent(avgW4) : '—'}</div>
        </div>
      </div>
    </div>
  )
}
