import { useCallback, useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { PartnerCodeAskPage, XcelAccountAskPage } from '@/components/e2e/PartnerCodeAsk'
import {
  KeycloakLogInCardV3,
  V3CardBack,
  V3CardForgot,
  V3CardHead,
  V3CardInput,
  V3CardSigningIn,
  V3CardSubmit,
} from '@/components/e2e/VerifyEmailModalV3'
import { LOADING_HANDOFF_MS } from '@/components/e2e/XcelLoadingPage'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { HelpCircle } from '@/icons'
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
 *     not in Keycloak            assumed OCD's: OCD's password, then OCD;
 *                                "The Username or Password is incorrect." for
 *                                a wrong password and for no account alike
 *
 * ⚠ NOTHING SAYS AN ACCOUNT DOES NOT EXIST. OCD has no service that answers
 * whether a username exists (Swati, 2026-11-18), and an identity screen should
 * not say which half was wrong — so an email nobody knows walks exactly like
 * an OCD one until the password is in, and then gets the same words as a
 * wrong password. (For part of 2026-11-20 it said "An account does not
 * exist."; Afsana took it back the same day.) "Please create a user account."
 * is gone. Where the account is, the demo cannot look up: Account found in
 * (`invite-v3-log-in-account`) says.
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
 * grey; everything else is Keycloak's card, since this card hands over to it
 * (2026-11-20, Afsana): 460 wide, its Avenir, its Log in title and grey rule,
 * its labels (no colon), its rounded fields and its full-width button
 * (`V3CardHead`, `V3CardInput`, `V3CardSubmit`).
 *
 * What changed, and why:
 *   - Email, not Username — with an info icon saying a username works too.
 *     OCD asks for a username and most are emails (99% of B2C, 78% of B2B,
 *     Swati), so ⚠ THE FIELD DOES NOT CHECK FOR AN EMAIL: a username has to
 *     get through to OCD's password.
 *   - The email alone first, CONTINUE; the password only once Keycloak has
 *     said no. Keycloak's yes leaves this page for Keycloak's own.
 *   - Under the password: "The Username or Password is incorrect." — the same
 *     words for a wrong password and for no account (2026-11-20, Afsana).
 *   - Forgot password? only with the password, under its field as on
 *     Keycloak's card: before the email is in, nobody knows which system's
 *     password it is.
 */
export function XcelOcdLogInPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('OnCourse Direct Login')
  const go = useLogInNavigate()
  const account = resolveV3LogInAccount(useFeatureFlag(INVITE_V3_LOG_IN_ACCOUNT_FLAG).variant)
  const [params] = useSearchParams()
  /* Filled when Keycloak's ← Back brings the learner here to change it. */
  const [email, setEmail] = useState(() => params.get('email') ?? '')
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)
  /* The right password: "Signing you in", as Keycloak's card holds on, then
     OCD (2026-11-20, Afsana). Never after a failure — that is the error. */
  const [signingIn, setSigningIn] = useState(false)
  const standalone = params.get('standalone') === '1'
  useEffect(() => {
    /* Opened from `/invite-v3` the walk holds here, as Keycloak's does. */
    if (!signingIn || standalone) return
    const timer = window.setTimeout(() => go(LOG_IN_PATHS.ocdHome), LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
    // `go` is rebuilt every render; the hold starts once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signingIn, standalone])
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
    else setSigningIn(true)
  }

  if (signingIn) {
    return (
      <div style={OCD_PAGE}>
        <StandaloneBrowserChrome />
        <main style={OCD_MAIN}>
          <section aria-label="Signing you in" style={OCD_CARD}>
            <V3CardSigningIn />
          </section>
        </main>
      </div>
    )
  }

  return (
    <OcdFrame
      back={
        /* OCD's password step is Keycloak's: no email field, ← Back on its
           own row above the logo to change it (2026-11-20, Afsana). */
        step === 'password' ? (
          <V3CardBack
            onBack={() => {
              setStep('email')
              setPassword('')
              setFailed(false)
            }}
          />
        ) : null
      }
    >
      <form
        noValidate
        style={OCD_FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (step === 'email') submitEmail()
          else submitPassword()
        }}
      >
        {/* Keycloak's card's title and rule (2026-11-20, Afsana), so the
            email step and the Log in it may hand over to read as one. No lead
            on either step: the field says what it wants. */}
        <V3CardHead title="Log in" />
        {step === 'email' ? (
          <div style={OCD_FIELD}>
            <span style={OCD_LABEL_ROW}>
              <label htmlFor="ocd-email" style={OCD_LABEL}>
                Email
              </label>
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <button
                  type="button"
                  aria-label="About this field"
                  aria-describedby={tip ? tipId : undefined}
                  aria-expanded={tip}
                  onClick={() => setTip((v) => !v)}
                  onMouseEnter={() => setTip(true)}
                  onFocus={() => setTip(true)}
                  onMouseLeave={() => setTip(false)}
                  onBlur={() => setTip(false)}
                  className="cre-xcel-help"
                >
                  <HelpCircle size={20} aria-hidden />
                </button>
                {/* The live site's tooltip, above the icon (2026-11-23,
                    Afsana) — `.cre-xcel-tip` in inviteFlow.css. */}
                {tip ? (
                  <span id={tipId} role="tooltip" className="cre-xcel-tip">
                    Enter email or username
                  </span>
                ) : null}
              </span>
            </span>
            {/* ⚠ type="text", not "email" — a username must get through. */}
            {/* Keycloak's field (2026-11-20, Afsana): rounded, the light fill. */}
            <V3CardInput
              id="ocd-email"
              type="text"
              autoComplete="username"
              spellCheck={false}
              autoFocus
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        ) : (
          <div style={OCD_FIELD}>
            <label htmlFor="ocd-password" style={OCD_LABEL}>
              Password
            </label>
            <V3CardInput
              id="ocd-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setFailed(false)
              }}
              aria-invalid={failed}
              aria-describedby={failed ? 'ocd-incorrect' : undefined}
            />
            {failed ? (
              <p id="ocd-incorrect" role="alert" style={OCD_ERROR}>
                The Username or Password is incorrect.
              </p>
            ) : null}
            {/* Keycloak's place for it, under the field (2026-11-20, Afsana) —
                not OCD's, under the card. Drawn only: OCD's reset is OCD's. */}
            <V3CardForgot />
          </div>
        )}
        {/* Keycloak's Log in button (2026-11-20, Afsana): full width, the
            brick, off until the field has something in it. */}
        {step === 'email' ? (
          <V3CardSubmit ready={given !== ''}>Continue</V3CardSubmit>
        ) : (
          <V3CardSubmit ready={password !== ''}>Log in</V3CardSubmit>
        )}
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
    </OcdFrame>
  )
}

