import Papa from 'papaparse'

export interface ParsedCsv {
  headers: string[]
  rows: Record<string, string>[]
}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields ?? []
        if (headers.length === 0) {
          reject(new Error('The file could not be read as a CSV with headers.'))
          return
        }
        resolve({ headers, rows: results.data })
      },
      error: (error: Error) => reject(error),
    })
  })
}
