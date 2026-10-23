import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleXmarkThin } from '@/icons'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import {
  CART_PACKAGE_PARAM,
  FINDER_STATES,
  coursePitchFor,
  packagesFor,
  type CoursePackage,
} from '@/data/xcelCourseFinder'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { clearPartnerCodeAnswer } from '@/data/inviteFlows'
import { useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * THE COURSE PAGE — `/insurance-license/<line-of-authority>` on the real site,
 * and screen 2 of the guest journey (2026-10-22).
 *
 * ⚠ TWO PICKS, TWO PLACES, which is the shape this page was rebuilt around
 * after Jillienne walked the real route ("user goes to get license > life and
 * health, to get to the next page"). The NAV decides what you are licensing
 * FOR; this page's own "Select a state" decides WHERE. An earlier version
 * asked for both on the homepage at once, which is a finder the site does have
 * — on its homepage — but not the path a guest takes from the menu.
 *
 * ⚠ SO THE PACKAGES ARE BEHIND THE STATE. Pre-licensing is sold per state, and
 * the cards carry a state in their own names; showing them before one is picked
 * would be naming a course nobody has chosen, which is the failure this whole
 * line of work keeps circling.
 *
 * ⚠ BOTH PICKS LAND IN THE SAME TWO PARAMS the options modal writes, so a
 * guest who gets here is not stopped later to answer what they already have.
 */
export function XcelPackagesPage() {
  useEndToEndDemoParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const lineOfAuthority = params.get(INVITE_LOA_PARAM) ?? ''
  const state = params.get(INVITE_STATE_PARAM) ?? ''
  const [added, setAdded] = useState<CoursePackage | null>(null)

  useEndToEndPageChrome(
    lineOfAuthority
      ? `${lineOfAuthority} Insurance License Course | XCEL`
      : 'Insurance License Courses | XCEL',
  )

  /* No line of authority means this page was opened directly rather than
     through the nav. Send them to the homepage, which is where the choice
     lives, instead of drawing a page about nothing. */
  useEffect(() => {
    if (lineOfAuthority === '') {
      navigate({ pathname: '/end-to-end-demo/find', search: params.toString() }, { replace: true })
    }
  }, [lineOfAuthority, navigate, params])
  if (lineOfAuthority === '') return null

  const pitch = coursePitchFor(lineOfAuthority)
  const packages = state ? packagesFor(state, lineOfAuthority) : []

  const chooseState = (next: string) => {
    const q = new URLSearchParams(params)
    if (next === '') q.delete(INVITE_STATE_PARAM)
    else q.set(INVITE_STATE_PARAM, next)
    /* `replace`, so picking a state three times does not leave three entries
       between the learner and the page they came from. */
    setParams(q, { replace: true })
  }

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      <XcelSiteHeader />

      {/* The live page's breadcrumb. The STATE joins it once chosen — Home /
          Wisconsin / Get License / Life and Health — which is the page's own
          way of confirming the pick without a second message. */}
      <nav aria-label="Breadcrumb" style={CRUMB}>
        <ol style={CRUMB_LIST}>
          {['Home', ...(state ? [state] : []), 'Get License', lineOfAuthority].map((part, i, all) => (
            <li key={part} style={i === all.length - 1 ? CRUMB_HERE : undefined}>
              {part}
              {i < all.length - 1 ? (
                <span aria-hidden style={CRUMB_SEP}>
                  /
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <main style={BODY}>
        <h1 style={TITLE}>Choose Your {lineOfAuthority} Pre-Licensing Package</h1>
        <p style={LEDE}>
          With simple and proven pre-licensing packages, you can easily pick your training and start your
          course in a few minutes.
        </p>

        <section aria-labelledby="pitch-title" style={PITCH}>
          <div style={PITCH_TEXT}>
            <h2 id="pitch-title" style={PITCH_TITLE}>
              {pitch.heading}
            </h2>
            <p style={PITCH_BODY}>{pitch.body}</p>
            <ul style={BULLETS}>
              {pitch.bullets.map((b) => (
                <li key={b} style={BULLET}>
                  <span aria-hidden style={TICK}>
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <label style={STATE_FIELD}>
              <span style={SR_ONLY}>Select a state</span>
              <select
                value={state}
                onChange={(e) => chooseState(e.target.value)}
                style={{
                  ...STATE_SELECT,
                  color: state === '' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                }}
              >
                <option value="">Select a state</option>
                {FINDER_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <img
            src="/brand/e2e-xcel-lah.jpg"
            alt=""
            width={483}
            height={483}
            style={PITCH_PHOTO}
          />
        </section>

        {state ? (
          <div style={CARDS}>
            {packages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} onAdd={() => setAdded(pkg)} />
            ))}
          </div>
        ) : (
          /* ⚠ SAID, NOT LEFT BLANK. The packages are the reason the page
             exists; an empty space below the pitch reads as a page that failed
             to load rather than one waiting on a pick. */
          <p role="status" style={AWAITING}>
            Select your state to see the packages available there.
          </p>
        )}
      </main>

      <XcelFooter />

      {added ? (
        <AddedToCart
          pkg={added}
          onClose={() => setAdded(null)}
          onGoToCart={() => {
            /* ⚠ WHICH PACKAGE RIDES ALONG. The cart names the one that was
               added and prices it, so "Add to Cart" has to say WHICH — the
               state and line of authority alone cannot tell Premier from
               standard. */
            /* A fresh cart is a fresh purchase, so any partner-code answer
               from a previous one goes. */
            const next = clearPartnerCodeAnswer(params)
            next.set(CART_PACKAGE_PARAM, added.id)
            navigate({ pathname: '/end-to-end-demo/cart', search: next.toString() })
          }}
        />
      ) : null}
    </div>
  )
}

function PackageCard({ pkg, onAdd }: { pkg: CoursePackage; onAdd: () => void }) {
  const featured = pkg.ribbon != null
  return (
    <section aria-labelledby={`pkg-${pkg.id}`} style={featured ? CARD_FEATURED : CARD}>
      {pkg.ribbon ? <p style={RIBBON}>{pkg.ribbon}</p> : null}
      <div style={CARD_BODY}>
        <h2 id={`pkg-${pkg.id}`} style={CARD_TITLE}>
          {pkg.name}
        </h2>
        <p style={CARD_BLURB}>{pkg.blurb}</p>
        <div style={CARD_FOOT}>
          <p style={CARD_PRICE}>{pkg.price}</p>
          <p style={WHATS_INCLUDED}>What’s Included ⌄</p>
          <button type="button" className="cre-e2e-cta" style={ADD_BUTTON} onClick={onAdd}>
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * "ADDED TO YOUR CART" — the real site's confirmation (2026-10-22, screen 3 of
 * what Jillienne sent).
 *
 * ⚠ IT IS THE SEAM BETWEEN THE PUBLIC SITE AND THE FLOW. Go to Cart is where a
 * guest leaves xcelsolutions.com's package page and enters the product and
 * checkout pages the rest of this work built — so it is the one control here
 * that navigates, and the ✕ deliberately does not: dismissing a confirmation
 * should leave you where you were, with the choice still available.
 */
function AddedToCart({
  pkg,
  onClose,
  onGoToCart,
}: {
  pkg: CoursePackage
  onClose: () => void
  onGoToCart: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div style={SCRIM}>
      <div role="dialog" aria-modal="true" aria-labelledby="added-title" style={CART_MODAL}>
        <div style={CART_HEAD}>
          <h2 id="added-title" style={CART_TITLE}>
            Added to your cart
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" style={CART_CLOSE}>
            <CircleXmarkThin size={20} aria-hidden />
          </button>
        </div>
        <div style={CART_BODY}>
          <div style={CART_ITEM_COLUMN}>
            <p style={CART_ITEM}>{pkg.name}</p>
            {/* ⚠ WHAT IS IN THE BOX, which is the whole reason this
                confirmation is bigger than a toast: Premier's name does not say
                it includes the standard course, a recorded review and
                flashcards, and the moment to learn that is while the choice is
                still fresh. Drawn only for a bundle — one chip restating the
                line directly above it is a label, not information. */}
            {pkg.includes.length > 1 ? (
              <ul style={CART_CHIPS}>
                {pkg.includes.map((line) => (
                  <li key={line} style={CART_CHIP}>
                    {line}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <button type="button" className="cre-e2e-cta" style={GO_TO_CART} onClick={onGoToCart}>
            Go to Cart
          </button>
        </div>
      </div>
    </div>,
    document.body,
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

const PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const CRUMB: CSSProperties = { padding: '14px 48px', background: 'var(--color-fixed-light)' }

const CRUMB_LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  gap: 8,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const CRUMB_HERE: CSSProperties = { fontWeight: 800, color: 'var(--color-text-primary)' }

const CRUMB_SEP: CSSProperties = { marginLeft: 8, color: 'var(--color-text-tertiary)' }

const BODY: CSSProperties = {
  padding: '44px 48px 64px',
  background: 'var(--color-secondary-200)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 40,
  lineHeight: '50px',
  textAlign: 'center',
  color: 'var(--color-text-primary)',
}

const LEDE: CSSProperties = {
  margin: 0,
  maxWidth: 760,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '24px',
  textAlign: 'center',
  color: 'var(--color-text-primary)',
}

const PITCH: CSSProperties = {
  marginTop: 28,
  width: '100%',
  maxWidth: 1040,
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 48,
}

const PITCH_TEXT: CSSProperties = {
  flex: '1 1 380px',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const PITCH_TITLE: CSSProperties = {
  margin: 0,
  maxWidth: 420,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 26,
  lineHeight: '34px',
  color: 'var(--color-text-primary)',
}

const PITCH_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '23px',
  color: 'var(--color-text-primary)',
}

const BULLETS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const BULLET: CSSProperties = {
  display: 'flex',
  gap: 12,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const TICK: CSSProperties = {
  flex: 'none',
  color: 'var(--color-xcel-brick-600)',
  fontWeight: 800,
}

const STATE_FIELD: CSSProperties = { marginTop: 4, display: 'block', maxWidth: 240 }

const STATE_SELECT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 46,
  padding: '0 12px',
  borderRadius: 4,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  cursor: 'pointer',
}

const PITCH_PHOTO: CSSProperties = {
  flex: 'none',
  display: 'block',
  width: 340,
  height: 340,
  objectFit: 'cover',
  borderRadius: 4,
  boxShadow: '0 4px 14px var(--color-e2e-header-shadow)',
}

const AWAITING: CSSProperties = {
  margin: '36px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  color: 'var(--color-text-secondary)',
}

const CARDS: CSSProperties = {
  marginTop: 36,
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  alignItems: 'stretch',
  gap: 24,
  width: '100%',
}

const CARD: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  width: 340,
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const CARD_FEATURED: CSSProperties = { ...CARD, border: '2px solid var(--color-xcel-brick-600)' }

const RIBBON: CSSProperties = {
  position: 'absolute',
  top: -1,
  left: -1,
  margin: 0,
  padding: '5px 12px',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const CARD_BODY: CSSProperties = {
  flex: '1 0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '36px 24px 24px',
}

const CARD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const CARD_BLURB: CSSProperties = {
  margin: 0,
  flex: '1 0 auto',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '23px',
  color: 'var(--color-text-primary)',
}

const CARD_FOOT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

const CARD_PRICE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '26px',
  color: 'var(--color-text-primary)',
}

const WHATS_INCLUDED: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  color: 'var(--color-xcel-brick-600)',
}

const ADD_BUTTON: CSSProperties = {
  width: '100%',
  marginTop: 8,
  padding: '13px 20px',
  borderRadius: 4,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
}

/* ── Added to your cart ─────────────────────────────────────────────────── */

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  /* ⚠ CENTRED, like the flow's other two modals. Anchoring it near the top —
     where the live site puts it, over a full-height page — lands it on the demo
     bars inside the prototype's frame, which no real viewer of the site would
     ever see. Matching the idiom the affidavit and options modals already use
     is worth more here than matching a position that only makes sense outside
     this shell. */
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-e2e-scrim)',
}

const CART_MODAL: CSSProperties = {
  width: 560,
  maxWidth: '100%',
  boxSizing: 'border-box',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
}

const CART_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: '18px 22px',
  borderBottom: '1px solid var(--color-e2e-form-outline)',
}

const CART_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 17,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const CART_CLOSE: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const CART_BODY: CSSProperties = {
  display: 'flex',
  /* Top-aligned, not centred: the contents list grows downward and the CTA
     should stay level with the item's NAME rather than drift with it. */
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
  padding: '26px 22px 36px',
}

const CART_ITEM_COLUMN: CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const CART_CHIPS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const CART_CHIP: CSSProperties = {
  padding: '11px 14px',
  background: 'var(--color-e2e-form-locked)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 400,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const CART_ITEM: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const GO_TO_CART: CSSProperties = {
  flex: 'none',
  padding: '13px 34px',
  borderRadius: 4,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
}
