/* REFINED'S READINESS PARTS — a frozen fork of `CompassReadinessParts.tsx`,
   2026-11-10.

   ⚠ THIS IS THE FILE THE FIRST FORK MISSED, and the symptom is worth
   recording because it will happen again. Refined's Overview took the
   stage-aware page and its stylesheet, renamed `cre-rd` → `crf-rd`, and kept
   importing the SHARED parts — which still render `cre-rd-*` class names. The
   forked stylesheet defines none of those, so the Readiness-to-Pass panel
   lost its grid, its bars and its dots: label and value ran together as
   "Readiness58% of 85%". Nothing errored. It was caught by looking at the two
   versions side by side, not by a test.

   ⚠ SO THE RULE IS: FORK THE WHOLE RENDER TREE, not the page component. A
   fork that renames a prefix has to reach every component that writes that
   prefix, or the leaves keep pointing at the stylesheet the fork left behind.

   Verbatim but for the prefix — the originals still draw the current
   version's Overview, untouched. */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from '@/icons'
import type { PathRow, Ring, Seg, SubRow, TopicRow } from './compassReadinessModel'

/**
 * THE PIECES BOTH READINESS PAGES DRAW — the ring, its legend, the band, the
 * share pie and the topic table.
 *
 * ⚠ ONE TABLE, TWO COLUMN SETS. His exam-prep page lists practice and when a
 * topic was last practised; his journey page lists lessons and a score. It is
 * the same table doing the same job — "where do I stand, by topic" — so it is
 * one component with a `variant`, not two that drift.
 */
/**
 * THE THREE-ARC RING — his geometry exactly: a 168 viewBox drawn at 200px,
 * rotated a quarter turn, with tracks at r=77 / 64 / 51 and his dasharrays.
 * The arcs are computed in the fixture, so the drawing cannot drift from the
 * numbers beside it.
 */
export function ReadinessRing({ ring }: { ring: Ring }) {
  const arcs: [number, string, string, string][] = [
    [77, 'violet', ring.tri.sim, ring.tri.capSim],
    [64, 'steel', ring.tri.prac, ring.tri.capPrac],
    [51, ring.tri.rColor, ring.tri.ready, ring.tri.capReady],
  ]
  return (
    <div className="crf-rd-ring">
      <svg viewBox="0 0 168 168" width="200" height="200" role="img" aria-label={ring.tri.aria}>
        <g transform="rotate(-90 84 84)">
          {arcs.map(([r, tone, dash, cap]) => (
            <g key={r}>
              <circle cx="84" cy="84" r={r} fill="none" className="crf-rd-track" strokeWidth="9" />
              <circle
                cx="84"
                cy="84"
                r={r}
                fill="none"
                stroke={`var(--rd-${tone})`}
                strokeWidth="9"
                strokeDasharray={dash}
                strokeLinecap={cap as 'butt' | 'round'}
              />
            </g>
          ))}
        </g>
      </svg>
      <span
        className="crf-rd-pill"
        style={{ background: `var(--rd-${ring.pillBg})`, borderColor: `var(--rd-${ring.pillBorder})` }}
      >
        {ring.pillLabel}
      </span>
    </div>
  )
}

export function PathLine({ row }: { row: PathRow }) {
  return (
    <li className="crf-rd-path-row">
      <span className="crf-rd-dot" style={{ background: `var(--rd-${row.dot.tone})` }} aria-hidden />
      <span className="crf-rd-path-label" style={{ color: `var(--rd-${row.color})` }}>
        {row.label}
      </span>
      {row.hasBar && (
        <span className="crf-rd-path-bar" aria-hidden>
          <span style={{ width: row.pct, background: `var(--rd-${row.barColor})` }} />
        </span>
      )}
      <span className="crf-rd-path-value" style={{ color: `var(--rd-${row.valColor})` }}>
        {row.value}
      </span>
      {row.hasLink && <button type="button" className="crf-rd-quiet">{row.link}</button>}
    </li>
  )
}

/** His four-segment readiness band — Beginner · Developing · Proficient · Ready. */
export function Band({ segs }: { segs?: Seg[] }) {
  if (!segs?.length) return null
  return (
    <span className="crf-rd-band" aria-hidden>
      {segs.map((s, i) => (
        <span key={i} style={{ flex: `${s.style.weight} 1 0`, background: `var(--rd-${s.style.tone})` }} />
      ))}
    </span>
  )
}

/**
 * ⚠ THE TABLE EXPANDS INTO SUB-TOPICS, and that is where the design earns its
 * keep: "Policy Provisions 47%" is a number to worry about, "Riders 36%,
 * weakest first" is somewhere to go tonight.
 */
/**
 * ⚠ THE PIE IS THE SHARE OF THE EXAM, not progress — his note says so above
 * the table ("pie = share of the exam"). Reading it as completion would
 * invert the page's meaning, which is why the label travels with it.
 */
export function SharePie({ row }: { row: TopicRow }) {
  if (!row.hasPie) return null
  const end = Number(row.pieEnd ?? 0)
  return (
    <span
      className="crf-rd-pie"
      role="img"
      aria-label={row.pieLabel ?? ''}
      style={{ background: `conic-gradient(var(--rd-steel) ${end}deg, var(--rd-steel-edge) 0)` }}
    />
  )
}

