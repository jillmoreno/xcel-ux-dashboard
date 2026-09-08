/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching DashboardVersionsPanelContext: provider, hook, and
   types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared "is the Membership Versions slide-over open" state. Mirrors
 * `DashboardVersionsPanelContext`. The Header's Membership-version pill
 * (surfaced from the Admin tools menu) is the entry point; the provider
 * lives at the layout level so any surface can call
 * `useMembershipVersionsPanel().openPanel()` without prop drilling.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const MembershipVersionsPanelContext = createContext<State | null>(null)

export function MembershipVersionsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(() => ({ open, openPanel, closePanel }), [open, openPanel, closePanel])
  return (
    <MembershipVersionsPanelContext.Provider value={value}>
      {children}
    </MembershipVersionsPanelContext.Provider>
  )
}

export function useMembershipVersionsPanel(): State {
  const ctx = useContext(MembershipVersionsPanelContext)
  if (!ctx) {
    throw new Error('useMembershipVersionsPanel must be used within MembershipVersionsPanelProvider')
  }
  return ctx
}
