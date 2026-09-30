import { useId, useState, type CSSProperties } from 'react'
import { X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { Toast } from '@/components/ui/Toast'
import { Checkbox } from '@/components/ui/Checkbox'
import type { AccountProfile } from '@/data/accountProfileFixtures'
import { Field, PanelFooter, TextInput } from './profileFormBits'
import { panelBodyStyle } from './profileFormStyles'

/**
 * The Personal Information pencil — one screen, no chooser, because this card
 * edits every field it displays and there is nothing to branch between.
 *
 * Header chrome matches `ProfileEditStubPanel` (Close button, `<h2>`, divider)
 * so the two cards' pencils open into the same-looking sheet; only the body
 * differs.
 *
 * ⚠ THE FORM IS SEEDED FROM `data` ON EVERY OPEN, not on mount. The panel stays
 * mounted so its Toast survives the sheet closing (see `AccountDetailsEditPanel`
 * for the same arrangement), which means a plain `useState(data.name)` initialiser
 * would capture the FIRST value forever: save, reopen, and you would be editing
 * the original again while the card shows the new one. The effect below re-seeds
 * on each open.
 */

type Personal = AccountProfile['personal']

type Props = {
  open: boolean
  onClose: () => void
  data: Personal
  /** Lifts the saved values up to `PersonalInformationCard`'s local state. */
  onSaved: (next: Personal) => void
}

export function PersonalInformationEditPanel({ open, onClose, data, onSaved }: Props) {
  const id = useId()
  const [form, setForm] = useState<Personal>(data)
  const [sameAsBilling, setSameAsBilling] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  /* Re-seeded DURING RENDER on the open edge — React's "adjusting state when a
     prop changes" pattern, not an effect. An effect would paint the previous
     session's half-edited form for a frame before replacing it, and trips
     `react-hooks/set-state-in-effect`. */
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setForm(data)
      /* Re-derive rather than reset to false: reopening on a profile whose two
         addresses already match should show the box ticked, or the learner has
         to notice the duplication themselves. */
      setSameAsBilling(
        data.billing.line1 === data.shipping.line1 &&
          data.billing.cityState === data.shipping.cityState &&
          data.billing.postal === data.shipping.postal,
      )
    }
  }

  const setField = <K extends keyof Personal>(key: K, value: Personal[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setAddress = (which: 'billing' | 'shipping', key: keyof Personal['billing'], value: string) =>
    setForm((f) => ({ ...f, [which]: { ...f[which], [key]: value } }))

  /* Deliberately shallow: name, DOB, phone and the two billing fields a parcel
     cannot arrive without. No format checks on the address — this is a
     prototype, and a postal-code regex here would reject half the world. */
  const canSave =
    form.name.trim().length > 0 &&
    form.dateOfBirth.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.billing.line1.trim().length > 0 &&
    form.billing.postal.trim().length > 0

  const save = () => {
    const next: Personal = sameAsBilling ? { ...form, shipping: { ...form.billing } } : form
    console.info('account:update-personal-information')
    onSaved(next)
    onClose()
    setToastOpen(true)
  }

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Edit Personal Information">
        {/* `display: contents` so the wrapper carries the token override
            without becoming a flex item of the Sheet's panel — the header,
            divider, body and footer stay direct children as before. The class
            has to live in here rather than on the Profile page, because a Sheet
            portals to document.body and inherits nothing from that tree. */}
        <div className="cre-account-actions" style={{ display: 'contents' }}>
        <header style={headerStyle}>
          <button
            type="button"
            aria-label="Close Edit Personal Information panel"
            onClick={onClose}
            className="cre-sheet-close"
            style={closeButtonStyle}
          >
            <X size={14} aria-hidden />
            Close
          </button>
          <h2 style={titleStyle}>Edit Personal Information</h2>
        </header>
        <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

        <div style={panelBodyStyle}>
          <Field label="Name" htmlFor={`${id}-name`}>
            <TextInput
              id={`${id}-name`}
              value={form.name}
              onChange={(v) => setField('name', v)}
              placeholder="Full name"
            />
          </Field>

          <Field label="Date of Birth" htmlFor={`${id}-dob`}>
            <TextInput
              id={`${id}-dob`}
              type="date"
              value={toDateInputValue(form.dateOfBirth)}
              onChange={(v) => setField('dateOfBirth', fromDateInputValue(v))}
            />
          </Field>

          <Field label="Phone Number" htmlFor={`${id}-phone`}>
            <TextInput
              id={`${id}-phone`}
              type="tel"
              value={form.phone}
              onChange={(v) => setField('phone', v)}
              placeholder="Phone number"
            />
          </Field>

          <fieldset style={groupStyle}>
            <legend style={legendStyle}>Billing Address</legend>
            <div style={groupFieldsStyle}>
              <Field label="Street Address" htmlFor={`${id}-b-line1`}>
                <TextInput
                  id={`${id}-b-line1`}
                  value={form.billing.line1}
                  onChange={(v) => setAddress('billing', 'line1', v)}
                  placeholder="Street address"
                />
              </Field>
              <Field label="City, State" htmlFor={`${id}-b-city`}>
                <TextInput
                  id={`${id}-b-city`}
                  value={form.billing.cityState}
                  onChange={(v) => setAddress('billing', 'cityState', v)}
                  placeholder="City, State"
                />
              </Field>
              <Field label="Postal Code" htmlFor={`${id}-b-postal`}>
                <TextInput
                  id={`${id}-b-postal`}
                  value={form.billing.postal}
                  onChange={(v) => setAddress('billing', 'postal', v)}
                  placeholder="Postal code"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset style={groupStyle}>
            <legend style={legendStyle}>Shipping Address</legend>
            <Checkbox
              checked={sameAsBilling}
              /* `Checkbox` hands back the DOM event, not a boolean. */
              onChange={(e) => setSameAsBilling(e.target.checked)}
              label="Same as billing address"
            />
            {/* Hidden, not disabled: a disabled copy of three fields the learner
                is not using is three more things to read past. The values are
                taken from billing at save time, so nothing typed here is lost —
                unticking reveals whatever was in the fields before. */}
            {!sameAsBilling && (
              <div style={groupFieldsStyle}>
                <Field label="Street Address" htmlFor={`${id}-s-line1`}>
                  <TextInput
                    id={`${id}-s-line1`}
                    value={form.shipping.line1}
                    onChange={(v) => setAddress('shipping', 'line1', v)}
                    placeholder="Street address"
                  />
                </Field>
                <Field label="City, State" htmlFor={`${id}-s-city`}>
                  <TextInput
                    id={`${id}-s-city`}
                    value={form.shipping.cityState}
                    onChange={(v) => setAddress('shipping', 'cityState', v)}
                    placeholder="City, State"
                  />
                </Field>
                <Field label="Postal Code" htmlFor={`${id}-s-postal`}>
                  <TextInput
                    id={`${id}-s-postal`}
                    value={form.shipping.postal}
                    onChange={(v) => setAddress('shipping', 'postal', v)}
                    placeholder="Postal code"
                  />
                </Field>
              </div>
            )}
          </fieldset>
        </div>

        <PanelFooter saveDisabled={!canSave} onSave={save} onCancel={onClose} />
        </div>
      </Sheet>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        tone="success"
        title="Personal information updated"
        duration={3500}
      >
        Your personal details have been saved.
      </Toast>
    </>
  )
}

/* ─── date plumbing ────────────────────────────────────────────────────── */

/**
 * The card displays `5/16/1980`; `<input type="date">` speaks only `1980-05-16`.
 * These two convert between them and pass anything they don't recognise
 * straight through, so a fixture in another shape degrades to an unfilled date
 * picker rather than throwing.
 */
function toDateInputValue(display: string): string {
  const m = display.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return /^\d{4}-\d{2}-\d{2}$/.test(display.trim()) ? display.trim() : ''
  const [, month, day, year] = m
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function fromDateInputValue(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return value
  const [, year, month, day] = m
  /* Back to the card's own unpadded M/D/YYYY, so a saved date looks like the
     one that was there rather than gaining leading zeros. */
  return `${Number(month)}/${Number(day)}/${year}`
}

/* ─── styles (tokens only) ─────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  padding: '20px 24px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const closeButtonStyle: CSSProperties = {
  alignSelf: 'flex-start',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  cursor: 'pointer',
  padding: 0,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const groupStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  border: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const legendStyle: CSSProperties = {
  padding: 0,
  marginBottom: 4,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const groupFieldsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}
