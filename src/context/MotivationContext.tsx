/* eslint-disable react-refresh/only-export-components -- provider + hook in one
   file, same single-import pattern as LoFiContext / AccountContext. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * The learner's "motivation statement" — a single shared string so it can be
 * displayed/edited from more than one surface (the Dashboard Rebrand's "Your
 * Motivation" widget AND, in the `under-name` layout, the left-rail profile
 * header). Persists to `localStorage['cgp.motivationStatement']`.
 */
const STORAGE_KEY = 'cgp.motivationStatement'

export type MotivationState = {
  statement: string
  setStatement: (next: string) => void
}

function loadInitial(): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * Exported so a dev-handoff preview can pin the statement rather than inherit
 * the reviewer's own. `ProfilePersonalizeBand` self-dismisses once a statement
 * is set, so a reviewer who has saved one would otherwise open that component's
 * preview and be shown nothing — the same reason previews override
 * `AccountContext` instead of relying on whatever brand is seeded.
 */
export const MotivationContext = createContext<MotivationState | null>(null)

export function MotivationProvider({ children }: { children: ReactNode }) {
  const [statement, setStatementState] = useState<string>(loadInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, statement)
    } catch {
      // Quota / private-mode failures are swallowed — state still lives in
      // memory for the session.
    }
  }, [statement])

  const setStatement = useCallback((next: string) => setStatementState(next), [])
  const value = useMemo<MotivationState>(() => ({ statement, setStatement }), [statement, setStatement])

  return <MotivationContext.Provider value={value}>{children}</MotivationContext.Provider>
}

/** Safe default for callers (tests, isolated renders) with no provider — an
 *  empty statement + no-op setter. */
const DEFAULT_STATE: MotivationState = { statement: '', setStatement: () => {} }

export function useMotivation(): MotivationState {
  return useContext(MotivationContext) ?? DEFAULT_STATE
}
