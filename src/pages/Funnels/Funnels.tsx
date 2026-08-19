import { ArrowDown, AlertTriangle } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { useAnalyticsBundle } from '../../context/useAnalyticsBundle'
import { getBiggestDropOff } from '../../analytics/funnel'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { formatNumber, formatPercent } from '../../utils/formatting'
import styles from './Funnels.module.css'

export function Funnels() {
  const { dataset } = useDataset()
  const { funnelResult } = useAnalyticsBundle()

  if (!dataset) return null

  if (funnelResult.steps.length === 0) {
    return (
      <InlineNotice>
        A funnel needs an <code>event</code> column with recognizable steps (like signup,
        onboarding_complete, feature usage or purchase). This dataset doesn&apos;t have enough of
        those events to build one.
      </InlineNotice>
    )
  }

  const biggestDropOff = getBiggestDropOff(funnelResult)

  return (
    <div className={styles.page}>
      <div className={styles.funnel}>
        {funnelResult.steps.map((step, i) => {
          const isBiggest = biggestDropOff?.key === step.key
          return (
            <div key={step.key} className={styles.stepWrapper}>
              {i > 0 && (
                <div className={`${styles.dropIndicator} ${isBiggest ? styles.dropBiggest : ''}`}>
                  <ArrowDown size={16} aria-hidden="true" />
                  <span>{formatPercent(step.dropOffFromPrevious)} drop-off</span>
                  {isBiggest && (
                    <span className={styles.biggestTag}>
                      <AlertTriangle size={12} aria-hidden="true" /> Biggest drop-off
                    </span>
                  )}
                </div>
              )}
              <div className={`${styles.step} ${isBiggest ? styles.stepBiggest : ''}`}>
                <div className={styles.stepBarTrack}>
                  <div
                    className={styles.stepBarFill}
                    style={{ width: `${Math.max(step.conversionFromStart, 2)}%` }}
                  />
                </div>
                <div className={styles.stepInfo}>
                  <span className={styles.stepName}>{step.name}</span>
                  <span className={styles.stepUsers}>{formatNumber(step.users)} users</span>
                  <span className={styles.stepPct}>{formatPercent(step.conversionFromStart)} of start</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {biggestDropOff && (
        <div className={styles.opportunity}>
          <AlertTriangle size={18} aria-hidden="true" className={styles.opportunityIcon} />
          <p>
            <strong>Biggest opportunity:</strong> your largest drop-off occurs before{' '}
            <strong>{biggestDropOff.name}</strong>, where {formatPercent(biggestDropOff.dropOffFromPrevious)}{' '}
            of users are lost.
          </p>
        </div>
      )}
    </div>
  )
}
