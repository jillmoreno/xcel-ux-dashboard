import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3,
  isQualifyingEducationVersion,
} from '@/data/dashboardVersions'
import {
  dashboardLayoutForVersion,
  hiddenRailSectionsFor,
} from '@/components/layout/dashboardRail'

/**
 * TESTING 3 — Testing, with the course and its coursework as ONE block.
 * 2026-10-01.
 *
 * The argument: "Current course" and "Complete coursework" are the same subject
 * in two columns. Both name the course; both say how far through it the learner
 * is — one as a percentage and a bar, the other as six stops with ticks. This
 * version says it once.
 *
 * ⚠ WHAT THIS FILE MOSTLY GUARDS IS THE INHERITANCE, not the new block. Testing
 * 3 exists to compare ONE thing, so every other difference from Testing is a
 * defect — and the way a cloned version rots is that a later change teaches
 * `testing` something and forgets `testing-3`, which nothing on screen would
 * show. The combined block is the easy half to test; the sameness is the half
 * that needs pinning.
 *
 * ⚠ IT IS NOT "Testing 2". That id (`discoverability-testing-2`) is an older,
 * archived version with a live Study Pace tile, which still resolves and is the
 * only route to the Study Pace Adjust sheet. The numbering carried on past it
 * rather than reusing it.
 */

const T3 = '/dashboard-rebrand?demo=1&version=discoverability-testing-3'
const T1 = '/dashboard-rebrand?demo=1&version=discoverability-testing'

function renderShell(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const courseCard = () =>
  document.querySelector('section[aria-label="Current course"]') as HTMLElement

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
  window.history.replaceState({}, '', '/dashboard-rebrand')
})

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('Testing 3 — the version itself', () => {
  it('is in the picker, directly after its parent', () => {
    /* The picker is the only place the lineage is visible, and reading them in
       order is what makes the one difference legible. */
    const ids = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)
    expect(ids[ids.indexOf('discoverability-testing') + 1]).toBe('discoverability-testing-3')
  })

  it('did NOT take the archived Testing 2 id', () => {
    /* ⚠ THE WHOLE REASON THIS VERSION IS CALLED THREE. `testing-2` is archived
       from the picker but still resolves, still has its Archive row, and is the
       only route to the Study Pace Adjust sheet. Reusing the id would have
       broken all three silently. */
    expect(DISCOVERABILITY_DASHBOARD_VERSION_TESTING_3.id).toBe('discoverability-testing-3')
    expect(dashboardLayoutForVersion('discoverability-testing-2')).toBe('testing-2')
    expect(dashboardLayoutForVersion('discoverability-testing-3')).toBe('testing-3')
  })

  it('resolves a qualifying journey and inherits Testing’s rail trim', () => {
    /* Two of the inheritances that are decided OUTSIDE the band, which is
       exactly where a clone forgets to follow. */
    expect(isQualifyingEducationVersion('discoverability-testing-3')).toBe(true)
    expect(hiddenRailSectionsFor('testing-3')).toEqual(hiddenRailSectionsFor('testing'))
  })
})

describe('the combined block', () => {
  it('puts the coursework stops inside the Current course card', () => {
    renderShell(T3)
    const card = within(courseCard())
    /* Both halves, one card: the course identity and action… */
    expect(card.getByText('Current course')).toBeTruthy()
    expect(card.getByRole('button', { name: /Resume|Start course/ })).toBeTruthy()
    /* …and the coursework that the percentage is made of. */
    expect(card.getByText('Complete Coursework')).toBeTruthy()
    expect(card.getByText(/Pre-Licensing Lessons/)).toBeTruthy()
    expect(card.getByText(/Survey & Certificate/)).toBeTruthy()
  })

  it('numbers the block Step 1, and the column carries on at Step 2', () => {
    /* 2026-10-01, the direct ask. ⚠ BOTH HALVES ARE THE ASSERTION. Numbering
       the block only matters because the column continues from it — label this
       1 and renumber the column 1-3 and the page would claim the journey has
       three steps, which is a different claim about the product than the one
       this version makes. The coursework did not stop being step 1, it moved. */
    renderShell(T3)
    expect(within(courseCard()).getByText(/Step 1 · Atlas Study Journey/)).toBeTruthy()
    const column = document.querySelector('section[aria-label="Pass State Exam"]') as HTMLElement
    expect(within(column).getByText(/Step 2/)).toBeTruthy()
  })

  it('does NOT also leave a coursework card in the journey column', () => {
    /* ⚠ THE DEFECT THIS VERSION EXISTS TO REMOVE, reappearing as a bug. A
       combined block with the stops ALSO in the right column is the same list
       twice — worse than what it replaced, and nothing would throw. */
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Study journey"]')).toBeNull()
    expect(screen.getAllByText('Complete Coursework')).toHaveLength(1)
  })

  it('keeps the stops OUT of the course card on Testing', () => {
    /* The control arm. The direction a clone most easily breaks is the parent:
       a prop defaulted the wrong way would combine both versions and leave
       nothing to compare. */
    renderShell(T1)
    expect(within(courseCard()).queryByText('Complete Coursework')).toBeNull()
    expect(document.querySelector('section[aria-label="Study journey"]')).toBeTruthy()
  })
})

