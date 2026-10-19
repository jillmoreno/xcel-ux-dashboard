import { useSearchParams } from 'react-router-dom'
import { useDeviceFrame } from './DeviceFrameContext'
import { isTestSession } from '@/data/gatewayMode'

/** The strip's height — the shell offsets its sticky header by it. */
export const BROWSER_CHROME_H = 38

/**
 * THE DEMO FRAME'S BROWSER-WINDOW TITLE BAR — three traffic lights on a grey
 * strip, the top edge of the centred window the demo renders inside.
 *
 * ⚠ IT LIVED IN `Header.tsx` UNTIL 2026-10-19, which meant only pages inside
 * the app shell had it. The invite flow renders OUTSIDE that shell — its
 * whole point is that it is not the product yet — so the walk opened in a
 * browser window, lost its window for three pages, and got it back at the
 * dashboard (Jillienne: "can we also add this browser header to the
 * email/invite flows so it feels like a seamless experience"). Moved here so
 * both draw the same one rather than the flow drawing a copy that drifts.
 */
export function BrowserChromeBar({ top }: { top: number }) {
  return (
    <div
      aria-hidden
      className="cre-browser-chrome"
      style={{
        // Pins directly below the prototype bar so the browser-window chrome
        // stays fixed together with the app header on scroll.
        position: 'sticky',
        top,
        zIndex: 51,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        height: BROWSER_CHROME_H,
        padding: '0 16px',
        background: 'var(--color-neutral-300)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <span style={{ display: 'inline-flex', gap: 8, flexShrink: 0 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
      </span>
    </div>
  )
}

/**
 * The same strip, for a page that is NOT inside the app shell — it works out
 * for itself whether the demo frame is on and where the prototype bar leaves
 * off, which the shell's Header does from its own state.
 *
 * ⚠ THE 40 AND THE LIST OF HIDERS ARE THE SHELL'S, repeated here because the
 * shell computes them from props this page does not have. `PrototypeChrome`
 * is the authority on which params hide the bar; if one is added there it has
 * to be added in both places, which is exactly the note `Header.tsx` already
 * carries about `stageTop`.
 */
export function StandaloneBrowserChrome() {
  const { device } = useDeviceFrame()
  const [params] = useSearchParams()
  if (device !== 'desktop-framed') return null
  const hidden =
    params.get('chrome') === 'off' || params.get('present') === '1' || isTestSession(`?${params.toString()}`)
  return <BrowserChromeBar top={hidden ? 0 : 40} />
}
