import { useCallback, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { PartnerCodeAskPage, XcelAccountAskPage } from '@/components/e2e/PartnerCodeAsk'
import { KeycloakLogInCardV3 } from '@/components/e2e/VerifyEmailModalV3'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { CircleInfo } from '@/icons'
import {
  INVITE_V3_LOG_IN_ACCOUNT_FLAG,
  LOG_IN_PATHS,
  V3_WRONG_DEMO_PASSWORD,
  resolveV3LogInAccount,
} from '@/data/inviteFlowsV3'
import {
  E2E_JOURNEY_FULL,
  E2E_JOURNEY_PARAM,
  E2E_LEARNER_EMAIL,
  END_TO_END_VERSION,
  useEndToEndDemoParams,
  useEndToEndPageChrome,
} from './endToEndDemo'
import './inviteFlow.css'

/**
 * INVITE FLOW V3'S LOG IN — 2026-11-20, Afsana, from the eCommerce PRD's 5.7,
 * the decisions of 2026-11-18 and Swati's call the same day.
 *
 * A learner who has bought comes back to xcelsolutions.com and presses Log In.
 * They should not have to remember whether their account is in OCD or Atlas,
 * so the OCD log-in page is repurposed to ask for the email alone and work it
 * out:
 *
 *   Log In                      the site header (`XcelSiteHeader`)
 *   Do you have a Partner Code? the live page; Yes does nothing for now
 *   Do you have an XCEL account? the live page; No is not mocked
 *   OCD's log-in page            the email, looked up in Keycloak first —
 *     in Keycloak                Keycloak's log-in widget, then Atlas Home
 *     not in Keycloak            assumed OCD's: OCD's password, then OCD, or
 *                                "Either username or password is incorrect."
 *
 * ⚠ NOTHING SAYS AN ACCOUNT DOES NOT EXIST. OCD has no service that answers
 * whether a username exists (Swati, 2026-11-18), and an identity screen should
 * not say which half was wrong — so an email nobody knows walks exactly like
 * an OCD one until the password is in, and then gets the same words as a
 * wrong password. "Please create a user account." is gone (decisions,
 * 2026-11-18). Where the account is, the demo cannot look up: Account found
 * in (`invite-v3-log-in-account`) says.
 *
 * Four pages, one file: they are one short walk and share the frame.
 */

/** "Do you have a Partner Code?" — the live site's `/customer/account/option`,
 *  opened by Log In. The question is `PartnerCodeAsk`'s, shared with the
 *  checkout's, so the two cannot drift. Yes does nothing until the partner
 *  site's log-in is designed (2026-11-20, Afsana). */
export function XcelLogInPartnerCodePage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Partner Code | XCEL')
  const go = useLogInNavigate()
  return (
    <SitePage>
      <PartnerCodeAskPage onAnswer={(answer) => answer === 'no' && go(LOG_IN_PATHS.account)} />
    </SitePage>
  )
}

/** "Do you have an XCEL account?" — the live site's
 *  `/customer/account/question`. Yes opens OCD's log-in page; No goes to
 *  today's sign-up, which is unchanged and not mocked (2026-11-20, Afsana). */
export function XcelLogInAccountPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('XCEL account | XCEL')
  const go = useLogInNavigate()
  return (
    <SitePage>
      <XcelAccountAskPage
        onAnswer={(answer) => answer === 'yes' && go(LOG_IN_PATHS.ocd)}
        onBack={() => go(LOG_IN_PATHS.partnerCode)}
      />
    </SitePage>
  )
}

/**
 * OCD'S LOG-IN PAGE, REPURPOSED — the page being redesigned. The live page's
 * frame, measured off it: the grey form, the 500 white card, the logo, Arial
 * labels with colons, square 41-high fields and the brick LOG IN.
 *
 * What changed, and why:
 *   - Email, not Username — with an info icon saying a username works too.
 *     OCD asks for a username and most are emails (99% of B2C, 78% of B2B,
 *     Swati), so ⚠ THE FIELD DOES NOT CHECK FOR AN EMAIL: a username has to
 *     get through to OCD's password.
 *   - The email alone first, CONTINUE; the password only once Keycloak has
 *     said no. Keycloak's yes leaves this page for Keycloak's own.
 *   - "Either username or password is incorrect." under the password, the
 *     same words for an unknown account and a wrong password.
 *   - Forgot your password? only with the password: before the email is in,
 *     nobody knows which system's password it is.
 */