describe('the lesson line, nested in the coursework', () => {
  /* 2026-10-01, the direct ask: "move the lesson section to be within the
     complete coursework, under the pre-licensing lessons to better indicate
     where the user is." */

  it('sits inside the stops list, under the live stop', () => {
    renderShell(T3)
    const lesson = within(courseCard()).getByText(/Life Insurance Premiums/)
    const li = lesson.closest('li')
    expect(li, 'the lesson block is not inside a stop row').toBeTruthy()
    /* ⚠ UNDER THE RIGHT STOP, not merely somewhere in the list. The `li` it
       lands in must be the one naming the stop the learner is on — a block that
       slid under Course Exam would still pass a "nested" check and would be
       saying the learner is somewhere they are not. */
    expect(li!.textContent).toMatch(/Pre-Licensing Lessons/)
  })

  it('takes Resume with it — the card keeps exactly one', () => {
    /* ⚠ COUNTED. The block is built once and PLACED, so a refactor that copies
       it instead would give the card two Resume buttons, and `home.resume` is a
       registered CTA that a moderated run counts. */
    renderShell(T3)
    const resumes = within(courseCard()).getAllByRole('button', {
      name: /Resume|Start course|Review course/,
    })
    expect(resumes).toHaveLength(1)
    expect(resumes[0].closest('li')?.textContent).toMatch(/Pre-Licensing Lessons/)
  })

  it('leaves the lesson line where it was on Testing', () => {
    /* The control arm: `stopDetail` is a slot on a SHARED rail, so the way this
       breaks is the lesson appearing inside every version's journey. */
    renderShell(T1)
    const lesson = screen.getByText(/Life Insurance Premiums/)
    expect(lesson.closest('li')).toBeNull()
  })

  it('leaves every other stop without a nested block', () => {
    renderShell(T3)
    const nested = [...courseCard().querySelectorAll('li')].filter((li) =>
      /Life Insurance Premiums/.test(li.textContent ?? ''),
    )
    expect(nested).toHaveLength(1)
  })
})

describe('the coursework stop says how far in the learner is', () => {
  /* 2026-10-01, the direct ask: "because we are on lesson 27, some of this line
     should be filled in. Also the Pre-licensing Lessons (26 of 42 Completed)". */

  it('titles the lesson stop with its progress, not just its total', () => {
    renderShell(T3)
    expect(within(courseCard()).getByText(/Pre-Licensing Lessons \(26 of 42 Completed\)/)).toBeTruthy()
  })

  it('part-fills the connector under it, in proportion to the progress', () => {
    /* ⚠ THE PROPORTION IS THE ASSERTION, not merely that two pieces exist. The
       whole claim is that the filled share MATCHES how far in the learner is —
       a split hard-coded at half would pass a structural check and would be
       drawing a figure the page contradicts four lines above.

       ⚠ ASSERTED ON FLEX RATIOS, NOT RENDERED HEIGHTS. jsdom does no layout, so
       every `getBoundingClientRect` here is 0; the ratio lives in the style and
       that is the thing a refactor to percentage heights would break (see the
       note at the call site for why percentages collapse in some engines). */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    const [filled, rest] = [...spine.children] as HTMLElement[]
    expect(filled, 'the connector is not split').toBeTruthy()
    /* ⚠ READ THE SHORTHAND, NOT THE LONGHAND. `border-left` here carries a
       `var()`, which the engine cannot decompose at parse time — so
       `.style.borderLeftStyle` comes back EMPTY and an assertion on it passes
       or fails for reasons that have nothing to do with the dash. */
    expect(filled.style.borderLeft).not.toContain('dashed')
    expect(rest.style.borderLeft).toContain('dashed')
    const f = Number(filled.style.flexGrow)
    const r = Number(rest.style.flexGrow)
    expect(Math.round((f / (f + r)) * 100)).toBe(62)
  })

  it('says the same colour on both halves — the difference is the texture', () => {
    /* The rail says everything in words and never in colour alone (2.1.4.1). A
       filled half in a new accent hue would make this the one row that does. */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    const [filled, rest] = [...spine.children] as HTMLElement[]
    expect(filled.style.background).toContain('--color-border-subtle')
    expect(rest.style.borderLeft).toContain('--color-border-subtle')
  })

  it('leaves Testing’s stop label and connector alone', () => {
    /* Both are opt-in props on a SHARED rail, so the way they break is by
       reaching every version at once. */
    renderShell(T1)
    expect(screen.getByText(/Pre-Licensing Lessons \(42\)/)).toBeTruthy()
    expect(screen.queryByText(/26 of 42 Completed/)).toBeNull()
  })
})

