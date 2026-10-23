/* INVITE FLOW V2 — checkout (/end-to-end-demo/checkout).
 *
 * A VERBATIM FORK of `InvitedCheckoutPage` taken 2026-10-22, the day the invite flow got
 * versions (`inviteFlowVersions.ts`). It renders when `invite-flow-version`
 * resolves to `v2`; `InvitedCheckoutPage` keeps rendering V1 and is NOT
 * touched by work in here — which is the whole point of the fork, and the
 * repo's standing rule for changing something that already exists.
 *
 * ⚠ IDENTICAL TO V1 UNTIL IT IS CHANGED. While that is still true, a
 * difference you see between the two versions is a bug in the switch
 * (`InviteFlowRoutes.tsx`), not a difference in the design.
 *
 * ⚠ FORK THE LAYOUT, IMPORT THE DATA. Everything below reads the demo's course,
 * prices, learner and partner from `./endToEndDemo` — keep it that way. Two
 * copies of the content means the V1/V2 comparison stops being about the
 * design.
 */
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, CreditCard, LockSolid, Plus, Trash } from '@/icons'
import {
  E2E_LEARNER_EMAIL,
  E2E_LEARNER_PHONE,
  E2E_ORIGINAL_PRICE,
  E2E_PARTNER_NAME,
  E2E_PARTNER_PRICE,
  useEndToEndCourseTitle,
  useEndToEndDemoParams,
} from './endToEndDemo'
import {
  INVITE_LOA_PARAM,
  INVITE_STATE_PARAM,
  inviteProductTitle,
  useInviteChoice,
} from '@/data/inviteMissingDetails'
import { CART_PACKAGE_PARAM, cartPackage } from '@/data/xcelCourseFinder'
import { LOADING_HANDOFF_MS, XcelLoadingPage } from '@/components/e2e/XcelLoadingPage'
import { PartnerCodeAskModal } from '@/components/e2e/PartnerCodeAsk'
import {
  PARTNER_CODE_PARAM,
  asksForPartnerCode,
  usePartnerAttribution,
  usePartnerCodeAnswered,
  usePartnerCodeAsk,
  emailEnteredTwice,
  individuallyInvited,
  emailsMatch,
  looksLikeEmail,
  studentDetailsKnown,
  studentInformationComplete,
  useInviteFlow,
  type InviteFlowId,
} from '@/data/inviteFlows'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import './inviteFlow.css'

/**
 * CHECKOUT — `/end-to-end-demo/checkout` (2026-10-14, Eric's request), Figma
 * "Atlas UX Design" 420:2392. The End-to-End Demo's next page: Invited Product
 * Detail's Purchase Now opens it.
 *
 * A MOCK THAT WALKS THROUGH, and sends nothing. THE PAYMENT COLUMN was
 * reworked 2026-10-15 (Eric's request) to a reference checkout's features, in
 * this page's own styling: Express checkout, then OR, then Billing address
 * (Edit billing address — an expandable form with Delete and Confirm — or Use a
 * different billing address), then Payment methods (Credit Card, expandable:
 * Name on Card, Card Number, Expiration, CVV, a Save card switch, Card
 * Nickname, Make this my default payment method, Confirm Payment Method).
 * The reference's payment-provider name is not copied.
 *
 * The card fields fill with TEST data when clicked — Visa's published test card
 * 4242 4242 4242 4242, never a real one. ANY CLICK IN THE PAYMENT COLUMN (or
 * Confirm Payment Method) turns Place your order on (the design's 50% is its
 * off state), and placing the order opens
 * Confirmation & Password (`InvitedConfirmationPage`). Confirm billing address
 * folds its form; Delete, the express-checkout marks, the Edit button, the
 * Terms link and Apply are not wired.
 *
 * DEMO DATA: the learner is the demo's, Jordan Navarro, at an invented address
 * and a 555 number. The Figma frame carries what looks like a real home address
 * and phone, so it is not copied here.
 *
 * The design's fonts and colours, through the `--font-e2e-*` / `--color-e2e-*`
 * tokens (Rockwell for the design's Amasis MT). The card, Google Pay, PayPal
 * and reCAPTCHA marks are the design's own images (`public/brand/checkout/`).
 */
