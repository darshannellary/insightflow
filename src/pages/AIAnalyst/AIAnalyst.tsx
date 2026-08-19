import { useState } from 'react'
import { Sparkles, Search } from 'lucide-react'
import { useDataset } from '../../context/DatasetContext'
import { useInsights } from '../../context/useAnalyticsBundle'
import { answerQuery, type AskResult } from '../../analytics/insightEngine'
import { InsightCard } from '../../components/InsightCard/InsightCard'
import { InlineNotice } from '../../components/InlineNotice/InlineNotice'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import styles from './AIAnalyst.module.css'

const EXAMPLE_QUESTIONS = [
  'What is my biggest growth opportunity?',
  'Which segment converts best?',
  'Where are users dropping off?',
  'Which features should I investigate?',
  'What changed recently?',
]

export function AIAnalyst() {
  const { dataset, range } = useDataset()
  const { insights, context } = useInsights(range)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<AskResult | null>(null)

  const runQuery = (q: string) => {
    if (!context) return
    setQuery(q)
    setResult(answerQuery(q, context, insights))
  }

  if (!dataset) return null

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <div className={styles.introHeader}>
          <Sparkles size={18} aria-hidden="true" className={styles.introIcon} />
          <h2>AI Product Analyst</h2>
          <Tooltip label="How this works">
            InsightFlow uses local statistical analysis and rule-based reasoning to generate
            product insights. No external AI service or API key is required, and your data never
            leaves your browser.
          </Tooltip>
        </div>
        <p className={styles.introBody}>
          These insights are generated entirely in your browser by running deterministic rules
          over your data — not by an LLM.
        </p>
      </div>

      <section className={styles.askSection}>
        <h3 className={styles.askTitle}>Ask your product data</h3>
        <form
          className={styles.askForm}
          onSubmit={(e) => {
            e.preventDefault()
            runQuery(query)
          }}
        >
          <div className={styles.searchInput}>
            <Search size={16} aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Where are users dropping off?"
              aria-label="Ask your product data"
            />
          </div>
          <button type="submit" className={styles.askButton}>
            Ask
          </button>
        </form>
        <div className={styles.examples}>
          {EXAMPLE_QUESTIONS.map((q) => (
            <button key={q} type="button" className={styles.exampleChip} onClick={() => runQuery(q)}>
              {q}
            </button>
          ))}
        </div>

        {result && (
          <div className={styles.answer}>
            <h4 className={styles.answerTitle}>{result.title}</h4>
            <ul className={styles.answerBody}>
              {result.body.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h3 className={styles.insightsTitle}>Detected insights</h3>
        {insights.length === 0 ? (
          <InlineNotice>
            No strong patterns were detected in this dataset yet. Try a different date range, or
            upload a dataset with more history.
          </InlineNotice>
        ) : (
          <div className={styles.insightGrid}>
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
