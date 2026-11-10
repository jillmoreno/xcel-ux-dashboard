import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { acquireBodyScrollLock } from '@/utils/bodyScrollLock'
import { ArrowUpRightFromSquare, Check, FileText, TriangleExclamation, User, X } from '@/icons'
import type { AffidavitKind } from './AffidavitModal'

/* The original's titles, repeated rather than imported (Afsana, 2026-11-11):
   exporting them from `AffidavitModal.tsx` would trip fast refresh's
   components-only rule, and that file stays untouched. Keep the two in step. */
const AFFIDAVIT: Record<AffidavitKind, { title: string }> = {
  pre: { title: 'Pre-course Affidavit' },
  post: { title: 'Study-manual Notice Affidavit' },
}

/**
 * THE AFFIDAVIT MODAL IN THE HOUSE STYLE — 2026-11-11, Afsana, from Jill's
 * exploration of the same modal (`public/prototypes/xcel-affidavit-modal.html`)
 * and her brief (`prompts/affidavit-modal-afsana.md`).
 *
 * A sibling of `AffidavitModal.tsx`, which stays as it is: same public API
 * (`kind`, `onClose`, `initialAgreed`), so a call site swaps one for the other
 * with the Design bar's "Affidavit modal" control. The titles are the
 * original's, repeated below.
 *
 * Top to bottom: the title and the ✕ on one row; the notice naming who must
 * act; one line of instruction; the document and its attestation as one
 * group; first / middle / last name; the typed signature; one I Agree.
 *
 * ⚠ WHERE IT LEAVES THE BRIEF, ON PURPOSE (Afsana, 2026-11-11):
 *   - THE NOTICE IS TEAL FOR THE STUDENT, with a person; amber with a triangle
 *     for the proctor. The brief said amber for both; Jill's exploration moved
 *     the student's to teal the same evening, and this follows the exploration.
 *   - NO INLINE ERROR MESSAGES, no signature-must-match-the-name rule and no
 *     "Date exam was completed" field. Those are open on the state-forms
 *     modal (`feat/affidavits`) and are decided there, not here. I Agree
 *     stays off until the box is ticked and First name, Last name and
 *     Signature are filled.
 */
