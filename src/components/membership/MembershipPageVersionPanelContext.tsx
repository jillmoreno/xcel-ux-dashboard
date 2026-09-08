/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching DashboardVersionsPanelContext: provider component, hook,
   and types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared "is the Membership Version slide-over open" state — the picker for the
 * Dashboard Rebrand "Membership" rail section (Full ⇄ Simple). Opened from the
 * "Membership Version" row in the Feature Flag sheet (next to "Dashboard
 * Version"). Mirrors DashboardVersionsPanelContext.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const MembershipPageVersionPanelContext = createContext<State | null>(null)

export function MembershipPageVersionPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(() => ({ open, openPanel, closePanel }), [open, openPanel, closePanel])
  return (
    <MembershipPageVersionPanelContext.Provider value={value}>
      {children}
    </MembershipPageVersionPanelContext.Provider>
  )
}

export function useMembershipPageVersionPanel(): State {
  const ctx = useContext(MembershipPageVersionPanelContext)
  if (!ctx) {
    throw new Error(
      'useMembershipPageVersionPanel must be used within MembershipPageVersionPanelProvider',
    )
  }
  return ctx
}
