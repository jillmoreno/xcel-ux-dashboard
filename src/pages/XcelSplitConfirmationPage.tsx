import { useEffect, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CircleCheckSolid } from '@/icons'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { PartnerHeader } from '@/components/e2e/PartnerHeader'
import { TopoBackground } from '@/components/e2e/TopoBackground'
import { LOADING_HANDOFF_MS, XcelLoadingPage } from '@/components/e2e/XcelLoadingPage'
import { InvitePasswordChecklist } from '@/components/e2e/InvitePasswordChecklist'
import { CART_PACKAGE_PARAM, cartPackage } from '@/data/xcelCourseFinder'
import {
  SPLIT_JOURNEY_RAIL_FLAG,
  partnerAttributed,
  passwordSetFromEmailedLink,
  useEmailValidated,
  useInviteFlow,
  usePartnerAttribution,
} from '@/data/inviteFlows'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import { meetsInvitePasswordRules } from '@/data/invitePasswordRules'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
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

/**
 * THE SPLIT CONFIRMATION — 2026-10-22, the second thank-you treatment: "the
 * page will look similar to my loading gif page with the topo background. but
 * in a style where the left side is the confirmation info, the right side is
 * the topo background with the login window".
 *
 * ⚠ IT IS A DIFFERENT ENDING, NOT A RESTYLE. The receipt page hands the learner
 * a Launch Student Portal button and assumes the account is ready; this one
 * sends them to their inbox first — "the user is required to go to their email
 * to validate". That is a different promise about when they can start studying,
 * and it is the thing the two are being compared on.
 *
 * ⚠ THE SAME SCREEN BOTH TIMES. Validating does not open a new page: "that
 * will bring them back to this same styled screen with the login info". So the
 * right-hand card has two states and the left rail never changes — a learner
 * returning from their email sees the order they already placed, still there,
 * which is most of the reassurance this page exists to give.
 *
 * ⚠ THE DEMO NEEDS A WAY TO BE THE EMAIL LINK. Nothing in a prototype can send
 * mail, so the un-validated card carries an explicit stand-in rather than
 * pretending — see `SIMULATE`.
 */
