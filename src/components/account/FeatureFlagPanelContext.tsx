/* eslint-disable react-refresh/only-export-components -- same pattern
   as JumpBackInPanelContext / LearningPathsPanelContext: provider +
   hook + types live together so callers import from one path. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * Shared "is the Feature Flag slide-over open" state. Mirrors
 * `JumpBackInPanelContext` — the panel itself is mounted once at the
 * layout level (so its portal lives inside the providers' subtree) and
 * any component can call `useFeatureFlagPanel().openPanel()`.
 *
 * Consumers today: AccountMenu's "Feature Flag" row under UI/UX Demo
 * Tools. Anywhere else that wants to surface the flag editor can call
 * the same hook.
 */
type State = {
  open: boolean
  openPanel: () => void
  closePanel: () => void
}

const FeatureFlagPanelContext = createContext<State | null>(null)

export function FeatureFlagPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openPanel = useCallback(() => setOpen(true), [])
  const closePanel = useCallback(() => setOpen(false), [])
  const value = useMemo<State>(
    () => ({ open, openPanel, closePanel }),
    [open, openPanel, closePanel],
  )
  return (
    <FeatureFlagPanelContext.Provider value={value}>
      {children}
    </FeatureFlagPanelContext.Provider>
  )
}

export function useFeatureFlagPanel(): State {
  const ctx = useContext(FeatureFlagPanelContext)
  if (!ctx) {
    throw new Error(
      'useFeatureFlagPanel must be used within FeatureFlagPanelProvider',
    )
  }
  return ctx
}
