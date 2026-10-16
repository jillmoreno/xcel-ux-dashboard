import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassCourseLanding } from '@/components/learning/CompassCourseLanding'
import { SESSION_LESSON } from '@/data/compassSessionFixtures'

/**
 * RESUME LESSON, ON THE COMPASS LEARN PAGE (2026-10-16, Jillienne: "Learn >
 * Resume lesson should take user to the video screen").
 *
 * ⚠ IT WAS INERT ON PURPOSE, and the reason it was inert is the reason it is
 * wired THIS way. `CompassCourseLanding`'s note refused to wire it because
 * that "would assert a mapping nobody has made between her nineteen chapters
 * and the player's table of contents". The mapping still does not exist —
 * nineteen chapters, one lesson — so this opens the SESSION AT ITS FIRST
 * BEAT and claims nothing about which lesson that is. Mapping the row to a
 * chapter is still the thing not to do.
 *
 * The first case below is the one that matters: it pins that the first beat
 * is the VIDEO. If the fixture is ever reordered, "takes the user to the
 * video screen" quietly stops being true and nothing on screen would say so.
 */
function renderLanding(onResume?: () => void) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassCourseLanding onResume={onResume} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

afterEach(cleanup)

describe('Resume lesson', () => {
  it('the session’s first beat IS the video — which is what the ask depends on', () => {
    // Nothing points the session at a beat; it opens at index 0. So "the
    // video screen" is only true while the video is first.
    expect(SESSION_LESSON.beats[0].type).toBe('video')
  })

  it('is on in the committed baseline', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-resume-opens-session')
    expect(flag?.defaultEnabled).toBe(true)
    // The honest limitation is in the description, not just a code comment —
    // it is what a reviewer reads on the flag panel.
    expect(flag?.description).toMatch(/same lesson/i)
  })

  it('opens the session when it has a handler', () => {
    const onResume = vi.fn()
    renderLanding(onResume)
    fireEvent.click(screen.getByRole('button', { name: /Resume lesson/ }))
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('is drawn identically with no handler, so the off arm is the old design', () => {
    // The button is not hidden when inert — it is the design's, and removing
    // it would be a second change nobody asked for.
    renderLanding(undefined)
    const button = screen.getByRole('button', { name: /Resume lesson/ })
    expect(button).toBeInTheDocument()
    fireEvent.click(button) // and does nothing, without throwing
  })
})
