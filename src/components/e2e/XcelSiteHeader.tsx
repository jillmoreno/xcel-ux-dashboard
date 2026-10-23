import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown } from '@/icons'
import { ShoppingCart } from '@/icons'
import { clearPartnerCodeAnswer } from '@/data/inviteFlows'
import { CART_PACKAGE_PARAM, GET_LICENSE_NAV, cartPackage } from '@/data/xcelCourseFinder'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'

/**
 * XCELSOLUTIONS.COM'S HEADER — 2026-10-22, with the guest journey's public
 * screens.
 *
 * ⚠ THE NAV IS THE ROUTE A GUEST ACTUALLY TAKES (Jillienne: "user goes to get
 * license > life and health, to get to the next page"). The homepage's finder
 * is a second door and a real one, but the walk being designed goes through
 * this dropdown — so Get License is wired, not drawn. Everything else in the
 * bar is inert: it is the frame around the two decisions, and a nav where
 * every item worked would be a marketing site to maintain.
 *
 * ⚠ THE PARTNER-CODE BAR IS PART OF THE HEADER ON INTERIOR PAGES, which is
 * where the real site puts it (the homepage carries the same offer as a card in
 * its hero instead). It is drawn here for what it MEANS rather than for
 * completeness: a code is how a walk-in becomes partner-attributed, which is
 * the distinction `partnerAttributed` carries. Still inert — see
 * `XcelFindCoursePage` for why a visibly unwired box beats a silently dead one.
 */
