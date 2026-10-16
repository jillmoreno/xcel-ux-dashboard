import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AtlasReadinessCard } from '@/components/compass/AtlasReadinessCard'

/**
 * READINESS AT 0% (2026-10-16, Jillienne: "replace readiness back in for 0%,
 * just do not show anything in the graph. change the text to Not Started.
 * Will update as you progress through course material.").
 *
 * ⚠ THE FIRST PASS HID THE CARD, and that is worth remembering rather than
 * just replacing: a readiness score before any coursework is a number with
 * nothing behind it, so hiding it was not wrong about the NUMBER — it was
 * wrong about the card, because it hid the fact that readiness exists and is
 * coming. An empty dial that names itself says both.
 *
 * ⚠ NOT STARTED IS NOT A FIFTH LEVEL. It lives outside `LEVELS` on purpose:
 * the four are a scale, and "nothing measured yet" is not a point on it.
 * Folding it in would make it "level 1 of 5" — the exact claim the empty dial
 * avoids — which is what the aria-label case below guards.
 */
afterEach(cleanup)

const arc = () => document.querySelectorAll('path')[1]

describe('the Readiness card, not started', () => {
  it('draws the track and no arc', () => {
    render(<AtlasReadinessCard notStarted />)
    expect(arc().getAttribute('stroke-dasharray')).toMatch(/^0 /)
  })

  /* ⚠ IT IS A SENTENCE WEARING A LABEL'S CLOTHES, which is what this guards.
     The slot under the dial normally holds "Overall readiness" — a LABEL:
     uppercase, tracked out, `white-space: nowrap`. The not-started line is a
     sentence, and in that dress it shouted and ran past the card instead of
     wrapping. If the two ever share a style again, this is what says so. */
  it('reads as body text, not as the dial\u2019s label', () => {
    render(<AtlasReadinessCard notStarted />)
    const sentence = screen.getByText('Will update as you progress through course material')
    expect(sentence.style.textTransform).not.toBe('uppercase')
    expect(sentence.style.whiteSpace).not.toBe('nowrap')
    expect(sentence.style.letterSpacing).toBe('')
  })

  it('names itself and says when it will mean something', () => {
    render(<AtlasReadinessCard notStarted />)
    expect(screen.getByText('Not Started')).toBeInTheDocument()
    expect(
      screen.getByText('Will update as you progress through course material'),
    ).toBeInTheDocument()
    // …and the figure's usual caption is gone, not sitting alongside it.
    expect(screen.queryByText('Overall readiness')).toBeNull()
  })

  it('does not claim to be a level on the scale', () => {
    render(<AtlasReadinessCard notStarted />)
    const card = screen.getByRole('button')
    expect(card.getAttribute('aria-label')).toContain('Not Started')
    expect(card.getAttribute('aria-label'), 'not "level 1 of 5"').not.toMatch(/level \d+ of/)
  })

  it('pressing it enters the scale at the first band — the step-through is unchanged', () => {
    render(<AtlasReadinessCard notStarted />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.getByText('Overall readiness')).toBeInTheDocument()
    expect(arc().getAttribute('stroke-dasharray')).not.toMatch(/^0 /)
  })

  it('without the prop it opens on the first band, as before', () => {
    render(<AtlasReadinessCard />)
    expect(screen.getByText('Beginner')).toBeInTheDocument()
    expect(screen.queryByText('Not Started')).toBeNull()
    // FOUR bands since 2026-10-16 — Beginner · Developing · Proficient ·
    // Ready, from Jillienne's bands image. It was five differently-named
    // ones (Novice … Exam Ready).
    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/level 1 of 4/)
  })
})