/**
 * ⚠ THE COLUMNS ARE HIS FLAGS, not a variant this port invented. `colLessons`
 * puts "Lessons · Course" in; `colReady` puts "Readiness · Exam Prep" in —
 * and on the QE stages it is FALSE, so the table has three columns and no
 * Readiness at all. That absence is the design's first claim, and a port that
 * always drew the column (the first pass did) contradicts it with an empty
 * cell on every row.
 */
export function TopicTable({
  rows,
  variant = 'prep',
  colLessons = false,
  colReady = true,
}: {
  rows: TopicRow[]
  /** `prep` is "by exam topic" (practice, last practiced); `lessons` is his
   *  course table (lessons done, and the percent beside them). */
  variant?: 'prep' | 'lessons'
  colLessons?: boolean
  colReady?: boolean
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(rows.filter((r) => r.expanded).map((r) => [r.name, true])),
  )
  return (
    <table className="crf-rd-grid">
      <thead>
        <tr>
          <th>{variant === 'prep' ? 'Total percentage of exam' : 'Topic'}</th>
          {variant === 'prep' ? <th>Practice</th> : colLessons ? <th>Lessons · Course</th> : null}
          {colReady ? <th>{variant === 'prep' ? 'Readiness' : 'Readiness · Exam Prep'}</th> : null}
          {variant === 'prep' ? <th>Last practiced</th> : null}
          <th className="crf-rd-right">Next</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <Fragment2 key={r.name}>
            <tr className="crf-rd-topic">
              <td>
                <button
                  type="button"
                  className="crf-rd-expander"
                  aria-expanded={!!open[r.name]}
                  onClick={() => setOpen((o) => ({ ...o, [r.name]: !o[r.name] }))}
                >
                  {open[r.name] ? <ChevronDown size={14} aria-hidden /> : <ChevronRight size={14} aria-hidden />}
                  <SharePie row={r} />
                  <span>
                    <b style={{ color: `var(--rd-${r.nameColor})` }}>{r.name}</b>
                    <span className="crf-rd-weight">{r.weight}</span>
                  </span>
                </button>
              </td>
              {(variant === 'prep' || colLessons) && (
                <td>
                  <span style={{ color: `var(--rd-${r.pColor ?? r.lColor})` }}>
                    {r.pLabel ?? r.lessons}
                  </span>
                  {/* ⚠ HIS LESSON PERCENT SITS BESIDE THE COUNT, not in a
                      column of its own: "7 of 8 · in progress  88%". */}
                  {variant === 'lessons' && r.lPct && <b className="crf-rd-lpct">{r.lPct}</b>}
                  {(r.hasCov || r.lPct) && (
                    <span className="crf-rd-cov" aria-hidden>
                      <span
                        style={{
                          width: r.covPct ?? r.lPct,
                          background: r.lBar ? `var(--rd-${r.lBar})` : undefined,
                        }}
                      />
                    </span>
                  )}
                </td>
              )}
              {colReady && (
              <td>
                {r.hasBand ? (
                  <span className="crf-rd-readiness">
                    <Band segs={r.segs} />
                    <b style={{ color: `var(--rd-${r.bColor})` }}>{r.bWord}</b>
                    <span>{r.num}%</span>
                  </span>
                ) : (
                  <span style={{ color: `var(--rd-${r.bNoteColor})` }}>{r.bNote}</span>
                )}
              </td>
              )}
              {variant === 'prep' && <td>{r.last}</td>}
              <td className="crf-rd-right">
                {r.act &&
                  (r.isPrimary ? (
                    <button type="button" className="crf-rd-primary crf-rd-small">
                      {r.act}
                    </button>
                  ) : (
                    <button type="button" className="crf-rd-link" style={{ color: `var(--rd-${r.aColor})` }}>
                      {r.act} ›
                    </button>
                  ))}
              </td>
            </tr>
            {open[r.name] &&
              r.subs?.length && (
                <tr className="crf-rd-subs">
                  <td colSpan={5}>
                    <div className="crf-rd-subs-head">
                      <span className="crf-rd-label">Readiness by sub-topic</span>
                      <span className="crf-rd-note">Weakest first</span>
                    </div>
                    {r.subs.map((s) => (
                      <SubLine key={s.name} sub={s} />
                    ))}
                  </td>
                </tr>
              )}
          </Fragment2>
        ))}
      </tbody>
    </table>
  )
}

export function SubLine({ sub }: { sub: SubRow }) {
  return (
    <div className="crf-rd-sub">
      <span className="crf-rd-sub-name">{sub.name}</span>
      {sub.note && <span style={{ color: `var(--rd-${sub.noteColor})` }}>{sub.note}</span>}
      <span className="crf-rd-readiness">
        <Band segs={sub.segs} />
        <b style={{ color: `var(--rd-${sub.bColor})` }}>{sub.bWord}</b>
        <span>{sub.num}%</span>
      </span>
      {/* ⚠ A SUB-ROW'S ACTION IS RUBI'S — `rubi` / `rubiCta`, not the topic
          row's `act`. The first pass read the wrong field and every sub-row
          lost its "Practice · 12 min ›", which is the one control that turns
          a weak sub-topic into tonight's work. */}
      {(sub.rubiCta || sub.act) && (
        <button
          type="button"
          className={`crf-rd-link${sub.rubi ? ' crf-rd-link--rubi' : ''}`}
          style={sub.rubi ? undefined : { color: `var(--rd-${sub.aColor})` }}
        >
          {sub.rubiCta ?? sub.act} ›
        </button>
      )}
    </div>
  )
}


/** A keyed pair of rows — `<Fragment>` with a key, named for readability. */
export function Fragment2({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