export function InvitedCheckoutPageV2() {
  const navigate = useNavigate()
  /* THE ADDRESS IS CARRIED FORWARD, not rebuilt (2026-10-16). Invited Product
     Detail already hands its whole query string to this page; this hop used to
     write `demo` and `version` from scratch and drop everything else, which
     is where `?journey=full` died — the End-to-End row walked all the way to
     the spinner and then behaved like the invite row, with nothing to see. */
  const [params, setParams] = useSearchParams()
  // THE STUDENT'S ADDRESS, editable in Edit Student Information (2026-10-15,
  // Eric's request), and whether it is also the billing address — "Use as
  // default billing address" there. While it is, the Payment column's billing
  // address follows it; editing the billing form takes the billing address
  // off it.
  /* WHICH FLOW — the `invite-flow-journey` design control, read FIRST because
     the student state below starts from it. Asked through PREDICATES rather
     than by name, so a fifth flow answers questions instead of hiding in a
     chain of comparisons. See `inviteFlows.ts`. */
  const flow = useInviteFlow()
  /* THE PARTNER CODE QUESTION, on the arm that asks it HERE — 2026-10-22. The
     `page` arm asked it before this page was reached, so by the time a learner
     arrives from there the answer is already in the address and this draws
     nothing. See `partner-code-ask`. */
  const partnerAsk = usePartnerCodeAsk()
  const partnerAnswered = usePartnerCodeAnswered()
  const askingForPartnerCode =
    partnerAsk === 'modal' && asksForPartnerCode(flow) && !partnerAnswered
  /* ⚠ ATTRIBUTION COUNTS THE ANSWER, not just the flow — a guest who says they
     have a code IS partner-attributed from that moment, which is what moves
     the price below. */
  const partnered = usePartnerAttribution()
  /* ⚠ GUEST STARTS BLANK — 2026-10-22. The initialiser is a function so the
     arm is read once, at mount, rather than on every render: a reviewer who
     flips the control mid-page keeps what they have typed instead of having it
     wiped, and `?ff=` decides what they START with, which is what the control
     is for. The consequence to know is that switching arms does NOT retro-fill
     the form — reload to get the other arm's starting state. */
  const [student, setStudent] = useState<PostalAddress>(() =>
    studentDetailsKnown(flow) ? STUDENT_ADDRESS : BLANK_ADDRESS,
  )
  const [studentOpen, setStudentOpen] = useState(false)
  const [studentIsBilling, setStudentIsBilling] = useState(true)
  const [billingOwn, setBillingOwn] = useState<PostalAddress>(STUDENT_ADDRESS)
  const billingAddress = studentIsBilling ? student : billingOwn
  // Billing address: which option, whether its form is open, and confirmed.
  const [billing, setBilling] = useState<'edit' | 'different'>('edit')
  // Folded until opened (2026-10-15, Eric's request).
  const [billingOpen, setBillingOpen] = useState(false)
  const [billingConfirmed, setBillingConfirmed] = useState(false)
  // "Use a different billing address": its own, blank form (2026-10-15,
  // Eric's request); confirming it makes it the billing address.
  const [differentOpen, setDifferentOpen] = useState(false)
  const [different, setDifferent] = useState<PostalAddress>(BLANK_ADDRESS)
  // The card: its form open, which fields have been clicked (and so filled),
  // the Save card switch, and whether it has been confirmed.
  const [cardOpen, setCardOpen] = useState(true)
  /* B2C's two addresses. Separate state rather than one value with a
     confirmation, because the pair IS the control: the first field is masked,
     so the only way a learner can check what they typed is for the second to
     disagree with it. */
  const [email, setEmail] = useState('')
  const [emailAgain, setEmailAgain] = useState('')
  /* ⚠ THE MISMATCH IS NOT SHOWN WHILE THEY ARE STILL TYPING IT. A second field
     that turns red on its first character is objecting to an address nobody
     has finished writing — so the error waits for the field to be left
     (`touched`), which is when the learner has actually made a claim. */
  const [confirmTouched, setConfirmTouched] = useState(false)
  /* ⚠ PHONE IS THE GUEST FORM'S ONLY FIELD OUTSIDE `PostalAddress`, so it is
     its own state rather than a tenth member of a type three other forms
     share. */
  const [phone, setPhone] = useState('')
  /* ⚠ THE GATE IS A PRESS NOW, NOT A WATCHER — 2026-10-22, Jillienne: "there
     should be a save and continue that unlocks the next step". Payment used to
     open the moment the last field happened to be valid, which is a section
     appearing underneath you mid-keystroke; it now opens when the learner says
     they are done. The difference matters beyond tidiness: a form that commits
     itself has no moment where the learner can review what they typed. */
  const [studentSaved, setStudentSaved] = useState(false)
  /* ⚠ PRESSING SAVE IS ALSO "I'VE FINISHED TYPING" — 2026-10-22. The error
     waited on blur alone, which is right while someone is still in the field
     and wrong at the moment they try to move on: with a mismatch the Save
     button was simply disabled, saying nothing, and a greyed-out control with
     no explanation is the clearest way to strand somebody. */
  const [triedToSave, setTriedToSave] = useState(false)
  const emailFinished = confirmTouched || triedToSave
  /** What the email pair is wrong ABOUT, or null. */
  const emailError: 'mismatch' | 'missing' | null = !emailEnteredTwice(flow)
    ? null
    : !emailFinished
      ? null
      : emailAgain.trim() === '' && email.trim() !== ''
        ? 'missing'
        : emailAgain.length > 0 && !emailsMatch(email, emailAgain)
          ? 'mismatch'
          : null
  /* GUEST'S GATE — 2026-10-22. Payment opens when the student information is
     complete; `studentInformationComplete` owns what that means, because it is
     a decision rather than a condition. The other two arms arrive complete, so
     the gate is open for them from the first render and this is `true`
     throughout — the Payment column is not conditional CODE, it is wrapped in
     something that happens never to close on those arms. */
  /* Enough typed to be worth saving — what Save and continue needs. */
  const studentFormComplete = studentInformationComplete({ ...student, phone, email, emailAgain })
  /* …and whether Payment is open. The invited arms arrive complete and saved;
     Guest has to press. */
  const studentComplete = studentDetailsKnown(flow) || studentSaved
  const [filled, setFilled] = useState<Partial<Record<CardField, boolean>>>({})
  const fill = (f: CardField) => setFilled((prev) => ({ ...prev, [f]: true }))
  const [saveCard, setSaveCard] = useState(true)
  const [nickname, setNickname] = useState('')
  const [cardConfirmed, setCardConfirmed] = useState(false)
  // Place your order turns on at ANY click in the Payment column, as well as
  // on Confirm Payment Method (2026-10-15, Eric's request) — a demo shortcut.
  const [orderReady, setOrderReady] = useState(false)
  const canOrder = orderReady || cardConfirmed
  /* ⚠ THE ORDER IS PLACED, AND THE PAGE SAYS SO BEFORE THE RECEIPT DOES —
     2026-10-22: "after user clicks place your order, we likely need to show
     the loading gif page before immediately loading the confirmation page."
     Paying is the one moment in this flow where a learner has handed something
     over and is waiting to hear back, and a confirmation that appears in the
     same frame as the press reads as a page swap rather than as a purchase
     going through. The hold is where the product takes the money. */
  const [placing, setPlacing] = useState(false)
  useEndToEndDemoParams()
  /* THE PRODUCT'S NAME — the learner's pick when the invitation was missing
     its details (2026-10-22), else the advertised course. Read from the
     address, which the hop from Invited Product Detail carries forward whole,
     so the order summary names the course they actually chose rather than the
     one the invitation failed to specify. */
  const advertisedTitle = useEndToEndCourseTitle()
  const inviteChoice = useInviteChoice()
  /* ⚠ THE CART OUTRANKS BOTH — 2026-10-22, found walking the guest journey end
     to end. A guest arrives here holding something they CHOSE: a named package
     at a price the cart has already quoted them twice. This page was built
     when checkout only ever followed an invitation to one known product, so it
     priced every order from `E2E_ORIGINAL_PRICE` and listed three hard-coded
     Florida Life and Health items — which meant the cart said $299 Premier,
     the checkout said $199, and the receipt said $299 again. A checkout that
     disagrees with the cart it came from is the one number on the page nobody
     can explain away. */
  const pkg = cartPackage(
    params.get(INVITE_STATE_PARAM) ?? '',
    params.get(INVITE_LOA_PARAM) ?? '',
    params.get(CART_PACKAGE_PARAM),
  )
  const courseTitle = pkg?.name ?? (inviteChoice ? inviteProductTitle(inviteChoice) : advertisedTitle)
  /* What is in the box. The cart's package where there is one — a learner who
     bought the standard package must not be shown Premier's three lines. */
  const lineItems = pkg?.includes ?? INVITED_LINE_ITEMS
  /* What they actually pay. The partner's price where a partner is behind the
     purchase, otherwise what the cart quoted, otherwise the invited flow's. */
  const price = partnered ? PARTNER_PRICE : (pkg?.price ?? ORIGINAL_PRICE)
  /* ⚠ STRUCK, AND IT HAS TO BE A HIGHER NUMBER THAN `price` — 2026-10-22: "i
     want the price strike included in the demo, so keep the strike, but make
     the other price points consistent." Without a cart this is the invited
     flow's list price, which the partner arm discounts from; with one it is
     the package's own. */
  const listPrice = pkg?.listPrice ?? ORIGINAL_PRICE

  /* ⚠ WHICH CONFIRMATION DEPENDS ON HOW THEY ARRIVED — 2026-10-22. An invited
     learner ends on Confirmation & Password, which sets a password and hands
     them into Atlas; a stranger who bought from the public site ends on that
     site's order confirmation, with an order number and a way into the portal.
     They are not variants of one page: what a flow ends on follows from how it
     began.
     
     `replace`, not push: the order is placed and the checkout behind it holds
     a card form whose state is gone — Back should leave the step, not drop a
     reviewer onto a form that will not take a second payment. The timer is
     cleared on unmount, so leaving early (the Design bar's Page control, the
     rail) cannot navigate on top of wherever the reviewer went. */
  useEffect(() => {
    if (!placing) return
    const destination = individuallyInvited(flow)
      ? '/end-to-end-demo/confirmation'
      : '/end-to-end-demo/order-confirmation'
    const timer = window.setTimeout(() => {
      navigate(`${destination}?${params.toString()}`, { replace: true })
    }, LOADING_HANDOFF_MS)
    return () => window.clearTimeout(timer)
  }, [placing, flow, navigate, params])

  useEffect(() => {
    const before = document.title
    // A tick later: AccountContext names the tab on mount too.
    const t = window.setTimeout(() => {
      document.title = 'Checkout'
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.title = before
    }
  }, [])

  const answerPartnerCode = (value: 'yes' | 'no') => {
    const next = new URLSearchParams(params)
    next.set(PARTNER_CODE_PARAM, value)
    /* ⚠ `replace`, and no navigation away. That is the whole point of this
       arm: the learner stays on the page they came to pay on, and the only
       thing that changes behind the modal is the price. */
    setParams(next, { replace: true })
  }

  /* ⚠ THE WHOLE PAGE, NOT AN OVERLAY. A spinner laid over a checkout still
     shows the card form underneath it, which invites a second press on an
     order already placed — and the flow's other hand-off (Confirmation &
     Password's) replaces its page too, so the two look like one product
     doing one thing. */
  if (placing) return <XcelLoadingPage message="Placing your order" />

  return (
    <div style={PAGE}>
      {/* ⚠ THE MODAL ARM OF `partner-code-ask`. Drawn over the checkout rather
          than before it, so the comparison with the `page` arm is between two
          placements of one question — the question itself is the same
          component. */}
      {askingForPartnerCode ? <PartnerCodeAskModal onAnswer={answerPartnerCode} /> : null}
      {/* ⚠ THE BROWSER WINDOW CONTINUES HERE (2026-10-19, Jillienne: "can
          we also add this browser header to the email/invite flows so it
          feels like a seamless experience"). These pages render OUTSIDE the
          app shell, so the shell's own strip never reached them — the walk
          opened in a browser window, lost it for the invite flow, and got it
          back at the dashboard. Draws only in the Demo frame, as it does
          there. */}
      <StandaloneBrowserChrome />
      {/* The header, Figma 423:2522 (2026-10-15, Eric's request; 420:2392's
          logo-left header before): Secure Checkout centred, the logo on the
          right — the partner header's frame. Return to Cart was removed
          2026-10-15 (Eric's request); an empty slot the logo's width keeps
          Secure Checkout on the page's centre. */}
      <header style={HEADER}>
        <span aria-hidden style={{ width: 115, flex: 'none' }} />
        <p style={SECURE_CHECKOUT}>
          Secure Checkout
          <LockSolid size={13} aria-hidden />
        </p>
        <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={HEADER_LOGO} />
      </header>

      <main style={MAIN}>
        {/* 1. STUDENT INFORMATION */}
        <section aria-labelledby="checkout-student" style={COLUMN}>
          <h3 id="checkout-student" style={STEP_TITLE}>
            1. Student information
          </h3>
          <div style={{ ...PANEL, padding: 20, gap: 20, position: 'relative' }}>
            {studentDetailsKnown(flow) ? null : (
              <button
                type="button"
                aria-label="Fill in the demo learner’s details"
                title="Demo shortcut: fill in the demo learner’s details"
                style={DEMO_FILL}
                onClick={() => {
                  setStudent(STUDENT_ADDRESS)
                  setEmail(E2E_LEARNER_EMAIL)
                  setEmailAgain(E2E_LEARNER_EMAIL)
                  setPhone(E2E_LEARNER_PHONE)
                  /* Clear anything the half-typed state was complaining
                     about — a filled form showing an old error is worse than
                     the empty one. */
                  setConfirmTouched(false)
                  setTriedToSave(false)
                  setStudentSaved(false)
                }}
              />
            )}
            {/* ⚠ GUEST HAS NOTHING TO DISPLAY — 2026-10-22. B2B and B2C open on
                the learner's name and address because the invitation carried
                them, with an Edit expander underneath. A guest's panel would
                otherwise open on an empty paragraph above an "Edit Student
                Information" row offering to edit nothing, so the arm swaps the
                display-plus-expander for the FORM ITSELF, always open: on this
                arm filling it in is the step, not an edit to a step already
                done. */}
            {studentDetailsKnown(flow) ? <Address address={student} /> : null}
            {/* THE EMAIL BLOCK sits ABOVE the form only on the arms whose form is
                an EDIT behind an expander — there the names are in the address
                displayed above, so the email is already below them. On Guest the
                form IS the section, so the block is slotted inside it, under the
                name row. See `afterName`. */}
            {/* THE EMAIL BLOCK — 2026-10-22, and the one thing that differs
                between B2B and B2C at Secure Checkout.

                It sits in Student information rather than in Payment because
                the address is not a payment detail: it is the identifier the
                ACCOUNT is built on afterwards — what Confirmation mails to,
                and in B2C what the password link is sent to. Putting it beside
                the student's name and address is also what makes the locked
                B2B field legible as "we already know this about you". */}
            {studentDetailsKnown(flow) ? (
              <EmailBlock
                flow={flow}
                email={email}
                onEmailChange={setEmail}
                emailAgain={emailAgain}
                onEmailAgainChange={setEmailAgain}
                onConfirmBlur={() => setConfirmTouched(true)}
                error={emailError}
              />
            ) : null}
            {/* EDIT STUDENT INFORMATION — the billing module's form, in place of
                the Edit button (2026-10-15, Eric's request). Its "Use as
                default billing address" makes this address the billing one. */}
            {/* ⚠ THE DEMO FILL — 2026-10-22, Jillienne: "let me click in a
                secret place on the personal info form to auto-fill that
                content. like bottom right of that container".

                Guest Checkout's form is ten empty fields, and typing them out
                is most of the time it takes to walk this flow in front of
                anyone. This is the same kind of shortcut the card fields
                already have (click one and it fills with the test card) —
                invisible, so it does not read as a feature of the product.

                ⚠ INVISIBLE TO THE EYE, NOT TO EVERYONE. It carries a label and
                a tooltip, so a pointer that lands on it and a screen reader
                both find out what it is. A control that is genuinely
                undiscoverable is a trap for anyone navigating by keyboard, and
                costs nothing to avoid.

                ⚠ IT DOES NOT SAVE. Filling is not the same as the learner
                saying their details are right, and Save and continue is the
                step being demonstrated. */}
            {studentDetailsKnown(flow) ? (
              <div style={studentOpen ? OPTION_OPEN : OPTION}>
                <OptionHeader
                  label="Edit Student Information"
                  note="Update the fields below, then confirm."
                  selected={studentOpen}
                  onSelect={() => setStudentOpen(true)}
                  open={studentOpen}
                  onToggle={() => setStudentOpen((v) => !v)}
                />
                {studentOpen ? (
                  <AddressForm
                    value={student}
                    onChange={setStudent}
                    isDefault={studentIsBilling}
                    onDefaultChange={setStudentIsBilling}
                    confirmLabel="Confirm student information"
                    onConfirm={() => setStudentOpen(false)}
                  />
                ) : null}
              </div>
            ) : (
              /* ⚠ NO "Confirm student information" BUTTON ON THIS ARM. The
                 shared form takes a confirm that CLOSES it — the right ending
                 for an edit inside an expander, and the wrong one here, where
                 the form is the section and closing it would hide the only
                 thing on the page the guest has to do. The gate below reacts to
                 the fields themselves, so there is nothing for a press to
                 confirm: `onConfirm` is a no-op and the button is hidden with
                 `hideConfirm`. */
              <AddressForm
                value={student}
                onChange={(next) => {
                  setStudent(next)
                  setStudentSaved(false)
                }}
                isDefault={studentIsBilling}
                onDefaultChange={setStudentIsBilling}
                confirmLabel="Confirm student information"
                onConfirm={() => {}}
                hideConfirm
                afterName={
                  <EmailBlock
                    flow={flow}
                    email={email}
                    onEmailChange={(v) => {
                      setEmail(v)
                      setStudentSaved(false)
                    }}
                    emailAgain={emailAgain}
                    onEmailAgainChange={(v) => {
                      setEmailAgain(v)
                      setStudentSaved(false)
                    }}
                    onConfirmBlur={() => setConfirmTouched(true)}
                    error={emailError}
                  />
                }
                afterAddress={
                  <TextField
                    label="Phone number *"
                    value={phone}
                    onChange={(v) => {
                      setPhone(v)
                      /* ⚠ EDITING RE-LOCKS PAYMENT. The save said "these
                         details are right"; changing one withdraws that, and
                         leaving Payment open over stale information is how a
                         learner pays against a detail they were mid-way through
                         correcting. */
                      setStudentSaved(false)
                    }}
                  />
                }
                actions={
                  <div style={{ paddingTop: 4 }}>
                    <button
                      type="button"
                      /* ⚠ NOT DISABLED. A disabled Save tells a learner they
                         have done something wrong and refuses to say what —
                         and with the first email field MASKED they cannot even
                         re-read what they typed to work it out. Pressable, and
                         the press is what surfaces the errors. */
                      className="cre-e2e-cta"
                      style={SAVE_ON}
                      onClick={() => {
                        setTriedToSave(true)
                        if (studentFormComplete) setStudentSaved(true)
                      }}
                    >
                      Save and continue
                    </button>
                    {/* ⚠ THE PRESS HAS TO SAY SOMETHING. Without this, pressing
                        a live button and having nothing happen is worse than
                        the disabled one it replaced. The email pair gets its
                        own message beside the fields; this covers the rest. */}
                    {triedToSave && !studentFormComplete ? (
                      <p role="alert" style={SAVE_ERROR}>
                        {emailError
                          ? 'Check your email address above, then try again.'
                          : 'Fill in every required field above, then try again.'}
                      </p>
                    ) : null}
                  </div>
                }
              />
            )}
          </div>
        </section>

        {/* 2. PAYMENT */}
        <section
          aria-labelledby="checkout-payment"
          style={COLUMN}
          /* ⚠ THE "ANY CLICK ARMS THE ORDER" SHORTCUT IS GATED TOO. This
             capture handler is the demo's way of turning Place your order on
             without walking the card form; left ungated, a click anywhere in
             the closed column would arm the order a guest is not allowed to
             place yet. */
          onClickCapture={studentComplete ? () => setOrderReady(true) : undefined}
        >
          {/* "Secure" on the title's baseline (2026-10-15, Eric's request). */}
          <div style={PAYMENT_TITLE_ROW}>
            <h3 id="checkout-payment" style={STEP_TITLE}>
              2. Payment
            </h3>
            <span style={SECURE_TAG}>
              Secure
              <img src="/brand/checkout/lock-small.svg" alt="" width={7} height={10} style={{ display: 'block' }} />
            </span>
          </div>
          {/* GUEST'S CLOSED PAYMENT COLUMN — 2026-10-22, Jillienne: "the
              payment section is not available until the student information is
              fulled out".

              ⚠ DIMMED AND INERT, NOT ABSENT. Removing the column would leave
              the guest looking at a checkout with no payment on it and nothing
              to say why — the step has to be VISIBLE to be understood as
              waiting. `inert` is what actually closes it: it takes the whole
              subtree out of the tab order, out of the accessibility tree and
              out of pointer events in one attribute, which `pointer-events:
              none` alone does not (a keyboard user would still tab into the
              card fields and type into a section the page says is closed). */}
          {studentComplete ? null : (
            <p role="status" style={PAYMENT_LOCKED_NOTE}>
              <img src="/brand/checkout/lock-small.svg" alt="" width={7} height={10} style={{ display: 'block', flex: 'none' }} />
              Complete your student information to continue to payment.
            </p>
          )}
          <div
            inert={studentComplete ? undefined : true}
            style={{
              ...PANEL,
              gap: 20,
              padding: 20,
              ...(studentComplete ? null : PAYMENT_LOCKED),
            }}
          >
            {/* EXPRESS CHECKOUT — the wallet marks; not wired. */}
            <div style={GROUP}>
              <p style={GROUP_LABEL}>Express checkout</p>
              <div style={EXPRESS}>
                <img src="/brand/checkout/google-pay.png" alt="Google Pay" width={60} height={32} style={{ display: 'block' }} />
                <span aria-label="Saved card" style={EXPRESS_MARK}>
                  <CreditCard size={18} aria-hidden />
                </span>
                <span aria-label="Add a wallet" style={EXPRESS_MARK}>
                  <Plus size={14} aria-hidden />
                </span>
              </div>
            </div>

            <div style={OR_RULE} aria-hidden>
              <span style={OR_LINE} />
              OR
              <span style={OR_LINE} />
            </div>

            {/* BILLING ADDRESS */}
            <div style={GROUP} role="radiogroup" aria-label="Billing address">
              <p style={GROUP_LABEL}>
                Billing address
                {/* In the fields' Regular weight (2026-10-15, Eric's request);
                    only while it IS the student's. */}
                {studentIsBilling ? <span style={{ fontWeight: 400 }}> (Defaulted to student address)</span> : null}
                {/* The current billing address, in the same Regular, stacked
                    under the name (2026-10-15, Eric's requests). */}
                {/* 8 more above and below (2026-10-15, Eric's request). */}
                <span style={{ display: 'block', marginTop: 10, marginBottom: 8, fontWeight: 400 }}>
                  {billingAddress.first} {billingAddress.last}
                  <br />
                  {billingAddress.street}
                  {billingAddress.line2 ? (
                    <>
                      <br />
                      {billingAddress.line2}
                    </>
                  ) : null}
                  <br />
                  {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
                </span>
              </p>
              <div style={billing === 'edit' && billingOpen ? OPTION_OPEN : OPTION}>
                <OptionHeader
                  label="Edit billing address"
                  note={
                    billingConfirmed && !billingOpen
                      ? `${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zip}`
                      : 'Update the fields below, then confirm.'
                  }
                  // Filled only while its form is open — an empty circle when
                  // folded (2026-10-15, Eric's request).
                  selected={billing === 'edit' && billingOpen}
                  onSelect={() => {
                    setBilling('edit')
                    setBillingOpen(true)
                    setDifferentOpen(false)
                  }}
                  open={billing === 'edit' && billingOpen}
                  onToggle={() => {
                    setBilling('edit')
                    setBillingOpen((v) => !v)
                    setDifferentOpen(false)
                  }}
                />
                {billing === 'edit' && billingOpen ? (
                  <AddressForm
                    value={billingAddress}
                    onChange={(next) => {
                      setBillingOwn(next)
                      setStudentIsBilling(false)
                    }}
                    confirmLabel="Confirm billing address"
                    onConfirm={() => {
                      setBillingConfirmed(true)
                      setBillingOpen(false)
                    }}
                  />
                ) : null}
              </div>
              <div style={billing === 'different' && differentOpen ? OPTION_OPEN : OPTION}>
                <OptionHeader
                  label="Use a different billing address"
                  // Filled only while its form is open, as Edit billing address.
                  selected={billing === 'different' && differentOpen}
                  onSelect={() => {
                    setBilling('different')
                    setDifferentOpen(true)
                    setBillingOpen(false)
                  }}
                  open={billing === 'different' && differentOpen}
                  onToggle={() => {
                    setBilling('different')
                    setDifferentOpen((v) => !v)
                    setBillingOpen(false)
                  }}
                />
                {billing === 'different' && differentOpen ? (
                  <AddressForm
                    value={different}
                    onChange={setDifferent}
                    saveAdditional
                    confirmLabel="Confirm billing address"
                    onConfirm={() => {
                      setBillingOwn(different)
                      setStudentIsBilling(false)
                      setDifferentOpen(false)
                    }}
                  />
                ) : null}
              </div>
            </div>

            {/* PAYMENT METHODS */}
            <div style={GROUP}>
              <p style={GROUP_LABEL}>Payment methods</p>
              <div style={cardOpen ? OPTION_OPEN : OPTION}>
                <OptionHeader
                  label="Credit Card"
                  note={cardConfirmed && !cardOpen ? 'Visa ending 4242' : undefined}
                  // Likewise: filled only while open.
                  selected={cardOpen}
                  onSelect={() => setCardOpen(true)}
                  open={cardOpen}
                  onToggle={() => setCardOpen((v) => !v)}
                >
                  <span style={CARD_MARKS}>
                    {(['visa', 'mastercard', 'amex', 'discover'] as const).map((c) => (
                      <img key={c} src={`/brand/checkout/card-${c}.png`} alt={CARD_NAMES[c]} width={26} height={26} />
                    ))}
                  </span>
                </OptionHeader>
                {cardOpen ? (
                  <div style={OPTION_BODY}>
                    <Field
                      label="Name on Card"
                      placeholder="Jordan Navarro"
                      value={filled.name ? TEST_CARD.name : ''}
                      onFill={() => fill('name')}
                    />
                    <Field
                      label="Card Number"
                      placeholder="0000 0000 0000 0000"
                      value={filled.number ? TEST_CARD.number : ''}
                      onFill={() => fill('number')}
                    />
                    <div style={TWO_UP}>
                      <Field
                        label="Expiration"
                        placeholder="MM/YY"
                        value={filled.exp ? TEST_CARD.exp : ''}
                        onFill={() => fill('exp')}
                      />
                      <Field label="CVV" placeholder="•••" value={filled.cvv ? TEST_CARD.cvv : ''} onFill={() => fill('cvv')} />
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={saveCard}
                      onClick={() => setSaveCard((v) => !v)}
                      style={SWITCH_ROW}
                    >
                      <span aria-hidden style={saveCard ? SWITCH_ON : SWITCH_OFF}>
                        <span style={saveCard ? KNOB_ON : KNOB_OFF} />
                      </span>
                      Save card
                    </button>
                    {saveCard ? (
                      <TextField
                        label="Card Nickname"
                        optional
                        placeholder="My Credit Card"
                        value={nickname}
                        onChange={setNickname}
                      />
                    ) : null}
                    <label style={CHECK_LABEL}>
                      <input type="checkbox" defaultChecked style={CHECKBOX} />
                      Make this my default payment method
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {/* Confirming turns Place your order on. */}
                      <button
                        type="button"
                        className="cre-e2e-dark"
                        style={DARK_BUTTON}
                        onClick={() => {
                          setCardConfirmed(true)
                          setCardOpen(false)
                        }}
                      >
                        Confirm Payment Method
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* ORDER SUMMARY */}
        <section aria-labelledby="checkout-summary" style={SUMMARY}>
          <h3 id="checkout-summary" style={{ ...STEP_TITLE, background: 'var(--color-fixed-light)' }}>
            Order summary
          </h3>
          {/* The outline starts below the title, so its sides do not run up
              beside it (2026-10-14, Eric's request). */}
          <div style={SUMMARY_BODY}>
          <div style={SUMMARY_ITEMS}>
            <div style={SUMMARY_PRODUCT}>
              <p style={{ ...TEXT_16, maxWidth: 260, fontWeight: 800, lineHeight: '22px' }}>{courseTitle}</p>
              {/* The original price, Invited Product Detail's struck-through one
                  (2026-10-15, Eric's request). */}
              {/* Struck in red at the PDP's angle (2026-10-15, Eric's request) —
                  the same SVG, scaled to this 16px price. */}
              <p style={{ ...TEXT_16, position: 'relative', alignSelf: 'flex-start' }}>
                {listPrice}
                <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={PRICE_STRIKE} />
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lineItems.map((d) => (
                <p key={d} style={DETAIL_ROW}>
                  {d}
                </p>
              ))}
            </div>
          </div>

          <div style={PROMO}>
            <label htmlFor="checkout-promo" style={PROMO_LABEL}>
              Promo code
            </label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input id="checkout-promo" type="text" style={PROMO_INPUT} />
              <button type="button" className="cre-e2e-muted" style={APPLY}>
                Apply
              </button>
            </div>
          </div>

          {/* ⚠ NO PARTNER, NO PARTNER PRICE — 2026-10-22, with the four flows.
              The partner's price and a "Partner Discount Price" line were
              unconditional, so B2C Guest Checkout — a flow with no partner
              anywhere in it — charged a discount nobody had earned and named a
              partner that did not exist. QR / social keeps the discount: a
              broadcast link is partner-ATTRIBUTED, which is the entire reason
              the partner posted it. That is the distinction `partnerAttributed`
              exists to carry, and it is why that flow is not just a second name
              for guest checkout. */}
          <div style={TOTALS}>
            {partnered ? (
              <p style={TOTAL_ROW}>
                <span>Partner Discount Price</span>
                <span>{PARTNER_PRICE}</span>
              </p>
            ) : null}
            <p style={TOTAL_ROW}>
              <span>Subtotal</span>
              <span>{price}</span>
            </p>
            <p style={{ ...TOTAL_ROW, fontWeight: 800, lineHeight: '22px' }}>
              <span>Grand Total</span>
              <span>{price}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, padding: '25px 20px 0' }}>
            {/* On after any click in the Payment column (or Confirm Payment
                Method); it opens Confirmation & Password (2026-10-15, Eric's
                requests). */}
            <button
              type="button"
              disabled={!canOrder}
              /* ⚠ THE CLASS ONLY ON THE LIVE ARM. The grey arm is the
                 DISABLED look; giving it a hover would promise a press the
                 page will not accept. */
              className={canOrder ? 'cre-e2e-cta' : undefined}
              style={canOrder ? PLACE_ORDER_ON : PLACE_ORDER}
              onClick={() => setPlacing(true)}
            >
              Place your order
            </button>
            <p style={TERMS}>
              By completing your purchase, you agree to our{' '}
              <button type="button" className="cre-e2e-textlink" style={TERMS_LINK}>
                Terms of Service
              </button>
              .
            </p>
          </div>
          </div>
        </section>
      </main>
    </div>
  )
}

