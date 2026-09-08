/* eslint-disable react-refresh/only-export-components -- same pattern
   as FeatureFlagContext / AccountContext: provider + hook + types
   in one file so consumers import from a single path. */
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
 * Platform-wide Lo-Fi mode. When `loFi` is true, `<AppLayout>` swaps
 * the main route content for a generic wireframe placeholder so
 * reviewers can preview the platform's layout skeleton without any
 * real data, copy, or imagery in the way.
 *
 * Toggle surfaces from AccountMenu → UI/UX Demo Tools → "Lo-Fi
 * mode" (the row's label flips to "Hi-Fi mode" while active).
 *
 * Persists to `localStorage` under `cgp.loFi` so a reviewer's
 * choice survives reload. Per-browser, never synced to the
 * account.
 */
type LoFiState = {
  loFi: boolean
  setLoFi: (next: boolean) => void
  toggle: () => void
}

const STORAGE_KEY = 'cgp.loFi'

function loadInitial(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw === 'true'
  } catch {
    return false
  }
}

const LoFiContext = createContext<LoFiState | null>(null)

export function LoFiProvider({ children }: { children: ReactNode }) {
  const [loFi, setLoFiState] = useState(loadInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, loFi ? 'true' : 'false')
    } catch {
      // Quota / private-mode failures are swallowed — state still
      // lives in memory for the session.
    }
  }, [loFi])

  const setLoFi = useCallback((next: boolean) => setLoFiState(next), [])
  const toggle = useCallback(() => setLoFiState((prev) => !prev), [])

  const value = useMemo<LoFiState>(
    () => ({ loFi, setLoFi, toggle }),
    [loFi, setLoFi, toggle],
  )

  return <LoFiContext.Provider value={value}>{children}</LoFiContext.Provider>
}

/** A no-op default for callers (tests, isolated component renders)
 *  that aren't wrapped in `<LoFiProvider>`. Returning a stable
 *  `loFi: false` state means components can opt into lo-fi via the
 *  hook safely from anywhere — they just render their normal
 *  content when no provider exists. */
const DEFAULT_STATE: LoFiState = {
  loFi: false,
  setLoFi: () => {},
  toggle: () => {},
}

export function useLoFi(): LoFiState {
  const ctx = useContext(LoFiContext)
  return ctx ?? DEFAULT_STATE
}

/**
 * Scope lo-fi to a single subtree. Re-provides the Lo-Fi context with
 * `loFi` OR-ed with `on`, so wrapping one widget (e.g. when its feature
 * flag's variant is "lo-fi") flips just that widget into its existing
 * lo-fi placeholder — without touching the widget's own code. The
 * global master switch still wins: when `parent.loFi` is true every
 * scoped widget is lo-fi regardless of `on`. `setLoFi` / `toggle` are
 * passed through unchanged so the master toggle keeps working from
 * inside a scope.
 */
export function LoFiScope({
  on,
  children,
}: {
  on: boolean
  children: ReactNode
}) {
  const parent = useLoFi()
  const value = useMemo<LoFiState>(
    () => ({ ...parent, loFi: parent.loFi || on }),
    [parent, on],
  )
  return <LoFiContext.Provider value={value}>{children}</LoFiContext.Provider>
}
