/* eslint-disable react-refresh/only-export-components -- provider, hook,
   constants, and the small frame/toggle components co-locate so consumers
   import from one path (same pattern as AccountContext / FeatureFlagContext). */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { isAtlasCompassNavVersion, resolveDashboardVersion } from '@/data/dashboardVersions'
import { useAccount } from '@/context/AccountContext'
import { BrowserWindow, MobileScreen, Monitor, TabletScreen } from '@/icons'
import { isTestSession } from '@/data/gatewayMode'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { homeBreakpointFor } from '@/data/homeBreakpoints'
import '@/styles/home-breakpoints/index.css'

/**
 * Device-preview frame for the prototype. A toggle in the PrototypeBar
 * (`<DeviceFrameToggle />`) switches the in-app shell between Desktop (full
 * width, default), a Demo frame (the app centered inside a browser-style window
 * on a dark backdrop — the presentation view), iPad/Tablet, and Mobile;
 * `<DeviceFrame>` (mounted in AppLayout) applies each treatment. Choice
 * persists to localStorage so it survives reloads.
 *
 * Scoped to AppLayout (in-app routes). The gateway / `/prototype/*` pages
 * render the PrototypeBar without the toggle and have no provider — the hook
 * returns a safe `desktop` default there so nothing crashes.
 */

export type DeviceSize = 'desktop' | 'desktop-framed' | 'tablet' | 'mobile'

/** Frame width per device. `desktop` / `desktop-framed` aren't width-capped
 *  here (framed is handled by its own centered window), so only the two narrow
 *  sizes carry a pixel width. Standard iPad / iPhone widths. */
export const DEVICE_WIDTHS: Record<'tablet' | 'mobile', number> = {
  tablet: 834,
  mobile: 390,
}

type DeviceFrameValue = { device: DeviceSize; setDevice: (d: DeviceSize) => void }

/** Safe default when rendered outside a provider (gateway bar, unit tests):
 *  desktop + a no-op setter, so the toggle renders but does nothing. */
const NO_PROVIDER: DeviceFrameValue = { device: 'desktop', setDevice: () => {} }

const DeviceFrameContext = createContext<DeviceFrameValue | null>(null)

const STORAGE_KEY = 'cgp.deviceFrame'

function loadInitial(): DeviceSize {
  // The Demo frame is the DEFAULT view (the presentation window). Only an
  // explicit stored 'desktop' opts out; Tablet + Mobile are temporarily
  // disabled in the toggle (not responsive yet), so any stale value falls back
  // to the framed default. Re-add 'tablet' / 'mobile' to the allow-list when
  // those options are re-enabled.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'desktop') return 'desktop'
  } catch {
    // ignore (private mode / SSR)
  }
  return 'desktop-framed'
}

export function DeviceFrameProvider({ children }: { children: ReactNode }) {
  const [device, setDeviceState] = useState<DeviceSize>(loadInitial)
  const { search } = useLocation()
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, device)
    } catch {
      // ignore (private mode / quota)
    }
  }, [device])
  const setDevice = useCallback((d: DeviceSize) => setDeviceState(d), [])
  // A `?chrome=off` share link reads as a real web session (see PrototypeChrome).
  // Since the DEFAULT device is the Demo frame (a browser-window mock with
  // traffic-light dots), force plain full-bleed `desktop` for these links so no
  // fake window betrays the "real session" look — regardless of the viewer's
  // saved device. Only the effective value is overridden; the stored preference
  // is left intact, so leaving the share link restores their choice.
  const params = new URLSearchParams(search)
  const chromeOff = params.get('chrome') === 'off'
  // `?present=1` (the "Share Demo" link) forces the Demo frame — the app in a
  // browser window on the dark stage — regardless of the viewer's saved device,
  // so a shared demo always opens as the presentation view (with the prototype
  // bar + demo controls hidden; see PrototypeChrome).
  const present = params.get('present') === '1'
  /* `?test=1` (the moderated user-test link) forces the Demo frame for the same
     reason `present=1` does — the direct ask was to keep "the back background
     for the demo mode". It differs from `present` only in what it leaves on the
     bar: see `PrototypeChrome`. */
  const test = isTestSession(search)
  const effectiveDevice: DeviceSize = present || test
    ? 'desktop-framed'
    : chromeOff
      ? 'desktop'
      : device
  const value = useMemo<DeviceFrameValue>(
    () => ({ device: effectiveDevice, setDevice }),
    [effectiveDevice, setDevice],
  )
  return <DeviceFrameContext.Provider value={value}>{children}</DeviceFrameContext.Provider>
}

/** Current device + setter. Falls back to the no-op default outside a provider. */
export function useDeviceFrame(): DeviceFrameValue {
  return useContext(DeviceFrameContext) ?? NO_PROVIDER
}