/* Invited Product Detail's two prices (its price card, 2026-10-15). */
/* What the INVITED flow's single course contains. Only reached when there is
   no cart in the address — the guest and QR arms bring their own. */
const INVITED_LINE_ITEMS = [
  'Florida Life and Health Pre-licensing',
  'Recorded Livestream Exam Review - Life and Health English',
  'Flashcards - Life, Health, and Accident Insurance',
]

const ORIGINAL_PRICE = E2E_ORIGINAL_PRICE

/* The PDP's strike (98 × 2.15 over a 25.8px price, −6.71°), at 16px. */
const PRICE_STRIKE: CSSProperties = {
  position: 'absolute',
  left: -2,
  top: '50%',
  width: 62,
  height: 1.5,
  transform: 'translateY(-50%) rotate(-6.71deg)',
}

const PARTNER_PRICE = E2E_PARTNER_PRICE

const CARD_NAMES = { amex: 'American Express', visa: 'Visa', mastercard: 'Mastercard', discover: 'Discover' }

type PostalAddress = {
  first: string
  last: string
  street: string
  line2: string
  state: string
  city: string
  zip: string
}

/* DEMO DATA — the demo learner, at an invented address. */
const STUDENT_ADDRESS: PostalAddress = {
  first: 'Jordan',
  last: 'Navarro',
  street: '1200 Bayshore Boulevard',
  line2: '',
  state: 'Florida',
  city: 'Tampa',
  zip: '33606',
}

