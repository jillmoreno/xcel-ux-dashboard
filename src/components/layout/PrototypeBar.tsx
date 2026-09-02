import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, House } from '@/icons'
import {
  clearPrototypeWalkthrough,
  readPrototypeWalkthrough,
} from './prototypeWalkthrough'
import { prototypeFeatureById } from '@/data/prototypeFeatures'

// Guiding quotes shown on the right of the prototype bar. Kept as JS
// strings (not inline JSX text) so the apostrophes / smart quotes don't
// trip react/no-unescaped-entities.
const PROTOTYPE_QUOTES: { text: string; author?: string }[] = [
  {
    text: 'Design isn’t just what it looks like and feels like — design is how it works.',
    author: 'Steve Jobs',
  },
  {
    text: 'A user interface is like a joke. If you have to explain it, it’s not that good.',
    author: 'Martin LeBlanc',
  },
  {
    text: 'UX Designer (noun): a person always brainstorming to humanize technology. See also: wizard, magician.',
  },
  {
    text: 'Arachibutyrophobia: the fear of peanut butter sticking to the roof of your mouth.',
  },
  {
    text: 'Koumpounophobia: an intense aversion to or fear of clothing buttons.',
  },
  {
    text: 'Anatidaephobia: the lingering, irrational suspicion that a duck is watching you.',
  },
  {
    text: 'Hippopotomonstrosesquippedaliophobia: the wonderfully ironic — and real — fear of long words.',
  },
  {
    text: 'Triskaidekaphobia: the fear of the number 13, which can lead to avoiding floors in buildings or traveling on that specific day.',
  },
  {
    text: 'Globophobia: the fear of balloons, often triggered by the startling sound of them popping.',
  },
  {
    text: 'Nomophobia: the fear of being without your mobile phone or losing signal.',
  },
  {
    text: 'Pogonophobia: the fear of beards.',
  },
  {
    text: 'Phobophobia: the fear of developing a phobia — essentially, the fear of fear itself.',
  },
  {
    text: 'Turophobia: the fear of cheese.',
  },
  {
    text: 'Xanthophobia: the fear of the color yellow.',
  },
  {
    text: 'Alektorophobia: the fear of chickens.',
  },
  {
    text: 'Ablutophobia: the fear of bathing or washing.',
  },
  {
    text: 'Ommetaphobia: the fear of eyes.',
  },
]

// Rotate to the next quote on every full page reload. The index is
// computed once at module-evaluation time (which runs once per reload,
// and — unlike effects — is not double-invoked by StrictMode) and
// persisted so each reload advances by one, cycling through the set.
const ACTIVE_QUOTE = (() => {
  const KEY = 'cgp.prototypeQuoteIndex'
  try {
    const raw = window.localStorage.getItem(KEY)
    const next =
      raw === null ? 0 : (parseInt(raw, 10) + 1) % PROTOTYPE_QUOTES.length
    window.localStorage.setItem(KEY, String(next))
    return PROTOTYPE_QUOTES[next] ?? PROTOTYPE_QUOTES[0]
  } catch {
    return PROTOTYPE_QUOTES[0]
  }
})()

/**
 * Which prototype SECTION the current route belongs to — surfaced as a chip in
 * the bar next to the "UI/UX Prototype" label:
 *   • Demo          — `?section=demo`, a `?demo=1` experience, or a
 *                     demo-category feature.
 *   • Research      — the `/research-rationale` route.
 *   • Design & Dev  — `?section=dev`, a dev feature gateway, or any other
 *                     in-app working-set route.
 * Null on the section chooser (`/`), where nothing is chosen yet.
 */
function prototypeSectionLabel(
  pathname: string,
  search: string,
  walkthroughFeatureId: string | null,
): string | null {
  if (pathname.startsWith('/research-rationale')) return 'Research'
  const params = new URLSearchParams(search)
  const section = params.get('section')
  if (section === 'demo') return 'Demo'
  if (section === 'dev') return 'Design & Dev'
  if (params.get('demo') === '1') return 'Demo'
  const featureId = pathname.match(/^\/prototype\/([^/]+)/)?.[1] ?? walkthroughFeatureId
  if (featureId) {
    const feature = prototypeFeatureById(featureId)
    if (feature) return feature.category === 'demo' ? 'Demo' : 'Design & Dev'
  }
  // The bare gateway home is the chooser (no section); a feature gateway with an
  // unknown id resolves to nothing too. Everything else in-app is the working set.
  if (pathname === '/' || pathname.startsWith('/prototype')) return null
  return 'Design & Dev'
}

