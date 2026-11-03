import { useEffect, useLayoutEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CircleXmarkThin, Square, SquareCheck } from '@/icons'
import { AFFIDAVIT, type AffidavitKind } from './AffidavitModal'

/**
 * THE AFFIDAVIT MODAL, V2 — 2026-11-03, Afsana. A fork of `AffidavitModal`
 * (which is untouched and still what main shows), chosen at the call site by
 * the `atlas-affidavit-v2` flag. Same document, same names — `AFFIDAVIT` is
 * imported, not copied, so the comparison is only about what V2 changes.
 *
 * ⚠ THE FIRST CHANGE: THE REVIEW CHROME STAYS UNCOVERED. V1's scrim is
 * `inset: 0` at z-index 1000, so the moment the modal opens the review bar,
 * the demo controls and the design controls go dark and stop answering —
 * including the design bar's own Affidavit control, the one that opened it.
 * A reviewer could not switch learner, progress or affidavit kind without
 * closing the modal first. V2 does two things:
 *
 *   1. The scrim STARTS BELOW THE BARS. `useChromeBottom` measures the lowest
 *      edge of `.cre-prototype-bar` / `.cre-demo-controls` (the design bar is
 *      a `DemoBar` too, so it carries that class) and re-measures on scroll,
 *      resize and DOM changes — the design bar mounts and unmounts, and the
 *      in-flow bars scroll away under the sticky one. No bars on screen
 *      (`?chrome=off`) measures 0, which is V1's full cover.
 *   2. The scrim sits at z-index 55: above the product shell (its header and
 *      browser chrome top out at 51), BELOW the bars' dropdown panels and the
 *      robot's menu (60), so a menu opened from a bar drops over the dim
 *      rather than behind it.
 *
 * The bars are prototype chrome, not product, so the learner's experience is
 * unchanged: in the real product there is nothing above the scrim.
 */
export type { AffidavitKind }

/** Every bar that sits above the product — the dark review bar, then the demo
 *  and design controls. */
const CHROME_SELECTOR = '.cre-prototype-bar, .cre-demo-controls'

/** The window y where the review chrome ends, 0 when none is on screen. */
function useChromeBottom(): number {
  const [bottom, setBottom] = useState(0)
  useLayoutEffect(() => {
    const measure = () => {
      let max = 0
      document.querySelectorAll(CHROME_SELECTOR).forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.height > 0) max = Math.max(max, r.bottom)
      })
      setBottom(Math.max(0, Math.round(max)))
    }
    measure()
    const observer = new MutationObserver(measure)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('scroll', measure, true)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure, true)
      window.removeEventListener('resize', measure)
    }
  }, [])
  return bottom
}

export function AffidavitModalV2({
  kind = 'pre',
  onClose,
  initialAgreed = false,
}: {
  kind?: AffidavitKind
  onClose: () => void
  /** Opens with the attestation already ticked.
   *
   *  ⚠ FOR THE DEV HANDOFF'S STATE GALLERY ONLY (2026-10-21) — the same role
   *  `initialStage` plays on `AtlasExamDateCard` and `initialLevel` on
   *  `AtlasReadinessCard`. A learner never reaches this modal pre-agreed, and
   *  no product surface passes it; it exists so the handoff can show the
   *  enabled Continue button without asking the reader to go and tick a box
   *  to find out what it looks like. */
  initialAgreed?: boolean
}) {
  const doc = AFFIDAVIT[kind]
  const [agreed, setAgreed] = useState(initialAgreed)
  const chromeBottom = useChromeBottom()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div style={{ ...SCRIM, top: chromeBottom }}>
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

/* The page darkened behind, the modal centred on it — below the bars, and
   under their menus (see the header). `top` is set at render. */
const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 55,
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