export function XcelOcdLogInPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('OnCourse Direct Login')
  const go = useLogInNavigate()
  const account = resolveV3LogInAccount(useFeatureFlag(INVITE_V3_LOG_IN_ACCOUNT_FLAG).variant)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  const [tip, setTip] = useState(false)
  const tipId = useId()
  const given = email.trim()

  const submitEmail = () => {
    if (!given) return
    /* Keycloak first (PRD 5.7): found there, Keycloak's own page. */
    if (account === 'atlas') go(LOG_IN_PATHS.keycloak, { email: given })
    else setStep('password')
  }
  const submitPassword = () => {
    if (!password) return
    /* Neither system knows the pair: an unknown account and a wrong password
       read the same. */
    if (account === 'none' || password === V3_WRONG_DEMO_PASSWORD) setFailed(true)
    else go(LOG_IN_PATHS.ocdHome)
  }

  return (
    <OcdFrame>
      <form
        noValidate
        style={OCD_FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 'email') submitEmail()
          else submitPassword()
        }}
      >
        <div style={OCD_FIELD}>
          <span style={OCD_LABEL_ROW}>
            <label htmlFor="ocd-email" style={OCD_LABEL}>
              Email:
            </label>
            <span style={{ position: 'relative', display: 'inline-flex' }}>
              <button
                type="button"
                aria-label="About this field"
                aria-describedby={tip ? tipId : undefined}
                aria-expanded={tip}
                onClick={() => setTip((v) => !v)}
                onMouseEnter={() => setTip(true)}
                onMouseLeave={() => setTip(false)}
                onBlur={() => setTip(false)}
                style={OCD_INFO}
              >
                <CircleInfo size={14} aria-hidden />
              </button>
              {tip ? (
                <span id={tipId} role="tooltip" style={OCD_TIP}>
                  Enter the email address or username you use for your XCEL account.
                </span>
              ) : null}
            </span>
          </span>
          {/* ⚠ type="text", not "email" — a username must get through. */}
          <input
            id="ocd-email"
            type="text"
            autoComplete="username"
            spellCheck={false}
            value={email}
            readOnly={step === 'password'}
            onChange={(e) => setEmail(e.target.value)}
            className="cre-e2e-input"
            style={step === 'password' ? { ...OCD_INPUT, ...OCD_INPUT_LOCKED } : OCD_INPUT}
          />
          {step === 'password' ? (
            <button
              type="button"
              style={OCD_CHANGE}
              onClick={() => {
                setStep('email')
                setPassword('')
                setFailed(false)
              }}
            >
              Not you? Change email
            </button>
          ) : null}
        </div>
        {step === 'password' ? (
          <div style={OCD_FIELD}>
            <label htmlFor="ocd-password" style={OCD_LABEL}>
              Password:
            </label>
            <input
              id="ocd-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFailed(false)
              }}
              aria-invalid={failed}
              aria-describedby={failed ? 'ocd-incorrect' : undefined}
              className="cre-e2e-input"
              style={OCD_INPUT}
            />
            {failed ? (
              <p id="ocd-incorrect" role="alert" style={OCD_ERROR}>
                Either username or password is incorrect.
              </p>
            ) : null}
          </div>
        ) : null}
        <button type="submit" className="cre-e2e-cta" style={OCD_BUTTON}>
          {step === 'email' ? 'Continue' : 'Log in'}
        </button>
      </form>
      {/* The demo fill — the invisible, labelled corner V3's modals carry. */}
      {step === 'email' ? (
        <button
          type="button"
          aria-label="Fill in the demo learner’s email"
          title="Demo shortcut: fill in the demo learner’s email"
          style={DEMO_FILL}
          onClick={() => setEmail(E2E_LEARNER_EMAIL)}
        />
      ) : null}
      {/* Inert, as on every flow: OCD's reset is OCD's. */}
      {step === 'password' ? (
        <p style={OCD_BELOW} data-below-card>
          <span style={OCD_FORGOT}>Forgot your password?</span>
        </p>
      ) : null}
    </OcdFrame>
  )
}

/** Keycloak's log-in, on a page of its own — it is its own system — with the
 *  address OCD's page was given, locked. Then Atlas Home, the flow's usual
 *  way in (`InvitedConfirmationPageV3`); opened from `/invite-v3` it holds on
 *  Signing you in instead, as every flow there does.
 *
 *  ⚠ THE EMAIL STEP'S FRAME, NOT RESET YOUR PASSWORD'S (2026-11-20, Afsana:
 *  "this page should not have the header with the logo, just like the initial
 *  email capture screen"; the card "need[s] to start at the same location").
 *  No header, OCD's grey, and the card's top edge where OCD's card's is —
 *  `OCD_MAIN`'s padding, not centred — so moving from one to the other is a
 *  card changing in place, not a page jumping. */
export function XcelKeycloakLogInPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Log in | XCEL')
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email')?.trim() || E2E_LEARNER_EMAIL
  const standalone = params.get('standalone') === '1'
  const onSignedIn = useCallback(() => {
    if (standalone) return
    navigate(`/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&${E2E_JOURNEY_PARAM}=${E2E_JOURNEY_FULL}`, {
      replace: true,
    })
  }, [standalone, navigate])
  return (
    <div style={OCD_PAGE}>
      <StandaloneBrowserChrome />
      <main style={OCD_MAIN}>
        <KeycloakLogInCardV3 email={email} onSignedIn={onSignedIn} />
      </main>
    </div>
  )
}

