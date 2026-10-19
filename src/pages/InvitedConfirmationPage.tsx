import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheckSolid } from '@/icons'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import './inviteFlow.css'
import { TopoBackground } from '@/components/e2e/TopoBackground'
import {
  E2E_JOURNEY_FULL,
  E2E_JOURNEY_PARAM,
  E2E_LEARNER_EMAIL,
  E2E_PARTNER_PRICE,
  END_TO_END_VERSION,
  isFullJourney,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'

/**
 * CONFIRMATION & PASSWORD — `/end-to-end-demo/confirmation` (2026-10-15,
 * Eric's request), Figma "Atlas UX Design" 425:2597, under the partner header.
 * The End-to-End Demo's step after Checkout: Place your order opens it, and
 * Confirm ENDS THE FLOW HERE (2026-10-15, Jillienne: "it should END after
 * user puts in a password") — the page becomes a LOADING PAGE, a compass of
 * arcs over a topo map, "Taking you to your learning dashboard…" typing its
 * dots. That is `e2e-ends-at-password`, on by default; off, Confirm opens the
 * demo's Home with the Affidavit modal over it, Eric's hand-off from earlier
 * the same day. (The loading page replaced a "Password created" card the same
 * afternoon, Jillienne's call: the end of the flow reads as a hand-off, not
 * a receipt.)
 *
 * ⚠ THE LOADING PAGE RESOLVES ON ONE ROW'S WALK (2026-10-16, Jillienne:
 * "after the loading gif page, after 3 seconds, should transition to the
 * Atlas Learning Home page"). These three pages are opened by TWO Prototypes
 * rows asking different questions, and the spinner is where the two answers
 * part:
 *
 *   • Invite & Purchase (Afsana & Eric) — the flow ENDS here, terminal
 *     spinner, exactly as `main` shipped on 2026-10-15. Nothing below
 *     changes it.
 *   • End-to-End User Experience (Jillienne) — the spinner hands off to the
 *     demo's Home after three seconds, because that row is the whole product
 *     with invite, Atlas and Compass synced together, and assembling it is
 *     the row's purpose: "the 3 designers do not merge those 2 together, I
 *     do."
 *
 * The row says which it is with `?journey=full` on its address — see
 * `isFullJourney` in `endToEndDemo.ts` for why that is a URL param and not a
 * flag (a flag has ONE value per build, and both rows open the same build).
 * `e2e-loading-opens-home` is a branch flag over the top, so the behaviour can
 * be switched off at promotion without editing the row.
 *
 * Left, the order confirmation on the guide's Secondary 200; right, the
 * Create password form. Clicking the password field fills it with a TEST
 * password that meets the rules (2026-10-15, Eric's request), the rules
 * (Figma 425:3001) show under it, and Confirm turns on — XCEL's brick, as
 * Checkout's Place your order. The field
 * still takes typing, and the eye shows or hides it. Nothing is stored or
 * sent.
 *
 * DEMO DATA, kept consistent with the rest of the demo rather than the
 * frame's placeholders: the learner is Checkout's Jordan Navarro (an
 * example.com address, not the frame's jane.doe), and the total is
 * Checkout's Grand Total, `E2E_PARTNER_PRICE` (the frame says $139.00). The confirmation number is the design's.
 */
export function InvitedConfirmationPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Confirmation & Password')
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  // Confirmed: the flow's end state, when `e2e-ends-at-password` is on.
  const [done, setDone] = useState(false)
  const endsHere = useFeatureFlag('e2e-ends-at-password').enabled
  // …and whether that end state RESOLVES — see `e2e-loading-opens-home`.
  const opensHome = useFeatureFlag('e2e-loading-opens-home').enabled
  /* WHOSE WALK IS THIS? `?journey=full` is on the End-to-End row's address and
     not on the Invite & Purchase row's — see `isFullJourney`. */
  const [params] = useSearchParams()
  const fullJourney = isFullJourney(params)

  /* THE HAND-OFF (2026-10-16, Jillienne: "after the loading gif page, after 3
     seconds, should transition to the Atlas Learning Home page"). The loading
     page waits `LOADING_HANDOFF_MS` and then opens the demo's Home, which is
     what makes the End-to-End row ONE journey rather than two rows a reviewer
     has to join up by hand.

     ⚠ ONLY ON THE END-TO-END ROW'S WALK, and this is the whole point of that
     row (2026-10-16, Jillienne: "the 3 designers do not merge those 2
     together, I do, that is the purpose of the separate tile"). The Invite &
     Purchase row opens these same three pages to answer a NARROWER question —
     how a learner gets in — and its answer still ends at the spinner, exactly
     as `main` shipped it on 2026-10-15. Afsana and Eric's surface is
     untouched by this; it is Jillienne's row that walks through to Atlas.

     So THREE conditions, and they are three different kinds of thing:
       • `done`      — the reviewer pressed Confirm.
       • `endsHere`  — `e2e-ends-at-password`, the Invite scope's promoted
                       baseline, which decides there is a spinner at all.
       • `fullJourney` — the ROW, via `?journey=full`.
     plus `opensHome`, the branch flag that lets this whole behaviour be
     switched off at promotion time without unpicking the row.

     ⚠ ABOVE THE `if (done)` RETURN, because that return is an early exit and
     a hook after it would not run on the branch that needs it. The effect
     guards on `done` instead.

     `replace`, not push: the password page is behind us and Back should leave
     the flow, not drop the reviewer onto a form whose state is gone — the
     same reasoning as `useEndToEndDemoParams`. No `?affidavit=1`; that modal
     is the OFF arm's hand-off. The timer is cleared on unmount, so leaving
     early (the Design bar's Page control, the rail) cannot navigate on top of
     wherever the reviewer went. */
  useEffect(() => {
    if (!done || !endsHere || !opensHome || !fullJourney) return
    const timer = window.setTimeout(() => {
      /* ⚠ `journey=full` RIDES ALONG INTO THE DASHBOARD (2026-10-16). It was
         dropped here when the hand-off landed, because nothing past the
         spinner read it yet. The dashboard does now: it is what lets Course
         Overview reach Anjani's Compass on THIS walk while Eric's Atlas
         Learning tile keeps his own pages. Drop it again and the walk ends
         in a dashboard that behaves like Eric's tile. */
      navigate(
        `/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&${E2E_JOURNEY_PARAM}=${E2E_JOURNEY_FULL}`,
        { replace: true },
      )
    }, LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [done, endsHere, opensHome, fullJourney, navigate])

  if (done) {
    /* THE END OF THE FLOW: the loading page. SVG and CSS, not a gif, so every
       colour is a token: the topo map behind (`TopoBackground`), a brick arc
       sweeping over a faint ring with a slower arc running the other way and
       a breathing dot at the centre, and the line's ellipsis typing itself.
       The motion classes live in tokens.css beside `cre-setup-spin` and stop
       under reduced motion. It never resolves; see the file comment.

       THE HEADER STAYS, EMPTY (2026-10-15, Jillienne: "the light gray
       background and white header will still exist, but the logo in the
       header will disappear"). It had been dropped entirely earlier the same
       day — "remove this part when loading gif is going" — which took 64
       with it and jumped the whole page upward on the press. `bare` keeps
       the bar and drops the lockup inside it, so only the branding leaves
       and the map below starts where it already was. */
    return (
      <div style={PAGE}>
        {/* The window stays through the loading end state too — the branding
            is what leaves there, not the browser around it. */}
        <StandaloneBrowserChrome />
        <PartnerHeader bare />
        <main style={LOADING_PAGE}>
          <TopoBackground />
          <div role="status" aria-live="polite" style={LOADING_STACK}>
            <svg aria-hidden viewBox="0 0 72 72" width={72} height={72} style={{ display: 'block', overflow: 'visible' }}>
              <circle cx={36} cy={36} r={32} fill="none" strokeWidth={3} style={{ stroke: 'var(--color-e2e-form-outline)' }} />
              <circle
                className="cre-e2e-loading-arc"
                cx={36}
                cy={36}
                r={32}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray="56 145"
                style={{ stroke: 'var(--color-xcel-brick-600)' }}
              />
              <circle
                className="cre-e2e-loading-arc-inner"
                cx={36}
                cy={36}
                r={21}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="30 102"
                strokeOpacity={0.4}
                style={{ stroke: 'var(--color-xcel-brick-600)' }}
              />
              <circle className="cre-e2e-loading-pulse" cx={36} cy={36} r={5} style={{ fill: 'var(--color-xcel-brick-600)' }} />
            </svg>
            <p style={LOADING_TEXT}>
              Taking you to your learning dashboard
              <span style={SR_ONLY}>…</span>
              <span aria-hidden>
                <span className="cre-e2e-loading-dot">.</span>
                <span className="cre-e2e-loading-dot">.</span>
                <span className="cre-e2e-loading-dot">.</span>
              </span>
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div style={PAGE}>
      {/* ⚠ THE BROWSER WINDOW CONTINUES HERE (2026-10-19, Jillienne: "can
          we also add this browser header to the email/invite flows so it
          feels like a seamless experience"). These pages render OUTSIDE the
          app shell, so the shell's own strip never reached them — the walk
          opened in a browser window, lost it for the invite flow, and got it
          back at the dashboard. Draws only in the Demo frame, as it does
          there. */}
      <StandaloneBrowserChrome />
      <PartnerHeader />
      <main style={BODY}>
        {/* THE ORDER CONFIRMATION */}
        <section aria-label="Order confirmation" style={CONFIRM_PANEL}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: CHECK_GAP, width: '100%' }}>
            <CircleCheckSolid size={CHECK_SIZE} aria-hidden style={{ color: 'var(--color-xcel-brick-600)', display: 'block' }} />
            <h1 style={TITLE}>Thank you for your order!</h1>
          </div>
          <dl style={FACTS}>
            <span aria-hidden style={RULE} />
            <Fact term="Confirmation number" value="XL00186764" spaced />
            <span aria-hidden style={RULE} />
            <Fact term="Email confirmation sent to" value={DEMO_EMAIL} />
            <span aria-hidden style={RULE} />
            <Fact term="Order total" value={E2E_PARTNER_PRICE} />
          </dl>
        </section>

        {/* CREATE PASSWORD */}
        <section aria-labelledby="create-password" style={PASSWORD_COLUMN}>
          <h2 id="create-password" style={TITLE}>
            Create password
          </h2>
          <form
            style={FORM}
            onSubmit={(e) => {
              e.preventDefault()
              if (!password) return
              if (endsHere) setDone(true)
              // Off: `affidavit=1`, and Home opens the Affidavit modal over itself.
              else navigate(`/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&affidavit=1`)
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <label style={FIELD_GROUP}>
                <span style={FIELD_LABEL}>Email</span>
                <span style={{ ...FIELD, background: 'var(--color-e2e-form-locked)' }}>
                  <span style={{ flex: '1 0 0', minWidth: 1 }}>{DEMO_EMAIL}</span>
                  <img src="/brand/confirmation/lock.svg" alt="Locked" width={16} height={16} style={{ display: 'block' }} />
                </span>
              </label>
              <label style={FIELD_GROUP}>
                <span style={FIELD_LABEL}>Password</span>
                <span style={FIELD}>
                  <input
                    type={shown ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    // Fills itself with the test password the first time.
                    onClick={() => {
                      if (!password) setPassword(TEST_PASSWORD)
                    }}
                    placeholder="Enter password..."
                    autoComplete="new-password"
                    style={PASSWORD_INPUT}
                  />
                  <button
                    type="button"
                    onClick={() => setShown((v) => !v)}
                    /* ⚠ THE LABEL NAMES THE ACTION, NOT THE STATE — "Show
                       password" while it is hidden. A control labelled for
                       what it currently IS leaves a screen-reader user to
                       work out what pressing it would do. `aria-pressed`
                       carries the state, which is the pair's whole job. */
                    aria-label={shown ? 'Hide password' : 'Show password'}
                    aria-pressed={shown}
                    style={EYE}
                  >
                    {/* ⚠ TWO ICONS, NOT ONE (2026-10-19, Jillienne: "this
                        icon should change when clicked to show the password,
                        there should be 2 different states"). The eye never
                        changed, so the only feedback was the field itself —
                        and `aria-pressed` was already telling assistive tech
                        a state the screen did not show.

                        ⚠ THE SLASH MEANS HIDDEN, which is the convention
                        worth getting the right way round: the icon shows
                        what pressing it DOES. Plain eye = "reveal" while the
                        password is dots; struck eye = "hide" while it is
                        legible. `eye-off.svg` is the design's own eye with a
                        diagonal added in the identical stroke — the standard
                        construction on its own geometry, not a second mark
                        from somewhere else. */}
                    <img
                      src={shown ? '/brand/confirmation/eye-off.svg' : '/brand/confirmation/eye.svg'}
                      alt=""
                      width={18}
                      height={18}
                      style={{ display: 'block' }}
                    />
                  </button>
                </span>
              </label>
            </div>
            {/* The rules, once the field has something in it (Figma 425:3001). */}
            {password ? (
              <div style={RULES}>
                <p style={{ margin: 0 }}>
                  Passwords must be between 9 and 30 characters long and include at least three of the four following
                  types of characters.
                </p>
                <ul style={RULE_LIST}>
                  <li>English uppercase letters (A through Z)</li>
                  <li>English lowercase letters (a through z)</li>
                  <li>Numbers (0 through 9)</li>
                  <li>{'Special characters (!@#$ %^&* _+=`|(){}[]:">,.?)'}</li>
                </ul>
              </div>
            ) : null}
            <div style={{ paddingTop: 8 }}>
              <button
                type="submit"
                disabled={!password}
                /* The grey arm is the disabled look — no hover on a control
                   that will not accept the press. */
                className={password ? 'cre-e2e-cta' : undefined}
                style={password ? CONFIRM_ON : CONFIRM}
              >
                Confirm
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

/* ⚠ THE SAME ADDRESS THE HEADER AND THE EMAIL PAGE SHOW (2026-10-19,
   Jillienne: "make this update within the Invite flow as well where
   applicable"). It was `@example.com` here and `alicia.navarro@gmail.com` in
   the header — so the walk confirmed a purchase to one address and then
   signed the learner in as somebody else. It reads the shared constant now,
   so the three cannot drift apart again. */
const DEMO_EMAIL = E2E_LEARNER_EMAIL

/* HOW LONG THE LOADING PAGE HOLDS before it opens Home (2026-10-16,
   Jillienne's three seconds). Long enough that the hand-off reads as a step
   the product is taking rather than a flicker, short enough that a
   stakeholder walking the flow does not think it has hung. */
const LOADING_HANDOFF_MS = 3000

/* TEST DATA ONLY — a demo password that meets the rules below (upper, lower,
   number, special; 12 characters). Not anyone's real password. */
const TEST_PASSWORD = 'Navarro#2026'

function Fact({ term, value, spaced = false }: { term: string; value: string; spaced?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 2 }}>
      <dt style={FACT_TERM}>{term}</dt>
      <dd style={spaced ? { ...FACT_VALUE, letterSpacing: 2 } : FACT_VALUE}>{value}</dd>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-neutral-75)' }

/* The body fills the window under the header: the confirmation panel, then
   the password column. */
const BODY: CSSProperties = { flex: '1 0 auto', display: 'flex', alignItems: 'stretch' }

/* The left panel's top, the check and the gap under it — named, because the
   password column's top is built from them: the two titles share a baseline
   (2026-10-15, Eric's request; the design's 134 put Create password 2 low). */
const PANEL_TOP = 64
const CHECK_SIZE = 52
const CHECK_GAP = 16

/* Secondary 200, a Secondary 300 rule on its right; 64 down, 88 in. */
const CONFIRM_PANEL: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 32,
  padding: `${PANEL_TOP}px 88px`,
  background: 'var(--color-secondary-200)',
  borderRight: '1px solid var(--color-secondary-300)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
  whiteSpace: 'nowrap',
}

const FACTS: CSSProperties = { margin: 0, width: 297, display: 'flex', flexDirection: 'column', gap: 20 }

const RULE: CSSProperties = { display: 'block', height: 1, background: 'var(--color-secondary-400)' }

const FACT_TERM: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: 'normal',
  letterSpacing: 1.08,
  textTransform: 'uppercase',
  color: 'var(--color-neutral-700)',
}

const FACT_VALUE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-neutral-900)',
}

/* 88 in, and down to the left title's line; a 440 column, its title 24
   above the form. */
const PASSWORD_COLUMN: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  width: 440,
  maxWidth: 440,
  boxSizing: 'content-box',
  padding: `${PANEL_TOP + CHECK_SIZE + CHECK_GAP}px 0 64px 88px`,
}

