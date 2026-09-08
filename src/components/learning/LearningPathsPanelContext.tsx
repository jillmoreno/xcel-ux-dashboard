/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching the AccountContext: provider component, hook, and
   types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { HomeStatus } from './learningPathsHomeUtil'

/**
 * Shared "is the My Learning Paths slide-over open" state. Two entry
 * points need to drive it:
 *
 *   1. The Header's "My Learning > Learning Paths" dropdown item
 *      (the original entry point).
 *   2. The Dashboard's Learner-Overview → Learning Paths "View All →"
 *      link.
 *
 * The panel itself is mounted once in `Header` (so the slide-over
 * portal lives in the same subtree as the navigation that originated
 * it). Other components can simply call `useLearningPathsPanel().openPanel()`.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
  /** The learner's currently-selected learning path id, or `null` to fall back
   *  to the brand's default active path. Selecting a path from the slide-over on
   *  the Dashboard Rebrand sets this (in place of navigating away) so the
   *  Current Learning Path + Jump Back In widgets re-resolve to it. */
  activePathId: string | null
  setActivePathId: (id: string | null) => void
  /** The compliance status of the active/pinned path, set from the dashboard
   *  progress-state persona (the demo "Progress" dropdown). When set, the
   *  sheet's pinned path reflects it instead of its own derived status, so the
   *  demo selection updates the sheet in lockstep with the Current Learning
   *  Path widget. `null` ⇒ the pinned path keeps its real derived status. */
  activeStatus: HomeStatus | null
  setActiveStatus: (status: HomeStatus | null) => void
}

const LearningPathsPanelContext = createContext<State | null>(null)

export function LearningPathsPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [activePathId, setActivePathId] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<HomeStatus | null>(null)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(
    () => ({ open, openPanel, closePanel, activePathId, setActivePathId, activeStatus, setActiveStatus }),
    [open, openPanel, closePanel, activePathId, activeStatus],
  )
  return (
    <LearningPathsPanelContext.Provider value={value}>
      {children}
    </LearningPathsPanelContext.Provider>
  )
}

export function useLearningPathsPanel(): State {
  const ctx = useContext(LearningPathsPanelContext)
  if (!ctx) {
    throw new Error('useLearningPathsPanel must be used within LearningPathsPanelProvider')
  }
  return ctx
}