const BLANK_ADDRESS: PostalAddress = { first: '', last: '', street: '', line2: '', state: '', city: '', zip: '' }

const STATES = ['Florida', 'Georgia', 'Illinois', 'New York', 'Texas']

function Address({ address }: { address: PostalAddress }) {
  return (
    <p style={TEXT_16}>
      {address.first} {address.last}
      <br />
      {address.street}
      {address.line2 ? (
        <>
          <br />
          {address.line2}
        </>
      ) : null}
      <br />
      {address.city}, {address.state} {address.zip}
      <br />
      United States
      <br />
      {E2E_LEARNER_PHONE}
    </p>
  )
}

/**
 * THE EMAIL AT SECURE CHECKOUT — 2026-10-22, Jillienne's brief.
 *
 * B2B: ONE field, pre-populated from the invitation and locked. The partner
 * sent the invitation to this address, so the learner never types it and
 * cannot change it — which is the point: the address is what ties the purchase
 * back to the partner's invitation, and an editable field would let the two
 * part company.
 *
 * B2C: TWO fields, the first MASKED and the second visible.
 *
 * ⚠ THE MASKING IS DELIBERATE AND IS THE UNUSUAL PART, so it is written down
 * rather than left to look like a mistake. Masking the first field is what
 * stops the second being satisfied by a paste or an autofill — the learner has
 * to produce the address twice from memory, which is what makes the second
 * entry evidence rather than a copy. The cost is real and worth stating: a
 * learner cannot proof-read what they typed, a password manager will not fill
 * it, and a screen reader announces it as a password field. That cost is the
 * trade being explored here; if it is judged too high, the shape to try next is
 * both fields visible with paste blocked on the second.
 */