/**
 * Constrains its children to the active device width, centered on a dark
 * backdrop. `desktop` renders the children untouched (full width). No
 * `overflow` on the frame so the app's sticky bars keep working.
 *
 * `chrome` is the prototype chrome (dark PrototypeBar + navy Demo Controls
 * banner). In the Demo frame it renders OUTSIDE the browser-window card so the
 * bars span the full screen width while the app sits in the centered, rounded
 * window below them. In every other mode it renders inline above the app.
 */
export function DeviceFrame({ chrome, children }: { chrome?: ReactNode; children: ReactNode }) {
  const { device } = useDeviceFrame()
  // The Atlas/Compass version's window opens at 1608 wide, not 1440
  // (2026-09-24, the direct ask). See `.cre-demo-stage-window--atlas`.
  /* ⚠ RESOLVED, NOT RAW (2026-10-06) — the demo stage opened at 1440 instead of
     the Atlas 1608 on a bare `?demo=1` once an Atlas version became the
     default. See `resolveDashboardVersion`. */
  const { brand } = useAccount()
  const atlas = isAtlasCompassNavVersion(
    resolveDashboardVersion(new URLSearchParams(useLocation().search).get('version'), brand),
  )
  const homeBreakpoint = homeBreakpointFor(useFeatureFlag('home-breakpoint').variant)
  /* THE BREAKPOINT FRAME (2026-10-30, Eric) — the design bar's Breakpoint control. When one is picked it wins over the
     device toggle: the app is drawn in a viewport of exactly that width and height, scrolling inside it, with its size
     captioned. `data-home-bp` is what scopes each breakpoint's own stylesheet (src/styles/home-breakpoints/).

     ⚠ ONE TREE FOR DESKTOP, THE DEMO FRAME AND EVERY BREAKPOINT — the same two divs in the same places, restyled. A
     different tree REMOUNTS the chrome, and the chrome's demo mode resets every flag to its baseline on the way back in —
     so picking a breakpoint put Breakpoint straight back to Live ("the breakpoints are not working", 2026-10-30). Desktop
     keeps its unwrapped layout through `display: contents`. */
  const breakpoint = homeBreakpoint
  if (device === 'desktop' || device === 'desktop-framed' || breakpoint) {
    const plain = device === 'desktop' && !breakpoint
    return (
      <div className={breakpoint ? 'cre-demo-stage cre-bp-stage' : plain ? undefined : 'cre-demo-stage'} style={plain ? CONTENTS : undefined}>
        {chrome}
        {breakpoint ? (
          <p className="cre-bp-caption">
            {breakpoint.label} · {breakpoint.width} × {breakpoint.height}
          </p>
        ) : null}
        <div
          className={
            breakpoint
              ? 'cre-bp-viewport'
              : plain
                ? undefined
                : atlas
                  ? 'cre-demo-stage-window cre-demo-stage-window--atlas'
                  : 'cre-demo-stage-window'
          }
          data-home-bp={breakpoint?.id}
          style={breakpoint ? { width: breakpoint.width, height: breakpoint.height } : plain ? CONTENTS : undefined}
        >
          {children}
        </div>
      </div>
    )
  }
  return (
    <div style={BACKDROP}>
      <div style={{ ...FRAME, maxWidth: DEVICE_WIDTHS[device] }}>
        {chrome}
        {children}
      </div>
    </div>
  )
}

/** Three-way device segmented toggle for the (dark) PrototypeBar. */
export function DeviceFrameToggle() {
  const { device, setDevice } = useDeviceFrame()
  return (
    <div role="group" aria-label="Preview device size" className="cre-device-toggle">
      {DEVICE_OPTIONS.map(({ id, label, Icon, disabled }) => (
        <button
          key={id}
          type="button"
          className="cre-device-toggle-btn"
          aria-pressed={device === id}
          aria-label={disabled ? `${label} view (not yet available)` : `${label} view`}
          title={disabled ? `${label} view — not yet responsive` : `${label} view`}
          disabled={disabled}
          onClick={() => !disabled && setDevice(id)}
          style={disabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
        >
          <Icon size={15} aria-hidden />
        </button>
      ))}
    </div>
  )
}

const DEVICE_OPTIONS: {
  id: DeviceSize
  label: string
  Icon: typeof Monitor
  /** Temporarily disabled — these viewports aren't responsive yet. */
  disabled?: boolean
}[] = [
  // Demo frame leads — it's the default view.
  { id: 'desktop-framed', label: 'Demo frame', Icon: BrowserWindow },
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'tablet', label: 'iPad / Tablet', Icon: TabletScreen, disabled: true },
  { id: 'mobile', label: 'Mobile', Icon: MobileScreen, disabled: true },
]

const CONTENTS: CSSProperties = { display: 'contents' }

const BACKDROP: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-neutral-900)',
}

const FRAME: CSSProperties = {
  margin: '0 auto',
  minHeight: '100vh',
  background: 'var(--color-surface-page)',
  // Lift the framed "device" off the dark backdrop.
  boxShadow: '0 0 0 1px rgb(0 0 0 / 0.35), 0 18px 50px rgb(0 0 0 / 0.45)',
}