export function XcelSiteHeader({
  partnerBar = true,
}: {
  /**
   * ⚠ OFF ON THE PARTNER CODE PAGE, which is the only page that turns it off.
   * That page's whole content is "Do you have a Partner Code?", and running a
   * bar across the top of it inviting you to enter one answers the question
   * above the question. The real page drops it for the same reason.
   */
  partnerBar?: boolean
} = {}) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [open, setOpen] = useState(false)
  /* ⚠ THE COUNT COMES FROM THE CART ITSELF, not a prop. The cart is the
     address (see `cartPackage`), so the badge reads the same source the cart
     page does and cannot say "1" over an empty basket. */
  const inCart = cartPackage(
    params.get(INVITE_STATE_PARAM) ?? '',
    params.get(INVITE_LOA_PARAM) ?? '',
    params.get(CART_PACKAGE_PARAM),
  )
  const [partnerCode, setPartnerCode] = useState('')
  const navRef = useRef<HTMLDivElement>(null)

  /* Dismiss on outside click and on Escape — the shape every menu on the demo
     bars uses. */
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  /* ⚠ THE NAV PICK SETS THE LINE OF AUTHORITY AND CLEARS THE STATE. That is
     the real site's shape: the nav decides WHAT you are licensing for, the
     package page's own picker decides WHERE. Carrying a state over from a
     previous line of authority would skip the one question that page exists to
     ask. */
  const openLine = (line: string) => {
    /* A new line of authority is a new selection, so the partner-code answer
       goes with it — see `clearPartnerCodeAnswer`. */
    const next = clearPartnerCodeAnswer(params)
    next.set(INVITE_LOA_PARAM, line)
    next.delete('lstate')
    setOpen(false)
    navigate({ pathname: '/end-to-end-demo/packages', search: next.toString() })
  }

  return (
    <>
      {partnerBar ? (
      <div style={PARTNER_BAR}>
        <div style={PARTNER_COPY}>
          <p style={PARTNER_HEADLINE}>
            Enter Partner Code <span style={{ fontWeight: 400 }}>(previously</span>{' '}
            <span style={{ color: 'var(--color-e2e-partner-accent)' }}>Discount Code</span>
            <span style={{ fontWeight: 400 }}>)</span>
          </p>
          <p style={PARTNER_SUB}>
            Access your company’s dedicated Partner Site for exclusive pricing, products and to log in.
          </p>
        </div>
        <div style={PARTNER_FORM}>
          <label>
            <span style={SR_ONLY}>Partner code</span>
            <input
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              placeholder="Enter partner code"
              style={PARTNER_INPUT}
            />
          </label>
          <button type="button" style={PARTNER_GO} title="Not wired in this prototype">
            Go to Partner Site
          </button>
        </div>
      </div>
      ) : null}

      <div style={UTILITY_BAR}>
        {['Become a Partner', 'Resources', 'State Requirements', 'Customer Support'].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>

      <header style={NAV}>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={NAV_LOGO} />
        <div ref={navRef} style={NAV_LINKS}>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((v) => !v)}
              style={{ ...NAV_ITEM, ...(open ? NAV_ITEM_OPEN : null) }}
            >
              Get License
              <ChevronDown size={13} aria-hidden />
            </button>
            {open ? (
              <div role="menu" aria-label="Get License" style={MENU}>
                <p style={MENU_HEADING}>Get License</p>
                {GET_LICENSE_NAV.map((line) => (
                  <button
                    key={line}
                    type="button"
                    role="menuitem"
                    onClick={() => openLine(line)}
                    style={MENU_ITEM}
                  >
                    {line}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {['Continuing Education', 'Study Tools & Reviews'].map((l) => (
            <span key={l} style={NAV_ITEM}>
              {l}
              <ChevronDown size={13} aria-hidden />
            </span>
          ))}
          <span style={CART_SLOT}>
            <ShoppingCart size={19} aria-hidden />
            {inCart ? (
              <span style={CART_BADGE}>
                <span style={SR_ONLY}>items in cart: </span>1
              </span>
            ) : null}
          </span>
          <span style={LOG_IN}>Log In</span>
        </div>
      </header>
    </>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const PARTNER_BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 16,
  padding: '12px 48px',
  background: 'var(--color-e2e-course-band)',
}

const PARTNER_COPY: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }

const PARTNER_HEADLINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  lineHeight: '20px',
  color: 'var(--color-fixed-light)',
}

const PARTNER_SUB: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'color-mix(in srgb, var(--color-fixed-light) 82%, transparent)',
}

const PARTNER_FORM: CSSProperties = { display: 'flex', flex: 'none' }

const PARTNER_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  width: 190,
  height: 38,
  padding: '0 10px',
  border: 'none',
  background: 'color-mix(in srgb, var(--color-fixed-light) 85%, transparent)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
}

/* The site's amber, which is this bar's alone — nothing else in the flow uses
   it, and that is what makes the partner offer read as a different register
   from XCEL's own brick CTAs. */
const PARTNER_GO: CSSProperties = {
  flex: 'none',
  height: 38,
  padding: '0 16px',
  border: 'none',
  background: 'var(--color-e2e-partner-accent)',
  color: 'var(--color-e2e-course-band)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
}

const UTILITY_BAR: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 28,
  padding: '9px 48px',
  background: 'var(--color-secondary-200)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const NAV: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 24,
  padding: '14px 48px',
  background: 'var(--color-fixed-light)',
}

const NAV_LOGO: CSSProperties = { display: 'block', width: 176, height: 56, objectFit: 'contain' }

const NAV_LINKS: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 28,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  color: 'var(--color-text-primary)',
}

const NAV_ITEM: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 8px',
  border: 'none',
  borderRadius: 3,
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const NAV_ITEM_OPEN: CSSProperties = { background: 'var(--color-secondary-200)' }

const MENU: CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  left: 0,
  zIndex: 20,
  minWidth: 210,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  padding: '14px 0',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 6px 18px var(--color-e2e-header-shadow)',
}

const MENU_HEADING: CSSProperties = {
  margin: '0 0 8px',
  padding: '0 20px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  color: 'var(--color-xcel-brick-600)',
}

const MENU_ITEM: CSSProperties = {
  padding: '7px 20px',
  border: 'none',
  background: 'none',
  textAlign: 'left',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const CART_SLOT: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  color: 'var(--color-text-primary)',
}

const CART_BADGE: CSSProperties = {
  position: 'absolute',
  top: -6,
  right: -8,
  minWidth: 16,
  height: 16,
  padding: '0 4px',
  boxSizing: 'border-box',
  borderRadius: 8,
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 10,
  lineHeight: '16px',
  textAlign: 'center',
}

const LOG_IN: CSSProperties = {
  padding: '9px 22px',
  borderRadius: 4,
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontWeight: 800,
}
