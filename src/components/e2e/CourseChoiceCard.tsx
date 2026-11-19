import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { CourseChoiceFields } from '@/components/e2e/CourseChoiceFields'
import { useV3DialogLayer } from '@/components/e2e/useV3DialogLayer'
import { matchState } from '@/data/inviteFlowsV3'
import { FINDER_LINES_OF_AUTHORITY, type FinderLineOfAuthority } from '@/data/xcelCourseFinder'
import { XmarkRegular } from '@/icons'
import { CHOOSE_BODY, CHOOSE_CARD, CHOOSE_RULE, CHOOSE_TITLE, GATE_OFF, GATE_ON } from './courseChoiceStyles'

/**
 * "SELECT YOUR STATE AND LINE OF AUTHORITY" — the QR flows' step 2, as one
 * card, and the same card as a dialog — 2026-11-18, Afsana: the product
 * page's "Change state/line of authority" should open a modal that "aligns
 * with the 'Select your state and line of authority' modal that shows up in
 * the QR flows".
 *
 * ⚠ ONE CARD, TWO PLACES. The QR step draws `CourseChoiceCard` on the page;
 * Eric's product page (`ProductDetailPageV3Multi`) draws it in
 * `CourseChoiceDialog`. Both are this file, so a change to the wording, the
 * fields or the button reaches both. The dialog adds only what a dialog
 * needs: the scrim, an ✕, Escape, and opening on the current choice.
 */

export function CourseChoiceCard({
  idPrefix,
  initial,
  onChoose,
  style,
  titleId,
  children,
}: {
  idPrefix: string
  /** Where the fields start — blank on the QR step, the current course in
   *  the dialog. */
  initial?: { state: string; lineOfAuthority: string }
  onChoose: (state: string, lineOfAuthority: FinderLineOfAuthority) => void
  style?: CSSProperties
  /** The heading's id, for a dialog's `aria-labelledby`. */
  titleId?: string
  /** Anything the card carries besides its own content — the dialog's ✕. */
  children?: React.ReactNode
}) {
  const [typed, setTyped] = useState(initial?.state ?? '')
  const [loa, setLoa] = useState<FinderLineOfAuthority | null>(() => {
    const given = initial?.lineOfAuthority
    return FINDER_LINES_OF_AUTHORITY.find((l) => l === given) ?? null
  })
  const state = matchState(typed)
  const ready = state != null && loa != null
  return (
    <form
      style={{ ...CHOOSE_CARD, ...style }}
      onSubmit={(e) => {
        e.preventDefault()
        if (state && loa) onChoose(state, loa)
      }}
    >
      {children}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h2 id={titleId} style={CHOOSE_TITLE}>
          Select your state and line of authority
        </h2>
        <div aria-hidden style={CHOOSE_RULE} />
        <p style={CHOOSE_BODY}>This will help us show you the course that aligns with you.</p>
      </div>
      <CourseChoiceFields
        idPrefix={idPrefix}
        stateLabel="State"
        loaLabel="Line of authority"
        state={typed}
        onState={setTyped}
        loa={loa}
        onLoa={setLoa}
      />
      <button type="submit" disabled={!ready} aria-disabled={!ready} style={ready ? GATE_ON : GATE_OFF}>
        Continue
      </button>
    </form>
  )
}

export function CourseChoiceDialog({
  initial,
  onChoose,
  onCancel,
}: {
  initial: { state: string; lineOfAuthority: string }
  onChoose: (state: string, lineOfAuthority: FinderLineOfAuthority) => void
  onCancel: () => void
}) {
  const layer = useV3DialogLayer()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])
  return createPortal(
    <div style={{ ...SCRIM, ...layer.scrim }} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-choice-dialog-title"
        style={{ maxWidth: '100%', ...layer.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <CourseChoiceCard
          idPrefix="course-choice-dialog"
          titleId="course-choice-dialog-title"
          initial={initial}
          onChoose={onChoose}
        >
          <button type="button" aria-label="Close" onClick={onCancel} style={CLOSE}>
            <XmarkRegular size={18} aria-hidden />
          </button>
        </CourseChoiceCard>
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
  background: 'var(--color-e2e-scrim)',
}

const CLOSE: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  width: 32,
  height: 32,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 4,
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}
