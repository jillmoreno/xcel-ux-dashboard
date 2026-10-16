import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, CreditCard, LockSolid, Plus, Trash } from '@/icons'
import { E2E_ORIGINAL_PRICE, E2E_PARTNER_PRICE, useEndToEndCourseTitle, useEndToEndDemoParams } from './endToEndDemo'

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
export function InvitedCheckoutPage() {
  const navigate = useNavigate()
  /* THE ADDRESS IS CARRIED FORWARD, not rebuilt (2026-10-16). Invited Product
     Detail already hands its whole query string to this page; this hop used to
     write `demo` and `version` from scratch and drop everything else, which
     is where `?journey=full` died — the End-to-End row walked all the way to
     the spinner and then behaved like the invite row, with nothing to see. */
  const [params] = useSearchParams()
  // THE STUDENT'S ADDRESS, editable in Edit Student Information (2026-10-15,
  // Eric's request), and whether it is also the billing address — "Use as
  // default billing address" there. While it is, the Payment column's billing
  // address follows it; editing the billing form takes the billing address
  // off it.
  const [student, setStudent] = useState<PostalAddress>(STUDENT_ADDRESS)
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
  const [filled, setFilled] = useState<Partial<Record<CardField, boolean>>>({})
  const fill = (f: CardField) => setFilled((prev) => ({ ...prev, [f]: true }))
  const [saveCard, setSaveCard] = useState(true)
  const [nickname, setNickname] = useState('')
  const [cardConfirmed, setCardConfirmed] = useState(false)
  // Place your order turns on at ANY click in the Payment column, as well as
  // on Confirm Payment Method (2026-10-15, Eric's request) — a demo shortcut.
  const [orderReady, setOrderReady] = useState(false)
  const canOrder = orderReady || cardConfirmed
  useEndToEndDemoParams()
  const courseTitle = useEndToEndCourseTitle()

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

  return (
    <div style={PAGE}>
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
          <div style={{ ...PANEL, padding: 20, gap: 20 }}>
            <Address address={student} />
            {/* EDIT STUDENT INFORMATION — the billing module's form, in place of
                the Edit button (2026-10-15, Eric's request). Its "Use as
                default billing address" makes this address the billing one. */}
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
          </div>
        </section>

        {/* 2. PAYMENT */}
        <section aria-labelledby="checkout-payment" style={COLUMN} onClickCapture={() => setOrderReady(true)}>
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
          <div style={{ ...PANEL, gap: 20, padding: 20 }}>
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
                {ORIGINAL_PRICE}
                <img src="/brand/e2e-price-strike.svg" alt="" aria-hidden style={PRICE_STRIKE} />
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Florida Life and Health Pre-licensing',
                'Recorded Livestream Exam Review - Life and Health English',
                'Flashcards - Life, Health, and Accident Insurance',
              ].map((d) => (
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
              <button type="button" style={APPLY}>
                Apply
              </button>
            </div>
          </div>

          <div style={TOTALS}>
            {/* The partner's price, and the totals at it (2026-10-15, Eric). */}
            <p style={TOTAL_ROW}>
              <span>Partner Discount Price</span>
              <span>{PARTNER_PRICE}</span>
            </p>
            <p style={TOTAL_ROW}>
              <span>Subtotal</span>
              <span>{PARTNER_PRICE}</span>
            </p>
            <p style={{ ...TOTAL_ROW, fontWeight: 800, lineHeight: '22px' }}>
              <span>Grand Total</span>
              <span>{PARTNER_PRICE}</span>
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 30, padding: '25px 20px 0' }}>
            {/* On after any click in the Payment column (or Confirm Payment
                Method); it opens Confirmation & Password (2026-10-15, Eric's
                requests). */}
            <button
              type="button"
              disabled={!canOrder}
              style={canOrder ? PLACE_ORDER_ON : PLACE_ORDER}
              onClick={() => navigate(`/end-to-end-demo/confirmation?${params.toString()}`)}
            >
              Place your order
            </button>
            <p style={TERMS}>
              By completing your purchase, you agree to our{' '}
              <button type="button" style={TERMS_LINK}>
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
      555 010 0199
    </p>
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
}) {
  const set = (k: keyof PostalAddress) => (v: string) => onChange({ ...value, [k]: v })
  return (
    <div style={OPTION_BODY}>
      <div style={TWO_UP}>
        <TextField label="First Name" value={value.first} onChange={set('first')} />
        <TextField label="Last Name" value={value.last} onChange={set('last')} />
      </div>
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
      <div style={BUTTON_ROW}>
        <button type="button" style={DELETE_BUTTON}>
          <Trash size={14} aria-hidden />
          Delete
        </button>
        <button type="button" style={{ ...DARK_BUTTON, flex: '1 0 0' }} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
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
  background: 'var(--color-text-primary)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '19px',
  color: 'var(--color-fixed-light)',
  cursor: 'pointer',
}

/* Delete: the brick, outlined, its trash glyph first. */
const DELETE_BUTTON: CSSProperties = {
  ...DARK_BUTTON,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  border: '1px solid var(--color-xcel-brick)',
  background: 'var(--color-fixed-light)',
  color: 'var(--color-xcel-brick)',
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
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 500,
  fontSize: 14,
  lineHeight: '18px',
  color: 'var(--color-fixed-light)',
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
  background: 'var(--color-xcel-brick)',
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
  color: 'var(--color-e2e-link)',
  textDecoration: 'underline',
  textDecorationThickness: 1,
  cursor: 'pointer',
}
