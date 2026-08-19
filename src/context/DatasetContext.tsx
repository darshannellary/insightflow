import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { parseCsvFile } from '../utils/csvParser'
import { buildDataset, DatasetBuildError } from '../utils/datasetBuilder'
import { getSampleDataset } from '../data/sampleData'
import type { Dataset, RangePreset } from '../types/dataset'

export type DatasetStatus = 'empty' | 'loading' | 'ready' | 'error'

interface DatasetContextValue {
  dataset: Dataset | null
  status: DatasetStatus
  error: string | null
  range: RangePreset
  setRange: (range: RangePreset) => void
  loadFile: (file: File) => Promise<void>
  loadSample: () => void
  clear: () => void
}

const DatasetContext = createContext<DatasetContextValue | null>(null)

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [status, setStatus] = useState<DatasetStatus>('empty')
  const [error, setError] = useState<string | null>(null)
  const [range, setRange] = useState<RangePreset>('30d')

  const loadFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setStatus('error')
      setError('Please upload a .csv file.')
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const { headers, rows } = await parseCsvFile(file)
      const built = buildDataset(rows, headers, file.name, false)
      setDataset(built)
      setRange('30d')
      setStatus('ready')
    } catch (err) {
      setDataset(null)
      setStatus('error')
      setError(
        err instanceof DatasetBuildError
          ? err.message
          : 'We could not read that file. Please check it is a valid CSV and try again.',
      )
    }
  }, [])

  const loadSample = useCallback(() => {
    setStatus('loading')
    setError(null)
    try {
      const sample = getSampleDataset()
      setDataset(sample)
      setRange('30d')
      setStatus('ready')
    } catch {
      setStatus('error')
      setError('Could not generate the sample dataset.')
    }
  }, [])

  const clear = useCallback(() => {
    setDataset(null)
    setStatus('empty')
    setError(null)
  }, [])

  const value = useMemo<DatasetContextValue>(
    () => ({ dataset, status, error, range, setRange, loadFile, loadSample, clear }),
    [dataset, status, error, range, loadFile, loadSample, clear],
  )

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together deliberately
export function useDataset(): DatasetContextValue {
  const ctx = useContext(DatasetContext)
  if (!ctx) throw new Error('useDataset must be used within a DatasetProvider')
  return ctx
}
