import { useState } from 'react'
import { ArrowLeft, ArrowRight } from '@/icons'
import type { JeffCard, JeffSection } from '@/data/compassJeffFixtures'

/**
 * HIS INLINE FLASHCARD DECK — Lesson 2 · Section 2.5, "Optional practice".
 *
 * ⚠ IT IS IN THE LESSON, NOT IN THE STUDIO, and that distinction cost this
 * port a wrong plan. The Studio's "Flashcards" tile makes an artefact whose
 * button asks the notebook a question; THIS is the only place in his
 * prototype where a card is actually turned over. A section whose type is
 * "Optional practice" carries its own deck, inline, where the learner just
 * read the material it is made of.
 *
 * ⚠ RATING A CARD ADVANCES IT. His `pick` saves the rating, announces
 * "<label> saved for <term>", and moves on after a beat — the learner never
 * presses next during a run. Prev/next exist for going back over one.
 *
 * ⚠ AND THE DECK ENDS SOMEWHERE. "Deck complete" counts the three ratings and
 * offers to flag the still-learning cards into Compass, which is what joins
 * this to the rest of the surface: the cards you did not know become flags you
 * can review before the exam.
 */
export function CompassJeffDeck({
  sec,
  onFlag,
}: {
  sec: JeffSection
  /** Files the still-learning cards as flags — "Flashcard: <term>". */
  onFlag: (cards: JeffCard[], num: string) => void
}) {
  const cards = sec.cards ?? []
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [back, setBack] = useState(false)
  const [ratings, setRatings] = useState<Record<number, Rating>>({})
  const [done, setDone] = useState(false)
  const [flagged, setFlagged] = useState(false)
  const [said, setSaid] = useState('')

  if (!cards.length) return null
  const at = Math.min(pos, order.length - 1)
  const card = cards[order[at]]
  const counts = { retry: 0, almost: 0, got: 0 }
  Object.values(ratings).forEach((r) => {
    counts[r] += 1
  })
  const toWork = cards.map((_, i) => i).filter((i) => ratings[i] && ratings[i] !== 'got')

  const advance = () => {
    setBack(false)
    if (at + 1 < order.length) setPos(at + 1)
    else setDone(true)
  }
  const rate = (r: Rating) => {
    setRatings((x) => ({ ...x, [order[at]]: r }))
    setSaid(`${RATES.find((x) => x[0] === r)![1]} saved for ${card.front}`)
    advance()
  }
  const restart = (only?: number[]) => {
    setOrder(only ?? cards.map((_, i) => i))
    setPos(0)
    setBack(false)
    setDone(false)
    if (!only) {
      setRatings({})
      setFlagged(false)
    }
  }

  if (done) {
    return (
      <div className="cre-jcd" role="group" aria-label="Flashcards — deck complete">
        <p className="serif cre-jcd-done-title">Deck complete</p>
        <div className="cre-jcd-counts">
          <span className="is-got">{counts.got} got it</span>
          <span className="is-almost">{counts.almost} almost</span>
          <span className="is-retry">{counts.retry} still learning</span>
        </div>
        <div className="cre-jcd-end">
          <button
            type="button"
            className="cre-jcd-end-btn"
            onClick={() => {
              if (!counts.retry) {
                restart()
                return
              }
              if (!flagged) {
                onFlag(
                  toWork.map((i) => cards[i]),
                  sec.num,
                )
                setFlagged(true)
              }
            }}
          >
            {counts.retry
              ? flagged
                ? 'View flags in Compass'
                : `Flag ${counts.retry} for review in Compass`
              : 'Start over'}
          </button>
          {toWork.length > 0 && (
            <button type="button" className="cre-jcd-ghost" onClick={() => restart(toWork)}>
              Review the {toWork.length} you missed
            </button>
          )}
          <button type="button" className="cre-jcd-ghost" onClick={() => restart()}>
            Start over
          </button>
        </div>
        {counts.retry > 0 && (
          <p className="cre-jcd-note">
            {flagged
              ? `${counts.retry} still-learning ${counts.retry === 1 ? 'card is' : 'cards are'} flagged in Compass.`
              : 'Adds your still-learning cards to Flags so you can review them later.'}
          </p>
        )}
        <span role="status" className="cre-jc-sr">
          {said}
        </span>
      </div>
    )
  }

  return (
    <div className="cre-jcd" role="group" aria-label="Flashcards">
      <p className="cre-jcd-pos">
        {at + 1} of {order.length}
      </p>
      <div className="cre-jcd-meter" aria-hidden>
        <div style={{ width: `${Math.round((at / order.length) * 100)}%` }} />
      </div>
      {/* ⚠ THE WHOLE CARD IS THE CONTROL, and the back is dark — his one
          inverted panel in the reading column. A small "flip" button beside a
          static card would be a different interaction. */}
      <button
        type="button"
        className={`cre-jcd-card${back ? ' is-back' : ''}`}
        aria-label={`Flashcard ${at + 1} of ${order.length}. ${
          back ? `Answer: ${card.back}` : `Term: ${card.front}. Select to reveal the answer.`
        }`}
        onClick={() => setBack((b) => !b)}
      >
        {back ? card.back : card.front}
      </button>

      {back ? (
        <div className="cre-jcd-rates" role="group" aria-label="How well did you know it?">
          {RATES.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={`cre-jcd-rate is-${key}`}
              aria-pressed={ratings[order[at]] === key}
              onClick={() => rate(key)}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <p className="cre-jcd-hint">Select the card to reveal the answer.</p>
      )}

      <div className="cre-jcd-nav">
        <button
          type="button"
          className="cre-jcd-ghost"
          disabled={at === 0}
          onClick={() => {
            setPos(Math.max(0, at - 1))
            setBack(false)
          }}
        >
          <ArrowLeft size={14} aria-hidden />
          Previous card
        </button>
        <button type="button" className="cre-jcd-ghost" onClick={advance}>
          Next card
          <ArrowRight size={14} aria-hidden />
        </button>
      </div>
      <span role="status" className="cre-jc-sr">
        {said}
      </span>
    </div>
  )
}

type Rating = 'retry' | 'almost' | 'got'
/** His three, in his order and his words. */
const RATES: [Rating, string][] = [
  ['retry', 'Still learning'],
  ['almost', 'Almost'],
  ['got', 'Got it'],
]