/** Where OCD's LOG IN leads: OCD itself, which this prototype does not mock —
 *  a stand-in that says so, in OCD's frame. */
export function XcelOcdHomeStandIn() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('OnCourse Direct')
  return (
    <OcdFrame>
      <div style={{ ...OCD_FORM, textAlign: 'center', gap: 12 }}>
        <h1 style={{ ...OCD_LABEL, fontSize: 16, margin: 0 }}>Logged in to OCD</h1>
        <p style={{ ...OCD_LABEL, fontWeight: 400, margin: 0 }}>
          The learner is now in OCD, which this prototype does not mock.
        </p>
      </div>
    </OcdFrame>
  )
}

/* ── Frames ─────────────────────────────────────────────────────────────── */

/** The public site's page: header with the partner-code bar, the live pages
 *  draw it on both questions, then the footer. */
function SitePage({ children }: { children: ReactNode }) {
  return (
    <div style={SITE_PAGE}>
      <StandaloneBrowserChrome />
      <XcelSiteHeader />
      <main style={{ background: 'var(--color-fixed-light)' }}>{children}</main>
      <XcelFooter />
    </div>
  )
}

/** OCD's log-in frame: the grey ground and the white card with the logo. */
function OcdFrame({ children }: { children: ReactNode }) {
  return (
    <div style={OCD_PAGE}>
      <StandaloneBrowserChrome />
      <main style={OCD_MAIN}>
        <section aria-label="Log in" style={OCD_CARD}>
          <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={OCD_LOGO} />
          {children}
        </section>
      </main>
    </div>
  )
}

/** Forward through the Log In walk, keeping the address's demo state.
 *  Pushed, not replaced, so the browser's Back retraces it. */
function useLogInNavigate() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  return (pathname: string, extra: Record<string, string> = {}) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(extra)) next.set(k, v)
    navigate({ pathname, search: next.toString() })
  }
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const SITE_PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const OCD_PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-e2e-ocd-ground)',
  fontFamily: 'var(--font-e2e-ocd)',
}

const OCD_MAIN: CSSProperties = { display: 'flex', justifyContent: 'center', padding: '82px 16px 48px' }

/* White, 15 padding, the fields 371 wide inside. ⚠ 460 WIDE, NOT THE LIVE
   PAGE'S 500 (2026-11-20, Afsana): the width of Keycloak's card, which takes
   its place, so the two are one card changing rather than two sizes. */
const OCD_CARD: CSSProperties = {
  position: 'relative',
  boxSizing: 'border-box',
  width: 460,
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 48,
  padding: '64px 15px 56px',
  background: 'var(--color-fixed-light)',
}

const OCD_LOGO: CSSProperties = { display: 'block', width: 140, height: 56, objectFit: 'contain' }

const OCD_FORM: CSSProperties = {
  width: 371,
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 22,
}

const OCD_FIELD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const OCD_LABEL_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }

const OCD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const OCD_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 41,
  padding: 10,
  border: '1px solid var(--color-e2e-partner-divider)',
  borderRadius: 0,
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 16,
  color: 'var(--color-text-primary)',
}

/* The email once Keycloak has said no — kept on screen, so the learner sees
   which address the password is for. */
const OCD_INPUT_LOCKED: CSSProperties = {
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-e2e-form-text)',
}

const OCD_INFO: CSSProperties = {
  display: 'inline-flex',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-e2e-ocd-link)',
  cursor: 'pointer',
}

const OCD_TIP: CSSProperties = {
  position: 'absolute',
  left: 22,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 1,
  width: 220,
  padding: '8px 10px',
  borderRadius: 4,
  background: 'var(--color-neutral-950)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 12,
  lineHeight: '17px',
  fontWeight: 400,
}

const OCD_CHANGE: CSSProperties = {
  alignSelf: 'flex-start',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-e2e-ocd-link)',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 13,
  cursor: 'pointer',
}

/* The live page's own red for its message under the field. */
const OCD_ERROR: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  color: 'var(--color-error-600)',
}

/* The live LOG IN: 145 × 50, the brick, 5 radius, Arial 14 bold, uppercase,
   1.6 tracking. */
const OCD_BUTTON: CSSProperties = {
  alignSelf: 'center',
  minWidth: 145,
  height: 50,
  marginTop: 14,
  padding: '15px 20px',
  border: '2px solid var(--color-xcel-brick)',
  borderRadius: 5,
  background: 'var(--color-xcel-brick)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '1.6px',
  textTransform: 'uppercase',
  cursor: 'pointer',
}

/* Forgot your password? sits under the card, on the grey. */
const OCD_BELOW: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: -44,
  margin: 0,
  textAlign: 'center',
}

const OCD_FORGOT: CSSProperties = {
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  fontWeight: 300,
  color: 'var(--color-e2e-ocd-link)',
}

const DEMO_FILL: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  width: 32,
  height: 32,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
}