/**
 * Dark (neutral-800) ~40px utility bar pinned to the very top of the
 * prototype. Carries the prototype navigation (back to the gateway
 * home), the "UI/UX Prototype" label, and the guiding quote — all in
 * white against the dark strip.
 *
 * `showHomeLink` (default `true`) renders the top-left house icon that
 * jumps back to the gateway home (and clears any active walkthrough).
 * The gateway landing page itself passes `false` — there's nowhere
 * "home" to go from home.
 *
 * When the reviewer is mid feature walkthrough (a feature id is stashed
 * in session — see `prototypeWalkthrough`) and is NOT on a gateway
 * route, a "← Back" pill appears next to the house and returns to that
 * feature's page (`/prototype/:featureId`).
 *
 * `adminTools` is an optional slot pinned to the far-right edge of the bar
 * (just right of the quote). The in-app Header injects `<AdminToolsMenu />`
 * here; the gateway landing page passes nothing (the menu depends on
 * AppLayout contexts that don't exist on the gateway).
 */
export function PrototypeBar({
  showHomeLink = true,
  adminTools,
  demoToggle,
  deviceToggle,
  back,
  fullBleed = false,
}: {
  showHomeLink?: boolean
  adminTools?: ReactNode
  /** Stakeholder "Demo" show/hide toggle, positioned to the left of the
   *  "UI/UX Prototype" label (just before the device toggle). The in-app
   *  Header injects it only on the Dashboard Discoverability shell (where the
   *  Demo Controls banner lives). */
  demoToggle?: ReactNode
  /** Device-size preview toggle, sitting left of the "UI/UX Prototype" label
   *  (just after the Demo toggle). The in-app Header injects
   *  `<DeviceFrameToggle />` here; the gateway bar passes nothing (no
   *  DeviceFrameProvider out there). */
  deviceToggle?: ReactNode
  /** Explicit "← Back" pill target — overrides the session-walkthrough
   *  back and shows regardless of route (e.g. the dev-handoff detail
   *  page links back to its feature gateway). */
  back?: { to: string; label?: string; title?: string }
  /** In the Demo frame the bar runs edge-to-edge (full screen width) — drops the
   *  rebrand's 1440-cap / left-anchor so the dark strip + its content span the
   *  whole viewport above the centered browser window. */
  fullBleed?: boolean
}) {
  const { pathname, search } = useLocation()
  const walkthroughFeatureId = readPrototypeWalkthrough()
  // The prototype SECTION the reviewer is currently in — shown as a chip right
  // of the "UI/UX Prototype" label. Null on the section chooser (`/`), where no
  // section is active yet.
  const sectionLabel = prototypeSectionLabel(pathname, search, walkthroughFeatureId)
  // On the gateway itself (home or a feature page) there's nothing to go
  // "back" to — the session-walkthrough Back pill only shows on platform
  // screens. An explicit `back` prop wins and shows anywhere.
  const onGatewayRoute = pathname === '/' || pathname.startsWith('/prototype')
  // On the rebrand shell the bar is LEFT-anchored (no `mx-auto`) so it shares
  // the shell's coordinate system — rail flush-left, rail+content capped at
  // 1440 — matching the app header + Demo Controls bar.
  const platformNav = pathname === '/dashboard-rebrand'
  const backTarget: { to: string; label: string; title?: string } | null = back
    ? { to: back.to, label: back.label ?? 'Back', title: back.title }
    : showHomeLink && walkthroughFeatureId && !onGatewayRoute
      ? {
          // Explore walkthroughs open the platform directly (no curated
          // gateway), so their Back returns to the Common Dashboard landing;
          // guided walkthroughs return to their feature gateway.
          to:
            prototypeFeatureById(walkthroughFeatureId)?.kind === 'explore'
              ? '/'
              : `/prototype/${walkthroughFeatureId}`,
          label: 'Back',
        }
      : null
  return (
    <div
      className="cre-prototype-bar"
      style={{
        position: 'sticky',
        top: 0,
        // Above the platform header (z 50), which sticks just below this
        // bar at top: 40 — so both stay pinned and always visible.
        zIndex: 60,
        height: 40,
        background: 'var(--color-neutral-800)',
        color: 'var(--color-neutral-50)',
        // On the rebrand shell the bar is capped at the 1440 rail+content width
        // and left-anchored (matching the app header + Demo Controls bar), so on
        // wider screens the area to the right shows the page background rather
        // than the dark strip running past the content edge. In the Demo frame
        // (`fullBleed`) that cap is dropped so the strip spans the full screen.
        ...(platformNav && !fullBleed ? { maxWidth: 1440, alignSelf: 'flex-start', width: '100%' } : null),
      }}
    >
      <div
        className={`flex items-center${platformNav || fullBleed ? '' : ' mx-auto'}`}
        style={{
          height: '100%',
          maxWidth: fullBleed ? 'none' : 1440,
          padding: '0 24px',
          width: '100%',
          gap: 16,
        }}
      >
        {showHomeLink && <PrototypeHomeIcon />}
        {/* The "← Back" pill — from an explicit `back` prop (shows regardless of
            route, e.g. the landing's section → overview) or the session
            walkthrough (feature gateways). */}
        {backTarget && (
          <FeatureBackLink
            to={backTarget.to}
            label={backTarget.label}
            title={backTarget.title}
          />
        )}
        {(showHomeLink || backTarget) && (
          <span
            aria-hidden
            style={{
              width: 1,
              height: 16,
              background: 'rgba(255, 255, 255, 0.25)',
              flexShrink: 0,
            }}
          />
        )}
        {/* "Demo" show/hide toggle (Discoverability shell only) + the
            device-size preview toggle — kept as ONE flex child with a tight
            inner gap, positioned to the LEFT of the "UI/UX Prototype" label. */}
        {(demoToggle || deviceToggle) && (
          <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {demoToggle}
            {deviceToggle}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          UI/UX Prototype
        </span>
        {/* Current-section chip (Demo / Research / Design & Dev) — reflects which
            prototype section the reviewer is in. Hidden on the chooser. */}
        {sectionLabel && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 9px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 255, 255, 0.14)',
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              color: 'var(--color-neutral-50)',
            }}
          >
            {sectionLabel}
          </span>
        )}
        {/* Quote — pushed to the right so it sits just left of the far-right
            admin-tools (robot) menu; truncates first when space is tight. */}
        <span
          style={{
            marginLeft: 'auto',
            minWidth: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            fontStyle: 'italic',
            color: 'rgba(255, 255, 255, 0.72)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {'“' + ACTIVE_QUOTE.text + '”'}
          {ACTIVE_QUOTE.author && (
            <span style={{ fontStyle: 'normal', opacity: 0.85, marginLeft: 6 }}>
              {'— ' + ACTIVE_QUOTE.author}
            </span>
          )}
        </span>
        {/* Hidden admin-tools (robot) menu — pinned to the far-right edge of
            the bar, just right of the quote. */}
        {adminTools}
      </div>
    </div>
  )
}

