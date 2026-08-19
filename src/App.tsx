import { useState } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { DatasetProvider, useDataset } from './context/DatasetContext'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Header } from './components/Header/Header'
import { EmptyState } from './components/EmptyState/EmptyState'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { Analytics } from './pages/Analytics/Analytics'
import { Funnels } from './pages/Funnels/Funnels'
import { Retention } from './pages/Retention/Retention'
import { Features } from './pages/Features/Features'
import { Segments } from './pages/Segments/Segments'
import { Priorities } from './pages/Priorities/Priorities'
import { AIAnalyst } from './pages/AIAnalyst/AIAnalyst'
import { Settings } from './pages/Settings/Settings'
import styles from './App.module.css'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Product Overview',
  '/analytics': 'Analytics',
  '/funnels': 'Funnels',
  '/retention': 'Retention',
  '/features': 'Features',
  '/segments': 'Segments',
  '/priorities': 'Priorities',
  '/ai-analyst': 'AI Product Analyst',
  '/settings': 'Settings',
}

function AppShell() {
  const { dataset, status } = useDataset()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'InsightFlow'
  const dataOptionalPaths = ['/settings', '/priorities']
  const showEmptyState = !dataset && !dataOptionalPaths.includes(location.pathname)

  return (
    <div className={styles.shell}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={styles.main}>
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.content}>
          {showEmptyState ? (
            <EmptyState />
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/funnels" element={<Funnels />} />
              <Route path="/retention" element={<Retention />} />
              <Route path="/features" element={<Features />} />
              <Route path="/segments" element={<Segments />} />
              <Route path="/priorities" element={<Priorities />} />
              <Route path="/ai-analyst" element={<AIAnalyst />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          )}
        </main>
      </div>
      <div aria-live="polite" className="visually-hidden">
        {status === 'loading' ? 'Loading dataset…' : ''}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <DatasetProvider>
      <HashRouter>
        <AppShell />
      </HashRouter>
    </DatasetProvider>
  )
}
