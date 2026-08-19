import { Lock, Trash2 } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { formatNumber } from '../../utils/formatting'
import styles from './Settings.module.css'

export function Settings() {
  const { dataset, clear, loadSample } = useDataset()

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Current dataset</h2>
        {dataset ? (
          <div className={styles.datasetInfo}>
            <div className={styles.infoRow}>
              <span>File</span>
              <span>{dataset.meta.fileName}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Type</span>
              <span>{dataset.meta.isSample ? 'Demo Dataset' : 'Uploaded CSV'}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Rows</span>
              <span>{formatNumber(dataset.meta.rowCount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Users</span>
              <span>{formatNumber(dataset.meta.userCount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Events</span>
              <span>{formatNumber(dataset.meta.eventCount)}</span>
            </div>
            <div className={styles.infoRow}>
              <span>Detected columns</span>
              <span>{dataset.columns.join(', ')}</span>
            </div>
            <button type="button" className={styles.dangerButton} onClick={clear}>
              <Trash2 size={15} /> Clear dataset
            </button>
          </div>
        ) : (
          <div className={styles.datasetInfo}>
            <p className={styles.emptyText}>No dataset is currently loaded.</p>
            <button type="button" className={styles.primaryButton} onClick={loadSample}>
              Load sample dataset
            </button>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Privacy</h2>
        <div className={styles.privacyRow}>
          <Lock size={18} aria-hidden="true" className={styles.privacyIcon} />
          <p>
            InsightFlow runs entirely in your browser. Uploaded files are parsed locally and are
            never sent to a server — there is no backend, no database, and no external API. Your
            uploaded dataset is kept only in memory and clears automatically when you refresh the
            page.
          </p>
        </div>
      </section>
    </div>
  )
}
