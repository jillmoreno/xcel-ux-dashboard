import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'

/**
 * THE SIGNED-IN OCD CART'S TWO DIALOGS — Invite Flow V3, 2026-11-02, Afsana.
 * Both follow the Partner Code question at Checkout:
 *
 *   Yes → PartnerCodeEntryDialog, whatever the cart holds: the code is
 *         collected. A code leads to the partner's own site (the header's
 *         "Go to Partner Site"), which this prototype does not have, so the
 *         walk ends on this dialog.
 *   No, mixed cart → UnsupportedItemDialog: the item outside the targeted SKUs
 *         will be dropped. Proceeding signs them out and goes on as the
 *         targeted cart does.
 *
 * 460 wide, as every V3 dialog, and with no dark title band — the Partner Code
 * question they open from had its band taken off at Afsana's request.
 */

function useEscape(onCancel: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
}

export function PartnerCodeEntryDialog({ onCancel }: { onCancel: () => void }) {
  const layer = useV3DialogLayer()
  const [code, setCode] = useState('')
  useEscape(onCancel)
  const ready = code.trim() !== ''
  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }} onClick={onCancel}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="v3-partner-entry-title"
        style={{ ...CARD, ...layer.card }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => e.preventDefault()}
      >
        <div style={HEAD}>
          <h2 id="v3-partner-entry-title" style={TITLE}>
            Enter your Partner Code
          </h2>
          <p style={BODY}>Access your company’s dedicated Partner Site for exclusive pricing, products and to log in.</p>
        </div>
        <label style={FIELD}>
          <span style={LABEL}>Partner code</span>
          <input autoFocus value={code} onChange={(e) => setCode(e.target.value)} style={INPUT} />
        </label>
        <div style={ACTIONS}>
          {/* ⚠ GOES NOWHERE — partner sites are not in this prototype, so this
              is the end of the Yes walk. */}
          <button
            type="submit"
            disabled={!ready}
            aria-disabled={!ready}
            title="The end of this flow — partner sites are not in this prototype"
            style={ready ? PRIMARY : { ...PRIMARY, opacity: 0.5, cursor: 'not-allowed' }}
          >
            Go to Partner Site
          </button>
          <button type="button" onClick={onCancel} style={CANCEL}>
            Cancel
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export function UnsupportedItemDialog({
  items,
  onProceed,
  onCancel,
}: {
  items: string[]
  onProceed: () => void
  onCancel: () => void
}) {
  const layer = useV3DialogLayer()
  useEscape(onCancel)
  const count = items.length === 1 ? '1 item in your cart is' : `${items.length} items in your cart are`
  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="v3-unsupported-title"
        style={{ ...CARD, ...layer.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={HEAD}>
          <h2 id="v3-unsupported-title" style={TITLE}>
            {count} not supported
          </h2>
          <p style={BODY}>
            To support an ongoing platform update, the following will be removed from your cart if you continue to
            checkout:
          </p>
          <ul style={LIST}>
            {items.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
        <div style={ACTIONS}>
          <button type="button" onClick={onProceed} style={PRIMARY}>
            Proceed to checkout
          </button>
          <button type="button" onClick={onCancel} style={CANCEL}>
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Styles — the Change your course dialog's, without its band ──────────── */

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-e2e-scrim)',
}

const CARD: CSSProperties = {
  boxSizing: 'border-box',
  width: 460,
  maxWidth: 'calc(100vw - 48px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: '32px 36px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
  borderRadius: 8,
}

const HEAD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const LIST: CSSProperties = { ...BODY, margin: 0, paddingLeft: 20, fontWeight: 800 }

const FIELD: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 }

const LABEL: CSSProperties = {
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 13,
  color: 'var(--color-text-primary)',
}

const INPUT: CSSProperties = {
  boxSizing: 'border-box',
  height: 44,
  padding: '0 12px',
  border: '1px solid var(--color-e2e-form-outline)',
  borderRadius: 4,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 15,
}

const ACTIONS: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 }

const PRIMARY: CSSProperties = {
  padding: '12px 26px',
  borderRadius: 6,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: '0.02em',
  cursor: 'pointer',
}

const CANCEL: CSSProperties = {
  alignSelf: 'center',
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 14,
  color: '#00539a',
  cursor: 'pointer',
}