/** Keycloak's log-in, on a page of its own — it is its own system — for the
 *  address OCD's page was given, which ← Back returns to change. Then Atlas Home, the flow's usual
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
        <KeycloakLogInCardV3
          email={email}
          onSignedIn={onSignedIn}
          onBack={() => {
            /* Back to the email step, the address still in it. */
            const next = new URLSearchParams(params)
            next.set('email', email)
            navigate({ pathname: LOG_IN_PATHS.ocd, search: next.toString() })
          }}
        />
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
function OcdFrame({ children, back }: { children: ReactNode; back?: ReactNode }) {
  return (
    <div style={OCD_PAGE}>
      <StandaloneBrowserChrome />
      <main style={OCD_MAIN}>
        <section aria-label="Log in" style={OCD_CARD}>
          {back}
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
  fontFamily: 'var(--font-e2e-avenir)',
}

const OCD_MAIN: CSSProperties = { display: 'flex', justifyContent: 'center', padding: '82px 16px 48px' }

/* White, Keycloak's card's padding, so its fields and button are the same
   width as Keycloak's (2026-11-20, Afsana). ⚠ 460 WIDE, NOT THE LIVE
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
  /* Keycloak's card's top: its padding, gap and logo (`VerifyEmailModalV3`),
     so Log in sits at the same height on both (2026-11-20, Afsana). */
  gap: 20,
  padding: '36px 36px 32px',
  background: 'var(--color-fixed-light)',
}

const OCD_LOGO: CSSProperties = { display: 'block', width: 132, height: 42, objectFit: 'contain' }

const OCD_FORM: CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 20,
}

const OCD_FIELD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const OCD_LABEL_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 }

/* Keycloak's field label (`VerifyEmailModalV3`'s FIELD_LABEL), no colon —
   2026-11-20, Afsana. */
const OCD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  fontWeight: 800,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

/* Keycloak's wrong-password line (`VerifyEmailModalV3`'s INVALID). */
const OCD_ERROR: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-error-600)',
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
