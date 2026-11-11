import { ArrowRotateLeft, Bullseye, ChevronRight, Notebook, RubiLogo, Thumbtack } from '@/icons'
import {
  JEFF_MVP_FC_TOPIC as TOPIC,
  JEFF_MVP_FC_TOPIC_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn } from './CompassRefinedChrome'
import './compassRefined.css'

/**
 * A FLASHCARDS TOPIC — 2026-11-09, the ninth page ported and the first that
 * his rail cannot reach: it opens from a deck on the Flashcards page.
 *
 * ⚠ THE THREE MODES ARE ROUTES INTO A SESSION, NOT FILTERS ON THIS LIST.
 * Spaced Repetition, Confidence and Bookmarked Flashcards each start a study
 * session ordered differently — the subtopic list below does not change when
 * one is picked. Their shape invites being read as a filter bar, and reading
 * them that way would make the page look like it was doing something it is
 * not.
 *
 * ⚠ IT HAS A BREADCRUMB BECAUSE IT HAS NO RAIL ROW. The rail cannot show
 * where you are on a page it does not list, so the crumb back to Flashcards
 * is the only thing that can — which is why it is the first element.
 */
export function CompassRefinedFlashcardTopic({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  const modeIcon = (key: string) =>
    key === 'spaced' ? ArrowRotateLeft : key === 'confidence' ? Bullseye : Thumbtack

  return (
    <div className="crf-page">
      <button type="button" className="crf-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassRefinedColumn>
        <nav className="crf-crumb" aria-label="Breadcrumb">
          <button type="button" className="crf-crumb__link" onClick={go('flashcards')}>
            {COPY.crumbRoot}
          </button>
          <span className="crf-crumb__sep" aria-hidden>
            /
          </span>
          <span className="crf-crumb__here">{TOPIC.topicTitle}</span>
        </nav>

        <header className="crf-ftopic__head">
          <p className="crf-eyebrow">{TOPIC.topicMeta}</p>
          <h1 className="crf-h1">{TOPIC.topicTitle}</h1>
          <div className="crf-ftopic__modes">
            <button type="button" className="crf-cta" onClick={go('flashcard-study')}>
              <Notebook size={14} aria-hidden />
              {TOPIC.studyAllLabel}
            </button>
            {TOPIC.modes.map((m) => {
              const Icon = modeIcon(m.key)
              return (
                <button key={m.key} type="button" className="crf-btn" onClick={go('flashcard-study')}>
                  <Icon size={13} aria-hidden />
                  {m.label}
                </button>
              )
            })}
          </div>
        </header>

        <section className="crf-ftopic__list" aria-label={COPY.subtopicsHeading}>
          <header className="crf-ftopic__listhead">
            <p className="crf-eyebrow">{COPY.subtopicsHeading}</p>
            <p className="crf-fc__note">{TOPIC.listNote}</p>
          </header>
          {TOPIC.subs.map((s) => (
            <article className="crf-ftopic__row" key={s.title}>
              <div className="crf-ftopic__name">
                <p className="crf-pr__seteyebrow">{COPY.subtopicEyebrow}</p>
                <p className="crf-pr__settitle">{s.title}</p>
              </div>
              <div className="crf-ftopic__score">
                <span className="crf-pr__seteyebrow">{COPY.readinessLabel}</span>
                <span className="crf-ftopic__band">
                  <span className="crf-sub__bar" aria-hidden>
                    {s.segs.map((g, i) => (
                      <span
                        key={i}
                        style={{ flex: `${g.flex} 1 0`, height: g.height, background: `var(--cjm-${g.tone})` }}
                      />
                    ))}
                  </span>
                  <b style={{ color: `var(--cjm-${s.bandTone})` }}>{s.band}</b>
                  <span>{s.conf}%</span>
                </span>
              </div>
              {/* ⚠ "7 cards · 3 due" ONLY WHEN SOMETHING IS DUE — his `hasDue`.
                  A row reading "9 cards · 0 due" would make nothing look like
                  something. */}
              <span className="crf-ftopic__cards">{COPY.cardsFmt(s.cards, s.hasDue ? s.due : 0)}</span>
              <button type="button" className="crf-btn" onClick={go('flashcard-study')}>
                {COPY.study}
                <ChevronRight size={12} aria-hidden />
              </button>
            </article>
          ))}
        </section>
      </CompassRefinedColumn>
    </div>
  )
}
