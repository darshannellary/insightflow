import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import type { KPIValue } from '../../analytics/metrics'
import { formatChange, formatCurrency, formatNumber, formatPercent } from '../../utils/formatting'
import styles from './KPICard.module.css'

function formatValue(kpi: KPIValue): string {
  switch (kpi.format) {
    case 'percent':
      return formatPercent(kpi.value)
    case 'currency':
      return formatCurrency(kpi.value)
    default:
      return formatNumber(kpi.value)
  }
}

export function KPICard({ kpi }: { kpi: KPIValue }) {
  const TrendIcon = kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus

  return (
    <div className={styles.card}>
      <div className={styles.label}>{kpi.label}</div>
      <div className={styles.value}>{formatValue(kpi)}</div>
      {kpi.change !== null && (
        <div className={`${styles.change} ${styles[kpi.trend]}`}>
          <TrendIcon size={13} aria-hidden="true" />
          <span>{formatChange(kpi.change)}</span>
          <span className="visually-hidden">vs previous period</span>
        </div>
      )}
    </div>
  )
}