function EmailBlock({
  flow,
  email,
  onEmailChange,
  emailAgain,
  onEmailAgainChange,
  onConfirmBlur,
  error,
}: {
  flow: InviteFlowId
  email: string
  onEmailChange: (v: string) => void
  emailAgain: string
  onEmailAgainChange: (v: string) => void
  onConfirmBlur: () => void
  /**
   * What the pair is wrong about, or null — 2026-10-22, widened from a boolean
   * `mismatch`.
   *
   * ⚠ "EMPTY" AND "DIFFERENT" NEED DIFFERENT SENTENCES. A learner who left the
   * second field blank and one who typed it wrong have made different
   * mistakes, and "These addresses don't match" is confusing for the first —
   * there is nothing to compare. The boolean could not tell them apart.
   */
  error: 'mismatch' | 'missing' | null
}) {
  if (!emailEnteredTwice(flow)) {
    return (
      <div style={EMAIL_BLOCK}>
        <label style={EMAIL_FIELD_GROUP}>
          <span style={FIELD_LABEL}>Email</span>
          {/* ⚠ A DISABLED `input`, NOT A `span` DRESSED AS ONE. The
              confirmation page draws its locked email as text in a field-shaped
              box, which reads correctly and is invisible to anything looking
              for the form's fields. Here the address is part of what is being
              submitted, so it stays a real input and is disabled — the lock is
              then a fact about the control rather than a picture of one. */}
          <span style={{ position: 'relative', display: 'block' }}>
            <input
              type="email"
              value={E2E_LEARNER_EMAIL}
              disabled
              readOnly
              aria-describedby="checkout-email-note"
              style={{
                ...FIELD,
                paddingRight: 36,
                background: 'var(--color-e2e-form-locked)',
                color: 'var(--color-text-secondary)',
                cursor: 'not-allowed',
              }}
            />
            <img
              src="/brand/confirmation/lock.svg"
              alt="Locked"
              width={16}
              height={16}
              style={{ position: 'absolute', right: 11, top: 11, display: 'block' }}
            />
          </span>
        </label>
        <p id="checkout-email-note" style={EMAIL_NOTE}>
          {`This is the address ${E2E_PARTNER_NAME} sent your invitation to. Your account will be created with it.`}
        </p>
      </div>
    )
  }

  return (
    <div style={EMAIL_BLOCK}>
      <label style={EMAIL_FIELD_GROUP}>
        <span style={FIELD_LABEL}>Email address</span>
        {/* Masked — see the note above the component. `autoComplete="off"`
            rather than an email token, so a browser does not undo the masking
            by filling both fields at once. */}
        <input
          type="password"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Enter your email address"
          autoComplete="off"
          aria-describedby="checkout-email-note"
          style={{ ...FIELD, paddingRight: 10 }}
        />
      </label>
      <label style={EMAIL_FIELD_GROUP}>
        <span style={FIELD_LABEL}>Re-enter email address</span>
        <input
          type="email"
          value={emailAgain}
          onChange={(e) => onEmailAgainChange(e.target.value)}
          onBlur={onConfirmBlur}
          placeholder="Re-enter your email address"
          autoComplete="off"
          /* ⚠ THE ERROR IS WIRED TO THIS FIELD, not to the block. It is the
             one the learner can see and fix — pointing a screen reader at the
             masked field above would send them to a value they cannot read. */
          aria-invalid={error != null || undefined}
          aria-describedby={error ? 'checkout-email-error' : 'checkout-email-note'}
          style={{
            ...FIELD,
            paddingRight: 10,
            /* ⚠ THE WHOLE `border` SHORTHAND, not `borderColor` over it.
               `FIELD` sets `border`, and React warns (then drops one of them)
               when a rerender mixes a shorthand with its longhand for the same
               value — so the error outline would come and go. */
            border: error
              ? '1px solid var(--color-status-error-text)'
              : '1px solid var(--color-e2e-card-outline)',
          }}
        />
      </label>
      {error ? (
        /* `role="alert"` so it is announced when it appears — the learner has
           already left the field, or pressed Save, by then, so nothing else
           would say it. */
        <p id="checkout-email-error" role="alert" style={EMAIL_ERROR}>
          {error === 'missing'
            ? 'Re-enter your email address to confirm it.'
            : 'These addresses don’t match. Re-enter your email address.'}
        </p>
      ) : (
        <p id="checkout-email-note" style={EMAIL_NOTE}>
          {looksLikeEmail(emailAgain) && emailsMatch(email, emailAgain)
            ? 'Your order confirmation and account link will be sent here.'
            : 'Enter it twice so we can be sure we can reach you. Your account will be created with this address.'}
        </p>
      )}
    </div>
  )
}

