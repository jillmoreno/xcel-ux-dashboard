import { useEffect, useRef, useState } from 'react'
import { ClipboardList, ClipboardListCheckRegular, GearRegular, LockRegular, Notebook, RubiLogo } from '@/icons'
import {
  COMPASS_RAIL_ASK_RUBI,
  COMPASS_RAIL_LEARNER,
  COMPASS_RAIL_LOCKED,
  COMPASS_RAIL_LOCKED_HEADING,
  COMPASS_RAIL_SETTINGS,
  lockedTip,
  type CompassLockedRow,
} from '@/data/compassRailFixtures'
import type { CompassPage } from './CompassCoursePlayer'
import type { CompassPageRow } from './compassPages'
import { CompassGateDialog } from './CompassGateDialog'
import './compassAnjani.css'

/**
 * ANJANI'S COMPASS RAIL — 2026-10-08 ("i still need anjanis rails that exist
 * in her design. not these."), rebuilt 2026-10-15 from her second master.
 *
 * ⚠ A FORK OF `CompassSidebar`, NOT A FLAG THROUGH IT — still. The rail is a
 * different object in her design, not the shared one with different words:
 *
 * | | `CompassSidebar` | Hers, now |
 * |---|---|---|
 * | Top | Home crumb, course title, days left, a 62% bar | nothing — the header above carries the logo (the lockup went 2026-10-15) |
 * | Rows | eight pages, icon + label | Overview · Learn · Study planner · Ask Rubi · Progress, icon + label |
 * | Then | — | an EXAM PREP rule and three LOCKED rows: Practice, Flashcards, Exam Simulator |
 * | Bottom | nothing | Settings, then the learner |
 *
 * ⚠ WHAT CHANGED ON THE 15TH, so nobody reads it as drift. Her rows have
 * icons now (they were label-only — that was measured, not guessed, and so is
 * this). The Course hours / Exam footer is GONE from her file, Settings is
 * where it was. Flashcards and Exam Simulator left the page list for the
 * locked group, which is what makes the gate real: the first tap on a locked
 * row shows WHY in a tooltip for four seconds, the second opens the Exam prep
 * dialog — `CompassGateDialog`, shared with the Learn page's locked Part 2.
 *
 * ⚠ ASK RUBI AND SETTINGS ARE INERT, as in her file: drawn as rows, going
 * nowhere. Progress is drawn disabled. See the fixtures for the words.
 *
 * ⚠ NO HOME CRUMB, AND THAT IS SAFE ONLY HERE — her pages render inside the
 * shell with the global header's Home pill on screen. The lesson player keeps
 * the shared sidebar and its crumb.
 */
export function CompassRail({
  page,
  onSelectPage,
  pages,
}: {
  page: CompassPage
  onSelectPage: (p: CompassPage) => void
  /** The rows, from `HYBRID_COMPASS_PAGES` — passed rather than imported so the
   *  rail cannot disagree with the list the rest of the page reads. */
  pages: readonly CompassPageRow[]
}) {
  const [tip, setTip] = useState<CompassLockedRow['id'] | null>(null)
  const [gate, setGate] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])
  /* First tap shows the reason; a second tap while it shows opens the dialog. */
  const lockTap = (id: CompassLockedRow['id']) => {
    if (tip === id) {
      setTip(null)
      setGate(true)
      return
    }
    setTip(id)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setTip(null), 4000)
  }

  return (
    <aside className="cre-rail">
      {/* ⚠ NO LOCKUP — 2026-10-15, the direct ask ("remove", pointing at it).
          Her standalone file has no global header, so its rail carries the
          XCEL logo and "Compass"; inside the shell the header above already
          shows the logo, and the rail's copy read as a duplicate. The
          wordmark stays in the fixtures for the day the rail stands alone. */}
      <nav aria-label="Course pages" className="cre-rail__nav">
        <ul className="cre-rail__list">
          {pages.flatMap((p) => {
            const active = p.id === page
            const Icon = p.icon
            /* Ask Rubi sits between Study planner and Progress in her rail; it
               is not a page, so the rail draws it rather than the page list. */
            const ask =
              p.id === 'study-planner' ? (
                <li key="ask-rubi">
                  <button type="button" className="cre-rail__row cre-rail__row--ask">
                    <span className="cre-rail__ic">
                      <RubiLogo size={14} aria-hidden />
                    </span>
                    {COMPASS_RAIL_ASK_RUBI}
                  </button>
                </li>
              ) : null
            if (p.disabled) {
              return [
                <li key={p.id}>
                  <span className="cre-rail__row cre-rail__row--disabled" aria-disabled>
                    <span className="cre-rail__ic">
                      <Icon size={15} aria-hidden />
                    </span>
                    {p.label}
                  </span>
                </li>,
              ]
            }
            return [
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectPage(p.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`cre-rail__row${active ? ' cre-rail__row--active' : ''}`}
                >
                  <span className="cre-rail__ic">
                    <Icon size={15} aria-hidden />
                  </span>
                  {p.label}
                </button>
              </li>,
              ask,
            ]
          })}
        </ul>

        <div className="cre-rail__split" aria-hidden>
          <LockRegular size={12} />
          <span className="cre-rail__split-lbl">{COMPASS_RAIL_LOCKED_HEADING}</span>
          <span className="cre-rail__split-rule" />
        </div>
        <ul className="cre-rail__list" aria-label={COMPASS_RAIL_LOCKED_HEADING}>
          {COMPASS_RAIL_LOCKED.map((row) => {
            const Icon = LOCKED_ICONS[row.id]
            const t = lockedTip(row.label)
            return (
              <li key={row.id}>
                <button
                  type="button"
                  className="cre-rail__locked"
                  aria-describedby={tip === row.id ? `cre-rail-tip-${row.id}` : undefined}
                  onClick={(e) => {
                    e.stopPropagation()
                    lockTap(row.id)
                  }}
                >
                  <span className="cre-rail__ic">
                    <Icon size={15} aria-hidden />
                  </span>
                  <span className="cre-rail__locked-tx">{row.label}</span>
                  <span
                    id={`cre-rail-tip-${row.id}`}
                    role="tooltip"
                    className={`cre-rail__tip${tip === row.id ? ' cre-rail__tip--show' : ''}`}
                  >
                    <b>{t.head}</b>
                    {t.body}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* ⚠ PUSHED DOWN BY `margin-top: auto`, not by a spacer. */}
      <div className="cre-rail__foot">
        <button type="button" className="cre-rail__row cre-rail__row--settings">
          <span className="cre-rail__ic">
            <GearRegular size={15} aria-hidden />
          </span>
          {COMPASS_RAIL_SETTINGS}
        </button>
        <div className="cre-rail__learner">
          <span aria-hidden className="cre-rail__avatar">
            {COMPASS_RAIL_LEARNER.initials}
          </span>
          <span className="cre-rail__who">{COMPASS_RAIL_LEARNER.name}</span>
        </div>
      </div>

      <CompassGateDialog open={gate} onClose={() => setGate(false)} />
    </aside>
  )
}

const LOCKED_ICONS = {
  practice: ClipboardList,
  flashcards: Notebook,
  'exam-simulator': ClipboardListCheckRegular,
} as const
