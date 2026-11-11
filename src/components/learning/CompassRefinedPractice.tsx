import { useState } from 'react'
import { ArrowRotateLeft, Bullseye, Clock, Grid, RubiLogo, Table, X } from '@/icons'
import {
  JEFF_MVP_PRACTICE as PR,
  JEFF_MVP_PRACTICE_COPY as COPY,
  practiceMatches,
  type JeffMvpPage,
  type JeffMvpPracticeGroup,
  type JeffMvpPracticePill,
  type JeffMvpPracticeRec,
  type JeffMvpPracticeSet,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn, CompassRefinedHead } from './CompassRefinedChrome'
import './compassRefined.css'

type PracticeSet = JeffMvpPracticeSet
type PracticeGroup = JeffMvpPracticeGroup

/**
 * JEFF'S PRACTICE PAGE — 2026-11-09, the fourth ported and the one the other
 * three point at: every Practice button on Readiness and the Overview lands
 * here.
 *
 * Two recommendations — the weakest set and a spaced review — over a
 * catalogue of twenty-one question sets, filterable by confidence and by
 * Readiness band, in three groupings and two views.
 *
 * ⚠ THREE TABS ARE THREE GROUPINGS, NOT A FILTER ON ONE LIST. Topics gives
 * five groups; Subtopics gives one flat group of the same sets with a topic
 * eyebrow on each; Bookmarked gives the two sets that have bookmarks, with
 * their counts. All three are his, stored separately.
 *
 * ⚠ A FILTER ONLY EVER MATCHES A STARTED SET. Picking Low confidence hides
 * every unstarted set rather than showing it unmatched, and picking High
 * empties the page — which is correct, because nothing has been practised
 * well yet. His empty state explains it in those terms rather than in terms
 * of the filter.
 *
 * ⚠ `Bullseye` STANDS IN FOR HIS LAYERS GLYPH on the two Start-set buttons.
 * His mark is a stack of sheets — the same one the Overview's Practice card
 * uses, where `Library` stands in. The registry ships no layers icon; a
 * bullseye reads as "a target to hit", which is what a practice set is, and
 * is the nearest honest meaning. Adding a layers icon is a registry decision.
 *
 * ⚠ THE TEXT-SELECTION POPOVER IS NOT PORTED, deliberately. His `selAsk` /
 * `selNote` / `selBm` offer Ask Rubi, Note and Bookmark over a live DOM text
 * selection. It belongs to the question text on `PracticeSession`, which is
 * not this page — here it would hang off set titles, which is not what it is
 * for. It travels with that page when that page is ported.
 */
