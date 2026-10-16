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
 * ⚠ NOT STARTED IS NOT A SIXTH LEVEL. It lives outside `LEVELS` on purpose:
 * the five are a scale, and "nothing measured yet" is not a point on it.
 * Folding it in would make it "level 1 of 6" — the exact claim the empty dial
 * avoids — which is what the aria-label case below guards.
 */
afterEach(cleanup)

const arc = () => document.querySelectorAll('path')[1]

describe('the Readiness card, not started', () => {
  it('draws the track and no arc', () => {
    render(<AtlasReadinessCard notStarted />)
    expect(arc().getAttribute('stroke-dasharray')).toMatch(/^0 /)
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
    expect(card.getAttribute('aria-label'), 'not "level 1 of 6"').not.toMatch(/level \d+ of/)
  })

  it('pressing it enters the scale at Novice — the step-through is unchanged', () => {
    render(<AtlasReadinessCard notStarted />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Novice')).toBeInTheDocument()
    expect(screen.getByText('Overall readiness')).toBeInTheDocument()
    expect(arc().getAttribute('stroke-dasharray')).not.toMatch(/^0 /)
  })

  it('without the prop it is the five-level card, untouched', () => {
    render(<AtlasReadinessCard />)
    expect(screen.getByText('Novice')).toBeInTheDocument()
    expect(screen.queryByText('Not Started')).toBeNull()
    expect(screen.getByRole('button').getAttribute('aria-label')).toMatch(/level 1 of 5/)
  })
})
