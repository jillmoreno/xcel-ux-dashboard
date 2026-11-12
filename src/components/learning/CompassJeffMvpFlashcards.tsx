import { useState } from 'react'
import { ArrowRight, Clock, Grid, Notebook, RubiLogo, Table } from '@/icons'
import {
  JEFF_MVP_FLASHCARDS as FC,
  JEFF_MVP_FLASHCARDS_COPY as COPY,
  flashcardsMatches,
  flashcardsNote,
  type JeffMvpDeck,
  type JeffMvpDeckRec,
  type JeffMvpPage,
  type JeffMvpPracticePill,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

type Tab = 'topics' | 'subtopics' | 'bookmarked'

/**
 * JEFF'S FLASHCARDS — 2026-11-09, the seventh page ported.
 *
 * Practice's sibling in shape and not its twin in behaviour. Two
 * recommendations, three tabs, a view toggle and the same two filter rows —
 * over 252 cards generated from the course content.
 *
 * ⚠ ITS FILTER RULE IS NOT PRACTICE'S. There, both halves require the set to
 * have been started, so an unstarted set can never match. Here there is no
 * such test: every deck carries a confidence and a band whether or not it has
 * been studied. `flashcardsMatches` is its own function for that reason, and
 * reusing `practiceMatches` here would quietly empty the page.
 *
 * ⚠ IT OPENS IN CARDS, WHERE PRACTICE OPENS IN TABLE. Both defaults are his.
 *
 * ⚠ THE THIRD TAB IS A DIFFERENT POOL, not a filter on the second: the 15
 * subtopics that have bookmarks, with the card count relabelled ("3
 * bookmarked · of 30 cards") and the bookmark badge dropped, because there it
 * would be on every row.
 *
 * ⚠ THE READINESS WORD CARRIES ITS NUMBER HERE — "readiness, 70%" — where
 * Practice's card said only "readiness". Small, his, and the kind of thing a
 * shared component would flatten.
 */
export function CompassJeffMvpFlashcards({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [tab, setTab] = useState<Tab>('topics')
  const [view, setView] = useState<'table' | 'cards'>('cards')
  const [conf, setConf] = useState<string[]>([])
  const [ready, setReady] = useState<string[]>([])
  const [bmOnly, setBmOnly] = useState(false)
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)

  const toggle = (list: string[], set: (v: string[]) => void, label: string) =>
    set(list.includes(label) ? list.filter((x) => x !== label) : [...list, label])
  const clear = () => {
    setConf([])
    setReady([])
    setBmOnly(false)
  }

  const pool: JeffMvpDeck[] = FC[tab]
  const anyFilter = conf.length > 0 || ready.length > 0 || bmOnly
  const shown = pool.filter((d) => flashcardsMatches(d, conf, ready, bmOnly))
  const noun = tab === 'topics' ? 'topics' : tab === 'bookmarked' ? 'subtopics' : 'subtopics'
  const note = flashcardsNote(shown, pool, noun, anyFilter, tab === 'bookmarked')

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        <CompassJeffMvpHead
          title={COPY.title}
          below={
            <>
              <p className="cjm-ov__course cjm-prep__course">{COPY.course}</p>
              <p className="cjm-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- the two recommendations ---------- */}
        <section className="cjm-pr__rec" aria-label={FC.start.title}>
          <p className="cjm-eyebrow cjm-eyebrow--rubi cjm-pr__receyebrow">
            <RubiLogo size={13} aria-hidden />
            {COPY.rubiEyebrow} · {FC.start.kind}
          </p>
          <div className="cjm-pr__weakest">
            <DeckRing rec={FC.start} />
            <div className="cjm-pr__recbody">
              <p className="cjm-pr__rectopic">{FC.start.topic}</p>
              <h2 className="cjm-pr__rectitle cjm-serif">{FC.start.title}</h2>
              <p className="cjm-card__text">{FC.start.why}</p>
              <p className="cjm-pr__recstats">
                <span>
                  <span className="cjm-dot" style={{ background: `var(--cjm-${FC.start.readyTone})` }} aria-hidden />
                  {COPY.readinessLabel} <b>{FC.start.ready}%</b>
                </span>
                <span>
                  <span className="cjm-dot" style={{ background: 'var(--cjm-steel)' }} aria-hidden />
                  {COPY.reviewedLabel} <b>{FC.start.reviewed}%</b>
                </span>
                <span>
                  <Clock size={13} aria-hidden /> {COPY.aboutLabel} {FC.start.timeLabel}
                </span>
              </p>
            </div>
            <button type="button" className="cjm-cta" onClick={go('flashcard-study')}>
              <Notebook size={14} aria-hidden />
              {FC.start.cta}
            </button>
          </div>

          <div className="cjm-pr__spaced">
            <p className="cjm-eyebrow cjm-eyebrow--steel">
              <ArrowRight size={13} aria-hidden /> {FC.upNext.kind}
            </p>
            <p className="cjm-pr__spacedtitle">{FC.upNext.title}</p>
            <span
              className="cjm-pill"
              style={{
                background: `var(--cjm-${FC.upNext.bandBg})`,
                border: `1px solid var(--cjm-${FC.upNext.bandBorder})`,
                color: `var(--cjm-${FC.upNext.bandInk})`,
              }}
            >
              {FC.upNext.band}
            </span>
            <span className="cjm-pr__due">{FC.upNext.rowMeta}</span>
            <button type="button" className="cjm-btn" onClick={go('flashcard-study')}>
              <Notebook size={13} aria-hidden />
              {FC.upNext.cta}
            </button>
          </div>
        </section>

        {/* ---------- tabs and views ---------- */}
        <div className="cjm-pr__bar">
          <div className="cjm-tabs cjm-tabs--flush" role="tablist" aria-label="Which decks">
            {FC.tabs.map((t, i) => {
              const key = (['topics', 'subtopics', 'bookmarked'] as const)[i]
              const on = tab === key
              return (
                <button
                  key={t.label}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={on ? 'cjm-tab is-on' : 'cjm-tab'}
                  onClick={() => setTab(key)}
                >
                  <span className="cjm-tab__label">{t.label}</span>
                  <span className="cjm-tab__sub">{t.sub}</span>
                </button>
              )
            })}
          </div>
          <div className="cjm-pr__views">
            {FC.views.map((v) => {
              const key = v.label === 'Table' ? 'table' : 'cards'
              const on = view === key
              const Icon = key === 'table' ? Table : Grid
              return (
                <button
                  key={v.label}
                  type="button"
                  aria-pressed={on}
                  className={on ? 'cjm-pr__view is-on' : 'cjm-pr__view'}
                  onClick={() => setView(key as 'table' | 'cards')}
                >
                  <Icon size={14} aria-hidden />
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ---------- filters ---------- */}
        <div className="cjm-pr__filters">
          <span className="cjm-pr__filterby">{COPY.filterBy}</span>
          <span className="cjm-pr__filtergroup">
            <span className="cjm-pr__filterlabel">{COPY.confidenceLabel}</span>
            {FC.confPills.map((p) => (
              <Pill key={p.label} pill={p} on={conf.includes(p.label)} onClick={() => toggle(conf, setConf, p.label)} />
            ))}
          </span>
          <span className="cjm-pr__filtergroup">
            <span className="cjm-pr__filterlabel">{COPY.readinessFilterLabel}</span>
            {FC.readyPills.map((p) => (
              <Pill key={p.label} pill={p} on={ready.includes(p.label)} onClick={() => toggle(ready, setReady, p.label)} />
            ))}
          </span>
          {anyFilter ? (
            <button type="button" className="cjm-link cjm-link--flush" onClick={clear}>
              {COPY.clearFilters}
            </button>
          ) : null}
        </div>

        {/* ---------- results ---------- */}
        <header className="cjm-fc__resultshead">
          <p className="cjm-eyebrow">{FC.heads[tab]}</p>
          <p className="cjm-fc__note">{note}</p>
        </header>

        {shown.length === 0 ? (
          <div className="cjm-pr__empty" role="status">
            <p className="cjm-pr__emptytitle">{COPY.emptyTitle}</p>
            <p className="cjm-pr__emptybody">{COPY.emptyBody}</p>
            <button type="button" className="cjm-btn" onClick={clear}>
              {COPY.clearFilters}
            </button>
          </div>
        ) : view === 'table' ? (
          <DeckTable decks={shown} colName={FC.colNames[tab]} go={go} />
        ) : (
          <DeckCards decks={shown} go={go} />
        )}
      </CompassJeffMvpColumn>
    </div>
  )
}

function Pill({ pill, on, onClick }: { pill: JeffMvpPracticePill; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      className={on ? 'cjm-fpill is-on' : 'cjm-fpill'}
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

/** The confidence and Readiness pills, which both views draw the same way —
 *  and which both label, unlike Practice's table. */
function DeckPills({ d }: { d: JeffMvpDeck }) {
  return (
    <>
      <span
        className="cjm-pill cjm-pill--conf"
        style={{
          background: `var(--cjm-${d.confBg})`,
          border: `1px solid var(--cjm-${d.confBorder})`,
          color: `var(--cjm-${d.confInk})`,
        }}
      >
        {d.conf}
        <span className="cjm-pr__confword">{COPY.confidenceWord}</span>
      </span>
      <span
        className="cjm-pill"
        style={{
          background: `var(--cjm-${d.badgeBg})`,
          border: `1px solid var(--cjm-${d.badgeBorder})`,
          color: `var(--cjm-${d.bandTone})`,
          flexDirection: 'column',
          gap: 0,
          lineHeight: 1.25,
        }}
      >
        {d.band}
        <span className="cjm-pr__confword">{COPY.readinessWordFmt(d.ready)}</span>
      </span>
    </>
  )
}

function DeckTable({
  decks,
  colName,
  go,
}: {
  decks: readonly JeffMvpDeck[]
  colName: string
  go: (p: JeffMvpPage) => () => void
}) {
  return (
    <table className="cjm-pr__table cjm-fc__table">
      <thead>
        <tr>
          <th scope="col">{colName}</th>
          <th scope="col">{COPY.confidenceCol}</th>
          <th scope="col">{COPY.readinessCol}</th>
          <th scope="col">{COPY.cardsCol}</th>
          <th scope="col">
            <span className="cjm-sr">{COPY.actionCol}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {decks.map((d) => (
          <tr key={d.title + d.eyebrow}>
            <td>
              {d.hasEyebrow ? <span className="cjm-pr__seteyebrow">{d.eyebrow}</span> : null}
              <span className="cjm-pr__settitle">{d.title}</span>
            </td>
            <td>
              <span
                className="cjm-pill cjm-pill--conf"
                style={{
                  background: `var(--cjm-${d.confBg})`,
                  border: `1px solid var(--cjm-${d.confBorder})`,
                  color: `var(--cjm-${d.confInk})`,
                }}
              >
                {d.conf}
                <span className="cjm-pr__confword">{COPY.confidenceWord}</span>
              </span>
            </td>
            <td>
              <span
                className="cjm-pill"
                style={{
                  background: `var(--cjm-${d.badgeBg})`,
                  border: `1px solid var(--cjm-${d.badgeBorder})`,
                  color: `var(--cjm-${d.bandTone})`,
                  flexDirection: 'column',
                  gap: 0,
                  lineHeight: 1.25,
                }}
              >
                {d.band}
                <span className="cjm-pr__confword">{COPY.readinessWordFmt(d.ready)}</span>
              </span>
            </td>
            <td>
              <span className="cjm-pr__status">{d.cardsLabel}</span>
              {d.hasBm ? (
                <span className="cjm-fc__bm">
                  {d.bm} {COPY.bookmarkedWord}
                </span>
              ) : null}
            </td>
            <td className="cjm-pr__action">
              <button type="button" className="cjm-btn" onClick={go('flashcard-topic')}>
                {COPY.startDeck}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function DeckCards({ decks, go }: { decks: readonly JeffMvpDeck[]; go: (p: JeffMvpPage) => () => void }) {
  return (
    <div className="cjm-fc__cards">
      {decks.map((d) => (
        <article className="cjm-fc__card" key={d.title + d.eyebrow}>
          <p className="cjm-fc__cardpills">
            <DeckPills d={d} />
          </p>
          {d.hasEyebrow ? <p className="cjm-pr__seteyebrow">{d.eyebrow}</p> : null}
          <p className="cjm-fc__cardtitle">{d.title}</p>
          <p className="cjm-fc__cardmeta">{d.cardsLabel}</p>
          {d.hasBm ? (
            <p className="cjm-fc__bm">
              <b>{d.bm}</b> {COPY.bookmarkedWord}
            </p>
          ) : null}
          <button type="button" className="cjm-btn" onClick={go('flashcard-topic')}>
            {COPY.startDeck}
          </button>
        </article>
      ))}
    </div>
  )
}

/** The same double arc Practice's weakest set uses: Readiness outside,
 *  reviewed inside. */
function DeckRing({ rec }: { rec: JeffMvpDeckRec }) {
  return (
    <div className="cjm-pr__ring">
      <div style={{ position: 'relative', width: 152, height: 152 }}>
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
        <span className="cjm-pr__ringmid" aria-hidden>
          <span
            className="cjm-pill"
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
