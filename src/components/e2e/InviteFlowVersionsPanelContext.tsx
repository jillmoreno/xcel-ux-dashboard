/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching DashboardVersionsPanelContext: provider component, hook
   and types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared "is the Invite Flow Versions slide-over open" state — 2026-10-22.
 *
 * Mirrors `DashboardVersionsPanelContext`, and is a SEPARATE provider rather
 * than a second flag on that one: both pickers are reached from the same demo-bar
 * control on different routes, and one `open` boolean for both would let a
 * dashboard sheet left open on `/dashboard-rebrand` reappear over an invite
 * page. Two states, one trigger that chooses between them (`DemoControlsBar`).
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const InviteFlowVersionsPanelContext = createContext<State | null>(null)

export function InviteFlowVersionsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(() => ({ open, openPanel, closePanel }), [open, openPanel, closePanel])
  return (
    <InviteFlowVersionsPanelContext.Provider value={value}>
      {children}
    </InviteFlowVersionsPanelContext.Provider>
  )
}

/**
 * ⚠ RETURNS `null` WITHOUT A PROVIDER RATHER THAN THROWING, which is the one
 * place this deliberately parts company with `useDashboardVersionsPanel`.
 *
 * Its consumer is `DemoControlsBar` — SHARED CHROME that a dozen test harnesses
 * already mount, each listing the providers it needs by hand. A throwing hook
 * there does not surface a wiring bug; it turns every one of those suites red
 * for a control they are not testing, and the pressure is then to add a
 * provider to each file rather than to fix anything. Null means the bar's
 * version control keeps its dashboard behaviour, which is exactly what those
 * harnesses had before this existed.
 *
 * In the running app the provider is unconditional (`AppLayout`), so the null
 * arm is a test-harness path, not a product one.
 */
export function useInviteFlowVersionsPanel(): State | null {
  return useContext(InviteFlowVersionsPanelContext)
}
