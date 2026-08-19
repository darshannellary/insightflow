import { useRef, useState } from 'react'
import { BarChart3, Compass, ListChecks, Lock, ShieldCheck, KeyRound } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import styles from './EmptyState.module.css'

const FEATURE_CARDS = [
  {
    icon: BarChart3,
    title: 'ANALYZE',
    body: 'Understand users, events and product usage.',
  },
  {
    icon: Compass,
    title: 'DISCOVER',
    body: 'Find conversion, retention and feature insights.',
  },
  {
    icon: ListChecks,
    title: 'PRIORITIZE',
    body: 'Turn insights into product decisions.',
  },
]

export function EmptyState() {
  const { loadFile, loadSample, status, error } = useDataset()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (file) void loadFile(file)
  }

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragActive(true)
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragActive(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <h2 className={styles.headline}>Turn product data into decisions.</h2>
        <p className={styles.subheadline}>
          Upload your product event data and discover what users are doing, where they&apos;re
          dropping off, and what to prioritize next.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={() => inputRef.current?.click()}>
            Upload CSV
          </button>
          <button type="button" className={styles.secondaryButton} onClick={loadSample}>
            Try Sample Dataset
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="visually-hidden"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
            aria-label="Upload CSV file"
          />
        </div>

        {status === 'loading' && <p className={styles.status}>Processing your data locally…</p>}
        {status === 'error' && error && (
          <p className={styles.errorStatus} role="alert">
            {error}
          </p>
        )}
        <p className={styles.dropHint}>or drag and drop a .csv file anywhere in this box</p>
      </div>

      <div className={styles.featureGrid}>
        {FEATURE_CARDS.map(({ icon: Icon, title, body }) => (
          <div key={title} className={styles.featureCard}>
            <Icon size={20} aria-hidden="true" className={styles.featureIcon} />
            <div className={styles.featureTitle}>{title}</div>
            <p className={styles.featureBody}>{body}</p>
          </div>
        ))}
      </div>

      <div className={styles.trustRow}>
        <span className={styles.trustItem}>
          <Lock size={14} aria-hidden="true" /> 100% local processing
        </span>
        <span className={styles.trustItem}>
          <KeyRound size={14} aria-hidden="true" /> No API key required
        </span>
        <span className={styles.trustItem}>
          <ShieldCheck size={14} aria-hidden="true" /> Your data never leaves your browser
        </span>
      </div>
    </div>
  )
}