export function AffidavitModalHouseStyle({
  kind = 'pre',
  onClose,
  initialAgreed = false,
  actor = 'student',
}: {
  kind?: AffidavitKind
  onClose: () => void
  /** Opens with the attestation ticked — the handoff gallery's, as on the original. */
  initialAgreed?: boolean
  /** Who the notice tells to act. The Design bar's "Proctor actor" sets it. */
  actor?: 'student' | 'proctor'
}) {
  const doc = AFFIDAVIT[kind]
  const [agreed, setAgreed] = useState(initialAgreed)
  const [vals, setVals] = useState({ first: '', middle: '', last: '', sig: '' })
  const dialog = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLInputElement>(null)
  const set = (id: keyof typeof vals) => (e: { target: { value: string } }) =>
    setVals((v) => ({ ...v, [id]: e.target.value }))
  const ready = agreed && [vals.first, vals.last, vals.sig].every((v) => v.trim() !== '')

  // Home does not scroll behind it.
  useEffect(() => acquireBodyScrollLock(), [])
  useEffect(() => box.current?.focus(), [])

  /* Escape closes; Tab stays inside. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose()
      if (e.key !== 'Tab' || !dialog.current) return
      const f = [...dialog.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled])')]
      if (!f.length) return
      const first = f[0]!
      const last = f[f.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const proctor = actor === 'proctor'
  return createPortal(
    <div style={SCRIM}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="affidavit-hs-title" style={MODAL}>
        <div style={SCROLL}>
          <div style={TITLE_ROW}>
            <h2 id="affidavit-hs-title" style={TITLE}>
              {doc.title}
            </h2>
            <button type="button" className="affidavit-hs-close" onClick={onClose} aria-label="Close" style={CLOSE}>
              <X size={18} aria-hidden />
            </button>
          </div>

          <div role="note" style={proctor ? NOTICE_PROCTOR : NOTICE_STUDENT}>
            {proctor ? <TriangleExclamation size={16} aria-hidden style={NOTICE_ICON} /> : <User size={16} aria-hidden style={NOTICE_ICON} />}
            <span style={{ display: 'grid', gap: 2 }}>
              <span style={EYEBROW}>{proctor ? 'Proctor action required' : 'Student action required'}</span>
              <span style={NOTICE_BODY}>You must complete and sign this affidavit yourself. Someone else cannot sign it on your behalf.</span>
            </span>
          </div>

          <p style={INTRO}>Read the affidavit, confirm you&rsquo;ve read it, then sign below with your name.</p>

          <div style={DOC_GROUP}>
            {/* In the demo the link goes nowhere. */}
            <a href="#" className="affidavit-hs-doc" onClick={(e) => e.preventDefault()} style={DOC_ROW}>
              <FileText size={20} aria-hidden style={{ flex: '0 0 20px', color: 'var(--color-text-secondary)' }} />
              <span className="affidavit-hs-doc-name" style={DOC_NAME}>
                {doc.title}
              </span>
              <ArrowUpRightFromSquare size={16} aria-hidden style={{ flex: '0 0 16px', color: 'var(--color-primary-500)' }} />
            </a>
            <label style={ATTEST}>
              <input
                ref={box}
                type="checkbox"
                className="affidavit-hs-box"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                aria-required="true"
                style={HIDDEN_CHECKBOX}
              />
              <span aria-hidden style={agreed ? BOX_ON : BOX}>
                {agreed ? <Check size={12} /> : null}
              </span>
              <span>
                I confirm that I have read the affidavit and that all statements contained in it are true and accurate.
                <Req />
              </span>
            </label>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <div className="affidavit-hs-row3" style={ROW3}>
              <Field id="first" label="First name" required value={vals.first} onChange={set('first')} ac="given-name" />
              <Field id="middle" label="Middle name" value={vals.middle} onChange={set('middle')} ac="additional-name" />
              <Field id="last" label="Last name" required value={vals.last} onChange={set('last')} ac="family-name" />
            </div>
            <Field
              id="sig"
              label="Signature"
              required
              value={vals.sig}
              onChange={set('sig')}
              ac="off"
              placeholder="Type your full name"
              hint="Typing your name here counts as your signature."
            />
          </div>
        </div>

        <div style={FOOTER}>
          <button type="button" className="affidavit-hs-agree" disabled={!ready} onClick={onClose} style={ready ? AGREE_ON : AGREE}>
            I Agree
          </button>
        </div>
      </div>
      {/* Hover and focus states CSSProperties cannot say. */}
      <style>{HOVER_CSS}</style>
    </div>,
    document.body,
  )
}

function Req() {
  return (
    <span aria-hidden style={{ color: 'var(--color-xcel-brick)', fontWeight: 700 }}>
      {' '}*
    </span>
  )
}