export function XcelSplitConfirmationPage({
  tone = 'dark',
}: {
  /**
   * ⚠ THE RAIL'S TONE, AND IT IS MORE THAN A COLOUR SWAP (2026-10-22, "can we
   * do a lighter confirmation experience"). The light treatment also ranges
   * the heading left, drops the box around it and trades the green tick for
   * XCEL's brick — a dark panel needs an outline to hold the thank-you
   * together and a light one does not, so honouring the design means honouring
   * the layout difference rather than recolouring and calling it done.
   */
  tone?: 'dark' | 'light'
} = {}) {
  const light = tone === 'light'
  useEndToEndDemoParams()
  useEndToEndPageChrome('Thank you for your order | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const flow = useInviteFlow()
  const validated = useEmailValidated()
  const [password, setPassword] = useState('')
  const [shown, setShown] = useState(false)
  const ready = meetsInvitePasswordRules(password)
  /* ⚠ OFF BY DEFAULT — 2026-10-22: "add a feature toggle that hides this
     section completely and on default only shows the last step section,
     centered in the screen." Only the VALIDATED state has a rail to hide; the
     receipt before it is doing a different job. */
  const railOn = useFeatureFlag(SPLIT_JOURNEY_RAIL_FLAG).enabled
  const rail = validated && railOn
  /**
   * ⚠ WHETHER THE CARD IS AT THE PASSWORD YET — 2026-10-23, Jillienne of the
   * invited ending: "this step needs to match the confirmation page we did for
   * the guest version, but the create password side will skip the email
   * validation for this flow, all the other UI should be matching."
   *
   * Validation is a step some flows have and others do not, and
   * `passwordSetFromEmailedLink` is already that question. A guest typed their
   * address in and has to prove they can open it, so the card sends them to
   * their inbox first; an invited learner was REACHED at that address by their
   * partner, so there is nothing left to prove and the password is the step.
   *
   * ⚠ IT IS NOT `validated`, WHICH STILL GOVERNS THE RAIL. The invited arm
   * skips the email, not the receipt: it has never seen one, so the left half
   * stays the order just placed rather than jumping ahead to the journey panel
   * a returning learner gets.
   */
  const atPassword = validated || !passwordSetFromEmailedLink(flow)
  /* ⚠ SIGNING IN TAKES A MOMENT, AND THE PAGE SAYS SO — 2026-10-22: "once log
     in is clicked, will show the loading gif page and then land user on the
     Atlas home page." The same hold Place your order uses, for the same
     reason: an account being created and a dashboard appearing in the same
     frame reads as a page swap, not as a sign-in. */
  const [signingIn, setSigningIn] = useState(false)
  /* ⚠ THE INVITED ARM'S TWO HAND-OFF FLAGS, HONOURED HERE SINCE 2026-10-23,
     when this page became the ending for BOTH journeys. They were
     Confirmation & Password's, and delegating to this page without them would
     have dropped two toggles silently — the worst way to lose behaviour. Both
     default ON, so the committed baseline is unchanged on either arm. */
  const endsHere = useFeatureFlag('e2e-ends-at-password').enabled
  const opensHome = useFeatureFlag('e2e-loading-opens-home').enabled

  const pkg = cartPackage(
    params.get(INVITE_STATE_PARAM) ?? '',
    params.get(INVITE_LOA_PARAM) ?? '',
    params.get(CART_PACKAGE_PARAM),
  )
  const partnered = usePartnerAttribution()
  const advertised = useEndToEndCourseTitle()
  const total = partnered ? '$65.00' : (pkg?.price ?? '$199.00')
  /* What they bought. The cart's package where there is one; otherwise the
     course the state and line of authority name, so a link straight to this
     page still says what the order was for. Null only when neither is in the
     address, and the row is then simply not drawn rather than left blank. */
  const state = params.get(INVITE_STATE_PARAM) ?? ''
  const lineOfAuthority = params.get(INVITE_LOA_PARAM) ?? ''
  /* ⚠ AND THE ADVERTISED COURSE LAST — 2026-10-23, when the invited arms
     started ending here. They arrive with no cart and no picked pair: the
     course came from the invitation, so it is `useEndToEndCourseTitle` that
     knows it. Without this fallback a receipt for an order that definitely
     named a course simply had no Product row. */
  const purchased =
    pkg?.name ??
    (state && lineOfAuthority ? `${state} ${lineOfAuthority} Pre-licensing` : null) ??
    advertised

  /* ⚠ THE LEARNER GOES TO THEIR INBOX — 2026-10-22, with the activation email
     mock. The page used to flip itself with a "Demo: I've clicked the link"
     shortcut; now it opens the email, and the link INSIDE that email is what
     brings them back validated. The walk is the point: a reviewer should see
     what the learner receives, not be told it was sent. */
  const openEmail = () =>
    navigate({ pathname: '/end-to-end-demo/activation-email', search: params.toString() })

  /* ⚠ ATLAS HOME, WITH `journey=full` RIDING ALONG. The guest arm now ends
     where the invited one does — Confirmation & Password's own hand-off writes
     the identical address, and for the identical reason: the dashboard reads
     that parameter to decide whether Course Overview reaches Compass on this
     walk. Drop it and the walk ends in a dashboard behaving like a different
     demo. `replace`, so Back leaves the flow rather than returning to a
     password form whose state is gone; cleared on unmount, so leaving early
     cannot navigate on top of wherever the reviewer went. */
  useEffect(() => {
    /* ⚠ `opensHome` OFF MEANS THE SPINNER IS THE ENDING. The loading page is
       the last screen of the walk then, deliberately — it is what the flag is
       for. */
    if (!signingIn || !opensHome) return
    const timer = window.setTimeout(() => {
      navigate(
        `/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&${E2E_JOURNEY_PARAM}=${E2E_JOURNEY_FULL}`,
        { replace: true },
      )
    }, LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [signingIn, opensHome, navigate])

  if (signingIn) return <XcelLoadingPage message="Taking you to your learning dashboard" />

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      {/* The partner lockup, where there is a partner — the same call every
          other page in the flow makes. */}
      <PartnerHeader partner={partnerAttributed(flow) || partnered} />

      <main style={SPLIT}>
        {/* ── Left: the receipt ─────────────────────────────────────────── */}
        {/* ⚠ THE RAIL CHANGES JOB ONCE THEY ARE BACK — 2026-10-22: "when
            coming back to this part of the login process, we no longer need to
            show the confirmation stuff on the left".

            Before validating, the receipt is reassurance: it proves the order
            exists while the learner goes off to their inbox. After, they have
            already seen it and the order is no longer in question — so the
            panel stops looking backwards and shows what is ahead instead. The
            page keeps its shape; only what the left half is FOR changes. */}
        {validated ? (
          rail ? <JourneyRail state={state} lineOfAuthority={lineOfAuthority} /> : null
        ) : (
        <section aria-labelledby="order-thanks" style={light ? RAIL_LIGHT : RAIL}>
          <div style={light ? RECEIPT_LIGHT : RECEIPT}>
            {/* ⚠ NO TICK ON THE LIGHT ARM — 2026-10-22, the direct ask. The
                heading already says the order went through, and on warm paper a
                filled brick disc next to it was the loudest mark on a panel
                whose whole job is to be quieter than the sign-in card opposite.

                ⚠ ITS MICRO-INTERACTION GOES WITH IT HERE, and that is the cost
                worth naming: the arrival animation added two turns earlier now
                plays on the DARK arm only. The classes and keyframes are
                untouched and still in use there. */}
            {light ? null : (
              <span style={TICK_WRAP}>
                <span aria-hidden className="cre-e2e-order-tick-ring" style={TICK_RING} />
                <CircleCheckSolid
                  size={28}
                  aria-hidden
                  className="cre-e2e-order-tick"
                  style={{ color: 'var(--color-e2e-split-tick)', display: 'block', position: 'relative' }}
                />
              </span>
            )}
            {/* ⚠ PERSONALISED, AND THE NAME GETS ITS OWN LINE (2026-10-22,
                the direct ask). The receipt is the only place on this page
                that speaks to the learner rather than instructing them, and a
                name on its own line is what makes it read as being addressed
                rather than as a label with a greeting bolted on.

                `<br>` rather than two blocks: it is ONE heading, so its
                accessible name should be the whole sentence — "Jordan, Thank
                you for your order" — not two fragments a screen reader reads
                as separate things. */}
            <h1 id="order-thanks" style={light ? THANKS_LIGHT : THANKS}>
              {E2E_LEARNER_FIRST},
              <br />
              Thank you for your order!
            </h1>
          </div>
          {/* The perforation, as a receipt has. */}
          {/* The dark rail's perforation; the light one lets its hairline
              rules do that job on their own. */}
          {light ? null : <span aria-hidden style={PERFORATION} />}
          <dl style={FACTS}>
            {/* ⚠ THE PRODUCT, NOT THE EMAIL — 2026-10-22: "we are showing
                the email in the other side, can we update this to the product
                purchased instead?". The address is named twice in the card
                opposite — in the instruction and under it — so a third copy
                here spent the receipt's middle row on something already on
                screen, while the one thing a receipt must carry, WHAT was
                bought, was nowhere on the page. */}
            <Fact term="Confirmation number" value="XL00186764" wide light={light} />
            {purchased ? <Fact term="Product" value={purchased} light={light} /> : null}
            <Fact term="Order total" value={total} light={light} />
          </dl>
        </section>
        )}

        {/* ── Right: the topo, and the way in ───────────────────────────── */}
        {/* ⚠ CENTRED WHEN IT IS ALONE. With no rail the right half is the whole
            page, and a card sitting 420px from the left edge of a 1440px page
            would read as a layout missing its other half rather than as a
            deliberate single column. `justifyContent` already centres it
            horizontally; what changes is that the column stops being half a
            split and becomes the page. */}
        <section
          aria-labelledby="sign-in"
          style={{ ...(light ? FIELD_LIGHT : FIELD), ...(validated && !rail ? FIELD_ALONE : null) }}
        >
          <TopoBackground entrance />
          {/* ⚠ SCAFFOLDING, AND IT SAYS SO — 2026-10-22: "remove this, as it
              wont be a CTA that will be showing to the user, have a demo cta
              in the bottom right Go to Email".

              A real learner opens their own inbox; the product has no button
              for that, and one inside the card taught reviewers a step that
              does not exist. This is the prototype's own way of getting to the
              email screen, parked in the corner where demo controls live,
              marked DEMO, and drawn in neither of the page's two registers so
              it cannot be mistaken for product. */}
          {!atPassword ? (
            <button type="button" style={DEMO_CTA} onClick={openEmail}>
              <span style={DEMO_TAG}>Demo</span>
              Go to Email
            </button>
          ) : null}
          <div style={CARD}>
            {/* ⚠ "NEXT STEP" IS THE WHOLE POINT OF THIS CARD — 2026-10-22,
                the direct ask. A learner who has just paid is not looking for
                a task; the eyebrow says one is left before the heading names
                it, which is what turns "Confirm your email" from an
                instruction into a position in a sequence.

                ⚠ BEFORE VALIDATION ONLY. Once they are back from their inbox
                the card is the way in, not a step to get through — labelling
                it "Next step" there would imply a third one. */}
            {/* ⚠ BOTH STATES ARE STEPS NOW. The second used to be the way
                IN — "sign in to your existing account" — and an account that
                does not exist yet cannot be signed into. It is the last thing
                standing between the learner and their course, so it gets the
                same eyebrow as the first. */}
            <p style={CARD_EYEBROW}>{atPassword ? 'Last step' : 'Next step'}</p>
            <h2 id="sign-in" style={CARD_TITLE}>
              {atPassword ? 'Create your password' : 'Confirm your email'}
            </h2>

            {!atPassword ? (
              /* ⚠ THE FORM IS NOT DRAWN YET — 2026-10-22: "bc the user has not
                 yet clicked the link in their email, no reason to show these
                 fields like that cant do anything with".

                 It used to render the whole sign-in card greyed out above this
                 message, on the reasoning that keeping the card's shape stopped
                 the page jumping when the learner came back. That was the wrong
                 trade: four controls a learner cannot use are four things to
                 try before reading the sentence that explains why, and a
                 disabled password field invites exactly the attempt it will
                 refuse. The page shifting once, after they return from their
                 inbox, costs less. */
              <>
                {/* ⚠ IT OPENS ON THE INSTRUCTION, not on what we did —
                    2026-10-22, her wording. "We've sent…" reports our side of
                    it; "Open the email we sent to…" tells the learner what to
                    do, which is the only thing this card is for. "The
                    VERIFICATION link" names what the link is, so a learner who
                    thinks the mail is only a receipt has a reason to open it. */}
                <p style={CARD_NOTE}>
                  Open the email we sent to{' '}
                  <strong style={{ fontWeight: 800 }}>{E2E_LEARNER_EMAIL}</strong> and click the
                  verification link to activate your account.
                </p>

                {/* The fine print gets its own zone. Everything above the rule
                    is what to do; everything below is what to do when that does
                    not work. */}
                <span aria-hidden style={CARD_RULE} />

                {/* ⚠ ONE LINE, NOT THREE (2026-10-22, her wording). The
                    longer version spelled out the spam folder, the delay and
                    the sender across two paragraphs — all true, and all of it
                    read before the learner knows whether they have a problem
                    at all. This says the same thing to the person who does,
                    and nothing to the person who doesn't.

                    No bold lead any more either: it made "Don't see the email?"
                    scannable inside a paragraph, and there is no paragraph
                    left to scan. */}
                <p style={CARD_FINE}>
                  Don’t see it? Check your spam folder or{' '}
                  {/* ⚠ A BUTTON, NOT A STYLED SPAN. Inert in the prototype like
                      the rest of this page's links, but anything that reads as
                      clickable has to be reachable by keyboard and announced as
                      a control — a blue underline only a mouse can find is the
                      commonest way a help route goes missing for the people
                      most likely to need it. */}
                  <button type="button" style={CONTACT_LINK} title="Not wired in this prototype">
                    contact us
                  </button>
                  .
                </p>
              </>
            ) : (
              /* ⚠ THE FORM ONLY EXISTS ONCE IT CAN BE USED. Everything here
                 was previously drawn disabled alongside the message above. */
              <>
                <label style={FIELD_GROUP}>
                  <span style={FIELD_LABEL}>Email</span>
                  <span style={{ ...INPUT_SHELL, background: 'var(--color-e2e-form-locked)' }}>
                    <span style={{ flex: '1 0 0', minWidth: 1 }}>{E2E_LEARNER_EMAIL}</span>
                    <img src="/brand/confirmation/lock.svg" alt="Locked" width={16} height={16} style={{ display: 'block' }} />
                  </span>
                </label>

                <label style={FIELD_GROUP}>
                  <span style={FIELD_LABEL}>Create password</span>
                  <span style={INPUT_SHELL}>
                    <input
                      type={shown ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password..."
                      /* ⚠ `new-password`, NOT `current-password`. This is the
                         first one this learner has ever had, so a browser
                         offering a saved credential here would be offering
                         someone else's — and password managers use this token
                         to decide whether to GENERATE one, which is what we
                         want them to do. */
                      autoComplete="new-password"
                      style={PASSWORD_INPUT}
                    />
                    <button
                      type="button"
                      onClick={() => setShown((v) => !v)}
                      /* The label names the ACTION, not the state;
                         `aria-pressed` carries the state. The same pair as
                         Confirmation & Password. */
                      aria-label={shown ? 'Hide password' : 'Show password'}
                      aria-pressed={shown}
                      style={EYE}
                    >
                      {/* ⚠ THE SLASH MEANS HIDDEN, same as Confirmation &
                          Password — see the long note there (2026-10-22, the
                          mapping was the other way round until then). The
                          picture carries the STATE; the `aria-label` above
                          carries the action. */}
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

                {/* ⚠ SHOWN BEFORE THEY TYPE, not after. Confirmation &
                    Password reveals these once the field has something in it,
                    which is right when a learner already knows the rules and is
                    being reminded. Here they are being asked to invent a
                    password to a policy they have never seen — rules that
                    appear only after a first attempt are rules you learn by
                    failing. */}
{/* ⚠ THE HEADING IS THE FIELD LABEL'S REGISTER, deliberately —
                    "PASSWORD REQUIREMENTS" under "CREATE PASSWORD" reads as the
                    same form still talking, where a third type size would read
                    as a notice interrupting it. */}
                <InvitePasswordChecklist password={password} style={RULES} headingStyle={FIELD_LABEL} />

                {/* ⚠ "Forgot your password?" WENT WITH THE SIGN-IN FRAMING. An
                    account being created has no password to have forgotten. */}
                {/* ⚠ THE GATE IS THE CHECKLIST, not "is there anything in the
                    field" — one definition of valid, read by the rows above
                    and by this button, so the two cannot disagree. */}
                <button
                  type="button"
                  disabled={!ready}
                  className={ready ? 'cre-e2e-cta' : undefined}
                  style={ready ? LOG_IN_ON : LOG_IN_OFF}
                  /* ⚠ `endsHere` OFF SKIPS THE HOLD ENTIRELY and opens Home
                     with the Affidavit modal over it — Confirmation &
                     Password's own OFF arm, kept when this page took over its
                     ending. The flag decides whether the walk stops at the
                     password or carries into the affidavit; it is not a
                     different button. */
                  onClick={() => {
                    if (endsHere) setSigningIn(true)
                    else
                      navigate(
                        `/dashboard-rebrand?demo=1&version=${END_TO_END_VERSION}&affidavit=1`,
                      )
                  }}
                >
                  {/* ⚠ IT NAMES BOTH HALVES — 2026-10-22, the direct ask. The
                      press saves the password AND signs them in, and "Create
                      account" named neither: the account was created when they
                      paid, and what happens next is that they land in Atlas. */}
                  Save Password &amp; Log In
                </button>
                {/* ⚠ THE DEMO FILL, MOVED HERE WITH THE PASSWORD STEP —
                    2026-10-23. It was Confirmation & Password's, put in this
                    corner on 2026-10-22 ("yes move that shortcut to the bottom
                    right") so that filling the field and watching the
                    requirements tick stopped being the same gesture. That page
                    no longer has a password form; without bringing the corner
                    across, the shortcut would have quietly left the product in
                    a refactor nobody would connect it to.

                    ⚠ INVISIBLE TO THE EYE, NOT TO EVERYONE — label and
                    tooltip, so a pointer that lands on it and a screen reader
                    both find out what it is.

                    ⚠ 28 SQUARE, NOT 40. This card's padding is 28; sized to
                    the padding it lives entirely in the margin and cannot take
                    a press meant for the button above it. */}
                <button
                  type="button"
                  aria-label="Fill in the demo learner’s password"
                  title="Demo shortcut: fill in the demo learner’s password"
                  style={DEMO_PASSWORD_FILL}
                  onClick={() => setPassword(TEST_PASSWORD)}
                />
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

/**
 * WHAT IS AHEAD — the rail once the learner is validated (2026-10-22).
 *
 * ⚠ THE ENROL STEP IS DELIBERATELY ABSENT ("ignore the enroll in course
 * step"), and leaving it out is what makes the list useful rather than
 * decorative: they have just enrolled, so a first row marked done would spend
 * the panel's top line telling them something they did two screens ago. The
 * list starts at the next thing they have to do.
 *
 * ⚠ THREE STEPS, ONE LINE EACH. "Keep them light and simple" — this is a
 * glance, not a syllabus, and it sits opposite the card carrying the thing
 * they actually have to do now. Anything longer competes with it.
 */
function JourneyRail({ state, lineOfAuthority }: { state: string; lineOfAuthority: string }) {
  /* Named from the pick, so the journey is the learner's own — a panel that
     said "Pass State Exam for Florida Life and Health" to someone who bought
     Texas Personal Lines is the same lie this flow keeps having to fix. */
  const where = state || 'your state'
  const course = state && lineOfAuthority ? `${state} ${lineOfAuthority}` : 'your course'
  const steps = [
    {
      title: 'Complete Pre-licensing Coursework',
      body: 'Learn all of the material and reinforce your understanding through guided practice.',
    },
    {
      title: 'Pass State Exam',
      body: `Take your state licensing exam for ${course} with confidence.`,
    },
    {
      title: `Get Licensed in ${where}`,
      body: 'We will guide you along the way.',
    },
  ]

  return (
    <section aria-labelledby="journey" style={JOURNEY_RAIL}>
      <h1 id="journey" style={JOURNEY_TITLE}>
        Your Journey at a Glance
      </h1>
      <ol style={JOURNEY}>
        {steps.map((step, i) => (
          <li key={step.title} style={STEP}>
            {/* ⚠ THE LINE IS DRAWN BY THE MARKER, not by a border on the row —
                it has to stop at the LAST marker rather than run on under it,
                and a row border cannot know which row is last. */}
            <span aria-hidden style={STEP_MARK}>
              <span style={i === 0 ? DOT_NOW : DOT} />
              {i < steps.length - 1 ? <span style={STEP_LINE} /> : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={STEP_TITLE}>{step.title}</span>
              <span style={STEP_BODY}>{step.body}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Fact({
  term,
  value,
  wide = false,
  light = false,
}: {
  term: string
  value: string
  wide?: boolean
  light?: boolean
}) {
  return (
    <div style={light ? FACT_LIGHT : FACT}>
      <dt style={light ? FACT_TERM_LIGHT : FACT_TERM}>{term}</dt>
      <dd
        style={{
          ...(light ? FACT_VALUE_LIGHT : FACT_VALUE),
          letterSpacing: wide ? '0.08em' : undefined,
        }}
      >
        {value}
      </dd>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const SPLIT: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'stretch',
  minHeight: 520,
}

/* The dark rail. Its own token pair rather than the neutrals, because this
   panel is the one dark ground in the whole invite flow and must not flip with
   the theme — the same reason `tokens.css` pins the prototype bar's colours. */
const RAIL: CSSProperties = {
  flex: '0 1 340px',
  boxSizing: 'border-box',
  padding: '40px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  background: 'var(--color-e2e-split-rail)',
}

const RECEIPT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 14,
  padding: '22px 18px 26px',
  border: '1px solid var(--color-e2e-split-line)',
}

const TICK_WRAP: CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/* The ring is drawn from the tick's own colour, faded — one mark leaving, not
   a second colour arriving. */
const TICK_RING: CSSProperties = {
  position: 'absolute',
  inset: -6,
  borderRadius: '50%',
  border: '2px solid var(--color-e2e-split-tick)',
  pointerEvents: 'none',
}

const THANKS: CSSProperties = {
  margin: 0,
  textAlign: 'center',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-fixed-light)',
}

const PERFORATION: CSSProperties = {
  display: 'block',
  height: 1,
  borderTop: '1px dashed var(--color-e2e-split-line)',
}

const FACTS: CSSProperties = { margin: 0, display: 'flex', flexDirection: 'column', gap: 0 }

const FACT: CSSProperties = {
  padding: '12px 2px 14px',
  borderBottom: '1px solid var(--color-e2e-split-line)',
}

const FACT_TERM: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-e2e-split-label)',
}

const FACT_VALUE: CSSProperties = {
  margin: '5px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-fixed-light)',
}

/* ── The light rail ─────────────────────────────────────────────────────
   Warm paper rather than the dark ground, and NOT just a recolour: the
   heading ranges left with no box, the tick is XCEL brick, and the hairline
   rules carry the structure the dark panel's outline was carrying. */

const RAIL_LIGHT: CSSProperties = {
  flex: '0 1 370px',
  boxSizing: 'border-box',
  padding: '48px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  /* Warm paper, against the neutral the right half sits on — the two grounds
     are what separate the receipt from the way in. The RULES take the right
     half's colour instead; see `--color-e2e-split-rule-light`. */
  background: 'var(--color-secondary-200)',
}

/* No border, and ranged left — a light panel does not need an outline to hold
   the thank-you together, and boxing it would make the page look like a form.
   ⚠ ONE ROW SINCE 2026-10-22, the direct ask: the tick to the LEFT of the
   thank-you rather than stacked above it, and both reduced. The rail is the
   receipt, not the headline — the thing the learner has to ACT on is "Confirm
   your email" on the right, and it cannot be the page's loudest text while a
   34px tick and a 23px heading sit opposite it. */
const RECEIPT_LIGHT: CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  /* ⚠ RANGED LEFT WITH THE FACTS (2026-10-22). It was centred while the tick
     sat beside it — a pair of marks reads as a unit and wants its own axis.
     With the tick gone the heading is just the first line of the receipt, and
     a centred line over a left-aligned list is two margins where there should
     be one. */
  justifyContent: 'flex-start',
  gap: 12,
  padding: '0 0 14px',
}

/* ⚠ SMALLER THAN THE SIGN-IN CARD'S TITLE (20px), deliberately. The right
   card is what the learner has to do next; this is the record of what already
   happened. Two headings at the same size would make the page argue with
   itself about where to look. */
const THANKS_LIGHT: CSSProperties = {
  margin: 0,
  textAlign: 'left',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 17,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

/* ⚠ TIGHTENED 2026-10-22 ("reduce the vertical spacing between these
   components a bit"). The gap between one fact's value and the next fact's
   label was 36px — 18 under the value, 2 of padding, 16 above the next label —
   which spread four short lines down a panel taller than the card beside it.
   28 now, and the rules still do the separating. */
const FACT_LIGHT: CSSProperties = {
  padding: '13px 0 2px',
  borderTop: '1px solid var(--color-e2e-split-rule-light)',
}

const FACT_TERM_LIGHT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 10,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const FACT_VALUE_LIGHT: CSSProperties = {
  margin: '6px 0 13px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

/* The right half keeps the topo, on the same paper as the rail so the two
   sides read as one surface rather than two panels. */
const FIELD_LIGHT: CSSProperties = {
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

/* ── The journey list ──────────────────────────────────────────────────── */

/**
 * ⚠ CHARCOAL GROUND, BRICK HIGHLIGHT — 2026-10-22: "i wanted the background to
 * be a dark charcoal color close to what is used in xcel logo, use the red as
 * a highlight color only."
 *
 * The wordmark is one red letter against four dark ones, and this panel is
 * built the same way round: a neutral ground, with the brand's red spent on
 * the single mark that says where the learner is. A full red panel made the
 * whole list shout, and a list where everything is emphasised has no emphasis
 * in it.
 *
 * ⚠ IT IS THE SAME COLOUR IN BOTH TONES, which is the one place this page
 * stops branching. The receipt is a document and takes the page's paper; the
 * journey is a statement about what happens next, and it keeps its own ground
 * whichever treatment the rest of the page is wearing.
 */
const JOURNEY_RAIL: CSSProperties = {
  flex: '0 1 370px',
  boxSizing: 'border-box',
  padding: '48px 40px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--color-e2e-journey-ground)',
}

const JOURNEY_TITLE: CSSProperties = {
  margin: 0,
  textAlign: 'left',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 17,
  lineHeight: '24px',
  color: 'var(--color-fixed-light)',
}

const JOURNEY: CSSProperties = {
  listStyle: 'none',
  margin: '18px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}

const STEP: CSSProperties = { display: 'flex', gap: 14, minWidth: 0 }

/* Holds the dot and the line below it, so the connector ends with the last
   marker instead of running past it. */
const STEP_MARK: CSSProperties = {
  flex: 'none',
  width: 14,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: 3,
}

const DOT_BASE: CSSProperties = {
  flex: 'none',
  width: 12,
  height: 12,
  borderRadius: '50%',
  boxSizing: 'border-box',
}

/* Upcoming: a ring of the ground, hollow. */
const DOT: CSSProperties = {
  ...DOT_BASE,
  border: '2px solid color-mix(in srgb, var(--color-fixed-light) 55%, transparent)',
  background: 'transparent',
}

/* ⚠ THE ONLY RED ON THE PANEL. The step they are on, in the X's own brick —
   one filled brand mark against two hollow neutrals is what makes "you are
   here" readable without reading anything, and it is the whole job the red is
   doing here. */
const DOT_NOW: CSSProperties = {
  ...DOT_BASE,
  border: '2px solid var(--color-xcel-brick-600)',
  background: 'var(--color-xcel-brick-600)',
}

const STEP_LINE: CSSProperties = {
  flex: '1 0 auto',
  width: 1,
  minHeight: 26,
  margin: '4px 0',
  background: 'color-mix(in srgb, var(--color-fixed-light) 35%, transparent)',
}

const STEP_TITLE: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-fixed-light)',
}

/* ⚠ 82%, NOT A GREY. A second grey on a grey ground is two neutrals arguing;
   a tint of the same white the titles use reads as one voice turned down, and
   still measures well clear of AA on this charcoal. */
const STEP_BODY: CSSProperties = {
  display: 'block',
  margin: '3px 0 22px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'color-mix(in srgb, var(--color-fixed-light) 82%, transparent)',
}

const FIELD: CSSProperties = {
  position: 'relative',
  flex: '1 1 420px',
  minWidth: 0,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '48px 32px 64px',
  /* ⚠ THE LOADING PAGE'S GROUND, not the flow's warm band. The topo is drawn
     at `--color-e2e-topo` (#e3e3e3), which was designed to read on the
     loading page's neutral #f5f5f5; over the beige #f0eee9 the two are close
     enough in value that the contours all but vanish — the background was
     there and invisible, which is the worst of both. Matching the page it was
     borrowed from is what makes it read. */
  background: 'var(--color-neutral-75)',
  overflow: 'hidden',
}

/* ⚠ CENTRED VERTICALLY TOO, when the card is the only thing on the page. In
   the split the card starts at the top because the rail beside it does; alone,
   a card pinned to the top of an otherwise empty page looks dropped rather
   than placed. */
const FIELD_ALONE: CSSProperties = { flex: '1 1 100%', alignItems: 'center' }

/* TEST DATA ONLY — a demo password that meets the rules (upper, lower, number,
   special; 12 characters). Not anyone's real password. */
const TEST_PASSWORD = 'Navarro#2026'

/* The demo fill's target: the card's bottom-right corner, sized to its
   padding. Transparent and borderless — it is not part of the design, and
   anything visible here would read as a control of the product. */
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

/* Sits tight under the heading rather than at the card's own gap — the two
   are one unit, and the card's 16px rhythm between them would read as two
   separate lines. */
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

const CARD_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
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

/* The rules block. Quiet — it is reference material the learner reads once,
   not an instruction competing with the field above it. */
const RULES: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 11,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}

/* ⚠ NO `background` HERE, DELIBERATELY — 2026-10-22: "make this the xcel red
   color". It was the course band's charcoal, set inline, which beat the
   `cre-e2e-cta` class this button already carries and so threw away the
   class's hover, active and focus-visible states along with its colour. The
   fix is to stop overriding it rather than to inline a second red: the class
   is where every other CTA in the flow gets XCEL's brick, and one definition
   is what keeps them the same button. */
const LOG_IN_ON: CSSProperties = {
  padding: '12px 20px',
  borderRadius: 4,
  border: 'none',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}

const LOG_IN_OFF: CSSProperties = {
  ...LOG_IN_ON,
  background: 'var(--color-e2e-form-locked)',
  color: 'var(--color-text-secondary)',
  cursor: 'not-allowed',
}

/* The demo's way to the email screen. Dashed and muted on purpose: every
   other control on this page is either XCEL brick or the flow's dark CTA, so
   a dashed outline belongs to neither and reads as a tool rather than a step. */
const DEMO_CTA: CSSProperties = {
  position: 'absolute',
  right: 20,
  bottom: 20,
  zIndex: 1,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  borderRadius: 4,
  border: '1px dashed var(--color-text-tertiary)',
  background: 'color-mix(in srgb, var(--color-fixed-light) 86%, transparent)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const DEMO_TAG: CSSProperties = {
  padding: '2px 6px',
  borderRadius: 3,
  background: 'var(--color-text-tertiary)',
  color: 'var(--color-fixed-light)',
  fontSize: 9,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

/* The page's link blue — the same `--color-e2e-return` "Forgot your password?"
   uses, so the two read as one kind of thing. */
const CONTACT_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  color: 'var(--color-e2e-return)',
  textDecoration: 'underline',
  cursor: 'pointer',
}

/* The card's fine print — the spam note and the help line. 11px is small, so
   the colour carries the weight: `--color-text-secondary`, not the tertiary
   grey. The audit note in tokens.css is the reason that distinction matters —
   the lighter stop measured 3.9:1 on white at this size and failed AA. */
/* Separates "what to do" from "what to do when that doesn't work". Tight
   margins because the card's own 16px gap sits either side of it. */
const CARD_RULE: CSSProperties = {
  display: 'block',
  height: 1,
  margin: '2px 0',
  background: 'var(--color-e2e-form-outline)',
}

const CARD_FINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 11,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
}
