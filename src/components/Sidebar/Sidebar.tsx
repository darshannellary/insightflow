import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  LineChart,
  Filter,
  Repeat,
  Layers,
  Users,
  ListChecks,
  Sparkles,
  Settings,
  Lock,
  X,
} from 'lucide-react'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/funnels', label: 'Funnels', icon: Filter },
  { to: '/retention', label: 'Retention', icon: Repeat },
  { to: '/features', label: 'Features', icon: Layers },
  { to: '/segments', label: 'Segments', icon: Users },
  { to: '/priorities', label: 'Priorities', icon: ListChecks },
  { to: '/ai-analyst', label: 'AI Analyst', icon: Sparkles },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && <div className={styles.scrim} onClick={onClose} aria-hidden="true" />}
      <nav
        id="app-sidebar"
        className={`${styles.sidebar} ${open ? styles.open : ''}`}
        aria-label="Primary navigation"
      >
        <div className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              IF
            </span>
            <span className={styles.brandName}>InsightFlow</span>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <ul className={styles.navList}>
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={styles.footer}>
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <Settings size={18} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
          <div className={styles.privacyNote}>
            <Lock size={14} aria-hidden="true" />
            <div>
              <div className={styles.privacyTitle}>Local Analysis</div>
              <div className={styles.privacyText}>Your data never leaves this browser.</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
