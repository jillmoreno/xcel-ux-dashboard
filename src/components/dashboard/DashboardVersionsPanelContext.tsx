/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching the AccountContext: provider component, hook, and
   types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared "is the Dashboard Versions slide-over open" state. The Header's
 * Dashboard pill is the only entry point today, but the provider lives
 * at the layout level so other surfaces can call
 * `useDashboardVersionsPanel().openPanel()` without prop drilling.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const DashboardVersionsPanelContext = createContext<State | null>(null)

export function DashboardVersionsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(() => ({ open, openPanel, closePanel }), [open, openPanel, closePanel])
  return (
    <DashboardVersionsPanelContext.Provider value={value}>
      {children}
    </DashboardVersionsPanelContext.Provider>
  )
}

export function useDashboardVersionsPanel(): State {
  const ctx = useContext(DashboardVersionsPanelContext)
  if (!ctx) {
    throw new Error('useDashboardVersionsPanel must be used within DashboardVersionsPanelProvider')
  }
  return ctx
}
