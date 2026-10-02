import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { writeExamDate } from '@/data/examDateStore'
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

  it('branches off the spine with a solid caret at the live lesson', () => {
    /* 2026-10-01, the direct ask ("so it feels like its part of the timeline").

       ⚠ THE COLOUR IS THE ASSERTION AS MUCH AS THE SHAPE. The node, the filled
       spine and this caret are one mark in three parts; a caret in any other
       blue would break a set that only just became one. */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const caret = [...li.querySelectorAll('span')].find((el) =>
      (el as HTMLElement).style.borderLeft?.includes('solid'),
    ) as HTMLElement
    expect(caret, 'no caret beside the lesson block').toBeTruthy()
    expect(caret.style.borderLeft).toContain('--color-primary-700')
    /* A right-pointing border triangle: solid on the left, transparent above
       and below, and no box of its own. */
    expect(caret.style.borderTop).toContain('transparent')
    expect(caret.style.borderBottom).toContain('transparent')
    expect(caret.style.width).toBe('0px')
    /* ⚠ `aria-hidden`, like every other mark in this rail — the row's text
       already names the lesson, and a triangle announced to a screen reader is
       noise about a shape. */
    expect(caret.getAttribute('aria-hidden')).not.toBeNull()
  })

  it('draws no caret where there is no nested lesson', () => {
    /* The caret belongs to the nested block, so it must not outlive it — the
       journey column renders the same rail with no `stopDetail` at all. */
    renderShell(T1)
    const li = document.querySelector('ol[aria-label="Study journey stops"] li') as HTMLElement
    const caret = [...li.querySelectorAll('span')].find((el) =>
      (el as HTMLElement).style.borderLeft?.includes('solid'),
    )
    expect(caret).toBeUndefined()
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

  it('fills in the NODE’s blue, and leaves the rest the neutral dash', () => {
    /* 2026-10-01, the direct ask ("the gray line ... needs to be solid blue").
       ⚠ `--color-primary-700` SPECIFICALLY, because that is what both
       `syllabusDotDoneStyle` and `syllabusDotCurrentStyle` fill the node with —
       the line emanates from the node, and a tail in a different blue reads as
       a second mark rather than as the node's own.

       ⚠ THIS INVERTS AN ASSERTION FROM THE BUILD BEFORE, which pinned both
       halves to ONE colour on the grounds that a rail saying everything in
       words must not grow a status hue. The rule it protected still holds: the
       solid-vs-dashed TEXTURE carries the distinction and the row's text
       carries the count, so colour here is reinforcement and the rail reads
       correctly without it (2.1.4.1). */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    const [filled, rest] = [...spine.children] as HTMLElement[]
    expect(filled.style.background).toContain('--color-primary-700')
    expect(rest.style.borderLeft).toContain('--color-border-subtle')
  })

  it('leaves Testing’s connector grey — the blue is opt-in', () => {
    /* `progressSpine` is a prop on a SHARED rail. A rail that turned blue for
       everyone would be a product-wide restyle made on one version's ask. */
    renderShell(T1)
    const li = screen.getByText(/Pre-Licensing Lessons/).closest('li')!
    /* ⚠ THE SPINE, NOT THE WHOLE ROW. The NODE on this row is filled
       `--color-primary-700` under every version — it is the "you are here" dot
       — so a check across the `li` matches the dot and fails for the wrong
       reason. It did, first time. */
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    expect(spine).toBeTruthy()
    expect(spine.outerHTML).not.toContain('--color-primary-700')
    expect(spine.children).toHaveLength(0)
  })

  it('makes the stop row plain text — no hover, no chevron, no link colour', () => {
    /* 2026-10-01, the direct ask ("dont make this hover/clickable"). The live
       stop carries the lesson line and Resume nested under it; a second control
       on the row above competes for the same press.

       ⚠ ALL THREE ARE ASSERTED because the rail gates them on ONE condition
       (`interactive`), and a change that restored any of them would restore all
       three — a blue, chevroned row that happens not to respond is a worse
       state than either extreme. */
    renderShell(T3)
    const li = courseCard().querySelector('ol li') as HTMLElement
    expect(li.textContent).toContain('Pre-Licensing Lessons')
    expect(li.querySelector('button[data-cta-id="home.journey-stop"]')).toBeNull()
    expect(li.querySelector('.cre-stop-title')).toBeNull()
    expect(li.querySelector('.cre-journey-stop')).toBeNull()
    /* …and Resume, which is the way in now, is untouched. */
    expect(li.querySelector('button[data-cta-id="home.resume"]')).toBeTruthy()
  })

  it('leaves the journey column’s stops openable on Testing', () => {
    /* ⚠ A PROPERTY OF THIS CARD, NOT OF THE RAIL. `StudyJourneyRail` is shared;
       withholding the handler here must not quietly make every version's stops
       inert. */
    renderShell(T1)
    const li = document.querySelector('ol[aria-label="Study journey stops"] li') as HTMLElement
    expect(li.querySelector('button[data-cta-id="home.journey-stop"]')).toBeTruthy()
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
  it('is set exactly like the rail’s eyebrow below it', () => {
    /* 2026-10-01, the direct ask ("make the eyebrow fonts match"). Two eyebrows
       in one card, aligned to the same edge but set differently, read as two
       components that happen to be adjacent.

       ⚠ ASSERTED ON THE INLINE STYLE, not on computed values — jsdom resolves
       no cascade, and these are inline style objects either way. */
    renderShell(T3)
    const card = courseCard()
    const lead = within(card).getByText('Current course') as HTMLElement
    const step = within(card).getByText(/Step 1 · Atlas Study Journey/) as HTMLElement
    expect(lead.style.fontSize).toBe(step.style.fontSize)
    expect(lead.style.fontWeight).toBe(step.style.fontWeight)
    expect(lead.style.letterSpacing).toBe(step.style.letterSpacing)
  })

  it('leaves CourseEntryCard’s eyebrow alone', () => {
    /* ⚠ THE STYLE IS SPREAD FROM `CourseEntryCard`'s, which every other version
       renders. Restyling that object rather than this one would push a decision
       made about Testing 3's combined card onto QE Focused, Testing and Learner
       Focused. */
    renderShell(T1)
    const lead = within(courseCard()).getByText('Current course') as HTMLElement
    expect(lead.style.fontSize).toBe('11px')
  })

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

describe('the whole route in one card', () => {
  /* 2026-10-01, the direct ask: "add a divider after step 1 and put the step 2,
     then another divider and step 3 - shift the Exam date back to the right." */

  it('draws steps 1, 2 and 3 inside the card, in order', () => {
    /* ⚠ `p` AND `span` BOTH — Step 1's eyebrow is a paragraph the rail writes,
       Steps 2 and 3's are spans, because those live inside a <button> and a <p>
       there is invalid HTML the DOM re-parents. Querying only `p` found one of
       three and the test read as if the steps had vanished. */
    renderShell(T3)
    const eyebrows = [...courseCard().querySelectorAll('p, span')]
      .map((el) => el.textContent?.trim() ?? '')
      .filter((t) => /^Step \d($| )/.test(t))
    expect(eyebrows).toEqual(['Step 1 · Atlas Study Journey', 'Step 2', 'Step 3'])
  })

  it('gives each step a named region, as the shared widget does', () => {
    /* ⚠ THE LANDMARK SURVIVED THE FORK, and this is what says so. The first cut
       of `JourneyStepDisclosure` rendered a bare <div>, which costs a
       screen-reader user the ability to reach "Get Licensed in New York" at all
       and is completely invisible on screen. The name is the VISIBLE heading —
       a region announced as "Apply for your License" while reading "Get
       Licensed in New York" is a landmark disagreeing with its own content. */
    renderShell(T3)
    const card = courseCard()
    for (const label of ['Pass State Exam', 'Get Licensed in New York']) {
      expect(card.querySelector(`section[aria-label="${label}"]`), label).toBeTruthy()
    }
  })

  it('collapses each step to its name, with the detail behind a press', () => {
    /* 2026-10-01, the direct ask: "remove these - when user hovers over step 2
       or step 3, there should be a hover effect, and clicking would expand
       vertically to show more details."

       ⚠ REMOVED FROM THE REST STATE, NOT FROM THE PRODUCT. The fee and the
       detail line are what "more details" means; a fork that actually deleted
       them would pass a naive "the text is gone" check and would have quietly
       dropped two published facts. Both halves are asserted. */
    renderShell(T3)
    const step2 = courseCard().querySelector(
      'section[aria-label="Pass State Exam"]',
    ) as HTMLElement
    expect(step2.textContent).not.toContain('150 questions')
    fireEvent.click(within(step2).getByRole('button'))
    expect(step2.textContent).toContain('150 questions in 150 minutes. 70% to pass.')
    /* …and it closes again. A disclosure that only opens is a reveal. */
    fireEvent.click(within(step2).getByRole('button'))
    expect(step2.textContent).not.toContain('150 questions')
  })

  it('expands each step independently', () => {
    /* NOT an accordion. Nothing in the ask asked for one, and closing step 2 to
       read step 3 would make the two compete for a reader who wants both. */
    renderShell(T3)
    const card = courseCard()
    const step2 = card.querySelector('section[aria-label="Pass State Exam"]') as HTMLElement
    const step3 = card.querySelector(
      'section[aria-label="Get Licensed in New York"]',
    ) as HTMLElement
    fireEvent.click(within(step2).getByRole('button'))
    fireEvent.click(within(step3).getByRole('button'))
    expect(step2.textContent).toContain('150 questions')
    expect(step3.textContent).toContain('$80 application fee')
  })

  it('carries the journey’s own hover/focus treatment, not a new one', () => {
    /* ⚠ `cre-journey-stop` IS BORROWED DELIBERATELY. It is what the journey's
       stop rows three inches above use — background on hover, a focus-visible
       outline, 120ms ease — so a row in this card behaves like the rows beside
       it. A bespoke hover here would be a second answer to a question this
       product already answered, and it would drift. */
    renderShell(T3)
    const step2 = courseCard().querySelector(
      'section[aria-label="Pass State Exam"]',
    ) as HTMLElement
    const btn = within(step2).getByRole('button')
    expect(btn.className).toContain('cre-journey-stop')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('leaves Testing’s steps stating everything at rest', () => {
    /* The control arm, and the reason this is a FORK rather than a prop:
       `LicensingStepWidget` still draws these on QE Focused, Testing and
       Testing 2, where they are separate cards that say what they are without
       being pressed. A `collapsible` prop would have put an accordion on all
       three for one version's ask. */
    renderShell(T1)
    const step2 = document.querySelector('section[aria-label="Pass State Exam"]') as HTMLElement
    expect(step2.textContent).toContain('150 questions in 150 minutes. 70% to pass.')
    expect(within(step2).queryByRole('button', { expanded: false })).toBeNull()
  })

  it('leaves the column holding only what is NOT the route', () => {
    /* The exam question asks whether a date is booked; Quick links is a flat
       list of shortcuts. Neither is a step, which is why they are the two
       things that stay out of a card about the route. */
    renderShell(T3)
    const card = courseCard()
    const exam = document.querySelector('section[aria-label="Exam Date"]')!
    const quick = document.querySelector('section[aria-label="Quick links"]')!
    expect(card.contains(exam)).toBe(false)
    expect(card.contains(quick)).toBe(false)
  })

  it('gives the exam card its FULL readout again, not the compact one', () => {
    /* ⚠ A CONSEQUENCE WORTH PINNING. `compact` is passed at the under-course
       slot only, so moving the card back to the column restores the tear-off
       calendar — the two arms of `exam-card-placement` mean exactly that. A
       compact readout floating in the journey column would be the under-course
       treatment in a place that never asked for it. */
    /* A DATE HAS TO EXIST for there to be a readout at all — without one the
       card is still asking the question, and both arms ask it the same way. */
    writeExamDate('2026-05-26')
    renderShell(T3)
    const exam = document.querySelector('section[aria-label="Exam Date"]') as HTMLElement
    expect(within(exam).getByText('Your exam date')).toBeTruthy()
    expect(within(exam).getByText('MAY')).toBeTruthy()
  })

  it('ignores exam-card-placement on this version', () => {
    /* ⚠ THE FLAG IS OVERRIDDEN HERE, and a reviewer switching it sees nothing
       happen. That is the deliberate trade: the alternative was a flag
       combination that drops a question into the middle of a numbered route. */
    renderShell(`${T3}&ff=exam-card-placement:under-course`)
    expect(courseCard().querySelector('section[aria-label="Exam Date"]')).toBeNull()
  })

  it('leaves Testing’s steps as separate cards in the column', () => {
    renderShell(T1)
    const card = courseCard()
    for (const label of ['Pass State Exam', 'Get Licensed in New York']) {
      const step = document.querySelector(`section[aria-label="${label}"]`)!
      expect(card.contains(step), label).toBe(false)
    }
  })
})

describe('the percentage is the journey’s, not the course’s', () => {
  /* 2026-10-01, the direct ask: "since 100% means the user has completed the
     survey and certificate, adjust this 62% to better reflect where the user is
     in their journey." */

  const figure = () =>
    [...courseCard().querySelectorAll('span')].find(
      (el) => /^\d+$/.test(el.textContent ?? '') && el.style.fontSize === '30px',
    )

  it('counts every stop’s work, not just the lessons', () => {
    /* 26 of 71: 42 lessons + 1 course exam + 23 prep review + 3 simulators +
       1 each for the two completion tasks. ⚠ THE EXACT NUMBER IS THE
       ASSERTION, because every wrong model still produces A number — `hours`
       alone gives 55, equal-weight stops give 10, and the lesson figure this
       replaced gives 62. Only the stated model gives 37. */
    renderShell(T3)
    expect(figure()?.textContent).toBe('37')
  })

  it('leaves the lesson figure on Testing’s card', () => {
    /* ⚠ DERIVED IN THE CARD, NOT PUSHED THROUGH `percent`. That prop still
       carries 62 — it is what the stats row prints as "26 of 42 lessons" and
       what every other version's card shows. Moving the derivation to the band
       would change the number on QE Focused and Testing too, where there is no
       journey under it to justify it. */
    renderShell(T1)
    expect(figure()?.textContent).toBe('62')
  })

  it('still prints the lesson count beside it, unchanged', () => {
    /* ⚠ THE TWO NUMBERS NOW IMPLY DIFFERENT RATIOS on one row — 37% beside "26
       of 42 lessons", which is 62%. That is the deliberate consequence of the
       ask and the thing to look at: the figure measures the journey, the stat
       measures the course, and nothing on the card says so yet. */
    renderShell(T3)
    expect(within(courseCard()).getByText('26 of 42 lessons')).toBeTruthy()
  })
})

describe('the quick buttons', () => {
  it('sit in the right rail, directly under the exam card', () => {
    /* 2026-10-01, the direct ask. ⚠ ASSERTED AS SIBLING ORDER, not as document
       order. They spent one build at the foot of the LEFT column, and a
       `compareDocumentPosition` check against the course card passed in BOTH
       arrangements — the right column follows the left in the DOM either way.
       The only thing that distinguishes them is which parent the tiles hang
       off and what sits beside them. */
    renderShell(T3)
    const tiles = screen.getAllByRole('navigation', { name: 'Learning areas' })
    expect(tiles).toHaveLength(1)
    expect(tiles[0].closest('section[aria-label="Current course"]')).toBeNull()
    const siblings = [...tiles[0].parentElement!.children].map((el) =>
      el.getAttribute('aria-label'),
    )
    expect(siblings).toEqual(['Exam Date', 'Learning areas', 'Quick links'])
  })

  it('appear exactly once', () => {
    /* ⚠ COUNTED. Moving them is a suppress-here/render-there pair, and the
       failure mode is two copies rather than none — `HomeNavTileColumn` still
       draws them at the top of this column on every other version. */
    renderShell(T3)
    expect(screen.getAllByRole('navigation', { name: 'Learning areas' })).toHaveLength(1)
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
  it('still renders every journey step and the Quick links card', () => {
    /* ⚠ THIS ONLY PINS EXISTENCE, deliberately — WHERE each one goes is the
       subject of "the whole route in one card" below. It was the only
       assertion here for one build, and that was too weak: both steps moved
       into the combined card and it went on passing unchanged, which is
       exactly the silence a clone test is supposed to break. */
    renderShell(T3)
    for (const label of ['Pass State Exam', 'Get Licensed in New York', 'Exam Date', 'Quick links']) {
      expect(document.querySelector(`section[aria-label="${label}"]`), label).toBeTruthy()
    }
  })

  it('drops Readiness from the rail, exactly as Testing does', () => {
    renderShell(T3)
    expect(screen.queryByRole('button', { name: 'Readiness' })).toBeNull()
  })
})
