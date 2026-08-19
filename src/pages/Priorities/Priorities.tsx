import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ArrowUpDown } from 'lucide-react'
import {
  loadRiceItems,
  saveRiceItems,
  rankRiceItems,
  type RiceItem,
  type RankedRiceItem,
} from '../../analytics/rice'
import { DataTable, type DataTableColumn } from '../../components/DataTable/DataTable'
import { Badge, type BadgeTone } from '../../components/Badge/Badge'
import { formatNumber } from '../../utils/formatting'
import styles from './Priorities.module.css'

const PRIORITY_TONE: Record<RankedRiceItem['priority'], BadgeTone> = {
  HIGH: 'positive',
  MEDIUM: 'warning',
  LOW: 'neutral',
}

const EMPTY_FORM = { feature: '', reach: '', impact: '', confidence: '', effort: '' }

export function Priorities() {
  const [items, setItems] = useState<RiceItem[]>(() => loadRiceItems())
  const [form, setForm] = useState(EMPTY_FORM)
  const [sortAsc, setSortAsc] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    saveRiceItems(items)
  }, [items])

  const ranked = useMemo(() => {
    const result = rankRiceItems(items)
    return sortAsc ? [...result].reverse() : result
  }, [items, sortAsc])

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const reach = Number(form.reach)
    const impact = Number(form.impact)
    const confidence = Number(form.confidence)
    const effort = Number(form.effort)

    if (!form.feature.trim()) {
      setFormError('Please enter a feature name.')
      return
    }
    if ([reach, impact, confidence, effort].some((n) => Number.isNaN(n) || n < 0)) {
      setFormError('Reach, impact, confidence and effort must all be numbers.')
      return
    }
    if (effort <= 0) {
      setFormError('Effort must be greater than zero.')
      return
    }

    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), feature: form.feature.trim(), reach, impact, confidence, effort },
    ])
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const columns: DataTableColumn<RankedRiceItem>[] = [
    { key: 'rank', label: 'Rank', render: (row) => `#${row.rank}` },
    { key: 'feature', label: 'Feature', render: (row) => <strong>{row.feature}</strong> },
    { key: 'reach', label: 'Reach', align: 'right', render: (row) => formatNumber(row.reach) },
    { key: 'impact', label: 'Impact', align: 'right', render: (row) => row.impact },
    { key: 'confidence', label: 'Confidence', align: 'right', render: (row) => `${row.confidence}%` },
    { key: 'effort', label: 'Effort', align: 'right', render: (row) => row.effort },
    { key: 'score', label: 'RICE Score', align: 'right', render: (row) => row.score.toFixed(1) },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <Badge tone={PRIORITY_TONE[row.priority]}>{row.priority}</Badge>,
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          className={styles.deleteButton}
          onClick={() => handleDelete(row.id)}
          aria-label={`Delete ${row.feature}`}
        >
          <Trash2 size={15} />
        </button>
      ),
    },
  ]

  return (
    <div className={styles.page}>
      <form className={styles.form} onSubmit={handleAdd}>
        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Feature</span>
            <input
              value={form.feature}
              onChange={(e) => setForm((f) => ({ ...f, feature: e.target.value }))}
              placeholder="e.g. Dark Mode"
            />
          </label>
          <label className={styles.field}>
            <span>Reach (users/quarter)</span>
            <input
              type="number"
              min={0}
              value={form.reach}
              onChange={(e) => setForm((f) => ({ ...f, reach: e.target.value }))}
              placeholder="3000"
            />
          </label>
          <label className={styles.field}>
            <span>Impact (0.25–3)</span>
            <input
              type="number"
              min={0}
              step={0.25}
              value={form.impact}
              onChange={(e) => setForm((f) => ({ ...f, impact: e.target.value }))}
              placeholder="2"
            />
          </label>
          <label className={styles.field}>
            <span>Confidence (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={form.confidence}
              onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value }))}
              placeholder="80"
            />
          </label>
          <label className={styles.field}>
            <span>Effort (person-weeks)</span>
            <input
              type="number"
              min={0.1}
              step={0.5}
              value={form.effort}
              onChange={(e) => setForm((f) => ({ ...f, effort: e.target.value }))}
              placeholder="4"
            />
          </label>
          <button type="submit" className={styles.addButton}>
            <Plus size={16} /> Add
          </button>
        </div>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
      </form>

      <div className={styles.card}>
        <div className={styles.tableHeader}>
          <span className={styles.count}>{items.length} ideas</span>
          <button type="button" className={styles.sortButton} onClick={() => setSortAsc((s) => !s)}>
            <ArrowUpDown size={14} />
            Sort by RICE {sortAsc ? '(lowest first)' : '(highest first)'}
          </button>
        </div>
        {ranked.length === 0 ? (
          <p className={styles.emptyMessage}>No ideas yet — add one above to start prioritizing.</p>
        ) : (
          <DataTable columns={columns} rows={ranked} getRowKey={(row) => row.id} />
        )}
      </div>
    </div>
  )
}