/* The address form — the billing module's, shared with Edit Student
   Information (2026-10-15). Controlled: every keystroke goes to `onChange`.
   `isDefault` / `onDefaultChange` drive "Use as default billing address";
   without them the box is the form's own. */
function AddressForm({
  value,
  onChange,
  isDefault,
  onDefaultChange,
  confirmLabel,
  onConfirm,
  saveAdditional = false,
  hideConfirm = false,
  afterName,
  afterAddress,
  actions,
}: {
  value: PostalAddress
  onChange: (next: PostalAddress) => void
  isDefault?: boolean
  onDefaultChange?: (on: boolean) => void
  confirmLabel: string
  onConfirm: () => void
  /** Adds "Save as additional address", unticked (the different-address form,
   *  2026-10-15). */
  saveAdditional?: boolean
  /** Drops the Delete / Confirm row — 2026-10-22, for Guest Checkout, where
   *  this form IS the Student information section rather than an edit inside
   *  it. There is nothing to confirm (the Payment gate reads the fields) and
   *  nothing to delete (no saved address to remove). */
  hideConfirm?: boolean
  /**
   * Slotted in directly BELOW the name row — 2026-10-22, Jillienne: "email
   * section should be below the first and last name".
   *
   * ⚠ A SLOT RATHER THAN A SECOND COPY OF THE FORM. Guest Checkout's email
   * block has to sit between the names and the address, which is inside this
   * form; the alternative was either rendering the block above the whole form
   * (where it was, and wrong — you are asked for an address before you are
   * asked who you are) or forking the form for one arm. The billing forms pass
   * nothing and are unchanged.
   *
   * ⚠ NAME, THEN EMAIL, THEN ADDRESS is the order this puts things in, and it
   * is the conventional one for a reason: the email is how the person is
   * contacted, so it belongs with who they are rather than with where they
   * live.
   */
  afterName?: ReactNode
  /** Slotted after the State / City / ZIP row, before the billing checkbox —
   *  where Guest Checkout's Phone number sits in the design. */
  afterAddress?: ReactNode
  /** Replaces the Delete / Confirm row entirely. Guest Checkout passes its
   *  "Save and continue"; the billing forms pass nothing and keep theirs. */
  actions?: ReactNode
}) {
  const set = (k: keyof PostalAddress) => (v: string) => onChange({ ...value, [k]: v })
  return (
    <div style={OPTION_BODY}>
      <div style={TWO_UP}>
        <TextField label="First Name" value={value.first} onChange={set('first')} />
        <TextField label="Last Name" value={value.last} onChange={set('last')} />
      </div>
      {afterName}
      <SelectField label="Country" options={['United States of America']} />
      <TextField label="Street Address" value={value.street} onChange={set('street')} />
      <TextField
        label="Street Address line 2"
        optional
        placeholder="Apartment, Suite, Unit, building, floor, etc."
        value={value.line2}
        onChange={set('line2')}
      />
      <div style={THREE_UP}>
        <SelectField label="State" options={STATES} value={value.state} onChange={set('state')} />
        <TextField label="City" value={value.city} onChange={set('city')} />
        <TextField label="ZIP Code" value={value.zip} onChange={set('zip')} />
      </div>
      {afterAddress}
      <label style={CHECK_LABEL}>
        {onDefaultChange ? (
          <input
            type="checkbox"
            checked={!!isDefault}
            onChange={(e) => onDefaultChange(e.target.checked)}
            style={CHECKBOX}
          />
        ) : (
          <input type="checkbox" defaultChecked style={CHECKBOX} />
        )}
        Use as default billing address
      </label>
      {saveAdditional ? (
        <label style={CHECK_LABEL}>
          <input type="checkbox" style={CHECKBOX} />
          Save as additional address
        </label>
      ) : null}
      {actions}
      {hideConfirm ? null : (
        <div style={BUTTON_ROW}>
          <button type="button" className="cre-e2e-outline" style={DELETE_BUTTON}>
            <Trash size={14} aria-hidden />
            Delete
          </button>
          <button type="button" className="cre-e2e-dark" style={{ ...DARK_BUTTON, flex: '1 0 0' }} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      )}
    </div>
  )
}

