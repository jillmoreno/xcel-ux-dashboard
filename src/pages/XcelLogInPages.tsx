import { useCallback, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { PartnerCodeAskPage, XcelAccountAskPage } from '@/components/e2e/PartnerCodeAsk'
import { KeycloakLogInCardV3, V3CardHead, V3CardInput, V3CardSubmit } from '@/components/e2e/VerifyEmailModalV3'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { CircleInfo } from '@/icons'
import {
  INVITE_V3_LOG_IN_ACCOUNT_FLAG,
  LOG_IN_PATHS,
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
 *   OCD's log-in page, repurposed the email alone, looked up in Keycloak first —
 *     in Keycloak                Keycloak's log-in widget, then Atlas Home
 *     not in Keycloak            OCD's own log-in page, unchanged, the
 *                                Username filled and locked (2026-11-23);
 *                                LOG IN does nothing for an OCD account, and
 *                                says "The Username or Password is incorrect"
 *                                for none
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
 * Five pages, one file: they are one short walk and share the frame.
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
 * OCD'S LOG-IN PAGE, REPURPOSED — the email step, the page being redesigned.
 * The live page's grey; everything else is Keycloak's card, since this card
 * hands over to it (2026-11-20, Afsana): 460 wide, its Avenir, its Log in
 * title and grey rule, its labels (no colon), its rounded fields and its
 * full-width button (`V3CardHead`, `V3CardInput`, `V3CardSubmit`).
 *
 * What changed, and why:
 *   - Email, not Username — with an info icon saying a username works too.
 *     OCD asks for a username and most are emails (99% of B2C, 78% of B2B,
 *     Swati), so ⚠ THE FIELD DOES NOT CHECK FOR AN EMAIL: a username has to
 *     get through to OCD's page.
 *   - The email alone, Continue. Keycloak's yes opens Keycloak's Log in;
 *     its no opens OCD's own log-in page, unchanged, with the Username filled
 *     (`XcelOcdExistingLogInPage`, 2026-11-23). Until that day OCD's password
 *     was a second step of this card.
 */
export function XcelOcdLogInPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('OnCourse Direct Login')
  const go = useLogInNavigate()
  const account = resolveV3LogInAccount(useFeatureFlag(INVITE_V3_LOG_IN_ACCOUNT_FLAG).variant)
  const [params] = useSearchParams()
  /* Filled when Keycloak's ← Back brings the learner here to change it. */
  const [email, setEmail] = useState(() => params.get('email') ?? '')
  const [tip, setTip] = useState(false)
  const tipId = useId()
  const given = email.trim()

  return (
    <OcdFrame>
      <form
        noValidate
        style={OCD_FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (!given) return
          /* Keycloak first (PRD 5.7): found there, Keycloak's own page; not
             found, OCD's own (2026-11-23, Afsana). */
          go(account === 'atlas' ? LOG_IN_PATHS.keycloak : LOG_IN_PATHS.ocdExisting, { email: given })
        }}
      >
        {/* Keycloak's card's title and rule (2026-11-20, Afsana). No lead: the
            field says what it wants. */}
        <V3CardHead title="Log in" />
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
                <CircleInfo size={16} aria-hidden />
              </button>
              {/* The shared V3 tooltip, above the icon (2026-11-23, Afsana) —
                  `.cre-xcel-tip` in inviteFlow.css. */}
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
        {/* Keycloak's Log in button (2026-11-20, Afsana): full width, the
            brick, off until the field has something in it. */}
        <V3CardSubmit ready={given !== ''}>Continue</V3CardSubmit>
      </form>
      {/* The demo fill — the invisible, labelled corner V3's modals carry. */}
      <button
        type="button"
        aria-label="Fill in the demo learner’s email"
        title="Demo shortcut: fill in the demo learner’s email"
        style={DEMO_FILL}
        onClick={() => setEmail(E2E_LEARNER_EMAIL)}
      />
    </OcdFrame>
  )
}

/**
 * OCD'S OWN LOG-IN PAGE, AS IT IS — 2026-11-23, Afsana: for an OCD account or
 * none, Continue opens my.xcelsolutions.com/login.aspx, and "the design as
 * shown must be preserved". Measured off the live page: the grey form, the
 * 500 white card, the logo, Arial labels with colons, square 41-high fields,
 * the brick LOG IN and Forgot your password? under the card.
 *
 * What the flow adds, and only that:
 *   - the Username is the address given on the email step, and locked;
 *   - LOG IN with no password: "All fields are required" over the Username
 *     and the Password outlined red — the live page's own validation;
 *   - LOG IN with a password: nothing happens for an OCD account (the demo
 *     stops where OCD takes over); "The Username or Password is incorrect"
 *     over the Username for no account — the same place and red.
 */
