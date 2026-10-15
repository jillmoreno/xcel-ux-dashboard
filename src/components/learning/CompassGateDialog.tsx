import { useEffect, useRef } from 'react'
import { LockRegular } from '@/icons'
import { COMPASS_GATE_DIALOG } from '@/data/compassRailFixtures'

/**
 * THE EXAM PREP DIALOG — what the second tap on a locked rail row opens, and
 * what the locked Part 2 on the Learn page opens. Her `#gModal` with its
 * scrim; one component so the two cannot drift.
 *
 * ⚠ BOTH BUTTONS CLOSE IT. "Ask Rubi about this" goes nowhere in her file
 * either — it is drawn as the second action, not wired — so it closes, which
 * is the honest state rather than a route that lands somewhere wrong.
 */
export function CompassGateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const first = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (!open) return
    first.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const g = COMPASS_GATE_DIALOG
  return (
    <>
      <div className="cre-gate__scrim" onClick={onClose} />
      <div className="cre-gate" role="dialog" aria-modal="true" aria-labelledby="cre-gate-title">
        <span className="cre-gate__mark" aria-hidden>
          <LockRegular size={17} />
        </span>
        <h3 id="cre-gate-title">{g.title}</h3>
        <p>{g.body}</p>
        <p className="cre-gate__inside">
          <b>{g.insideHeading}</b>
        </p>
        <ul>
          {g.inside.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="cre-gate__acts">
          <button type="button" className="cre-gate__btn" ref={first} onClick={onClose}>
            {g.back}
          </button>
          <button type="button" className="cre-gate__btn cre-gate__btn--quiet" onClick={onClose}>
            {g.ask}
          </button>
        </div>
      </div>
    </>
  )
}
