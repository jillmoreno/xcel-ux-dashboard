import { useState } from 'react'
import { Notebook, Thumbtack } from '@/icons'
import {
  JEFF_MVP_CARD_STUDY as CS,
  JEFF_MVP_CARD_STUDY_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn } from './CompassJeffMvpShell'
import { WorkspaceRail } from './CompassJeffMvpQuestionSet'
import './compassJeffMvp.css'

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
export function CompassJeffMvpCardStudy({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [flipped, setFlipped] = useState(false)
  const [rated, setRated] = useState<string | null>(null)

  return (
    <div className="cjm-page">
      <CompassJeffMvpColumn>
        <nav className="cjm-crumb" aria-label="Breadcrumb">
          <button
            type="button"
            className="cjm-crumb__link"
            onClick={() => onSelectPage?.('flashcards')}
          >
            {COPY.crumbRoot}
          </button>
        </nav>

        <header className="cjm-qs__head">
          <span className="cjm-qs__tile" aria-hidden>
            <Notebook size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className="cjm-qs__title cjm-serif">{CS.deckTitle}</h1>
            <p className="cjm-qs__meta">{CS.deckSub}</p>
          </div>
          <div className="cjm-qs__headright">
            <button type="button" className="cjm-btn">
              {CS.sortLabel}
            </button>
            <span className="cjm-qs__pos">{COPY.progressFmt(CS.pos, CS.total)}</span>
          </div>
        </header>

        {/* ⚠ ONE CARD, TWO FACES, BOTH RENDERED. */}
        <button
          type="button"
          className={flipped ? 'cjm-cs__card is-back' : 'cjm-cs__card'}
          aria-label={CS.cardAria}
          onClick={() => setFlipped(!flipped)}
        >
          <span className="cjm-cs__face cjm-cs__front">
            <span className="cjm-pr__seteyebrow">{COPY.termLabel}</span>
            <span className="cjm-cs__term">{CS.term}</span>
            <span className="cjm-cs__hint">{COPY.flipHint}</span>
          </span>
          <span className="cjm-cs__face cjm-cs__back">
            <span className="cjm-cs__termsm">{CS.term}</span>
            <span className="cjm-cs__def">{CS.def}</span>
          </span>
        </button>

        {flipped ? (
          <div className="cjm-cs__rate">
            <p className="cjm-cs__ratq">{COPY.howWell}</p>
            <div className="cjm-cs__rates">
              {CS.rates.map((r, i) => (
                <button
                  key={r.level}
                  type="button"
                  aria-pressed={rated === r.level}
                  className={rated === r.level ? 'cjm-cs__rateopt is-on' : 'cjm-cs__rateopt'}
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
          <div className="cjm-cs__nav">
            <button type="button" className="cjm-btn">
              {COPY.previous}
            </button>
            <button type="button" className="cjm-btn" onClick={() => setFlipped(true)}>
              <kbd>{COPY.space}</kbd>
              {COPY.flip}
            </button>
            <button type="button" className="cjm-btn">
              {COPY.next}
            </button>
          </div>
        )}

        {/* ⚠ ICON-ONLY, 40×40, LABELLED FOR SCREEN READERS ONLY — his
            `bmLabel` and `saveLabel` are aria-labels, not captions. Printing
            them put two phrases on his page that are not on it. */}
        <div className="cjm-cs__tools" role="group" aria-label="Save or give feedback on this card">
          <button type="button" className="cjm-cs__tbtn" aria-pressed={false} aria-label={CS.bmLabel}>
            <Thumbtack size={16} aria-hidden />
          </button>
          <button type="button" className="cjm-cs__tbtn" aria-label={CS.saveLabel}>
            <Notebook size={16} aria-hidden />
          </button>
        </div>
      </CompassJeffMvpColumn>

      <WorkspaceRail />
    </div>
  )
}