/* White, a #E5E7EB outline, 16 corners, a soft shadow; 40 in. */
const FORM: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 40,
  borderRadius: 16,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 6px var(--color-e2e-form-shadow))',
}

const FIELD_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: 'normal',
  textTransform: 'uppercase',
  color: 'var(--color-neutral-950)',
}

const FIELD: CSSProperties = {
  height: 44,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 16px',
  borderRadius: 8,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-e2e-form-text)',
}

const PASSWORD_INPUT: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  height: '100%',
  padding: 0,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  font: 'inherit',
  color: 'var(--color-e2e-form-placeholder)',
}

const EYE: CSSProperties = {
  flex: 'none',
  display: 'flex',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

const CONFIRM: CSSProperties = {
  width: '100%',
  padding: '14px 0',
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-fixed-light)',
  cursor: 'not-allowed',
}

/* On once a password is in: XCEL's brick, as Checkout's Place your order. */
/* ⚠ NO `background`: `.cre-e2e-cta` paints the live arm, so its hover can
   outrank the element. The grey resting arm keeps its inline fill. */
const CONFIRM_ON: CSSProperties = { ...CONFIRM, background: undefined, cursor: 'pointer' }

/* The rules: Open Sans 13 / 18, the list indented 19.5. */
const RULES: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-neutral-950)',
}

const RULE_LIST: CSSProperties = { margin: 0, paddingLeft: 19.5, listStyle: 'disc' }

/* THE LOADING PAGE. Centred in the body, no header above it, the topo map
   absolutely behind it (hence `position: relative`); the line under the
   spinner is Open Sans 16 / 24 as the body copy on the Invited Product
   Detail page, its dots in a monospace-ish fixed width so they type in place. */
const LOADING_PAGE: CSSProperties = {
  ...BODY,
  position: 'relative',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 40,
}

const LOADING_STACK: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
}

const LOADING_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-neutral-950)',
  textAlign: 'center',
}

/* Screen readers get the ellipsis as one character; sighted viewers get the
   three dots typing themselves. */
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}
