import type { ReactNode } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import styles from './InlineNotice.module.css'

interface InlineNoticeProps {
  children: ReactNode
  tone?: 'info' | 'warning'
}

export function InlineNotice({ children, tone = 'info' }: InlineNoticeProps) {
  const Icon = tone === 'warning' ? AlertCircle : Info
  return (
    <div className={`${styles.notice} ${styles[tone]}`} role="status">
      <Icon size={16} aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}
