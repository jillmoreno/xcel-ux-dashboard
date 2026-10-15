import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, ChevronRight, GraduationCap, LockRegular } from '@/icons'
import {
  COMPASS_CHAPTERS,
  COMPASS_LEARN_LEAD,
  COMPASS_LEARN_RESUME,
  COMPASS_LEARN_TITLE,
  COMPASS_PART_1,
  COMPASS_PART_2,
  type CompassChapter,
} from '@/data/compassCourseLandingFixtures'
import { CompassGateDialog } from './CompassGateDialog'
import './compassAnjani.css'

/**
 * THE LEARN PAGE — what the Compass rail's "Learn" row opens on Anjani's
 * surface. 2026-10-08 it was her "Your course" with five modules; rebuilt
 * 2026-10-15 from her second master as the gated two-part course. See the
 * fixtures for exactly what changed and why "Not proven" left this page.
 *
 * ⚠ THREE BEHAVIOURS, ALL HERS. An open chapter row toggles its lesson list
 * (Chapter 1 opens on load, as her file has it). A LOCKED chapter explains
 * itself inline on a click — "Pass the Chapter 2 exam to open this." — for
 * 3.5 seconds, and never opens the Exam prep dialog. The locked PART 2's head
 * does open that dialog, the same one the rail's locked rows open.
 *
 * ⚠ THIS IS NOT THE LESSON PLAYER AND MUST NOT BECOME IT. Resume lesson is
 * drawn as the design draws it and goes nowhere — the player is still
 * `?section=course&coursePage=course`, and wiring one to the other would
 * assert a mapping nobody has made between her nineteen chapters and the
 * player's table of contents.
 */
