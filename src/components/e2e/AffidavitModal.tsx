import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CircleXmarkThin, Square, SquareCheck } from '@/icons'

/**
 * THE AFFIDAVIT MODAL — Figma "Atlas UX Design" 428:3054 (2026-10-15, Eric's
 * request). The End-to-End Demo opens it over Home when the learner arrives
 * from Confirmation & Password; the page darkens behind it.
 *
 * Ticking "I have read and understand this Affidavit" turns Continue to course
 * on (XCEL's brick, as the demo's other primary buttons); Continue closes the
 * modal to reveal Home. Cancel, the ✕ and Escape close it too. The grey panel
 * is the design's placeholder for the affidavit text.
 *
 * Portalled to <body>, fixed over the whole window, focus moved into it.
 *
 * ⚠ TWO AFFIDAVITS, AND THEY ARE NOT THE SAME DOCUMENT (2026-10-16). The
 * learner signs one before the coursework and one after it, and the Study
 * Journey has always listed both — "Pre-course Affidavit" and
 * "Study-manual Notice Affidavit" (`whiteJourneyTitles`). The modal
 * previously knew about neither and was headed "Affidavit"; `kind` names
 * which one is open, using the journey's own wording so the modal and the
 * row that leads to it cannot say different things.
 */
export type AffidavitKind = 'pre' | 'post'

/** The journey's own names, so the modal matches the row it belongs to. */
const AFFIDAVIT: Record<AffidavitKind, { title: string; when: string }> = {
  pre: { title: 'Pre-course Affidavit', when: 'Before you begin the coursework' },
  post: { title: 'Study-manual Notice Affidavit', when: 'After the coursework, before your final exam' },
}

export function AffidavitModal({ kind = 'pre', onClose }: { kind?: AffidavitKind; onClose: () => void }) {
  const doc = AFFIDAVIT[kind]
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div style={SCRIM}>
      <div role="dialog" aria-modal="true" aria-labelledby="affidavit-title" style={MODAL}>
        <button type="button" onClick={onClose} aria-label="Close" style={CLOSE}>
          <CircleXmarkThin size={23} aria-hidden />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 id="affidavit-title" style={TITLE}>
            {doc.title}
          </h2>
          {/* The course it belongs to, then WHEN in the course it is signed —
              the one thing that tells the two apart at a glance. */}
          <p style={TEXT}>Florida Life &amp; Health Pre-licensing</p>
          <p style={{ ...TEXT, opacity: 0.72 }}>{doc.when}</p>
        </div>

        {/* The affidavit's text goes here — the design's placeholder panel. */}
        <div aria-hidden style={DOCUMENT} />

        <label style={AGREE}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            // Focus lands here first: the one thing to do.
            autoFocus
            style={HIDDEN_CHECKBOX}
          />
          <span aria-hidden style={{ display: 'inline-flex', color: 'var(--color-e2e-return)' }}>
            {agreed ? <SquareCheck size={16} /> : <Square size={16} />}
          </span>
          I have read and understand this Affidavit
        </label>

        <div style={ACTIONS}>
          <button type="button" onClick={onClose} style={CANCEL}>
            Cancel
          </button>
          <button type="button" disabled={!agreed} onClick={onClose} style={agreed ? CONTINUE_ON : CONTINUE}>
            Continue to course
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* The page darkened behind, the modal centred on it. */
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

/* 440 wide, white, a #E5E7EB outline, 16 corners, 40 in, a soft shadow. */
const MODAL: CSSProperties = {
  position: 'relative',
  width: 440,
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 40,
  borderRadius: 16,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 6px var(--color-e2e-form-shadow))',
}

/* The ✕, 16 down, its right edge 21 in (the design's 401 of 440). */
const CLOSE: CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 21,
  display: 'flex',
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--color-e2e-return)',
  cursor: 'pointer',
}

/* Playfair Bold 24 / 38 — the heading serif, which is Playfair on this page. */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  fontSize: 24,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '18px',
  color: 'var(--color-neutral-950)',
}

const DOCUMENT: CSSProperties = {
  height: 224,
  borderRadius: 8,
  background: 'var(--color-e2e-form-locked)',
}

const AGREE: CSSProperties = {
  ...TEXT,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  cursor: 'pointer',
}

/* The real checkbox, kept for keyboard and screen readers; the FA square
   draws it. */
const HIDDEN_CHECKBOX: CSSProperties = {
  position: 'absolute',
  width: 16,
  height: 16,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
}

const ACTIONS: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 20,
  paddingTop: 8,
}

const CANCEL: CSSProperties = {
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  lineHeight: '11px',
  color: 'var(--color-primary-500)',
  cursor: 'pointer',
}

/* Off until the box is ticked — the design's #666. */
const CONTINUE: CSSProperties = {
  padding: '14px 24px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: 'normal',
  color: 'var(--color-fixed-light)',
  cursor: 'not-allowed',
}

const CONTINUE_ON: CSSProperties = { ...CONTINUE, background: 'var(--color-xcel-brick)', cursor: 'pointer' }