export function XcelOcdExistingLogInPage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('OnCourse Direct Login')
  const account = resolveV3LogInAccount(useFeatureFlag(INVITE_V3_LOG_IN_ACCOUNT_FLAG).variant)
  const [params] = useSearchParams()
  const username = params.get('email')?.trim() || E2E_LEARNER_EMAIL
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | 'required' | 'incorrect'>(null)

  return (
    <div style={LIVE_PAGE}>
      <StandaloneBrowserChrome />
      <form
        noValidate
        style={LIVE_FORM}
        onSubmit={(e) => {
          e.preventDefault()
          if (!password) setError('required')
          else setError(account === 'none' ? 'incorrect' : null)
        }}
      >
        <section aria-label="OnCourse Direct log in" style={LIVE_CARD}>
          <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={LIVE_LOGO} />
          <div style={LIVE_FIELDS}>
            {error ? (
              <p id="live-error" role="alert" style={LIVE_ERROR}>
                {error === 'required' ? 'All fields are required' : 'The Username or Password is incorrect'}
              </p>
            ) : null}
            <label htmlFor="live-username" style={LIVE_LABEL}>
              Username:
            </label>
            <input
              id="live-username"
              type="text"
              value={username}
              readOnly
              aria-readonly="true"
              style={LIVE_INPUT}
            />
            <label htmlFor="live-password" style={{ ...LIVE_LABEL, marginTop: 22 }}>
              Password:
            </label>
            <input
              id="live-password"
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error === 'required'}
              aria-describedby={error ? 'live-error' : undefined}
              style={error === 'required' ? { ...LIVE_INPUT, borderColor: 'var(--color-error-600)' } : LIVE_INPUT}
            />
          </div>
          <button type="submit" style={LIVE_BUTTON}>
            Log In
          </button>
        </section>
        {/* Inert, as on every flow: OCD's reset is OCD's. */}
        <p style={LIVE_BELOW}>
          <span style={LIVE_FORGOT}>Forgot your password?</span>
        </p>
      </form>
    </div>
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

/* OCD's own page, measured off my.xcelsolutions.com/login.aspx (2026-11-20
   and 2026-11-23): a white page, the form a grey block 540 wide 62 from the
   top, the card 500 wide inside it. */
const LIVE_PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--color-fixed-light)', paddingTop: 62 }

const LIVE_FORM: CSSProperties = {
  boxSizing: 'border-box',
  width: 540,
  maxWidth: '100%',
  margin: '0 auto',
  padding: '20px 20px 50px',
  background: 'var(--color-e2e-ocd-ground)',
}

const LIVE_CARD: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '94px 15px 78px',
  background: 'var(--color-fixed-light)',
}

const LIVE_LOGO: CSSProperties = { display: 'block', width: 150, height: 56, objectFit: 'contain' }

/* The fields' column: 371 wide, the labels and fields flush left in it. */
const LIVE_FIELDS: CSSProperties = {
  width: 371,
  maxWidth: '100%',
  marginTop: 75,
  display: 'flex',
  flexDirection: 'column',
  gap: 5,
}

const LIVE_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  fontWeight: 700,
  lineHeight: '16px',
  color: 'var(--color-e2e-ocd-ink)',
}

const LIVE_INPUT: CSSProperties = {
  boxSizing: 'border-box',
  width: '100%',
  height: 41,
  padding: 10,
  border: '1px solid var(--color-e2e-partner-divider)',
  borderRadius: 0,
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 16,
  color: 'var(--color-e2e-ocd-field-text)',
  outline: 'none',
}

/* The live page's message over the Username: its red, a size above the
   labels. */
const LIVE_ERROR: CSSProperties = {
  margin: '0 0 8px',
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 16,
  lineHeight: '20px',
  color: 'var(--color-error-600)',
}

/* The live LOG IN: 145 × 50, the brick, 5 radius, Arial 14 bold, uppercase,
   1.6 tracking. */
const LIVE_BUTTON: CSSProperties = {
  marginTop: 53,
  minWidth: 145,
  height: 50,
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
const LIVE_BELOW: CSSProperties = { margin: '21px 0 0', textAlign: 'center' }

const LIVE_FORGOT: CSSProperties = {
  fontFamily: 'var(--font-e2e-ocd)',
  fontSize: 14,
  fontWeight: 300,
  color: 'var(--color-e2e-ocd-link)',
}