/* An option's header row: its radio and label (and note), anything else
   passed (the card marks), and — when it folds — the chevron. */
function OptionHeader({
  label,
  note,
  selected,
  onSelect,
  open,
  onToggle,
  children,
}: {
  label: string
  note?: string
  selected: boolean
  onSelect: () => void
  open?: boolean
  onToggle?: () => void
  children?: ReactNode
}) {
  return (
    <div style={OPTION_HEADER}>
      <button type="button" role="radio" aria-checked={selected} onClick={onSelect} style={METHOD_LABEL}>
        <span aria-hidden style={{ ...(selected ? RADIO_ON : RADIO_OFF), flex: 'none' }} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
          {label}
          {note ? <span style={OPTION_NOTE}>{note}</span> : null}
        </span>
      </button>
      {children}
      {onToggle ? (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? 'Collapse' : 'Expand'}
          style={CHEVRON}
        >
          {open ? <ChevronUp size={12} aria-hidden /> : <ChevronDown size={12} aria-hidden />}
        </button>
      ) : null}
    </div>
  )
}

type CardField = 'name' | 'number' | 'exp' | 'cvv'

/* TEST DATA ONLY — Visa's published test card, not a real one. */
const TEST_CARD: Record<CardField, string> = {
  name: 'Jordan Navarro',
  number: '4242 4242 4242 4242',
  exp: '12/30',
  cvv: '123',
}

/* A card field that fills itself with the test card's value when clicked. A
   button, not an input: there is nothing to type, and nothing is sent. */
function Field({
  label,
  value,
  onFill,
  placeholder,
}: {
  label: string
  value: string
  onFill: () => void
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={FIELD_LABEL}>{label}</span>
      <button
        type="button"
        onClick={onFill}
        aria-label={`${label}${value ? `: ${value}` : ', click to fill'}`}
        style={{
          ...FIELD,
          paddingRight: 10,
          color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        }}
      >
        {value || placeholder}
      </button>
    </div>
  )
}

/* An address field — a real input, controlled by the address it edits. */
function TextField({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  optional?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={FIELD_LABEL}>
        {label}
        {optional ? <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}> (optional)</span> : null}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...FIELD, paddingRight: 10, cursor: 'text' }}
      />
    </label>
  )
}

function SelectField({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <span style={FIELD_LABEL}>{label}</span>
      <span style={{ position: 'relative', display: 'block' }}>
        <select
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          style={{ ...FIELD, appearance: 'none', cursor: 'pointer' }}
        >
          {/* A blank form's state starts unpicked. */}
          {value === '' ? <option value="">Select</option> : null}
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <img src="/brand/checkout/select-chevron.svg" alt="" width={12} height={8} style={SELECT_CHEVRON} />
      </span>
    </label>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--color-fixed-light)' }

/* 64 tall: 8 above and below the 48 logo (2026-10-15, Eric's request; the
   design's 88 had 20), as the partner header; 32 in each side, a 1px #E6E6E6
   outline drawn inside (as Figma strokes). Three parts, 16 apart; the middle
   one takes the room and centres its words. */
const HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '8px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: 'inset 0 0 0 1px var(--color-e2e-partner-outline)',
}

const HEADER_LOGO: CSSProperties = { display: 'block', width: 115, height: 48, flex: 'none', objectFit: 'contain' }

const SECURE_CHECKOUT: CSSProperties = {
  flex: '1 0 0',
  minWidth: 1,
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  // 8 between the words and the lock (2026-10-15, Eric's request; the
  // design's 16).
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: 'normal',
  color: 'var(--color-neutral-950)',
  whiteSpace: 'nowrap',
}

/* Three 384 columns, 48 apart (2026-10-15, Eric's request; the design's
   24), centred as a block — 1248 wide, which no longer fits the design's 240
   gutters at 1680; 55 below the header. */
const MAIN: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 48,
  padding: '55px 24px 80px',
}

const COLUMN: CSSProperties = { width: 384, flex: 'none', display: 'flex', flexDirection: 'column' }

/* 4 below each column's title, before its panel (2026-10-15, Eric's
   request). */
const STEP_TITLE: CSSProperties = {
  margin: '0 0 4px',
  height: 45,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-e2e-serif)',
  fontWeight: 700,
  fontSize: 18,
  lineHeight: '25px',
  color: 'var(--color-neutral-950)',
}

const PAYMENT_TITLE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  // Flush with the panel's right edge (2026-10-15, Eric's request; 20 in
  // before).
  justifyContent: 'space-between',
}

const SECURE_TAG: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 11,
  lineHeight: '14px',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

const PANEL: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

const TEXT_16: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const METHOD_LABEL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 15,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const RADIO_OFF: CSSProperties = {
  width: 20,
  height: 20,
  boxSizing: 'border-box',
  borderRadius: 20,
  border: '1px solid var(--color-text-secondary)',
  background: 'var(--color-fixed-light)',
}

/* Filled, with a 4px white ring inside — the design's selected radio. */
const RADIO_ON: CSSProperties = {
  ...RADIO_OFF,
  border: '1px solid var(--color-text-primary)',
  background: 'var(--color-text-primary)',
  boxShadow: 'inset 0 0 0 4px var(--color-fixed-light)',
}

const CARD_MARKS: CSSProperties = { display: 'flex', gap: 4 }

const FIELD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

const FIELD: CSSProperties = {
  position: 'relative',
  display: 'block',
  width: '100%',
  // 30 on the right for a select's chevron; one line, the card number
  // included, at 14.
  padding: '0 30px 0 10px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '36px',
  color: 'var(--color-text-primary)',
  cursor: 'text',
  height: 38,
  boxSizing: 'border-box',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-field)',
}

/* ── Guest Checkout's closed Payment column (2026-10-22) ── */

const PAYMENT_LOCKED: CSSProperties = {
  /* Readable, not invisible: the guest has to be able to SEE what they are
     waiting for. 0.45 keeps the structure legible while reading
     unmistakably as off. */
  opacity: 0.45,
  /* Belt and braces with `inert`, which does the real work — this is what a
     browser too old for `inert` falls back on. */
  userSelect: 'none',
}

