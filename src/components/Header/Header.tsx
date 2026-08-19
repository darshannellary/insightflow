import { useRef } from 'react'
import { Menu, Upload } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import type { RangePreset } from '../../types/dataset'
import styles from './Header.module.css'

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
]

interface HeaderProps {
  title: string
  onMenuClick: () => void
  showRangeSelector?: boolean
}

export function Header({ title, onMenuClick, showRangeSelector = true }: HeaderProps) {
  const { dataset, range, setRange, loadFile } = useDataset()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void loadFile(file)
    e.target.value = ''
  }

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={onMenuClick}
          aria-label="Open navigation"
          aria-controls="app-sidebar"
        >
          <Menu size={20} />
        </button>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.right}>
        {showRangeSelector && dataset && dataset.capabilities.hasTimestamp && (
          <div className={styles.rangeSelector} role="group" aria-label="Date range">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.rangeButton} ${range === opt.value ? styles.rangeActive : ''}`}
                onClick={() => setRange(opt.value)}
                aria-pressed={range === opt.value}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <button type="button" className={styles.uploadButton} onClick={() => inputRef.current?.click()}>
          <Upload size={16} />
          <span>{dataset ? 'Replace Data' : 'Upload CSV'}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="visually-hidden"
          onChange={handleFileChange}
          aria-label="Upload CSV file"
        />
      </div>
    </header>
  )
}
