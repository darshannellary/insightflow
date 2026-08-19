import type { ReactNode } from 'react'
import styles from './Badge.module.css'

export type BadgeTone = 'positive' | 'negative' | 'warning' | 'info' | 'neutral'

const DEFAULT_ICONS: Record<BadgeTone, string> = {
  positive: '●',
  negative: '●',
  warning: '●',
  info: '●',
  neutral: '●',
}

export function Badge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <span aria-hidden="true" className={styles.dot}>
        {DEFAULT_ICONS[tone]}
      </span>
      {children}
    </span>
  )
}
