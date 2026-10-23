import { useEffect, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

/**
 * "DO YOU HAVE A PARTNER CODE?" — 2026-10-22, and the question the guest
 * journey has to ask before it can price anything.
 *
 * ⚠ ONE QUESTION, TWO PRESENTATIONS. Jillienne: "i think we should explore a
 * variant of this simply showing over the checkout screen in a simple modal
 * instead of taking user to another page right away. make it a toggle to
 * compare both versions?" So the BODY lives here once and the two arms differ
 * only in what is drawn around it — a page of its own, or a modal over the
 * checkout. Writing it twice is how the two arms quietly stop being the same
 * question, which would make the comparison meaningless.
 *
 * ⚠ THE ANSWER IS WORTH MORE THAN THE DIALOG. Yes is how a walk-in becomes
 * partner-ATTRIBUTED — the distinction `partnerAttributed` carries through the
 * whole flow, and the reason the checkout's price moves. A version of this that
 * only opened and closed would be comparing two ways of showing nothing.
 */

export type PartnerCodeAnswer = 'yes' | 'no'

function Body({ onAnswer }: { onAnswer: (answer: PartnerCodeAnswer) => void }) {
  return (
    <div style={BODY}>
      {/* ⚠ THE ID IS LOAD-BEARING: both wrappers name this heading with
          `aria-labelledby`, so without it the page's section and the modal's
          dialog are announced with no name at all. */}
      <h1 id="partner-code-question" style={QUESTION}>
        Do you have a Partner Code?*
      </h1>
      <div style={BUTTONS}>
        <button type="button" className="cre-e2e-cta" style={ANSWER} onClick={() => onAnswer('yes')}>
          YES
        </button>
        <button type="button" className="cre-e2e-cta" style={ANSWER} onClick={() => onAnswer('no')}>
          NO
        </button>
      </div>
      <span aria-hidden style={RULE} />
      {/* The asterisk's note, which is what makes the question answerable: most
          people do not know whether they have one until they are told what it
          is. */}
      <p style={NOTE}>
        *Partner Code, previously known as a Discount Code, allows access to your company’s dedicated
        Partner Site for exclusive pricing, products and to log in.
      </p>
      <p style={HELP}>
        Need help? <span style={HELP_LINK}>Contact Us</span>
      </p>
    </div>
  )
}

/** The question as a page of its own — the arm that navigates. */
export function PartnerCodeAskPage({ onAnswer }: { onAnswer: (a: PartnerCodeAnswer) => void }) {
  return (
    <section aria-labelledby="partner-code-question" style={PAGE_WRAP}>
      <Body onAnswer={onAnswer} />
    </section>
  )
}

/**
 * The question as a modal over the checkout — the arm being explored.
 *
 * ⚠ NO DISMISS. Unlike every other modal in this flow there is no ✕ and no
 * Escape: the checkout behind it cannot be priced until this is answered, and
 * both answers are one click away, so there is nothing a dismissal could mean.
 * That is also the honest difference between the two arms — a page cannot be
 * dismissed either, and a modal that could would be an easier question than the
 * page version rather than the same one in a different place.
 */
export function PartnerCodeAskModal({ onAnswer }: { onAnswer: (a: PartnerCodeAnswer) => void }) {
  /* Focus the dialog on open so a keyboard user is inside it, since there is no
     dismiss to tab to. */
  useEffect(() => {
    const el = document.getElementById('partner-code-modal')
    el?.focus()
  }, [])

  return createPortal(
    <div style={SCRIM}>
      <div
        id="partner-code-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="partner-code-question"
        tabIndex={-1}
        style={MODAL}
      >
        <Body onAnswer={onAnswer} />
      </div>
    </div>,
    document.body,
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BODY: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
  width: '100%',
  maxWidth: 520,
  textAlign: 'center',
}

const QUESTION: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const BUTTONS: CSSProperties = { display: 'flex', gap: 12 }

const ANSWER: CSSProperties = {
  minWidth: 72,
  padding: '11px 22px',
  borderRadius: 3,
  border: 'none',
  background: 'var(--color-xcel-brick-600)',
  color: 'var(--color-fixed-light)',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 15,
  letterSpacing: '0.02em',
  cursor: 'pointer',
}

const RULE: CSSProperties = {
  display: 'block',
  width: '72%',
  height: 1,
  margin: '6px 0',
  background: 'var(--color-e2e-form-outline)',
}

const NOTE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}

const HELP: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const HELP_LINK: CSSProperties = {
  color: 'var(--color-xcel-brick-600)',
  fontWeight: 800,
}

const PAGE_WRAP: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '72px 48px 96px',
  background: 'var(--color-fixed-light)',
}

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

const MODAL: CSSProperties = {
  boxSizing: 'border-box',
  width: 560,
  maxWidth: '100%',
  display: 'flex',
  justifyContent: 'center',
  padding: '40px 32px',
  background: 'var(--color-fixed-light)',
  boxShadow: '0 10px 30px var(--color-e2e-form-shadow)',
}