describe('the card’s own eyebrow', () => {
  it('leads the card, above the cover image', () => {
    /* 2026-10-01, the direct ask. It sat inside the text column, right of the
       cover, which put it ~120px in while "Step 1 · Atlas Study Journey"
       started at the padding edge — two eyebrows in one card on two different
       left margins. ⚠ Asserted as DOCUMENT ORDER rather than pixels: jsdom does
       no layout, and the position follows from being a sibling of the image row
       rather than a child of the column beside it. */
    renderShell(T3)
    const card = courseCard()
    const eyebrow = within(card).getByText('Current course')
    const cover = card.querySelector('img')
    expect(cover).toBeTruthy()
    expect(
      eyebrow.compareDocumentPosition(cover!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    /* …and it is a direct child of the card, which is what puts it on the
       padding edge with the rail's eyebrow. */
    expect(eyebrow.parentElement).toBe(card)
  })

  it('leaves the eyebrow inside the text column on Testing', () => {
    renderShell(T1)
    const card = courseCard()
    const eyebrow = within(card).getByText('Current course')
    expect(eyebrow.parentElement).not.toBe(card)
  })
})

describe('the quick buttons', () => {
  it('move below the combined block, and appear exactly once', () => {
    /* ⚠ COUNTED, NOT JUST LOCATED. Moving them is a suppress-here/render-there
       pair, and the failure is two copies rather than none. */
    renderShell(T3)
    const tiles = screen.getAllByRole('navigation', { name: 'Learning areas' })
    expect(tiles).toHaveLength(1)
    /* Below the course card: same column, later in document order. */
    const card = courseCard()
    expect(card.compareDocumentPosition(tiles[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('leaves them above the journey column on Testing', () => {
    renderShell(T1)
    const tiles = screen.getAllByRole('navigation', { name: 'Learning areas' })
    expect(tiles).toHaveLength(1)
    /* On Testing they lead the RIGHT column, so the course card does not
       precede them in the way it does above — they are siblings of the journey,
       not of the course card. */
    expect(tiles[0].closest('section[aria-label="Current course"]')).toBeNull()
  })
})

describe('everything else is Testing’s', () => {
  /* ⚠ THE HALF THAT ACTUALLY ROTS. Each of these is a decision Testing makes
     that Testing 3 inherits rather than re-declares; a later change that
     teaches `testing` something new and forgets `testing-3` shows up here and
     nowhere on screen. */
  it('keeps the journey’s post-course steps as their own cards', () => {
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Pass State Exam"]')).toBeTruthy()
    expect(document.querySelector('section[aria-label="Get Licensed in New York"]')).toBeTruthy()
  })

  it('keeps the exam card and the Quick links card', () => {
    renderShell(T3)
    expect(document.querySelector('section[aria-label="Exam Date"]')).toBeTruthy()
    expect(document.querySelector('section[aria-label="Quick links"]')).toBeTruthy()
  })

  it('drops Readiness from the rail, exactly as Testing does', () => {
    renderShell(T3)
    expect(screen.queryByRole('button', { name: 'Readiness' })).toBeNull()
  })
})
