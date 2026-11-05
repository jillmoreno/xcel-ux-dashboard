import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { DesignSurfaceProvider } from '@/context/DesignSurfaceProvider'
import { useDesignSurface } from '@/context/designSurface'
import { FEATURE_FLAGS, FeatureFlagProvider, designControlsFor } from '@/context/FeatureFlagContext'
import { CompassLessonVersion } from '@/components/learning/CompassLessonVersion'
import { useCourseChrome } from '@/components/learning/courseTakeover'
import { SESSION_LESSON } from '@/data/compassSessionFixtures'

/**
 * WHICH VERSION OF THE COURSE CONTENT — `compass-content-version`, 2026-11-05,
 * the direct ask: "a design tool dropdown to show Anjanis Version (current),
 * Jeffs Version (what I will upload), and then a Refined Version (to come
 * later)".
 *
 * ⚠ WHAT THESE PIN IS THE SWITCH, NOT THE LESSONS. Two of the three arms are
 * empty — Jeff's file has not arrived and the refined version does not exist —
 * so there is nothing of theirs to assert. What there IS to assert is every
 * way the switch can strand a reviewer, and those are the three cases below
 * that carry a ⚠:
 *
 *   - an empty arm must NOT quietly render Anjani's lesson under another name
 *   - an empty arm must keep its own control ON the Design bar, or picking
 *     Jeff is a one-way door
 *   - an empty arm must leave the app header standing, since it draws no bar
 *     of its own to carry a way out
 *
 * Jeff's course landed on 2026-11-05, and the first case failed exactly as
 * this note said it should. It now asserts his content; the empty-arm rules
 * below are the `refined` arm's, which is still waiting.
 */

/** Reads the chrome store and the declared design surface off the DOM. */
function Probe() {
  return <span data-chrome={useCourseChrome()} data-surface={useDesignSurface() ?? ''} />
}

const chromeNow = () => document.querySelector('[data-chrome]')?.getAttribute('data-chrome') ?? null
const surfaceNow = () => document.querySelector('[data-surface]')?.getAttribute('data-surface') ?? null

function renderLesson(ff?: string, onExit: () => void = () => {}) {
  const url = ff ? `/dashboard-rebrand?ff=${ff}` : '/dashboard-rebrand'
  window.history.replaceState({}, '', url)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <DesignSurfaceProvider>
            <Probe />
            <CompassLessonVersion onExit={onExit} />
          </DesignSurfaceProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Her lesson, named by the fixture rather than by a string typed here. */
const anjanisLesson = () => screen.queryAllByText(SESSION_LESSON.chapter).length > 0

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('compass-content-version', () => {
  it('opens on Anjani’s version, which is what ships', () => {
    /* The arm is the question; the baseline is not. A default of anything else
       would move a live surface for every reviewer who never opened the bar. */
    renderLesson()
    expect(anjanisLesson()).toBe(true)
    expect(chromeNow()).toBe('takeover')
  })

  it('⚠ Jeff’s arm renders HIS course, not hers', () => {
    /* THE CASE THIS SUITE EXISTS FOR, and it has now been through both of its
       lives. While his arm was empty it asserted that the placeholder said so
       rather than quietly falling back to her lesson — a silent fallback
       renders HER session under HIS name and nothing on screen corrects the
       reviewer. His course landed on 2026-11-05 and this case failed, which
       was the intended signal: the assertion is now that his content is
       there and hers is not. Parity with his build is
       `CompassJeffCourse.test.tsx`; this is the SWITCH. */
    renderLesson('compass-content-version:jeff')
    expect(anjanisLesson()).toBe(false)
    expect(screen.getByText(/Chapter 2 Insurers and Insurance Markets/)).toBeTruthy()
    /* His right rail is an `<aside>`, so it lands as `complementary` — not
       `region`, which is what the first version of this assertion looked for. */
    expect(screen.getByRole('complementary', { name: 'Compass' })).toBeTruthy()
  })

  it('the refined arm is drawn too, so the comparison has three seats', () => {
    renderLesson('compass-content-version:refined')
    expect(anjanisLesson()).toBe(false)
    expect(screen.getByText('Refined version')).toBeTruthy()
  })

  it('⚠ an empty arm keeps the control on the bar — picking Jeff is not a one-way door', () => {
    /* The Design bar scopes controls by the surface on screen. An arm that
       failed to declare `compass:session` would take its OWN dropdown off the
       bar the moment it rendered, leaving no control to pick Anjani back. */
    renderLesson('compass-content-version:jeff')
    expect(surfaceNow()).toBe('compass:session')
    const onSession = designControlsFor('eric-atlas-e2e', 'eric', 'compass:session').map((f) => f.key)
    expect(onSession).toContain('compass-content-version')
  })

  it('⚠ the refined arm leaves the app header standing, and offers a way back', async () => {
    /* The session stands the header down because it draws its own bar; a
       placeholder draws no bar, so standing it down would leave a reviewer on
       a bare page with no product navigation at all. */
    const onExit = vi.fn()
    const { unmount } = renderLesson('compass-content-version:refined', onExit)
    expect(chromeNow()).toBe('none')
    await userEvent.click(screen.getByRole('button', { name: /Back to Learn/ }))
    expect(onExit).toHaveBeenCalledTimes(1)
    unmount()
    expect(chromeNow()).toBeNull()
  })

  it('⚠ Jeff’s course keeps the Atlas header rather than taking it down', async () => {
    /* `course`, not `takeover`: his export draws its own XCEL lockup because
       it is standalone, and this product's header already carries it. Taking
       the header down and drawing his would be two lockups stacked — the case
       `CourseContentV2` recorded in 2026-09-23. His Exit course is wired to
       the same way out the session uses. */
    const onExit = vi.fn()
    const { unmount } = renderLesson('compass-content-version:jeff', onExit)
    expect(chromeNow()).toBe('course')
    await userEvent.click(screen.getByRole('button', { name: /Exit course/ }))
    expect(onExit).toHaveBeenCalledTimes(1)
    unmount()
    expect(chromeNow()).toBeNull()
  })

  it('⚠ an unknown arm falls back to the shipped lesson', () => {
    /* A stale stored value or a hand-edited link must not leave a reviewer on
       a placeholder nobody chose. */
    renderLesson('compass-content-version:nonsense')
    expect(anjanisLesson()).toBe(true)
  })

  it('is a DESIGN control, scoped to the session, with her arm as the default', () => {
    const f = FEATURE_FLAGS.find((x) => x.key === 'compass-content-version')!
    expect(f.surface).toBe('design')
    expect(f.owner).toBe('anjani')
    expect(f.surfaces).toEqual(['compass:session'])
    expect(f.versions).toContain('eric-atlas-e2e')
    expect(f.defaultVariant).toBe('anjani')
    expect(f.variants?.map((v) => v.value)).toEqual(['anjani', 'jeff', 'refined'])
  })
})