/**
 * Top-left house icon → gateway home (`/`). Always visible (unlike the
 * hover-revealed admin-tools robot it's modeled on), white on the dark
 * strip with a subtle hover tint. Clears any active walkthrough so the
 * reviewer lands home with a clean slate.
 */
function PrototypeHomeIcon() {
  return (
    <Link
      to="/"
      onClick={() => clearPrototypeWalkthrough()}
      aria-label="Prototype home"
      title="Prototype home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-pill)',
        background: 'transparent',
        color: 'var(--color-neutral-50)',
        flexShrink: 0,
        transition: 'background 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <House size={18} aria-hidden />
    </Link>
  )
}

/**
 * "← Back" pill in the prototype bar. Used both mid-walkthrough (back to
 * the originating feature gateway) and by sub-pages like the dev-handoff
 * detail (back to its feature). White-outline pill, brightens on hover.
 */
function FeatureBackLink({
  to,
  label,
  title,
}: {
  to: string
  label: string
  title?: string
}) {
  return (
    <Link
      to={to}
      aria-label={title ?? label}
      title={title ?? label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 12px',
        borderRadius: 'var(--radius-pill)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        background: 'transparent',
        color: 'var(--color-neutral-50)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        transition: 'border-color 120ms ease, background 120ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)'
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <ArrowLeft size={14} aria-hidden />
      {label}
    </Link>
  )
}
