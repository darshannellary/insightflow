import type { ReactNode } from 'react'
import styles from './ChartCard.module.css'

interface ChartCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  /** Fixed pixel height for chart content. Omit for content that sizes itself (e.g. tables). */
  height?: number
}

export function ChartCard({ title, subtitle, actions, children, height }: ChartCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      <div className={styles.body} style={height ? { height } : undefined}>
        {children}
      </div>
    </section>
  )
}
