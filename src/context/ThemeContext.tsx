/* eslint-disable react-refresh/only-export-components -- ThemeProvider, the
   useTheme hook, and the Theme/Appearance types all live in this single module
   so consumers import from one place (mirrors AccountContext's pattern). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/** Resolved visual theme — what the token layer actually renders. */
export type Theme = 'light' | 'dark'

/**
 * The user-facing Appearance preference (Account menu → Preferences →
 * Appearance). Each mode bundles a resolved {@link Theme} with a rail
 * treatment ({@link NavVariant}):
 *
 *   - `light`      → light theme + a white rail (Neutral 50) — the default
 *   - `dim`        → light theme + a Neutral 800 dark rail
 *   - `dim-brand`  → light theme + a Primary 800 (per-brand) dark rail
 *   - `dark`       → dark theme  + graphite V2 rail
 *   - `system`     → follows the OS `prefers-color-scheme`, resolving to the
 *                    `light` or `dark` bundle.
 *
 * (`navy` / `light-2` / `light-3` remain as rail overrides for the
 * `platform-nav-color` demo flag, but are no longer Appearance modes.)
 */
export type Appearance =
  | 'light'
  | 'dim'
  | 'dim-brand'
  | 'dark'
  | 'system'

/** Rail treatment the shell applies for the resolved appearance. `navy` /
 *  `light-2` / `light-3` are no longer Appearance modes but remain valid rail
 *  overrides for the `platform-nav-color` demo flag. */
export type NavVariant =
  | 'light'
  | 'graphite'
  | 'neutral-800'
  | 'brand-800'
  | 'navy'
  | 'light-2'
  | 'light-3'

const APPEARANCES: readonly Appearance[] = ['light', 'dim', 'dim-brand', 'dark', 'system']

export type ThemeState = {
  /** The user's chosen mode (may be `system`). */
  appearance: Appearance
  setAppearance: (a: Appearance) => void
  /** Resolved theme (`system` collapsed to light/dark). Back-compat surface. */
  theme: Theme
  /** Rail treatment for the resolved appearance. */
  navVariant: NavVariant
  /** Legacy setters kept so existing call sites don't break. */
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

/**
 * Global appearance preference for the Dashboard Discoverability feature.
 *
 * The preference is persisted to localStorage, so once a reviewer picks a mode
 * it sticks across reloads. NOTE: holding the preference is separate from
 * *applying* it. The visual treatment is scoped to the `/dashboard-rebrand`
 * shell: `DashboardRebrandPage` writes `document.documentElement.dataset.theme`
 * from the resolved theme only while that page is mounted, and `PlatformShell`
 * reads `navVariant` to skin the rail. The rest of the app always renders the
 * app-wide light treatment. The Preferences entry (AccountMenu) likewise only
 * surfaces inside that feature.
 */
const STORAGE_KEY = 'cgp.appearance'
const LEGACY_THEME_KEY = 'cgp.theme'
const DEFAULT_APPEARANCE: Appearance = 'light'

function prefersDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function loadInitial(): Appearance {
  if (typeof window === 'undefined') return DEFAULT_APPEARANCE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw && (APPEARANCES as readonly string[]).includes(raw)) return raw as Appearance
    // Migrate a legacy light/dark theme preference into the appearance model.
    const legacy = window.localStorage.getItem(LEGACY_THEME_KEY)
    if (legacy === 'dark') return 'dark'
    if (legacy === 'light') return 'light'
    return DEFAULT_APPEARANCE
  } catch {
    return DEFAULT_APPEARANCE
  }
}

/** Resolve the concrete theme for an appearance + OS preference. */
export function resolveTheme(appearance: Appearance, osDark: boolean): Theme {
  if (appearance === 'dark') return 'dark'
  if (appearance === 'system') return osDark ? 'dark' : 'light'
  return 'light' // light + dim are both light-themed
}

/** Resolve the rail treatment for an appearance + OS preference. */
export function resolveNav(appearance: Appearance, osDark: boolean): NavVariant {
  switch (appearance) {
    case 'light':
      return 'light' // white rail (Neutral 50)
    case 'dim':
      return 'neutral-800' // Dim → Neutral 800 dark rail
    case 'dim-brand':
      return 'brand-800' // Dim / Brand → Primary 800 rail
    case 'system':
      return osDark ? 'graphite' : 'light'
    default:
      return 'graphite' // dark → the charcoal V2 rail
  }
}

const ThemeContext = createContext<ThemeState | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(loadInitial)
  const [osDark, setOsDark] = useState<boolean>(prefersDark)

  // Persist the chosen mode.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, appearance)
    } catch {
      // Ignore quota / private-mode errors — state still lives in memory.
    }
  }, [appearance])

  // Track the OS light/dark preference so `system` updates live.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setOsDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const setAppearance = useCallback((a: Appearance) => setAppearanceState(a), [])
  const setTheme = useCallback((t: Theme) => setAppearanceState(t), [])
  const toggleTheme = useCallback(
    () => setAppearanceState((prev) => (resolveTheme(prev, prefersDark()) === 'dark' ? 'light' : 'dark')),
    [],
  )

  const theme = resolveTheme(appearance, osDark)
  const navVariant = resolveNav(appearance, osDark)

  const value = useMemo<ThemeState>(
    () => ({ appearance, setAppearance, theme, navVariant, setTheme, toggleTheme }),
    [appearance, setAppearance, theme, navVariant, setTheme, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Safe default for consumers rendered outside a `ThemeProvider` (e.g. unit
 *  tests that mount a component in isolation). Mirrors `useDeviceFrame` — the
 *  hook never throws; appearance just resolves to the default and the setters
 *  are no-ops. The real app always wraps the tree in `<ThemeProvider>`
 *  (see `main.tsx`). */
const FALLBACK_THEME: ThemeState = {
  appearance: DEFAULT_APPEARANCE,
  setAppearance: () => {},
  theme: 'light',
  navVariant: 'graphite',
  setTheme: () => {},
  toggleTheme: () => {},
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext) ?? FALLBACK_THEME
}