export function CompassCourseLanding() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([1]))
  const [why, setWhy] = useState<number | null>(null)
  const [gate, setGate] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current)
  }, [])
  const toggle = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      return next
    })
  const explain = (n: number) => {
    setWhy(n)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setWhy(null), 3500)
  }
  const r = COMPASS_LEARN_RESUME

  return (
    <div className="cre-learn" role="region" aria-label="Learn page">
      <div className="cre-learn__col">
        <header>
          <h2 className="cre-learn__title">{COMPASS_LEARN_TITLE}</h2>
          <p className="cre-learn__sub">{COMPASS_LEARN_LEAD}</p>
        </header>

        <section className="cre-learn__resume" aria-label={r.eyebrow}>
          <div className="cre-learn__thumb" aria-hidden>
            <span className="cre-learn__play">
              <ChevronRight size={11} />
            </span>
          </div>
          <div className="cre-learn__resume-tx">
            <span className="cre-learn__eyebrow">{r.eyebrow}</span>
            <span className="cre-learn__resume-name">{r.title}</span>
            <div className="cre-learn__bar" role="progressbar" aria-valuenow={r.progressPct} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${r.progressPct}%` }} />
            </div>
          </div>
          <button type="button" className="cre-learn__resume-btn">
            {r.action}
            <ArrowRight size={14} aria-hidden />
          </button>
        </section>

        <div className="cre-learn__parts">
          <section className="cre-gmod" aria-label={COMPASS_PART_1.title}>
            <div className="cre-gmod__head">
              <span className="cre-gmod__ic" aria-hidden>
                <GraduationCap size={17} />
              </span>
              <div className="cre-gmod__tx">
                <span className="cre-gmod__eyebrow">{COMPASS_PART_1.eyebrow}</span>
                <h3>{COMPASS_PART_1.title}</h3>
              </div>
              <span className="cre-gmod__state">{COMPASS_PART_1.state}</span>
            </div>
            <div className="cre-gmod__body">
              {COMPASS_CHAPTERS.map((c) => (
                <ChapterRow
                  key={c.number}
                  chapter={c}
                  expanded={open.has(c.number)}
                  showWhy={why === c.number}
                  onToggle={() => toggle(c.number)}
                  onExplain={() => explain(c.number)}
                />
              ))}
            </div>
          </section>

          <section className="cre-gmod cre-gmod--locked" aria-label={COMPASS_PART_2.title}>
            <button type="button" className="cre-gmod__head" onClick={() => setGate(true)}>
              <span className="cre-gmod__ic" aria-hidden>
                <LockRegular size={15} />
              </span>
              <div className="cre-gmod__tx">
                <span className="cre-gmod__eyebrow">{COMPASS_PART_2.eyebrow}</span>
                <h3>{COMPASS_PART_2.title}</h3>
              </div>
              <span className="cre-gmod__state">{COMPASS_PART_2.state}</span>
            </button>
            <div className="cre-gmod__locked-body">
              <p>{COMPASS_PART_2.body}</p>
              <div className="cre-gmod__chips">
                {COMPASS_PART_2.chips.map((chip) => (
                  <span className="cre-gchip" key={chip}>
                    <LockRegular size={11} aria-hidden /> {chip}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <CompassGateDialog open={gate} onClose={() => setGate(false)} />
    </div>
  )
}

function ChapterRow({
  chapter: c,
  expanded,
  showWhy,
  onToggle,
  onExplain,
}: {
  chapter: CompassChapter
  expanded: boolean
  showWhy: boolean
  onToggle: () => void
  onExplain: () => void
}) {
  const kind =
    c.state === 'here'
      ? `Chapter ${c.number} · ${c.lessonCount} lessons · you are here`
      : c.lessonCount
        ? `Chapter ${c.number} · ${c.lessonCount} lessons`
        : `Chapter ${c.number}`
  if (c.state === 'locked') {
    return (
      <button
        type="button"
        className={`cre-grow cre-grow--locked${showWhy ? ' cre-grow--why' : ''}`}
        onClick={onExplain}
        aria-label={`Chapter ${c.number}, ${c.title}, locked`}
      >
        <span className="cre-grow__ic" aria-hidden>
          <LockRegular size={15} />
        </span>
        <span className="cre-grow__tx">
          <span className="cre-grow__kind">{kind}</span>
          <span className="cre-grow__name">{c.title}</span>
          <span className="cre-grow__why" role="status">
            {showWhy ? c.why : null}
          </span>
        </span>
        <span className="cre-grow__state">Locked</span>
      </button>
    )
  }
  const here = c.state === 'here'
  const lessonsId = `cre-glessons-${c.number}`
  return (
    <>
      <button
        type="button"
        className={`cre-grow cre-grow--open${here ? ' cre-grow--here' : ''}${expanded ? ' cre-grow--expanded' : ''}`}
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={lessonsId}
      >
        <span className="cre-grow__ic" aria-hidden>
          {here ? <ChevronRight size={13} /> : <Check size={15} />}
        </span>
        <span className="cre-grow__tx">
          <span className="cre-grow__kind">{kind}</span>
          <span className="cre-grow__name">{c.title}</span>
          {here && c.progressPct != null ? (
            <span className="cre-grow__bar" aria-hidden>
              <span style={{ width: `${c.progressPct}%` }} />
            </span>
          ) : null}
        </span>
        <span className={`cre-grow__state cre-grow__state--${here ? 'here' : 'passed'}`}>{here ? 'In progress' : 'Passed'}</span>
        <span className="cre-grow__chev" aria-hidden>
          <ChevronDown size={14} />
        </span>
      </button>
      {expanded && c.lessons ? (
        <ul className="cre-glessons" id={lessonsId} aria-label={`Chapter ${c.number} lessons`}>
          {c.lessons.map((l) => (
            <li className={`cre-glesson cre-glesson--${l.state}`} key={l.title}>
              <span className="cre-glesson__mark" aria-hidden>
                {l.state === 'done' ? <Check size={11} /> : l.state === 'now' ? <ChevronRight size={9} /> : null}
              </span>
              <span className="cre-glesson__t">{l.title}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}