const PAYMENT_LOCKED_NOTE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  margin: '0 0 10px',
  padding: '10px 12px',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-e2e-form-locked)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

/* ── The email block (2026-10-22) ── */

/* Guest Checkout's "Save and continue" — the press that opens Payment. Dark
   rather than XCEL brick, as the design has it: it commits a section, it does
   not place the order, and brick is what the order button is.

   ⚠ THERE IS NO DISABLED VARIANT ANY MORE. It had one until the errors landed;
   a greyed-out Save that will not say what is wrong is the dead end this
   replaced. */
const SAVE_ON: CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  border: 'none',
  borderRadius: 4,
  background: 'var(--color-e2e-course-band)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 700,
  fontSize: 16,
  cursor: 'pointer',
}


const EMAIL_BLOCK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }

const EMAIL_FIELD_GROUP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
}

const EMAIL_NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

/* ⚠ REGULAR WEIGHT, matching the email error above it (2026-10-22). The two
   are the same kind of message and sat at different weights for one commit,
   which read as one being more serious than the other. The colour marks them;
   the weight does not need to. */
/* The demo fill's target: the panel's bottom-right corner. Transparent and
   borderless — it is not part of the design, and anything visible here would
   read as a control of the product. 44 square so a pointer can actually land
   on it. */
const DEMO_FILL: CSSProperties = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  width: 44,
  height: 44,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'default',
}

const SAVE_ERROR: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-status-error-text)',
}

/* ⚠ REGULAR WEIGHT, NOT BOLD (2026-10-22, the direct ask). The colour is
   already doing the work of marking this as an error; bolding it as well made
   the correction shout louder than the field label it sits under. */
const EMAIL_ERROR: CSSProperties = {
  ...EMAIL_NOTE,
  color: 'var(--color-status-error-text)',
}

const SELECT_CHEVRON: CSSProperties = { position: 'absolute', right: 13, top: 12.6, display: 'block' }

const CHECKBOX: CSSProperties = {
  width: 18,
  height: 18,
  margin: 0,
  accentColor: 'var(--color-text-primary)',
}

/* ── The Payment column (2026-10-15 rework) ── */

const GROUP: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 10 }

const GROUP_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

/* The wallet marks in one outlined row, centred. */
const EXPRESS: CSSProperties = {
  // 8 more top and bottom (2026-10-15, Eric's request): 44, then 60.
  height: 60,
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  borderRadius: 5,
  border: '1px solid var(--color-text-primary)',
}

const EXPRESS_MARK: CSSProperties = {
  width: 30,
  height: 24,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: '1px solid var(--color-e2e-card-outline)',
  color: 'var(--color-text-primary)',
}

const OR_RULE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--color-text-secondary)',
}

const OR_LINE: CSSProperties = { flex: '1 0 0', height: 1, background: 'var(--color-e2e-card-outline)' }

/* An option: outlined, its header 14 in, its form under a #DDD rule. */
const OPTION: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  background: 'var(--color-fixed-light)',
}

/* Open, the outline goes dark, as Express checkout's (2026-10-15, Eric's
   request). */
const OPTION_OPEN: CSSProperties = { ...OPTION, border: '1px solid var(--color-text-primary)' }

const OPTION_HEADER: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 14,
}

const OPTION_NOTE: CSSProperties = {
  fontWeight: 400,
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--color-text-secondary)',
}

const OPTION_BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: '14px 14px 16px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
}

const CHEVRON: CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  padding: 4,
  border: 'none',
  background: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const TWO_UP: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }

const THREE_UP: CSSProperties = { display: 'grid', gridTemplateColumns: '1.1fr 1fr 0.9fr', gap: 8 }

const CHECK_LABEL: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const BUTTON_ROW: CSSProperties = { display: 'flex', gap: 10 }

/* The dark action — Confirm billing address, Confirm Payment Method. */
const DARK_BUTTON: CSSProperties = {
  minHeight: 38,
  padding: '8px 16px',
  border: 'none',
  borderRadius: 5,
  /* ⚠ THE CLASS OWNS THIS — an inline fill would outrank the stylesheet
     and the hover would never fire. See `inviteFlow.css`. */

  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '19px',
  cursor: 'pointer',
}

/* Delete: the brick, outlined, its trash glyph first. */
const DELETE_BUTTON: CSSProperties = {
  ...DARK_BUTTON,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderWidth: 1,
  borderStyle: 'solid',
}

/* The Save card switch: a 36 × 20 track, the brick when on. */
const SWITCH_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

const SWITCH_OFF: CSSProperties = {
  position: 'relative',
  width: 36,
  height: 20,
  flex: 'none',
  borderRadius: 10,
  background: 'var(--color-e2e-card-outline)',
}

const SWITCH_ON: CSSProperties = { ...SWITCH_OFF, background: 'var(--color-xcel-brick)' }

const KNOB_OFF: CSSProperties = {
  position: 'absolute',
  top: 2,
  left: 2,
  width: 16,
  height: 16,
  borderRadius: 8,
  background: 'var(--color-fixed-light)',
}

const KNOB_ON: CSSProperties = { ...KNOB_OFF, left: 18 }

/* The order summary: the warm ground, outlined on three sides, its items on
   white under a #DDD rule. */
const SUMMARY: CSSProperties = {
  width: 384,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
}

const SUMMARY_BODY: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  paddingBottom: 30,
  borderRadius: 5,
  border: '1px solid var(--color-e2e-card-outline)',
  borderTop: 'none',
  background: 'var(--color-e2e-summary)',
}

const SUMMARY_ITEMS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: '20px 20px 26px',
  borderTop: '1px solid var(--color-e2e-card-outline)',
  borderRadius: '5px 5px 0 0',
  background: 'var(--color-fixed-light)',
}

const SUMMARY_PRODUCT: CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16 }

const DETAIL_ROW: CSSProperties = {
  margin: 0,
  padding: '10px 10px',
  background: 'var(--color-e2e-detail-row)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
  lineHeight: '24px',
  color: 'var(--color-text-primary)',
}

const PROMO: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, padding: '25px 20px 0' }

const PROMO_LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}

const PROMO_INPUT: CSSProperties = {
  flex: '1 1 0',
  minWidth: 0,
  height: 36,
  boxSizing: 'border-box',
  margin: 0,
  padding: '0 10px',
  border: '1px solid var(--color-e2e-card-outline)',
  borderRight: 'none',
  borderRadius: '5px 0 0 5px',
  background: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
}

const APPLY: CSSProperties = {
  width: 96,
  height: 38,
  border: 'none',
  borderRadius: '0 5px 5px 0',
  /* ⚠ THE CLASS OWNS THIS — an inline fill would outrank the stylesheet
     and the hover would never fire. See `inviteFlow.css`. */

  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  cursor: 'pointer',
}

const TOTALS: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px 0' }

const TOTAL_ROW: CSSProperties = {
  ...TEXT_16,
  display: 'flex',
  justifyContent: 'space-between',
}

/* Off until "Securely store…" is ticked — the design's 50%. */
const PLACE_ORDER: CSSProperties = {
  height: 60,
  border: 'none',
  borderRadius: 5,
  background: 'var(--color-text-primary)',
  opacity: 0.5,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '27px',
  color: 'var(--color-fixed-light)',
  cursor: 'not-allowed',
}

/* On: XCEL's red, the brick (2026-10-15, Eric's request). */
const PLACE_ORDER_ON: CSSProperties = {
  ...PLACE_ORDER,
  opacity: 1,
  cursor: 'pointer',
}

const TERMS: CSSProperties = {
  margin: 0,
  paddingRight: 48,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const TERMS_LINK: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  font: 'inherit',
  textDecoration: 'underline',
  textDecorationThickness: 1,
  cursor: 'pointer',
}
