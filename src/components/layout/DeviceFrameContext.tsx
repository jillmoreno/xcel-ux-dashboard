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
import { BrowserWindow, MobileScreen, Monitor, TabletScreen } from '@/icons'

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
  const effectiveDevice: DeviceSize = present
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
  if (device === 'desktop')
    return (
      <>
        {chrome}
        {children}
      </>
    )
  // Demo frame: the full-width prototype/demo bars sit at the top of the dark
  // stage; the app itself (browser chrome → app header → content) is centered
  // inside a rounded browser-style window below them. The window chrome (traffic
  // lights) is injected by the Header as the window's top strip; the CSS rounds
  // it to meet the window's rounded corners. No `overflow` on the stage so the
  // app's sticky bars keep working (same rule as the narrow frames below).
  if (device === 'desktop-framed') {
    return (
      <div className="cre-demo-stage">
        {chrome}
        <div className="cre-demo-stage-window">{children}</div>
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
