import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Link } from 'react-router-dom'
import { Bell, Check, X } from '@/icons'
import { NotificationRow } from './NotificationRow'
import { useNotifications } from '@/context/NotificationsContext'
import { unreadBadgeLabel } from '@/data/notificationsFixtures'

/**
 * The header bell + the panel behind it.
 *
 * ## What the bell is for
 *
 * It is the **durable** half of the alert system — things that happened while
 * the learner was not looking. The transient half is [`Toast`](../ui/Toast.tsx),
 * and the two share `alertTones` but not a list. `notificationsFixtures`
 * carries the full argument for why piping one into the other ruins both.
 *
 * ## Three decisions worth not re-deriving
 *
 * **The badge counts UNREAD, not total.** A count that never goes down is a
 * scold rather than a signal, and the learner cannot act on it — the only way
 * to clear "8" would be to delete things. Unread falls to zero by reading,
 * which is the behaviour the badge is asking for.
 *
 * **Opening the panel does not mark everything read.** That is the shortcut
 * every implementation reaches for and it destroys the one thing the list is
 * good at: coming back to something. The badge clears per-row on click, plus
 * an explicit "Mark all read" — so dismissing the lot stays a decision rather
 * than a side effect of glancing at it.
 *
 * **A row is a link, not a card with buttons.** The panel is 380px; a
 * two-button footer per row turns eight notifications into a wall of chrome.
 * `actionLabel` renders as the row's own affordance text, and the whole row
 * is the hit target — the same call the week strip made ("every cell is a
 * link and a test asserts no buttons"). The two real buttons in the panel are
 * its header controls, which act on the LIST rather than on an item.
 */
