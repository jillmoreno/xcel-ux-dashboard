import { useState, type CSSProperties } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { X } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { supportConfigFor } from '@/data/support/supportFixtures'

/**
 * Customer Support slide-over (Elite "Customer Support" screen). A right-anchored
 * Sheet with the "× Close" affordance, a form — issue-type dropdown (required) +
 * a free-text description + a "Do you wish to be contacted?" Yes/No radio — and
 * a Send / Cancel footer. Send is disabled until an issue type is chosen. On
 * Send it fires a success Toast and closes (demo stub — nothing is submitted).
 *
 * The parent keeps this mounted (toggling `open`) so the success Toast — a
 * portal sibling of the Sheet — survives the panel closing on Send. The inner
 * form is remounted via `key` each open (mirrors MotivationalStatementPanel) so
 * its fields reset without a set-state-in-effect.
 */
export function CustomerSupportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Customer Support">
        <CustomerSupportForm
          key={open ? 'open' : 'closed'}
          onClose={onClose}
          onSent={() => {
            setToastOpen(true)
            onClose()
          }}
        />
      </Sheet>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        tone="success"
        title="Request sent"
        duration={3000}
      >
        Our support team will follow up with you soon.
      </Toast>
    </>
  )
}

/** The inner form — its own field state, remounted (reset) via `key` on open. */
function CustomerSupportForm({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { brand } = useAccount()
  const { issueTypes } = supportConfigFor(brand)
  const [issue, setIssue] = useState('')
  const [detail, setDetail] = useState('')
  const [contact, setContact] = useState<'yes' | 'no'>('yes')

  const canSend = issue !== ''
  const options = [{ value: '', label: 'Select' }, ...issueTypes.map((t) => ({ value: t, label: t }))]

  const handleSend = () => {
    console.info('support:customer-support:send', { brand, issue, detail, contact })
    onSent()
  }

  return (
    <>
      {/* Header — Close + blue title + divider. */}
      <header style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button
          type="button"
          aria-label="Close Customer Support panel"
          onClick={onClose}
          className="cre-sheet-close"
          style={closeBtnStyle}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2 style={titleStyle}>Customer Support</h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* Body — scrollable form. */}
      <div style={bodyStyle}>
        <h3 style={sectionHeadingStyle}>Customer Support</h3>

        <div style={fieldStyle}>
          <label htmlFor="support-issue" style={labelStyle}>
            What kind of issue are you experiencing? <span style={{ color: 'var(--color-error-500)' }}>*</span>
          </label>
          <Select
            id="support-issue"
            label="What kind of issue are you experiencing?"
            options={options}
            value={issue}
            onChange={(e) => setIssue(e.target.value)}
            style={{ width: '100%', height: 48 }}
          />
        </div>

        <textarea
          aria-label="Please describe your issue in detail"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={8}
          placeholder="Please, describe your issue in detail."
          style={textareaStyle}
        />

        <fieldset style={fieldsetStyle}>
          <legend style={labelStyle}>Do you wish to be contacted by Customer Service?</legend>
          <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
            <RadioOption
              name="support-contact"
              label="Yes"
              checked={contact === 'yes'}
              onChange={() => setContact('yes')}
            />
            <RadioOption
              name="support-contact"
              label="No"
              checked={contact === 'no'}
              onChange={() => setContact('no')}
            />
          </div>
        </fieldset>
      </div>

      {/* Footer — Send (disabled until an issue type is chosen) + Cancel. */}
      <footer style={footerStyle}>
        <Button
          variant="primary"
          size="md"
          disabled={!canSend}
          onClick={handleSend}
          style={{ minWidth: 120, height: 44 }}
        >
          Send
        </Button>
        <Button variant="secondary" size="md" onClick={onClose} style={{ minWidth: 120, height: 44 }}>
          Cancel
        </Button>
      </footer>
    </>
  )
}

/** A single labeled radio button (native input for keyboard + a11y). */
function RadioOption({
  name,
  label,
  checked,
  onChange,
}: {
  name: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{ width: 20, height: 20, accentColor: 'var(--color-action)', cursor: 'pointer' }}
      />
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--color-text-primary)' }}>
        {label}
      </span>
    </label>
  )
}

/* ─── styles ─────────────────────────────────────────────────────────── */

const closeBtnStyle: CSSProperties = {
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
  fontWeight: 700,
  fontSize: 28,
  lineHeight: '34px',
  color: 'var(--color-accent-text)',
}

const bodyStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '20px 20px 24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

const sectionHeadingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const fieldStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  padding: 0,
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: 200,
  resize: 'vertical',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const fieldsetStyle: CSSProperties = {
  border: 'none',
  padding: 0,
  margin: '4px 0 0',
}

const footerStyle: CSSProperties = {
  padding: '20px',
  borderTop: '1px solid var(--color-border-subtle)',
  display: 'flex',
  gap: 16,
}