function Field({
  id,
  label,
  required = false,
  value,
  onChange,
  ac,
  placeholder,
  hint,
}: {
  id: string
  label: string
  required?: boolean
  value: string
  onChange: (e: { target: { value: string } }) => void
  ac: string
  placeholder?: string
  hint?: ReactNode
}) {
  const inputId = `affidavit-hs-${id}`
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label htmlFor={inputId} style={LABEL}>
        {label}
        {required ? <Req /> : null}
      </label>
      <input
        id={inputId}
        className="affidavit-hs-input"
        value={value}
        onChange={onChange}
        autoComplete={ac}
        placeholder={placeholder}
        aria-required={required || undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        style={INPUT}
      />
      {hint ? (
        <p id={`${inputId}-hint`} style={HINT}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* Jill's three values (2026-11-10), tokens in the XCEL block since 2026-11-11. */
const CTA = 'var(--color-xcel-affidavit-cta)'
const STUDENT_FILL = 'var(--color-xcel-affidavit-student-fill)'
const STUDENT_INK = 'var(--color-xcel-affidavit-student-ink)'

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

/* 560 wide, white, the form outline, 16 corners; the body scrolls, the footer stays. */
const MODAL: CSSProperties = {
  width: 560,
  maxWidth: '100%',
  maxHeight: 'calc(100vh - 48px)',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: 16,
  border: '1px solid var(--color-e2e-form-outline)',
  background: 'var(--color-fixed-light)',
  filter: 'drop-shadow(0 4px 6px var(--color-e2e-form-shadow))',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
}

const SCROLL: CSSProperties = {
  overflow: 'auto',
  overscrollBehavior: 'contain',
  padding: '30px 30px 8px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const TITLE_ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 }

/* The heading serif in Charcoal — no coloured header bar, no subtitle. */
const TITLE: CSSProperties = {
  flex: 1,
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

/* A 36px round hit area, the 18px icon in Gray. It overhangs the padding by
   9px so the GLYPH, not the target, sits flush with I Agree's right edge. */
const CLOSE: CSSProperties = {
  flex: '0 0 36px',
  width: 36,
  height: 36,
  marginRight: -9,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'none',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const NOTICE: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 12px',
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: 'solid',
}
/* Teal for the student, so the two actors never read alike at a glance. */
const NOTICE_STUDENT: CSSProperties = {
  ...NOTICE,
  background: STUDENT_FILL,
  borderColor: 'var(--color-info-500)',
  color: STUDENT_INK,
}
const NOTICE_PROCTOR: CSSProperties = {
  ...NOTICE,
  background: 'var(--color-warning-100)',
  borderColor: 'var(--color-warning-300)',
  color: 'var(--color-warning-700)',
}
const NOTICE_ICON: CSSProperties = { flex: '0 0 16px', marginTop: 2 }

/* The one place uppercase is allowed, because it names who must act. */
const EYEBROW: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }
const NOTICE_BODY: CSSProperties = { fontSize: 13, fontWeight: 600, lineHeight: 1.4 }

const INTRO: CSSProperties = { margin: 0, fontSize: 14, color: 'var(--color-text-primary)' }

/* The document and its attestation: one group, one hairline between them. */
const DOC_GROUP: CSSProperties = {
  border: '1px solid var(--color-e2e-form-outline)',
  borderRadius: 8,
  overflow: 'hidden',
}
const DOC_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '12px 14px',
  background: 'var(--color-neutral-100)',
  textDecoration: 'none',
}
const DOC_NAME: CSSProperties = { flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--color-primary-500)' }

const ATTEST: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '12px 14px',
  borderTop: '1px solid var(--color-e2e-form-outline)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  cursor: 'pointer',
}

/* The real checkbox, kept for keyboard and screen readers; the square draws it. */
const HIDDEN_CHECKBOX: CSSProperties = {
  position: 'absolute',
  width: 18,
  height: 18,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
}
const BOX: CSSProperties = {
  flex: '0 0 18px',
  width: 18,
  height: 18,
  marginTop: 1,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  borderRadius: 4,
  border: '1.5px solid var(--color-primary-500)',
  background: 'var(--color-fixed-light)',
  color: 'var(--color-fixed-light)',
}
const BOX_ON: CSSProperties = { ...BOX, background: 'var(--color-primary-500)' }

/* Three up; one column on a narrow window (HOVER_CSS). */
const ROW3: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }

const LABEL: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }

const INPUT: CSSProperties = {
  height: 40,
  width: '100%',
  boxSizing: 'border-box',
  padding: '0 12px',
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
  background: 'var(--color-fixed-light)',
}

const HINT: CSSProperties = { margin: 0, fontSize: 12, color: 'var(--color-text-tertiary)' }

/* I Agree alone, no hairline above it (Jill, 2026-11-10: the button carries
   that edge). No status line, no Cancel. The 30px sides match the body, so
   the button lines up with the fields. */
const FOOTER: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '16px 30px 32px',
}

/* Off: Gray, not-allowed, no opacity trick. On: Jill's CTA, San Juan on hover. */
const AGREE: CSSProperties = {
  padding: '14px 24px',
  border: 'none',
  borderRadius: 8,
  background: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  lineHeight: 1,
  color: 'var(--color-fixed-light)',
  cursor: 'not-allowed',
}
const AGREE_ON: CSSProperties = { ...AGREE, background: CTA, cursor: 'pointer' }

const HOVER_CSS = `
.affidavit-hs-close:hover { background: var(--color-neutral-100); color: var(--color-text-primary); }
.affidavit-hs-close:focus-visible,
.affidavit-hs-agree:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
.affidavit-hs-doc:hover .affidavit-hs-doc-name { text-decoration: underline; }
.affidavit-hs-doc:focus-visible { outline: 2px solid var(--color-primary-500); outline-offset: -2px; }
.affidavit-hs-box:focus-visible + span { outline: 2px solid var(--color-primary-500); outline-offset: 2px; }
.affidavit-hs-input::placeholder { color: var(--color-text-tertiary); }
.affidavit-hs-input:focus { outline: none; border-color: var(--color-primary-500) !important; box-shadow: 0 0 0 2px var(--color-primary-500); }
.affidavit-hs-agree:not(:disabled):hover { background: var(--color-primary-500) !important; }
@media (max-width: 520px) { .affidavit-hs-row3 { grid-template-columns: 1fr !important; } }
`
