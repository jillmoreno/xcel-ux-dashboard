import type { CSSProperties, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'
import { X } from '@/icons'
import '@/pages/inviteFlow.css'

/**
 * XCEL'S OWN MODAL — 2026-11-24, Afsana: the three V3 modals the XCEL platform
 * shows (not Magento's, which commerce owns) — "Do you have a Partner Code?",
 * "1 item in your cart is not supported" and "Signing you out" — drawn as
 * XCEL draws its modals, not as Atlas does.
 *
 * Measured from the live "Select your state" modal on the Life & Health course
 * page (`.xcel-pkgcmp__modal-wrapper`): 560 wide, 5px corners, the 35% shadow
 * over a charcoal overlay; a header of 18px 30px 15px with a 1px #DDD rule
 * under it and the title in Avenir Heavy 18 / 27 (weight 800 here — see
 * TITLE); Magento's thin close glyph,
 * 14px grey, 18 from the top and 30 from the right, with no box; and content
 * of 20px 30px 30px in Avenir 18 / 27.
 *
 * One frame for the three, so they cannot drift apart. The V3 layer still
 * places it inside the demo window and holds the page still.
 */
export function XcelModalV3({
  id,
  title,
  titleId,
  onClose,
  onBackdrop,
  children,
}: {
  id?: string
  title: ReactNode
  titleId: string
  /** Draws the ✕. Without it the modal has no dismiss (Signing you out). */
  onClose?: () => void
  /** A click on the overlay, outside the card. */
  onBackdrop?: () => void
  children: ReactNode
}) {
  const layer = useV3DialogLayer()
  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }} onClick={onBackdrop}>
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{ ...CARD, ...layer.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={HEADER}>
          <h2 id={titleId} style={TITLE}>
            {title}
          </h2>
        </header>
        {onClose ? (
          <button type="button" aria-label="Close" onClick={onClose} className="cre-xcel-close" style={CLOSE}>
            <X size={14} aria-hidden />
          </button>
        ) : null}
        <div style={CONTENT}>{children}</div>
      </div>
    </div>,
    document.body,
  )
}

const SCRIM: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--color-xcel-overlay)',
}

const CARD: CSSProperties = {
  boxSizing: 'border-box',
  width: 560,
  maxWidth: 'calc(100vw - 48px)',
  background: 'var(--color-fixed-light)',
  borderRadius: 5,
  boxShadow: '0 0 12px 2px var(--color-xcel-modal-shadow)',
  color: 'var(--color-xcel-text)',
}

const HEADER: CSSProperties = {
  /* Room on the right for the ✕ (30 + 14 + 16). */
  padding: '18px 60px 15px 30px',
  borderBottom: '1px solid var(--color-e2e-card-outline)',
}

/* ⚠ 800, NOT THE LIVE SITE'S 900. XCEL loads its own "Avenir Heavy" file and
   labels it 900; here the face comes from the system's Avenir family, where
   900 is Avenir BLACK and Avenir Heavy is 800 — so 900 drew a step too heavy
   (2026-11-24, Afsana). */
const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 800,
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-xcel-text)',
}

/* Magento's close: a thin glyph, no box, top right. The button keeps a 27px
   tall target the glyph centres in, as the live one does. */
const CLOSE: CSSProperties = {
  position: 'absolute',
  top: 18,
  right: 30,
  width: 14,
  height: 27,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
}

const CONTENT: CSSProperties = {
  padding: '20px 30px 30px',
  fontFamily: 'var(--font-e2e-avenir)',
  fontWeight: 400,
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-xcel-text)',
}
