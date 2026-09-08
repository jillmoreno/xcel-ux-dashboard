import { useState } from 'react'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { Toast } from '@/components/ui/Toast'
import { Trash, X } from '@/icons'

/** Caps the statement so it stays short (~5 lines) wherever it's displayed —
 *  e.g. the account Profile page's Motivational Statement card. */
export const MAX_STATEMENT_LENGTH = 150

type FieldsProps = {
  /** The current saved statement (seeds the textarea). */
  value: string
  /** Commit a (trimmed) statement. */
  onSave: (statement: string) => void
  /** Cancel / Close — the parent decides what that means. */
  onClose: () => void
  /** Show the top-left Close button. Off for the inline dev-handoff preview,
   *  where there's no overlay to dismiss. */
  showClose?: boolean
}

/**
 * The panel's inner form — the Close/heading header, the "What's Motivating
 * You?" research blurb + prompt, the 150-char-capped textarea + counter, the
 * Delete link (when editing an existing statement), and the Save / Cancel
 * footer. Extracted from the Sheet wrapper so the SAME form renders both inside
 * `MotivationalStatementPanel` (the real product) and inline in the dev-handoff
 * preview — one source of truth, no drift.
 */
export function MotivationalStatementFields({ value, onSave, onClose, showClose = true }: FieldsProps) {
  const [text, setText] = useState(value)
  const empty = text.trim().length === 0
  // Editing an existing statement (opened with a value) → a Delete link is
  // offered, and Save stays enabled even when the field is cleared so the
  // deletion can be committed. Adding fresh → Save is disabled until non-empty.
  const hadInitialValue = value.trim().length > 0
  const saveDisabled = empty && !hadInitialValue

  return (
    <>
      {/* Header — Close (optional), title, divider. */}
      <header style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {showClose && (
          <button
            type="button"
            aria-label="Close Motivational Statement panel"
            onClick={onClose}
            className="cre-sheet-close"
            style={{
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
            }}
          >
            <X size={14} aria-hidden />
            Close
          </button>
        )}
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 22,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          Motivational Statement
        </h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* Body — scrollable. */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 16,
            lineHeight: '22px',
            color: 'var(--color-text-primary)',
          }}
        >
          What&rsquo;s Motivating You?
        </h3>
        <p style={blurbStyle}>
          Research shows that a simple statement can inspire, excite, and motivate people to increase
          their productivity to reach their goals.
        </p>
        <p style={blurbStyle}>
          Set yourself on a path to success. Take a minute to enter a statement that will motivate you in
          achieving your goal.
        </p>
        <textarea
          aria-label="Your motivational statement"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={MAX_STATEMENT_LENGTH}
          placeholder="Enter your statement…"
          style={{
            width: '100%',
            minHeight: 140,
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
          }}
        />
        {/* Character counter — the cap keeps the statement within ~5 lines in
            the left-rail "under-name" layout. */}
        <p
          style={{
            margin: '-8px 0 0',
            textAlign: 'right',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            lineHeight: '16px',
            color: 'var(--color-text-tertiary)',
          }}
        >
          {text.length}/{MAX_STATEMENT_LENGTH}
        </p>
        {/* Delete — only when editing an existing statement (and the field
            still holds text). Clears the field; Save then commits the empty
            (deleted) statement. */}
        {hadInitialValue && !empty && (
          <button
            type="button"
            onClick={() => setText('')}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 600,
              lineHeight: '20px',
              color: 'var(--color-secondary-700)',
            }}
          >
            <Trash size={14} aria-hidden />
            Delete Motivational Statement
          </button>
        )}
      </div>

      {/* Footer — neutral-light band, primary LEFT + secondary RIGHT. */}
      <footer
        style={{
          padding: '24px 32px',
          background: 'var(--color-neutral-light)',
          borderBottomLeftRadius: 16,
          display: 'flex',
          gap: 32,
        }}
      >
        <Button
          variant="primary"
          size="md"
          disabled={saveDisabled}
          onClick={() => onSave(text.trim())}
          style={{
            flex: 1,
            height: 52,
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            lineHeight: '28px',
            ...(saveDisabled && {
              background: 'var(--color-neutral-disabled)',
              borderColor: 'var(--color-neutral-disabled)',
              color: 'var(--color-neutral-dark)',
              cursor: 'not-allowed',
            }),
          }}
        >
          Save Statement
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={onClose}
          style={{
            flex: 1,
            height: 52,
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            lineHeight: '28px',
          }}
        >
          Cancel
        </Button>
      </footer>
    </>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  /** The current saved statement (seeds the textarea). */
  value: string
  /** Commit a new statement. */
  onSave: (statement: string) => void
}

/**
 * "Motivational Statement" slide-over (Sheet) — opened from the left-rail
 * "What motivates you?" statement. Wraps the shared `MotivationalStatementFields`
 * form in a right-anchored Sheet and owns the success Toast. When editing an
 * existing statement, a teal "Delete Motivational Statement" link clears the
 * field; Save stays enabled so the cleared (deleted) statement can be committed
 * (adding fresh keeps Save disabled until non-empty).
 *
 * The parent keeps this mounted and toggles `open` (so the success Toast — a
 * sibling of the Sheet — survives the panel closing on save); the `key` on the
 * fields re-seeds the textarea from `value` each time the panel opens.
 */
export function MotivationalStatementPanel({ open, onClose, value, onSave }: Props) {
  const [toastOpen, setToastOpen] = useState(false)
  // True when the last save committed an empty (deleted) statement — drives the
  // toast copy (cleared vs saved).
  const [savedEmpty, setSavedEmpty] = useState(false)

  return (
    <>
      <Sheet open={open} onClose={onClose} title="Motivational Statement">
        <MotivationalStatementFields
          // Re-seed the textarea from `value` each time the panel opens (the
          // panel stays mounted; remounting the fields on open reseeds them).
          key={open ? 'open' : 'closed'}
          value={value}
          onClose={onClose}
          onSave={(next) => {
            onSave(next)
            setSavedEmpty(next.length === 0)
            setToastOpen(true)
            onClose()
          }}
        />
      </Sheet>

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        tone="success"
        title={savedEmpty ? 'Statement cleared' : 'Statement saved'}
        duration={2500}
      >
        {savedEmpty
          ? 'Your motivational statement was removed.'
          : 'Your motivational statement is set.'}
      </Toast>
    </>
  )
}

const blurbStyle = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
} as const
