/* eslint-disable react-refresh/only-export-components -- per-feature
   pattern matching `LearningPathsPanelContext`: provider component,
   hook, and types live together so callers import from one path. */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

/**
 * Shared "is the Jump Back In slide-over open" state. V3's Jump Back In
 * tile uses `<CardEyebrow viewAllHref="…">` to route to /my-learning/courses
 * by default, but in V3 the "View All →" eyebrow action opens this
 * slide-over instead — same shape as the `My Learning Paths` slide-over,
 * but listing every in-progress course as a compact row.
 *
 * The panel itself is mounted once at the layout level (alongside the
 * Learning Paths panel) so the slide-over portal lives in the same
 * subtree as the providers. Other components can simply call
 * `useJumpBackInPanel().openPanel()`.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const JumpBackInPanelContext = createContext<State | null>(null)

export function JumpBackInPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(() => ({ open, openPanel, closePanel }), [open, openPanel, closePanel])
  return (
    <JumpBackInPanelContext.Provider value={value}>
      {children}
    </JumpBackInPanelContext.Provider>
  )
}

export function useJumpBackInPanel(): State {
  const ctx = useContext(JumpBackInPanelContext)
  if (!ctx) {
    throw new Error('useJumpBackInPanel must be used within JumpBackInPanelProvider')
  }
  return ctx
}
