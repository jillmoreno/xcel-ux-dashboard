import { useState } from 'react'
import { Notebook, Thumbtack } from '@/icons'
import {
  JEFF_MVP_CARD_STUDY as CS,
  JEFF_MVP_CARD_STUDY_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassRefinedColumn } from './CompassRefinedChrome'
import { WorkspaceRail } from './CompassRefinedQuestionSet'
import './compassRefined.css'

/**
 * A FLASHCARD STUDY SESSION — 2026-11-09, the twelfth page ported.
 *
 * ⚠ BOTH FACES ARE IN THE DOM AT ONCE. His card is a CSS flip, not a content
 * swap — term and definition both rendered, one turned away. Swapping the
 * content would look right and lose the flip, and would fail parity besides,
 * because his `innerText` carries both on either face.
 *
 * ⚠ THE RATING IS THE POINT OF THE SCREEN. Flipping reveals "How well did
 * you know it?" with three levels, and that rating is the confidence the
 * Flashcards page filters by — the same relationship the question set has
 * with Practice. These two session pages are where every confidence figure
 * in his MVP actually comes from.
 */
export function CompassRefinedCardStudy({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [rated, setRated] = useState<string | null>(null)

  return (
    <div className="crf-page">
      <CompassRefinedColumn>
        <nav className="crf-crumb" aria-label="Breadcrumb">
          <button
            type="button"
            className="crf-crumb__link"
            onClick={() => onSelectPage?.('flashcards')}
          >
            {COPY.crumbRoot}
          </button>
        </nav>

        <header className="crf-qs__head">
          <span className="crf-qs__tile" aria-hidden>
            <Notebook size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className="crf-qs__title crf-serif">{CS.deckTitle}</h1>
            <p className="crf-qs__meta">{CS.deckSub}</p>
          </div>
          <div className="crf-qs__headright">
            <button type="button" className="crf-btn">
              {CS.sortLabel}
            </button>
            <span className="crf-qs__pos">{COPY.progressFmt(CS.pos, CS.total)}</span>
          </div>
        </header>

        {/* ⚠ ONE CARD, TWO FACES, BOTH RENDERED. */}
        <button
          type="button"
          className={flipped ? 'crf-cs__card is-back' : 'crf-cs__card'}
          aria-label={CS.cardAria}
          onClick={() => setFlipped(!flipped)}
        >
          <span className="crf-cs__face crf-cs__front">
            <span className="crf-pr__seteyebrow">{COPY.termLabel}</span>
            <span className="crf-cs__term">{CS.term}</span>
            <span className="crf-cs__hint">{COPY.flipHint}</span>
          </span>
          <span className="crf-cs__face crf-cs__back">
            <span className="crf-cs__termsm">{CS.term}</span>
            <span className="crf-cs__def">{CS.def}</span>
          </span>
        </button>

        {flipped ? (
          <div className="crf-cs__rate">
            <p className="crf-cs__ratq">{COPY.howWell}</p>
            <div className="crf-cs__rates">
              {CS.rates.map((r, i) => (
                <button
                  key={r.level}
                  type="button"
                  aria-pressed={rated === r.level}
                  className={rated === r.level ? 'crf-cs__rateopt is-on' : 'crf-cs__rateopt'}
                  style={{ borderColor: `var(--cjm-${r.tone})`, color: `var(--cjm-${r.tone})` }}
                  onClick={() => setRated(r.level)}
                >
                  <b>{i + 1}</b>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="crf-cs__nav">
            <button type="button" className="crf-btn">
              {COPY.previous}
            </button>
            <button type="button" className="crf-btn" onClick={() => setFlipped(true)}>
              <kbd>{COPY.space}</kbd>
              {COPY.flip}
            </button>
            <button type="button" className="crf-btn">
              {COPY.next}
            </button>
          </div>
        )}

        {/* ⚠ ICON-ONLY, 40×40, LABELLED FOR SCREEN READERS ONLY — his
            `bmLabel` and `saveLabel` are aria-labels, not captions. Printing
            them put two phrases on his page that are not on it. */}
        <div className="crf-cs__tools" role="group" aria-label="Save or give feedback on this card">
          <button type="button" className="crf-cs__tbtn" aria-pressed={false} aria-label={CS.bmLabel}>
            <Thumbtack size={16} aria-hidden />
          </button>
          <button type="button" className="crf-cs__tbtn" aria-label={CS.saveLabel}>
            <Notebook size={16} aria-hidden />
          </button>
        </div>
      </CompassRefinedColumn>

      <WorkspaceRail />
    </div>
  )
}