export function CompassRefinedPractice({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [tab, setTab] = useState<'topics' | 'subtopics' | 'bookmarked'>('topics')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [conf, setConf] = useState<string[]>([])
  const [ready, setReady] = useState<string[]>([])
  const [intro, setIntro] = useState(true)
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)

  const toggle = (list: string[], set: (v: string[]) => void, label: string) =>
    set(list.includes(label) ? list.filter((x) => x !== label) : [...list, label])
  const clear = () => {
    setConf([])
    setReady([])
  }

  const groups: readonly PracticeGroup[] = PR[tab]
  const anyFilter = conf.length > 0 || ready.length > 0
  /* His rule, applied per set, then empty groups dropped — a group whose every
     set is filtered out does not draw a header over nothing. */
  const shown = groups
    .map((g) => ({ ...g, sets: g.sets.filter((s) => practiceMatches(s, conf, ready)) }))
    .filter((g) => g.sets.length > 0)
  const isEmpty = shown.length === 0

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <CompassRefinedHead
          title={COPY.title}
          below={
            <>
              <p className="crf-ov__course">{COPY.course}</p>
              {/* ⚠ DISMISSIBLE, as his is — `introOpen` / `dismissIntro`. */}
              {intro ? (
                <p className="crf-pr__lead">
                  {COPY.lead}
                  <button
                    type="button"
                    className="crf-pr__dismiss"
                    aria-label={COPY.dismissLabel}
                    onClick={() => setIntro(false)}
                  >
                    <X size={13} aria-hidden />
                  </button>
                </p>
              ) : null}
            </>
          }
        />

        {/* ---------- the two recommendations ---------- */}
        <section className="crf-pr__rec" aria-label={PR.weakest.title}>
          {/* ⚠ THE EYEBROW IS ABOVE THE WHOLE BLOCK, not inside the text
              column — his `.rec-main` starts after it. DOM order matters here
              beyond layout: putting it in the column makes the ring's band
              pill the first thing a screen reader meets, before it has been
              told what this panel is. */}
          <p className="crf-eyebrow crf-eyebrow--rubi crf-pr__receyebrow">
            <RubiLogo size={13} aria-hidden />
            {COPY.rubiEyebrow} · {PR.weakest.kind}
          </p>
          <div className="crf-pr__weakest">
            <SetRing rec={PR.weakest} />
            <div className="crf-pr__recbody">
              <p className="crf-pr__rectopic">{PR.weakest.topic}</p>
              <h2 className="crf-pr__rectitle crf-serif">{PR.weakest.title}</h2>
              <p className="crf-card__text">{PR.weakest.why}</p>
              <p className="crf-pr__recstats">
                <span>
                  <span className="crf-dot" style={{ background: `var(--cjm-${PR.weakest.readyTone})` }} aria-hidden />
                  {COPY.readinessLabel} <b>{PR.weakest.ready}%</b>
                </span>
                <span>
                  <span className="crf-dot" style={{ background: 'var(--cjm-steel)' }} aria-hidden />
                  {PR.weakest.covLabel} <b>{PR.weakest.cov}%</b> {PR.weakest.covNote}
                </span>
                <span>
                  <Clock size={13} aria-hidden /> {COPY.aboutLabel} {PR.weakest.timeLabel}
                </span>
              </p>
            </div>
            <button type="button" className="crf-cta" onClick={go('practice')}>
              <Bullseye size={14} aria-hidden />
              {PR.weakest.cta}
            </button>
          </div>

          {/* The spaced-review strip under it: a thinner row, same card. */}
          <div className="crf-pr__spaced">
            <p className="crf-eyebrow crf-eyebrow--steel">
              <ArrowRotateLeft size={13} aria-hidden /> {PR.spaced.kind}
            </p>
            <p className="crf-pr__spacedtitle">{PR.spaced.title}</p>
            <span
              className="crf-pill"
              style={{
                background: `var(--cjm-${PR.spaced.bandBg})`,
                border: `1px solid var(--cjm-${PR.spaced.bandBorder})`,
                color: `var(--cjm-${PR.spaced.bandInk})`,
              }}
            >
              {PR.spaced.band}
            </span>
            <span className="crf-pr__due">
              <b>{PR.spaced.due}</b> · {PR.spaced.rowMeta}
            </span>
            <button type="button" className="crf-btn" onClick={go('practice')}>
              <Bullseye size={13} aria-hidden />
              {PR.spaced.cta}
            </button>
          </div>
        </section>

        {/* ---------- tabs and the view toggle ---------- */}
        <div className="crf-pr__bar">
          <div className="crf-tabs crf-tabs--flush" role="tablist" aria-label="Which sets">
            {PR.tabs.map((t, i) => {
              const key = (['topics', 'subtopics', 'bookmarked'] as const)[i]
              const on = tab === key
              return (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={on ? 'crf-tab is-on' : 'crf-tab'}
                  onClick={() => setTab(key)}
                >
                  <span className="crf-tab__label">{t.label}</span>
                  <span className="crf-tab__sub">{t.sub}</span>
                </button>
              )
            })}
          </div>
          <div className="crf-pr__views">
            {PR.views.map((v) => {
              const key = v.label === 'Table' ? 'table' : 'cards'
              const on = view === key
              const Icon = key === 'table' ? Table : Grid
              return (
                <button
                  key={v.label}
                  type="button"
                  aria-pressed={on}
                  className={on ? 'crf-pr__view is-on' : 'crf-pr__view'}
                  onClick={() => setView(key as 'table' | 'cards')}
                >
                  <Icon size={14} aria-hidden />
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ---------- the filters ---------- */}
        <div className="crf-pr__filters">
          <span className="crf-pr__filterby">{COPY.filterBy}</span>
          <span className="crf-pr__filtergroup">
            <span className="crf-pr__filterlabel">{COPY.confidenceLabel}</span>
            {PR.confPills.map((p) => (
              <FilterPill
                key={p.label}
                pill={p}
                on={conf.includes(p.label)}
                onClick={() => toggle(conf, setConf, p.label)}
              />
            ))}
          </span>
          <span className="crf-pr__filtergroup">
            <span className="crf-pr__filterlabel">{COPY.readinessFilterLabel}</span>
            {PR.readyPills.map((p) => (
              <FilterPill
                key={p.label}
                pill={p}
                on={ready.includes(p.label)}
                onClick={() => toggle(ready, setReady, p.label)}
              />
            ))}
          </span>
          {/* ⚠ ONLY WHEN SOMETHING IS FILTERED — his `anyFilter`. */}
          {anyFilter ? (
            <button type="button" className="crf-link crf-link--flush" onClick={clear}>
              {COPY.clearFilters}
            </button>
          ) : null}
        </div>

        {/* ---------- the catalogue ---------- */}
        {isEmpty ? (
          <div className="crf-pr__empty" role="status">
            <p className="crf-pr__emptytitle">{COPY.emptyTitle}</p>
            <p className="crf-pr__emptybody">{COPY.emptyBody}</p>
            <button type="button" className="crf-btn" onClick={clear}>
              {COPY.clearFilters}
            </button>
          </div>
        ) : (
          shown.map((g) => (
            <section key={g.id} className="crf-pr__group" aria-label={g.title || COPY.title}>
              {/* The Subtopics and Bookmarked tabs give one group with no
                  header; only Topics names and counts its groups. */}
              {g.hasHeader ? (
                <header className="crf-pr__grouphead">
                  <h3 className="crf-pr__grouptitle">{g.title}</h3>
                  <p className="crf-pr__groupmeta">{g.meta}</p>
                </header>
              ) : null}
              {view === 'table' ? <SetTable sets={g.sets} go={go} /> : <SetCards sets={g.sets} go={go} />}
            </section>
          ))
        )}
      </CompassRefinedColumn>
    </div>
  )
}

function FilterPill({
  pill,
  on,
  onClick,
}: {
  pill: JeffMvpPracticePill
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={on ? 'crf-fpill is-on' : 'crf-fpill'}
      onClick={onClick}
      style={{
        background: on ? `var(--cjm-${pill.bg})` : undefined,
        borderColor: `var(--cjm-${pill.border})`,
        color: `var(--cjm-${pill.ink})`,
      }}
    >
      {pill.label}
    </button>
  )
}

/**
 * The table view.
 *
 * ⚠ A NOT-STARTED SET SHOWS "—" IN BOTH SCORED COLUMNS, even though his data
 * carries a band and a confidence for it. Those exist for the filter to test,
 * not to display: printing them would put a Readiness band on a set nobody
 * has opened.
 */
function SetTable({ sets, go }: { sets: readonly PracticeSet[]; go: (p: JeffMvpPage) => () => void }) {
  return (
    <table className="crf-pr__table">
      <thead>
        <tr>
          {COPY.cols.map((c) => (
            <th key={c} scope="col">
              {c}
            </th>
          ))}
          <th scope="col">
            <span className="crf-sr">{COPY.actionCol}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sets.map((s) => (
          <tr key={s.title}>
            <td>
              {s.hasEyebrow ? <span className="crf-pr__seteyebrow">{s.topic}</span> : null}
              <span className="crf-pr__settitle">{s.title}</span>
              {s.hasBmk ? <span className="crf-pr__bmk">{s.bmkText}</span> : null}
            </td>
            <td>
              {s.started ? (
                <span
                  className="crf-pill crf-pill--conf"
                  style={{
                    background: `var(--cjm-${s.confBg})`,
                    border: `1px solid var(--cjm-${s.confBorder})`,
                    color: `var(--cjm-${s.confInk})`,
                  }}
                >
                  {s.conf}
                  <span className="crf-pr__confword">{COPY.confidenceWord}</span>
                </span>
              ) : (
                <span className="crf-pr__dash">{COPY.dash}</span>
              )}
            </td>
            <td>
              {s.started ? (
                <span className="crf-pill crf-pill--beginner">{s.band}</span>
              ) : (
                <span className="crf-pr__dash">{COPY.dash}</span>
              )}
            </td>
            <td>
              <span className="crf-pr__status">{s.status}</span>
              {s.started ? (
                <span className="crf-bar crf-bar--set" role="img" aria-label={s.aria}>
                  <span
                    className="crf-bar__fill"
                    style={{ width: s.barW, minWidth: s.barMin }}
                  />
                </span>
              ) : null}
            </td>
            <td className="crf-pr__action">
              <button type="button" className="crf-btn" onClick={go('practice')}>
                {COPY.startSet}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * The cards view.
 *
 * ⚠ THE READINESS WORD IS THE CARDS' ONLY. Both views label the CONFIDENCE
 * pill ("Low / confidence"); only a card labels the band ("Beginner /
 * readiness"). That asymmetry is his, measured on his render — not the
 * symmetry it would be tempting to impose.
 */
function SetCards({ sets, go }: { sets: readonly PracticeSet[]; go: (p: JeffMvpPage) => () => void }) {
  return (
    <div className="crf-pr__cards">
      {sets.map((s) => (
        <article className="crf-pr__card" key={s.title}>
          {s.hasEyebrow ? <p className="crf-pr__seteyebrow">{s.topic}</p> : null}
          <p className="crf-pr__settitle">{s.title}</p>
          {s.hasBmk ? <p className="crf-pr__bmk">{s.bmkText}</p> : null}
          {s.started ? (
            <p className="crf-pr__cardpills">
              <span
                className="crf-pill crf-pill--conf"
                style={{
                  background: `var(--cjm-${s.confBg})`,
                  border: `1px solid var(--cjm-${s.confBorder})`,
                  color: `var(--cjm-${s.confInk})`,
                }}
              >
                {s.conf}
                <span className="crf-pr__confword">{COPY.confidenceWord}</span>
              </span>
              <span className="crf-pill crf-pill--beginner">
                {s.band}
                <span className="crf-pr__confword">{COPY.readinessWord}</span>
              </span>
            </p>
          ) : null}
          <p className="crf-pr__status">{s.status}</p>
          {s.started ? (
            <span className="crf-bar crf-bar--set" role="img" aria-label={s.aria}>
              <span className="crf-bar__fill" style={{ width: s.barW, minWidth: s.barMin }} />
            </span>
          ) : null}
          <button type="button" className="crf-btn" onClick={go('practice')}>
            {COPY.startSet}
          </button>
        </article>
      ))}
    </div>
  )
}

/** The weakest set's double arc — the same two-ring shape the Readiness page
 *  uses, at a smaller size. */
function SetRing({ rec }: { rec: JeffMvpPracticeRec }) {
  return (
    <div className="crf-pr__ring">
      <div style={{ position: 'relative', width: 152, height: 152 }}>
        {/* ⚠ 152px DRAWN FROM A 120 VIEWBOX, r=52 and r=40, stroke 8 — and the
            two tracks are DIFFERENT COLOURS: the Readiness arc runs on a warm
            track, the coverage arc on a cool one. Using one for both is the
            kind of thing nobody reports and everybody half-notices. Each arc
            carries its own rotate rather than sharing a group, as his does. */}
        <svg width="152" height="152" viewBox="0 0 120 120" role="img" aria-label={rec.ringAria}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--cjm-ring-warm)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={`var(--cjm-${rec.readyTone})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={rec.readyDash}
            transform="rotate(-90 60 60)"
          />
          <circle cx="60" cy="60" r="40" fill="none" stroke="var(--cjm-ring-steel-track)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="var(--cjm-steel-deep)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={rec.covDash}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="crf-pr__ringmid" aria-hidden>
          <span
            className="crf-pill"
            style={{
              background: `var(--cjm-${rec.bandBg})`,
              border: `1px solid var(--cjm-${rec.bandBorder})`,
              color: `var(--cjm-${rec.bandInk})`,
            }}
          >
            {rec.band}
          </span>
        </span>
      </div>
    </div>
  )
}
