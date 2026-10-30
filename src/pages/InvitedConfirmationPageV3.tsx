/* INVITE FLOW V3 — the ending (/end-to-end-demo/confirmation).
 *
 * Afsana's design, from `xcel-b2b2c-email-flow.html` (screens
 * `create-password`, `create-password-filled`, `ready`, `ready-login`),
 * 2026-10-30. Every V3 flow ends here after "Placing your order"; V1 and V2
 * keep their own endings (`InvitedConfirmationPage`, `InvitedConfirmationPageV2`,
 * `XcelSplitConfirmationPage`), untouched.
 *
 * Until then this file was a verbatim fork of `InvitedConfirmationPageV2`
 * ("Check your email"). The file has no such ending — every V3 flow either
 * verified its email before checkout or signs in to an Atlas account it
 * already has — so the fork was replaced rather than kept unused.
 *
 * TWO ENDINGS, chosen per flow by `inviteEndingV3` (`inviteFlowsV3.ts`):
 *
 *   create-password  Net New and OCD — the learner is new to Atlas, so the
 *                    last step is a password, set here.
 *   ready            Has Atlas — the learner already has an account, so the
 *                    last step is to start the course.
 *
 * The left panel is the same on both: the thank-you, the confirmation number,
 * the product and the total. Either button holds on the flow's loading page
 * and lands on the learning dashboard, the way V2's ending does.
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { TopoBackground } from '@/components/e2e/TopoBackground'
import { LOADING_HANDOFF_MS, XcelLoadingPage } from '@/components/e2e/XcelLoadingPage'
import { InvitePasswordChecklist } from '@/components/e2e/InvitePasswordChecklist'
import { CART_PACKAGE_PARAM, cartPackage } from '@/data/xcelCourseFinder'
import { usePartnerAttribution } from '@/data/inviteFlows'
import { inviteEndingV3, useInviteFlowV3 } from '@/data/inviteFlowsV3'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { meetsInvitePasswordRules } from '@/data/invitePasswordRules'
import { readVerifiedIdentity } from '@/data/inviteVerification'
import {
  useEndToEndCourseTitle,
  E2E_JOURNEY_FULL,
  E2E_JOURNEY_PARAM,
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_FIRST,
  END_TO_END_VERSION,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import './inviteFlow.css'

export function InvitedConfirmationPageV3() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Thank you for your order | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ending = inviteEndingV3(useInviteFlowV3())
  /* The address the code came back from, when the flow verified one; the demo
     learner otherwise. V3's check asks for the email only, so the name is the
     demo learner's either way. */
  const [verified] = useState(() => readVerifiedIdentity())
  const learnerEmail = verified?.email || E2E_LEARNER_EMAIL
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const ready = meetsInvitePasswordRules(password)
  const [signingIn, setSigningIn] = useState(false)

  /* What was bought, and for how much — V2's ending's reading of the same
     address, so the receipt agrees with the checkout. */
  const pkg = cartPackage(
    params.get(INVITE_STATE_PARAM) ?? '',
    params.get(INVITE_LOA_PARAM) ?? '',
    params.get(CART_PACKAGE_PARAM),
  )
  const partnered = usePartnerAttribution()
  const advertised = useEndToEndCourseTitle()
  const total = partnered ? '$65.00' : (pkg?.price ?? '$199.00')
  const state = params.get(INVITE_STATE_PARAM) ?? ''
  const lineOfAuthority = params.get(INVITE_LOA_PARAM) ?? ''
  const purchased =
    pkg?.name ?? (state && lineOfAuthority ? `${state} ${lineOfAuthority} Pre-licensing` : advertised)

  /* The same hand-off as V2's ending: the loading page for
     `LOADING_HANDOFF_MS`, then the learning dashboard with `journey=full`.
     `replace`, and cleared on unmount. */
  useEffect(() => {
    if (!signingIn) return
    const timer = window.setTimeout(() => {
      navigate(
        `/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&${E2E_JOURNEY_PARAM}=${E2E_JOURNEY_FULL}`,
        { replace: true },
      )
    }, LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [signingIn, navigate])

  if (signingIn) return <XcelLoadingPage message="Taking you to your learning dashboard" />

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      {/* XCEL's logo alone, as the file draws it — no partner lockup. */}
      <PartnerHeader partner={false} />
      <main style={MAIN}>
        <section aria-labelledby="order-thanks" style={RAIL}>
          <h1 id="order-thanks" style={THANKS}>
            Thank you for your order, {E2E_LEARNER_FIRST}!
          </h1>
          <div>
            <p style={RAIL_LABEL}>Confirmation number</p>
            <p style={CONFIRMATION_NUMBER}>XL00186764</p>
          </div>
          <dl style={FACTS}>
            <div>
              <dt style={RAIL_LABEL}>Product</dt>
              <dd style={FACT_VALUE}>{purchased}</dd>
            </div>
            <div>
              <dt style={RAIL_LABEL}>Order total</dt>
              <dd style={FACT_VALUE}>{total}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="sign-in" style={STAGE}>
          <TopoBackground entrance />
          <div style={CARD}>
            <p style={CARD_EYEBROW}>Last step</p>
            {ending === 'create-password' ? (
              <>
                <h2 id="sign-in" style={CARD_TITLE}>
                  Create your password
                </h2>
                <div aria-hidden style={CARD_RULE} />
                <label style={FIELD_GROUP}>
                  <span style={FIELD_LABEL}>Email</span>
                  <span style={{ ...INPUT_SHELL, background: 'var(--color-e2e-form-locked)' }}>
                    <span style={{ flex: '1 0 0', minWidth: 1 }}>{learnerEmail}</span>
                    <img src="/brand/confirmation/lock.svg" alt="Locked" width={16} height={16} style={{ display: 'block' }} />
                  </span>
                </label>
                <label style={FIELD_GROUP}>
                  <span style={FIELD_LABEL}>Password</span>
                  <span style={INPUT_SHELL}>
                    <input
                      type={shown ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      autoComplete="new-password"
                      style={PASSWORD_INPUT}
                    />
                    <button
                      type="button"
                      onClick={() => setShown((v) => !v)}
                      aria-label={shown ? 'Hide password' : 'Show password'}
                      aria-pressed={shown}
                      style={EYE}
                    >
                      <img
                        src={shown ? '/brand/confirmation/eye.svg' : '/brand/confirmation/eye-off.svg'}
                        alt=""
                        width={18}
                        height={18}
                        style={{ display: 'block' }}
                      />
                    </button>
                  </span>
                </label>
                <InvitePasswordChecklist password={password} style={RULES} headingStyle={FIELD_LABEL} />
                <button
                  type="button"
                  disabled={!ready}
                  className={ready ? 'cre-e2e-cta' : undefined}
                  style={ready ? CTA_ON : CTA_OFF}
                  onClick={() => setSigningIn(true)}
                >
                  Save Password &amp; Log In
                </button>
                {/* The demo fill — V2's corner, in the same place. */}
                <button
                  type="button"
                  aria-label="Fill in the demo learner’s password"
                  title="Demo shortcut: fill in the demo learner’s password"
                  style={DEMO_PASSWORD_FILL}
                  onClick={() => setPassword(TEST_PASSWORD)}
                />
              </>
            ) : (
              <>
                <h2 id="sign-in" style={CARD_TITLE}>
                  Start learning
                </h2>
                <div aria-hidden style={CARD_RULE} />
                <p style={CARD_BODY}>
                  Begin making progress in{' '}
                  <strong style={{ color: 'var(--color-text-primary)', fontWeight: 800 }}>{purchased}</strong>{' '}
                  today.
                </p>
                <button type="button" className="cre-e2e-cta" style={CTA_ON} onClick={() => setSigningIn(true)}>
                  Start Course
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

/* V2's demo password, so the same shortcut fills the same value. */
const TEST_PASSWORD = 'Navarro#2026'

/* ── Styles — the file's ────────────────────────────────────────────────── */

const PAGE: CSSProperties = {
  minHeight: '100%',
  background: 'var(--color-fixed-light)',
}

const MAIN: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  minHeight: 520,
}

/* The receipt. `#2f3338` and `#c9ced6` are the file's own; no token carries
   them yet. */
const RAIL: CSSProperties = {
  flex: '0 1 370px',
  boxSizing: 'border-box',
  padding: '48px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  background: '#2f3338',
  color: '#fff',
}

const THANKS: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: 1.25,
  color: '#fff',
}

const RAIL_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 12,
  letterSpacing: '.08em',
  textTransform: 'uppercase',
  color: '#c9ced6',
}

const CONFIRMATION_NUMBER: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 26,
  lineHeight: '32px',
  letterSpacing: '.06em',
  color: '#fff',
}

const FACTS: CSSProperties = {
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  paddingTop: 22,
  borderTop: '1px solid rgba(255,255,255,.18)',
}

const FACT_VALUE: CSSProperties = {
  margin: '4px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '22px',
  color: '#fff',
}

const STAGE: CSSProperties = {
  position: 'relative',
  flex: '1 1 420px',
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '48px 32px 64px',
  background: 'var(--color-neutral-75)',
  overflow: 'hidden',
}

const CARD: CSSProperties = {
  position: 'relative',
  width: 380,
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 28,
  borderRadius: 6,
  background: 'var(--color-fixed-light)',
  boxShadow: '0 6px 20px var(--color-e2e-form-shadow)',
}

const CARD_EYEBROW: CSSProperties = {
  margin: '0 0 -8px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-xcel-brick-600)',
}

const CARD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const CARD_RULE: CSSProperties = {
  width: '22%',
  height: 2,
  borderRadius: 1,
  background: '#dcdcdc',
  marginTop: -4,
}

const CARD_BODY: CSSProperties = {
  margin: '-4px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const FIELD_GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const INPUT_SHELL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 40,
  padding: '0 12px',
  boxSizing: 'border-box',
  borderRadius: 4,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-e2e-field)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const PASSWORD_INPUT: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  border: 'none',
  background: 'none',
  outline: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const EYE: CSSProperties = {
  flex: 'none',
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

const RULES: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 11,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}

/* No `background` when on: `cre-e2e-cta` carries the brick and its hover and
   focus states, as on V2's ending. */
const CTA_ON: CSSProperties = {
  padding: '12px 20px',
  borderRadius: 4,
  border: 'none',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}

const CTA_OFF: CSSProperties = {
  ...CTA_ON,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

const DEMO_PASSWORD_FILL: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: 28,
  height: 28,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
}