export function NotificationsMenu() {
  // Items and read state come from `NotificationsContext`, not from local
  // state. They used to live here, which was fine while the bell was the only
  // surface — the moment "View all" opened the full page, a local copy meant
  // clearing a row in the bell left it unread on the page, with the badge
  // already down. See that context for the rest of the argument.
  const { items, unread, markRead, markAllRead } = useNotifications()

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const id = useId()

  /**
   * How far to nudge the panel right so it stays on screen.
   *
   * The panel is 380px and anchored to the BELL's right edge — but the bell
   * is not the rightmost thing in the header (the account menu is), so at
   * phone width the panel's left edge landed 68px OFF SCREEN. `maxWidth` does
   * not help: it sized the panel correctly at 343px and then hung it in the
   * wrong place, which is why this needed measuring rather than a media query.
   *
   * Measured rather than computed from a breakpoint because the shell renders
   * inside a scaled `DeviceFrame`, so "the viewport" is not the window — the
   * same reason the Toast anchors through `useToastFrameAnchor` instead of
   * pinning to `position: fixed`.
   */
  const [shiftX, setShiftX] = useState(0)
  useLayoutEffect(() => {
    if (!open) {
      setShiftX(0)
      return
    }
    const clamp = () => {
      const panelEl = panelRef.current
      const anchorEl = ref.current
      if (!panelEl || !anchorEl) return
      const w = panelEl.offsetWidth
      // jsdom has no layout engine — every rect comes back zero, so there is
      // nothing to clamp and measuring would just walk the panel sideways on
      // each pass. Bailing on a zero width makes this a no-op in tests
      // instead of an infinite update loop, which is what it was first.
      if (!w) return
      // Measured from the ANCHOR, not from the panel. The panel sits at
      // `right: 0` inside it, so its untransformed left edge is exactly
      // `anchor.right - width` — a figure that does not include the shift
      // already applied, so this converges and `shiftX` stays out of the
      // dependency list.
      const unshiftedLeft = anchorEl.getBoundingClientRect().right - w
      setShiftX(unshiftedLeft < PANEL_GUTTER ? PANEL_GUTTER - unshiftedLeft : 0)
    }
    clamp()
    window.addEventListener('resize', clamp)
    return () => window.removeEventListener('resize', clamp)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        // The count is IN the label, not only in the badge — a red dot is
        // colour-and-position alone, which announces nothing.
        aria-label={
          unread > 0
            ? `Notifications — ${unread} unread`
            : 'Notifications — none unread'
        }
        onClick={() => setOpen((v) => !v)}
        className={`cre-icon-pill${open ? ' is-active' : ''}`}
        style={{ position: 'relative' }}
      >
        <Bell size={20} aria-hidden />
        {unread > 0 && (
          <span aria-hidden style={badgeStyle}>
            {unreadBadgeLabel(unread)}
          </span>
        )}
      </button>

      {open && (
        <div
          id={id}
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          style={{
            ...panelStyle,
            ...(shiftX ? { transform: `translateX(${shiftX}px)` } : null),
          }}
        >
          <header style={panelHeaderStyle}>
            <h2 style={panelTitleStyle}>Notifications</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="cre-alert-action"
                  style={textButtonStyle}
                >
                  <Check size={14} aria-hidden />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                aria-label="Close notifications"
                onClick={() => setOpen(false)}
                className="cre-icon-pill"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          </header>

          {items.length === 0 ? (
            <EmptyState />
          ) : (
            <ul style={listStyle}>
              {items.map((n) => (
                <li key={n.id}>
                  <NotificationRow
                    notification={n}
                    onOpen={() => {
                      markRead(n.id)
                      if (n.href) setOpen(false)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* The way out to the full list. Always shown, even on an empty
              one — a route that appears and disappears is one the learner
              cannot learn, which is the same call "View all" made on the
              Today's Tasks card. And it carries NO number, for the reason
              that card also found: the header two inches up already counts
              them, and two counts inches apart saying the same thing is the
              thing that gets edited out of one place and not the other. */}
          <footer style={panelFooterStyle}>
            <Link
              to="/dashboard-rebrand?section=notifications"
              onClick={() => setOpen(false)}
              className="cre-alert-action"
              style={footerLinkStyle}
            >
              View all →
            </Link>
          </footer>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div style={emptyStyle}>
      <span aria-hidden style={{ color: 'var(--color-neutral-500)' }}>
        <Bell size={28} aria-hidden />
      </span>
      <p style={emptyTitleStyle}>You're all caught up</p>
      <p style={emptyBodyStyle}>
        Reminders about your study plan, exam readiness and licence renewal will show up here.
      </p>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const badgeStyle: CSSProperties = {
  position: 'absolute',
  top: 4,
  right: 4,
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 'var(--radius-pill)',
  // The CTA ramp, not the error ramp. An unread count is not an error, and
  // XCEL's `--color-cta-500` is the knight's Brick red — loud enough to find
  // and already the brand's "look here" colour.
  background: 'var(--color-cta-500)',
  color: '#fff',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: '18px',
  textAlign: 'center',
  // Separates the badge from the glyph behind it at any header background.
  boxShadow: '0 0 0 2px var(--color-surface-card)',
}

/** Minimum space between the panel and the edge of the frame it renders in. */
const PANEL_GUTTER = 16

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  width: 380,
  maxWidth: `calc(100vw - ${PANEL_GUTTER * 2}px)`,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--shadow-popover)',
  zIndex: 50,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const panelHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  padding: '10px 8px 10px 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const panelTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const textButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: '4px 8px',
  borderRadius: 'var(--radius-md)',
  // Colour comes from `.cre-alert-action` — it has to change with the theme.
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  // Roughly five rows before it scrolls — enough that the list reads as a
  // list, short enough that the footer link stays on screen.
  maxHeight: 420,
  overflowY: 'auto',
}

const panelFooterStyle: CSSProperties = {
  padding: '10px 16px',
  borderTop: '1px solid var(--color-border-subtle)',
  background: 'var(--color-neutral-extra-light)',
}

const footerLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // Colour comes from `.cre-alert-action` — it has to change with the theme.
  textDecoration: 'none',
}

const emptyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 6,
  padding: '32px 24px',
}

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const emptyBodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}
