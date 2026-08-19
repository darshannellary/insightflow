import { useId, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import styles from './Tooltip.module.css'

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className={styles.wrapper}>
      <button
        type="button"
        className={styles.trigger}
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <Info size={14} />
        <span className="visually-hidden">{label}</span>
      </button>
      <span role="tooltip" id={id} className={`${styles.bubble} ${open ? styles.visible : ''}`}>
        {children}
      </span>
    </span>
  )
}
