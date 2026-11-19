import { ArrowRotateLeft, Bullseye, ChevronRight, Notebook, RubiLogo, Thumbtack } from '@/icons'
import {
  JEFF_MVP_FC_TOPIC as TOPIC,
  JEFF_MVP_FC_TOPIC_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

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
export function CompassJeffMvpFlashcardTopic({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  const modeIcon = (key: string) =>
    key === 'spaced' ? ArrowRotateLeft : key === 'confidence' ? Bullseye : Thumbtack

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        <nav className="cjm-crumb" aria-label="Breadcrumb">
          <button type="button" className="cjm-crumb__link" onClick={go('flashcards')}>
            {COPY.crumbRoot}
          </button>
          <span className="cjm-crumb__sep" aria-hidden>
            /
          </span>
          <span className="cjm-crumb__here">{TOPIC.topicTitle}</span>
        </nav>

        <header className="cjm-ftopic__head">
          <p className="cjm-eyebrow">{TOPIC.topicMeta}</p>
          <h1 className="cjm-h1 cjm-serif">{TOPIC.topicTitle}</h1>
          <div className="cjm-ftopic__modes">
            <button type="button" className="cjm-cta" onClick={go('flashcard-study')}>
              <Notebook size={14} aria-hidden />
              {TOPIC.studyAllLabel}
            </button>
            {TOPIC.modes.map((m) => {
              const Icon = modeIcon(m.key)
              return (
                <button key={m.key} type="button" className="cjm-btn" onClick={go('flashcard-study')}>
                  <Icon size={13} aria-hidden />
                  {m.label}
                </button>
              )
            })}
          </div>
        </header>

        <section className="cjm-ftopic__list" aria-label={COPY.subtopicsHeading}>
          <header className="cjm-ftopic__listhead">
            <p className="cjm-eyebrow">{COPY.subtopicsHeading}</p>
            <p className="cjm-fc__note">{TOPIC.listNote}</p>
          </header>
          {TOPIC.subs.map((s) => (
            <article className="cjm-ftopic__row" key={s.title}>
              <div className="cjm-ftopic__name">
                <p className="cjm-pr__seteyebrow">{COPY.subtopicEyebrow}</p>
                <p className="cjm-pr__settitle">{s.title}</p>
              </div>
              <div className="cjm-ftopic__score">
                <span className="cjm-pr__seteyebrow">{COPY.readinessLabel}</span>
                <span className="cjm-ftopic__band">
                  <span className="cjm-sub__bar" aria-hidden>
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
              <span className="cjm-ftopic__cards">{COPY.cardsFmt(s.cards, s.hasDue ? s.due : 0)}</span>
              <button type="button" className="cjm-btn" onClick={go('flashcard-study')}>
                {COPY.study}
                <ChevronRight size={12} aria-hidden />
              </button>
            </article>
          ))}
        </section>
      </CompassJeffMvpColumn>
    </div>
  )
}
