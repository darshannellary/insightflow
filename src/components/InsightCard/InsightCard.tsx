import {
  TrendingDown,
  TrendingUp,
  Sparkles,
  Lightbulb,
  GitBranch,
  DollarSign,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import type { Insight } from '../../analytics/insightEngine'
import { Badge, type BadgeTone } from '../Badge/Badge'
import styles from './InsightCard.module.css'

const ICONS: Record<string, typeof TrendingDown> = {
  TrendingDown,
  TrendingUp,
  Sparkles,
  Lightbulb,
  GitBranch,
  DollarSign,
}

const SEVERITY_TONE: Record<Insight['severity'], BadgeTone> = {
  HIGH: 'negative',
  MEDIUM: 'warning',
  LOW: 'info',
}

const SEVERITY_LABEL: Record<Insight['severity'], string> = {
  HIGH: 'High priority',
  MEDIUM: 'Medium priority',
  LOW: 'Positive signal',
}

export function InsightCard({ insight }: { insight: Insight }) {
  const Icon = ICONS[insight.icon] ?? AlertTriangle

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <span className={`${styles.iconWrap} ${styles[insight.severity]}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <Badge tone={SEVERITY_TONE[insight.severity]}>{SEVERITY_LABEL[insight.severity]}</Badge>
        <span className={styles.category}>{insight.category}</span>
      </div>
      <h3 className={styles.title}>{insight.title}</h3>
      <p className={styles.finding}>{insight.finding}</p>
      <p className={styles.evidence}>{insight.evidence}</p>
      <p className={styles.recommendation}>
        <ArrowRight size={14} aria-hidden="true" />
        <span>{insight.recommendation}</span>
      </p>
    </article>
  )
}
