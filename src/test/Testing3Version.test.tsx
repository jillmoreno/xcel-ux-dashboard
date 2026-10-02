import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
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
  /* ⚠ `?ff=` IS READ FROM `window.location`, NEVER FROM THE ROUTER ENTRY, and
     this helper did not set it for several builds. Tests passing `&ff=…` in the
     url string were rendering with the flag's DEFAULT and still passing —
     because the thing they asserted happened to be true either way. Mirroring
     the entry onto the location is what makes a pinned flag actually pin. */
  const ff = new URLSearchParams(url.split('?')[1] ?? '').get('ff')
  window.history.replaceState(
    {},
    '',
    ff ? `/dashboard-rebrand?ff=${encodeURIComponent(ff)}` : '/dashboard-rebrand',
  )
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
    /* ⚠ `getAll`, NOT `get` — there are TWO routes into the course as of
       2026-10-01 (the title button and the lesson block), so a singular query
       throws on ambiguity. Their identities are pinned below; here it is just
       presence. */
    expect(card.getAllByRole('button', { name: /Resume|Start course/ }).length).toBeGreaterThan(0)
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
    expect(within(courseCard()).getByText('Step 1')).toBeTruthy()
    /* …and the journey's NAME is no longer on this card at all, which is the
       cost of the trim. */
    expect(within(courseCard()).queryByText(/Atlas Study Journey/)).toBeNull()
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
    /* ⚠ PINS THE `axis` ARM. `journey-scale-style` defaults to `gauge` as of
       2026-10-02, which draws ONE continuous track instead of per-row segments
       — so everything this asserts about the spine belongs to the arm that
       still has one. The other arms have their own tests below. */
    renderShell(`${T3}&ff=journey-scale-style:axis`)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    /* ⚠ IT IS A SEGMENT OF THE SPINE, not a mark beside the lesson block — so
       it is asserted as the split connector's MIDDLE CHILD. That ordering is
       the fix for "the line should not go past the triangle": the solid half
       ends where this starts, by construction rather than by two offsets
       happening to agree. */
    const split = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    /* ⚠ THE MIDDLE CHILD IS A WRAPPER, not the triangle — it gained one on
       2026-10-01 so the "37%" figure could hang to the left of the spine
       without taking part in the 2px column's flow. The triangle is inside it
       and carries the border; the wrapper carries the offset. */
    const [solid, caretWrap, dashed] = [...split.children] as HTMLElement[]
    const caret = caretWrap.lastElementChild as HTMLElement
    expect(caret, 'no caret in the spine').toBeTruthy()
    expect(solid.style.background).toContain('--color-primary-700')
    expect(dashed.style.borderLeft).toContain('dashed')
    expect(caret.style.borderLeft).toContain('--color-primary-700')
    /* A right-pointing border triangle: solid on the left, transparent above
       and below, and no box of its own. */
    expect(caret.style.borderTop).toContain('transparent')
    expect(caret.style.borderBottom).toContain('transparent')
    expect(caret.style.width).toBe('0px')
    /* ⚠ THE OFFSET IS AGAINST THE 2px SPINE, which is this element's parent —
       NOT against the 26px rail column. Two wrong turns landed the triangle at
       x=101 and x=111 before 2 put its base on the line; a refactor that
       re-parents this needs to re-derive the number, not keep it. */
    /* The offset lives on the wrapper now; the triangle sits flush inside it. */
    expect(caretWrap.style.marginLeft).toBe('2px')
    expect(caretWrap.style.alignSelf).toBe('flex-start')
    /* ⚠ `aria-hidden`, like every other mark in this rail — the row's text
       already names the lesson, and a triangle announced to a screen reader is
       noise about a shape. */
    expect(caretWrap.getAttribute('aria-hidden')).not.toBeNull()
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

  it('carries a green rule, the same green as the gauge marker', () => {
    /* 2026-10-02, the direct ask. ⚠ THE COLOUR IS THE ASSERTION. The knob's
       glow and this edge are ONE signal in two places — the marker says where
       on the scale, the rule says which block — and a second green would make
       them two unrelated accents. Green is also the only hue on this card that
       is not the brand navy, which is what makes it findable. */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    /* ⚠ THE RULE IS ON THE TEXT ROW, not on the padded block — moved 2026-10-02
       so its height is the text's by construction. On the outer box it ran that
       box's padding and the button's too, ~26px taller than the words. */
    const row = within(li as HTMLElement)
      .getByText(/Life Insurance Premiums/)
      .parentElement!.parentElement as HTMLElement
    /* ⚠ AND IT IS THE MARKER'S *RENDERED* GREEN, not the raw token. The knob's
       ring is success-500 at 45% ALPHA, so matching the solid token would make
       the rule visibly darker than the ring it echoes. */
    expect(row.style.borderLeft).toContain('--color-success-500')
    expect(row.style.borderLeft).toContain('45%')
  })

  it('keeps the lesson text aligned with the stop titles despite the rule', () => {
    /* ⚠ THE BORDER EATS INTO THE INDENT. The 22px was pure padding; a 3px
       border on the same box would push the text to 25 and step it out of line
       with the stops above and below, which is the alignment the indent existed
       to create. 19 + 3 keeps it exactly where it was — verified live at a
       22px offset from the block's left edge. */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const block = within(li as HTMLElement)
      .getByText(/Life Insurance Premiums/)
      .closest('div') as HTMLElement
    const row = within(li as HTMLElement)
      .getByText(/Life Insurance Premiums/)
      .parentElement!.parentElement as HTMLElement
    /* ⚠ 9 + 3 + 10 = THE 22 THE TEXT HAS ALWAYS SAT AT. The indent is split
       across three boxes since the rule moved inward to hug the words; the SUM
       is what keeps the lesson aligned with the stop titles above and below.
       Change one and re-derive the other two. Verified live at 22px. */
    expect(block.style.paddingLeft).toBe('9px')
    expect(row.style.borderLeft).toContain('3px')
    expect(row.style.paddingLeft).toBe('10px')
  })

  it('centres the block on its text, so the gauge marker lands on the rule', () => {
    /* ⚠ THE MARKER ANCHORS TO THIS BOX'S CENTRE, so asymmetric vertical padding
       moves the two apart: at 8px above the text and 2px below, the centre sat
       3px high and the knob lined up with the block but not with the words the
       green rule marks. Measured 486 against 489 before, 0 after. The bottom
       margin absorbs the change so the block's height — and the list's rhythm —
       is unaltered. */
    renderShell(T3)
    const block = within(courseCard())
      .getByText(/Life Insurance Premiums/)
      .closest('div') as HTMLElement
    expect(block.style.paddingTop).toBe('8px')
    expect(block.style.paddingBottom).toBe('8px')
  })

  it('is itself a second way into the course', () => {
    /* 2026-10-01, the direct ask ("wrap in a container that will have a hover
       effect and take user to the course (in addition to the resume button)").

       ⚠ IT CARRIES `home.resume` TOO, and that is not an oversight. That CTA
       asks "if it dies, where do they go instead?" — an untagged second path to
       the same course would answer it wrongly, because a moderated run that
       broke Resume would leave this working and the participant would simply
       press it. Both controls do one thing, so both die together. */
    renderShell(T3)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const btn = li.querySelector('button[data-cta-id="home.resume"]') as HTMLElement
    expect(btn, 'the lesson block is not a control').toBeTruthy()
    /* ⚠ `cre-lesson-cta` SINCE 2026-10-02, not `cre-journey-stop`. The stop
       rows' neutral hover is right for a list of stops; this row is a CONTROL
       into the course and takes the right rail's tint so the two read as one
       system. Its own test is below. */
    expect(btn.className).toContain('cre-lesson-cta')
    expect(btn.getAttribute('aria-label')).toMatch(/^Resume /)
    expect(li.textContent).toMatch(/Lesson 27/)
  })

  it('keeps no paragraph or heading inside that button', () => {
    /* ⚠ A BUTTON MAY ONLY CONTAIN PHRASING CONTENT. The lesson block was built
       from `<p>` and `<h3>`; nested in a button that is invalid HTML and the
       DOM re-parents it, which breaks the layout in a way no assertion about
       text would catch. Same trap the step disclosures' eyebrows hit. */
    renderShell(T3)
    const btn = courseCard().querySelector(
      'li button[data-cta-id="home.resume"]',
    ) as HTMLElement
    expect(btn.querySelector('p, h1, h2, h3, h4, h5, h6')).toBeNull()
  })

  it('has exactly two routes into the course, and they are the two intended', () => {
    /* ⚠ COUNTED, AND LOCATED. Two is the design as of 2026-10-01 — the button
       beside the title and the lesson block in the stop. Counting alone would
       pass if a refactor duplicated one of them and lost the other, so each is
       pinned to where it belongs. */
    renderShell(T3)
    const card = courseCard()
    const routes = [...card.querySelectorAll('[data-cta-id="home.resume"]')]
    expect(routes).toHaveLength(2)
    const beside = routes.find((el) => !el.closest('li'))!
    const inStop = routes.find((el) => el.closest('li'))!
    /* ⚠ ON THE STATS ROW, NOT THE TITLE ROW, as of 2026-10-02 — it moved down
       beside "17 days" once the percentage and the lesson count left the
       header and made room. Located by its SIBLING rather than by a style, so
       it survives the row being restyled. */
    expect(beside.parentElement?.textContent).toMatch(/To complete course/i)
    expect(inStop.closest('li')?.textContent).toMatch(/Pre-Licensing Lessons/)
  })

  it('leaves the title a plain block, with nothing beside it', () => {
    /* ⚠ THIS INVERTS AN ASSERTION. It pinned Resume to the title's first line
       with `align-items: flex-start`, so the button would not walk down the
       card as the title wrapped. Resume moved to the stats row on 2026-10-02
       and the title is a plain block again — it has the column's full width,
       which is why it now wraps to two lines instead of three. */
    renderShell(T3)
    const heading = within(courseCard()).getByRole('heading', { level: 2 })
    /* ⚠ SIBLINGS, NOT DESCENDANTS. The heading's parent is the whole text
       column, which still CONTAINS Resume further down in the stats row — a
       `querySelector('button')` there finds it and the test fails for the wrong
       reason. What changed is that nothing sits beside the heading itself. */
    const siblings = [...(heading.parentElement?.children ?? [])]
    expect(siblings.some((el) => el.tagName === 'BUTTON')).toBe(false)
  })

  it('hides the progress bar behind `combined-progress-bar`', () => {
    /* 2026-10-02, the direct ask. ⚠ WHAT THE OFF ARM IS ASKING: the gauge down
       the timeline already carries a fill, a figure and a marker, so this bar
       is the card's SECOND statement of progress — and the two are not the same
       number today (the bar reads `percent`, 62%; the gauge is weighted across
       the journey, 37%). Two fills of different lengths for one course. */
    renderShell(T3)
    const bar = () =>
      [...courseCard().querySelectorAll('div[aria-hidden]')].find(
        (d) => (d as HTMLElement).style.height === '8px',
      )
    expect(bar(), 'the bar is missing by default').toBeTruthy()
    cleanup()
    renderShell(`${T3}&ff=combined-progress-bar:off`)
    expect(bar()).toBeUndefined()
  })

  it('says “Resume course”, not “Resume”', () => {
    /* It sits beside a stat line now rather than under the course title, so the
       word that named what it resumed is no longer directly above it. */
    renderShell(T3)
    expect(
      within(courseCard()).getByRole('button', { name: /Resume course/ }),
    ).toBeTruthy()
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
    /* ⚠ TWO RUNS WITH A RULE BETWEEN THEM as of 2026-10-02, not one
       parenthetical — so the name and the count are separate elements and a
       single `getByText` across both cannot match. Asserted on the row's text,
       which is what a reader actually reads. */
    const title = within(courseCard()).getByText('Pre-Licensing Lessons')
    expect(title.parentElement?.textContent).toMatch(/Pre-Licensing Lessons\s*26 of 42 Completed/)
    expect(title.parentElement?.textContent).not.toContain('(')
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
    /* ⚠ PINS THE `axis` ARM. `journey-scale-style` defaults to `gauge` as of
       2026-10-02, which draws ONE continuous track instead of per-row segments
       — so everything this asserts about the spine belongs to the arm that
       still has one. The other arms have their own tests below. */
    renderShell(`${T3}&ff=journey-scale-style:axis`)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    /* ⚠ THREE CHILDREN, NOT TWO — the caret sits BETWEEN the halves as of
       2026-10-01, which is what stops the blue running past it. A `[filled,
       rest]` destructure put the caret in `rest` and failed on its colour. */
    const [filled, , rest] = [...spine.children] as HTMLElement[]
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

  it('brackets the timeline with 0 and 100, and marks the journey figure', () => {
    /* 2026-10-01, the direct ask.

       ⚠ THE MARKER SAYS THE CARD'S OWN FIGURE, not the stop's. The caret sits
       at 62% of the FIRST stop (26 of 42 lessons); the label says 37%, which is
       how far that is through the whole route. Two numbers for two questions,
       and the one on the rail has to match the one in the card's big figure or
       the page contradicts itself. */
    /* ⚠ PINS THE `axis` ARM. `journey-scale-style` defaults to `gauge` as of
       2026-10-02, which draws ONE continuous track instead of per-row segments
       — so everything this asserts about the spine belongs to the arm that
       still has one. The other arms have their own tests below. */
    renderShell(`${T3}&ff=journey-scale-style:axis`)
    const card = courseCard()
    const caps = [...card.querySelectorAll('p')]
      .map((el) => el.textContent?.trim())
      .filter((t) => t === '0' || t === '100')
    expect(caps).toEqual(['0', '100'])
    const li = within(card).getByText(/Pre-Licensing Lessons/).closest('li')!
    expect(li.textContent).toContain('37%')
  })

  it('keeps the end caps out of the stops list', () => {
    /* ⚠ THEY BRACKET THE `<ol>`, they are not `<li>`s. A list item reading "0"
       would be announced as a stop in an ordered list OF stops — the spine is
       `aria-hidden` for exactly that reason and these belong to the same mark. */
    /* ⚠ PINS THE `axis` ARM. `journey-scale-style` defaults to `gauge` as of
       2026-10-02, which draws ONE continuous track instead of per-row segments
       — so everything this asserts about the spine belongs to the arm that
       still has one. The other arms have their own tests below. */
    renderShell(`${T3}&ff=journey-scale-style:axis`)
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]')!
    expect(ol.textContent).not.toMatch(/^0/)
    expect([...ol.querySelectorAll('li')].some((li) => li.textContent?.trim() === '100')).toBe(
      false,
    )
  })

  it('draws no axis on Testing', () => {
    renderShell(T1)
    const caps = [...document.querySelectorAll('p')]
      .map((el) => el.textContent?.trim())
      .filter((t) => t === '0' || t === '100')
    expect(caps).toEqual([])
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
    /* ⚠ PINS THE `axis` ARM. `journey-scale-style` defaults to `gauge` as of
       2026-10-02, which draws ONE continuous track instead of per-row segments
       — so everything this asserts about the spine belongs to the arm that
       still has one. The other arms have their own tests below. */
    renderShell(`${T3}&ff=journey-scale-style:axis`)
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const spine = li.querySelector('span[aria-hidden] > span:nth-child(2)') as HTMLElement
    /* ⚠ THREE CHILDREN, NOT TWO — the caret sits BETWEEN the halves as of
       2026-10-01, which is what stops the blue running past it. A `[filled,
       rest]` destructure put the caret in `rest` and failed on its colour. */
    const [filled, , rest] = [...spine.children] as HTMLElement[]
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
    /* ⚠ SCOPED TO THE STOP TITLE, not to the row. The lesson block nested in
       this same `li` IS a control and wears `cre-journey-stop` itself, so a
       row-wide check for that class now matches the wrong element — it did,
       first time. What this pins is that the TITLE is not inside a button. */
    const stopTitle = within(li as HTMLElement).getByText(/Pre-Licensing Lessons/)
    expect(stopTitle.closest('button')).toBeNull()
    expect(li.querySelector('button[data-cta-id="home.journey-stop"]')).toBeNull()
    expect(li.querySelector('.cre-stop-title')).toBeNull()
    /* ⚠ THE STOP TITLE IS NOT A CONTROL — but the LESSON BLOCK under it is,
       as of 2026-10-01. So this cannot assert "no buttons in the row": it has
       to say that the button present is the lesson's, not the stop's. The two
       are distinguished by the `home.journey-stop` id asserted above. */
    const buttons = [...li.querySelectorAll('button')]
    expect(buttons).toHaveLength(1)
    expect(buttons[0].getAttribute('data-cta-id')).toBe('home.resume')
  })

  it('leaves the journey column’s stops openable on Testing', () => {
    /* ⚠ A PROPERTY OF THIS CARD, NOT OF THE RAIL. `StudyJourneyRail` is shared;
       withholding the handler here must not quietly make every version's stops
       inert. */
    renderShell(T1)
    const li = document.querySelector('ol[aria-label="Study journey stops"] li') as HTMLElement
    expect(li.querySelector('button[data-cta-id="home.journey-stop"]')).toBeTruthy()
  })

  it('keeps the full eyebrow in Testing’s journey column', () => {
    /* ⚠ `stepLabelOnly` IS A PROP ON A SHARED RAIL. There the coursework card
       is the only one carrying the route's name, so trimming it everywhere
       would leave "Atlas Study Journey" unsaid on every version. */
    renderShell(T1)
    expect(screen.getByText(/Step 1 · Atlas Study Journey/)).toBeTruthy()
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
    const step = within(card).getByText('Step 1') as HTMLElement
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
    /* ⚠ ALL THREE BARE as of 2026-10-01, the direct ask. Step 1 carried
       "· Atlas Study Journey" and read as a different kind of thing above two
       bare siblings. The journey COLUMN keeps the full form — asserted below —
       because there the card is the only one naming the route. */
    expect(eyebrows).toEqual(['Step 1', 'Step 2', 'Step 3'])
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
    /* ⚠ `[0]`, NOT `getByRole('button')`. The open body now also holds the
       Exam Information link (2026-10-02), so the step has two buttons once it
       is expanded — the DISCLOSURE is the first and is what this test drives.
       `getByRole` threw here the day that link landed, which is the honest
       failure: the assumption "a step has one button" stopped being true. */
    const toggle = () => within(step2).getAllByRole('button')[0]
    fireEvent.click(toggle())
    expect(step2.textContent).toContain('150 questions in 150 minutes. 70% to pass.')
    /* …and it closes again. A disclosure that only opens is a reveal. */
    fireEvent.click(toggle())
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

  it('hovers like the rail’s links, with a chevron that never reflows', () => {
    /* 2026-10-02, the direct ask. ⚠ THE TINT IS THE SAME EXPRESSION the right
       rail's rows use — both are "a row you can press" on this page, and two
       hovers a column apart that differed would read as two systems. Verified
       live: both composite to the identical colour.

       ⚠ AND THE CLASS OWNS THE BACKGROUND. An inline `background: transparent`
       on the button BEAT the class's `:hover` and the row kept its chevron
       while losing its tint — measured, chevron opacity 1 against
       rgba(0,0,0,0). Second time that trap has bitten; if a class owns a hover
       it must own the rest state too. So the style object must NOT set one. */
    renderShell(T3)
    const btn = courseCard().querySelector(
      'li button[data-cta-id="home.resume"]',
    ) as HTMLElement
    expect(btn.className).toContain('cre-lesson-cta')
    expect(btn.style.background).toBe('')
    expect(btn.style.backgroundColor).toBe('')
    /* ⚠ THE CHEVRON IS ALWAYS IN THE DOM, hidden by opacity. Rendering it on
       hover alone would reflow the row's text the moment a cursor crossed it. */
    expect(btn.querySelector('.cre-lesson-chevron')).toBeTruthy()
  })

  it('keeps the stop ROWS on the journey’s own hover treatment', () => {
    /* ⚠ THE DISCLOSURES, NOT THE LESSON. Steps 2 and 3 borrow
       `cre-journey-stop` — the journey's own row treatment — because they ARE
       rows in this card's list. The lesson block moved to `cre-lesson-cta` on
       2026-10-02 because it is a control into the course rather than a row;
       see its own test above. */
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

  /* ⚠ THE FIGURE LIVES ON THE RAIL NOW — 2026-10-02, the direct ask: it
     "will replace the percentage in the header section". So it is found as the
     gauge's marker label, not as a 30px span in the header; the header has no
     percentage at all any more, which the test below asserts directly. */
  const figure = () =>
    [...courseCard().querySelectorAll('ol > span span')].find((el) =>
      /^\d+%$/.test(el.textContent?.trim() ?? ''),
    )

  it('counts every stop’s work, not just the lessons', () => {
    /* 26 of 71: 42 lessons + 1 course exam + 23 prep review + 3 simulators +
       1 each for the two completion tasks. ⚠ THE EXACT NUMBER IS THE
       ASSERTION, because every wrong model still produces A number — `hours`
       alone gives 55, equal-weight stops give 10, and the lesson figure this
       replaced gives 62. Only the stated model gives 37. */
    renderShell(T3)
    expect(figure()?.textContent).toBe('37%')
    /* …and the header states it nowhere. */
    const header = courseCard().firstElementChild as HTMLElement
    expect(header.textContent).not.toMatch(/\d+\s*%/)
  })

  it('leaves Testing’s card stating its own lesson figure in the header', () => {
    /* ⚠ DERIVED IN THE CARD, NOT PUSHED THROUGH `percent`. That prop still
       carries 62 — it is what the stats row prints as "26 of 42 lessons" and
       what every other version's card shows. Moving the derivation to the band
       would change the number on QE Focused and Testing too, where there is no
       journey under it to justify it. */
    renderShell(T1)
    const big = [...courseCard().querySelectorAll('span')].find(
      (el) => /^\d+$/.test(el.textContent ?? '') && (el as HTMLElement).style.fontSize === '30px',
    )
    expect(big?.textContent).toBe('62')
  })

  it('no longer prints the lesson count in the header', () => {
    /* ⚠ THIS RESOLVES THE CLASH IT USED TO PIN. The header carried "26 of 42
       lessons · Completed" beside a 37% figure — two numbers implying different
       ratios on one row, which this test used to record as a known cost. Both
       are gone from the header on 2026-10-02: the percentage to the rail, the
       count to the Pre-Licensing stop directly below, where it is built from
       the same two figures. One statement each, in one place each. */
    renderShell(T3)
    const header = courseCard().firstElementChild as HTMLElement
    expect(header.textContent).not.toContain('26 of 42 lessons')
    /* …and it is still on the stop. */
    expect(
      within(courseCard()).getByText('Pre-Licensing Lessons').parentElement?.textContent,
    ).toMatch(/26 of 42 Completed/)
  })
})

describe('the Are you ready stub', () => {
  it('reserves the slot and states nothing', () => {
    /* 2026-10-01, the direct ask ("leave the rest of the widget blank").

       ⚠ EMPTY IS THE ASSERTION, not an oversight. Readiness has been a lo-fi
       placeholder since 2026-09-17 and Testing DROPPED its tile for that
       reason. This reserves the slot so the rail's shape can be read with it
       in, without inventing a readout nobody has designed — so a later change
       that fills it with placeholder bars should fail here and be a decision. */
    renderShell(T3)
    const stub = document.querySelector(
      'section[aria-label="Your Study Pace / Exam Readiness"]',
    ) as HTMLElement
    expect(stub).toBeTruthy()
    expect(within(stub).getByText('Your Study Pace / Exam Readiness')).toBeTruthy()
    /* ⚠ IT HAS A LO-FI DOUBLE RING NOW (2026-10-02) but still states NOTHING —
       no text beyond the eyebrow, no control, and the arcs carry fixed
       fractions in the lo-fi greys so no figure can be read off them. A
       placeholder that looked live would be the product claiming a readiness
       model it does not have. */
    expect(stub.textContent?.trim()).toBe('Your Study Pace / Exam Readiness')
    expect(stub.querySelector('button, a, input')).toBeNull()
    expect(stub.querySelectorAll('svg circle')).toHaveLength(4)
  })

  it('does not appear on Testing', () => {
    renderShell(T1)
    expect(
      document.querySelector('section[aria-label="Your Study Pace / Exam Readiness"]'),
    ).toBeNull()
  })
})

describe('journey-scale-style — four ways to show 0 / 37 / 100', () => {
  /* 2026-10-02, the direct ask: the first attempt "is not doing great", so
     explore. Nothing is chosen — these pin that all four exist, differ, and
     state the same number.

     ⚠ THE PROBLEM THEY SPLIT ON: these rows are spaced by their CONTENT's
     height, not by how much work each stop is. So a figure beside the current
     stop is in the right PLACE but the wrong HEIGHT, and a figure at its true
     height sits beside a stop the learner has not reached. `axis` and `chip`
     choose position; `gauge` and `header` choose proportion. */

  const arm = (v: string) => `${T3}&ff=journey-scale-style:${v}`

  it('is in the catalog with four arms, opening on the gauge', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'journey-scale-style')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['gauge', 'axis', 'chip', 'header'])
    /* ⚠ `gauge` OPENS, NOT `axis`. The arm that answers the stated defect is
       the one to look at first; nothing is decided by that. */
    expect(flag?.defaultVariant).toBe('gauge')
  })

  it('states the same figure under every arm', () => {
    /* ⚠ THE ONE THING ALL FOUR MUST SHARE. A variant that drew a different
       number would not be a presentation choice, it would be a second claim
       about the learner's progress. */
    for (const v of ['gauge', 'axis', 'chip', 'header']) {
      renderShell(arm(v))
      expect(courseCard().textContent, v).toContain('37%')
      cleanup()
    }
  })

  it('gauge: one continuous track, no per-row dashes', () => {
    renderShell(arm('gauge'))
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    /* The track is the ol's own child, not a row's — that is what lets it span
       the list rather than being filled row by row. */
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    expect(track, 'no continuous track').toBeTruthy()
    expect(track.style.position).toBe('absolute')
    expect(track.textContent).toContain('0')
    expect(track.textContent).toContain('100')
    /* …and the segments inside the rows carry no dash any more. */
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    expect(li.innerHTML).not.toContain('dashed')
  })

  it('gauge: the nodes sit ON the line, and the unreached ones are smaller', () => {
    /* 2026-10-02, the direct ask. ⚠ THE TRACK WAS MEASURED AGAINST THE WRONG
       BOX first: `left: 12` is relative to the `<ol>`'s border box, which put
       it in the 30px label gutter — a second vertical 31px left of the circles,
       so the stops read as a list BESIDE a gauge instead of stops ON it. The
       list's padding is 30 and the rail column 26 wide, so the centre is 43.
       Asserted as agreement rather than as a number, so a change to either one
       has to keep them together. */
    renderShell(`${T3}&ff=journey-scale-style:gauge,journey-stop-mark:circle`)
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    expect(track.style.left).toBe('42px')
    /* ⚠ AND THE TRACK IS RENDERED BEFORE THE ROWS, which is what paints the
       nodes over it. Reorder and the line would cut through every circle. */
    expect([...ol.children].indexOf(track)).toBe(0)

    /* The live stop keeps its size; the ones nobody has reached shrink, so six
       equal circles stop reading as six equal claims. */
    /* ⚠ PINS `journey-stop-mark: circle`. `dash` became the default on
       2026-10-02, and it replaces the shrunk ring with a tick — so the SIZE
       claim belongs to the arm that still draws rings. The tick arm is pinned
       separately below. */
    const dots = [...ol.querySelectorAll('li > span[aria-hidden] > span:first-child')]
    expect((dots[0] as HTMLElement).style.width).toBe('14px')
    expect((dots[1] as HTMLElement).style.width).toBe('10px')
  })

  it('gauge: a dashed run joins the marker to the lesson’s rule', () => {
    /* 2026-10-02, the direct ask. The knob, this run and the block's left edge
       are one mark crossing the gutter — all three in the rule's light green,
       so they do not read as two greens either side of a gap.

       ⚠ ITS WIDTH IS GUTTER ARITHMETIC AND IT WAS WRONG BY 12 FIRST. The track
       is positioned against the LIST's padding box while the rows sit inside
       that padding, so a width built only from the column and the gaps
       overshoots by exactly the list's 30px padding — it ran through the lesson
       text. Verified after: connector right edge 160, rule left edge 160. */
    renderShell(arm('gauge'))
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    const knob = [...track.children].find((el) => (el as HTMLElement).style.boxShadow) as HTMLElement
    const conn = knob.firstElementChild as HTMLElement
    expect(conn, 'no run from the marker').toBeTruthy()
    expect(conn.style.borderTop).toContain('dashed')
    expect(conn.style.borderTop).toContain('--color-success-500')
    /* 30 + 26 + 10 + 9 − 42 − 5 */
    expect(conn.style.width).toBe('28px')
  })

  it('gauge: the end caps sit left of the line, in regular weight', () => {
    /* 2026-10-02, the direct ask. Centred on the track they sat ON the spine —
       0 reading as a label hung off the first node. In the left gutter they
       line up under the 37% figure and the three read as one axis down one
       edge. Regular weight because the ends of a scale are furniture; the
       figure between them is the reading. Verified: all three right-aligned at
       x=117. */
    renderShell(arm('gauge'))
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    const caps = [...track.children].filter((el) =>
      /^(0|100)$/.test(el.textContent?.trim() ?? ''),
    ) as HTMLElement[]
    expect(caps).toHaveLength(2)
    for (const cap of caps) {
      expect(cap.style.right).toBe('100%')
      expect(cap.style.fontWeight).toBe('400')
    }
  })

  it('gauge: the marker carries a green glow, and it is the only green', () => {
    /* ⚠ A `box-shadow`, NOT A BORDER. A border grows the element and shifts the
       dot off the line; shadows paint outward from a fixed box.

       ⚠ GREEN IS REINFORCEMENT. The dot's POSITION says where the learner is
       and the row text says which stop is live, so the rail reads correctly
       without colour perception — the glow makes it findable, it does not carry
       the meaning. */
    renderShell(arm('gauge'))
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    /* ⚠ FOUND BY ITS SHADOW, NOT BY INDEX. `track.children[1]` was the knob
       until the remainder line was split out ahead of it on 2026-10-02, and an
       index-based grab then pointed at the wrong element. The knob is the one
       thing in here that glows. */
    const knob = [...track.children].find((el) =>
      (el as HTMLElement).style.boxShadow,
    ) as HTMLElement
    expect(knob, 'no glowing marker').toBeTruthy()
    expect(knob.style.boxShadow).toContain('--color-success-500')
    expect(knob.style.border).toBeFalsy()
  })

  it('gauge: the other arms keep full-size dots', () => {
    /* ⚠ SCOPED. On the arms with per-row segments there are GAPS between the
       dots, and equal sizing is what makes them read as one sequence — shrinking
       them there would be solving a problem those arms do not have. */
    renderShell(`${T3}&ff=journey-scale-style:axis,journey-stop-mark:circle`)
    const dots = [
      ...courseCard().querySelectorAll('li > span[aria-hidden] > span:first-child'),
    ]
    expect((dots[1] as HTMLElement).style.width).toBe('14px')
  })

  it('gauge: the marker anchors to the lesson block, not to a percentage', () => {
    /* 2026-10-02, the direct ask ("the 37% should line up horizontally with the
       lesson"). The lesson's height is its CONTENT's — a chapter name that
       wraps moves it — so no percentage expresses "level with it"; the rail
       measures the block and positions the fill, knob and figure off that.

       ⚠ JSDOM HAS NO LAYOUT, so the measurement always reads 0 here and the
       component falls back to the proportional `top`. What IS assertable is
       that the anchor EXISTS and wraps the detail — lose the wrapper and the
       measurement has nothing to read, which is silent in a browser too until
       someone looks. The alignment itself was verified live: knob centre 775,
       lesson block centre 775, delta 0.

       ⚠ AND IT CHANGES WHAT THE GAUGE CLAIMS. It was the arm that chose
       PROPORTION over position; anchored, it chooses position like the others,
       so 0 and 100 now bracket a line whose marker is not at its proportional
       height. The figure is still the honest number. */
    renderShell(arm('gauge'))
    const li = within(courseCard()).getByText(/Pre-Licensing Lessons/).closest('li')!
    const column = li.lastElementChild as HTMLElement
    const anchor = column.lastElementChild as HTMLElement
    expect(anchor, 'the detail has no anchor wrapper').toBeTruthy()
    expect(anchor.textContent).toMatch(/Lesson 27/)
    /* ⚠ ONLY THE CURRENT ROW carries it — a ref handed to every row would leave
       the last one to write winning, and the marker would track the bottom
       stop. */
    const others = [
      ...courseCard().querySelectorAll('ol > li'),
    ].slice(1) as HTMLElement[]
    for (const other of others) {
      expect(other.textContent).not.toMatch(/Lesson 27/)
    }
  })

  it('gauge: ground not yet covered is thinner and lighter than the fill', () => {
    /* 2026-10-02, the direct ask. ⚠ IT IS ITS OWN ELEMENT NOW. It was the
       track's background, which forced ONE width on covered and uncovered
       ground alike; split out, the remainder can recede while the fill keeps
       its weight. Measured in the browser: 1px #ececec against 2px navy. */
    renderShell(arm('gauge'))
    const ol = courseCard().querySelector('ol[aria-label="Study journey stops"]') as HTMLElement
    const track = [...ol.children].find((el) => el.tagName === 'SPAN') as HTMLElement
    const [remainder, fill] = [...track.children] as HTMLElement[]
    expect(remainder.style.width).toBe('1px')
    expect(fill.style.width).toBe('2px')
    expect(remainder.style.background).toContain('--color-neutral-100')
    expect(fill.style.background).toContain('--color-primary-700')
  })

  it('stop marks: `dash` replaces the ring with a tick, done and live untouched', () => {
    /* 2026-10-02, the direct ask, as its own flag. ⚠ THE RESET IS THE PART THAT
       MATTERS: the tick is spread over `syllabusDotStyle`, which carries a 1px
       dashed border and a 50% radius — without clearing both, a tick renders
       inside a faint rounded box. */
    /* ⚠ BOTH FLAGS IN ONE `ff`, comma-separated. `renderShell` lifts the whole
       `ff` param off the url it is handed and mirrors it onto
       `window.location`, so a second `?ff=` written by hand afterwards is just
       overwritten by the next render. */
    renderShell(`${T3}&ff=journey-scale-style:gauge,journey-stop-mark:dash`)
    const marks = [
      ...courseCard().querySelectorAll('li > span[aria-hidden] > span:first-child'),
    ] as HTMLElement[]
    /* The live stop keeps its 14px node… */
    expect(marks[0].style.width).toBe('14px')
    /* …and every unreached one is a 12x2 tick with no border left behind. */
    for (const m of marks.slice(1)) {
      expect(m.style.width).toBe('12px')
      expect(m.style.height).toBe('2px')
      expect(m.style.border).toBe('0px')
    }
  })

  it('stop marks: `dash` is the default now, with `circle` the opt-in', () => {
    /* ⚠ FLIPPED 2026-10-02, the direct ask ("make these current settings the
       default"). A diff of the live store against the catalog found exactly ONE
       setting moved — this one — so it is the whole of that change. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'journey-stop-mark')
    expect(flag?.defaultVariant).toBe('dash')
    renderShell(arm('gauge'))
    const marks = [
      ...courseCard().querySelectorAll('li > span[aria-hidden] > span:first-child'),
    ] as HTMLElement[]
    expect(marks[1].style.height).toBe('2px')
    /* …and `circle` still reaches the shrunk ring. */
    cleanup()
    renderShell(`${T3}&ff=journey-scale-style:gauge,journey-stop-mark:circle`)
    const rings = [
      ...courseCard().querySelectorAll('li > span[aria-hidden] > span:first-child'),
    ] as HTMLElement[]
    expect(rings[1].style.height).toBe('10px')
  })

  it('chip: the figure rides the live stop, with no 0 or 100 anywhere', () => {
    renderShell(arm('chip'))
    const card = courseCard()
    const li = within(card).getByText(/Pre-Licensing Lessons/).closest('li')!
    expect(li.textContent).toContain('37%')
    /* ⚠ NO SCALE AT ALL on this arm — it states a percentage without implying
       a scale it cannot keep. What it gives up is any sense of how much is
       LEFT, which is the trade to judge. */
    const caps = [...card.querySelectorAll('p, span')]
      .map((el) => el.textContent?.trim())
      .filter((t) => t === '0' || t === '100')
    expect(caps).toEqual([])
  })

  it('header: the scale leaves the column for a horizontal track', () => {
    renderShell(arm('header'))
    const card = courseCard()
    const ol = card.querySelector('ol[aria-label="Study journey stops"]')!
    const zero = [...card.querySelectorAll('span')].find((el) => el.textContent?.trim() === '0')!
    expect(zero, 'no 0 cap').toBeTruthy()
    /* ⚠ ABOVE THE LIST, NOT IN IT. The whole point of this arm is that the
       timeline goes back to being a plain list with nothing down its edge. */
    expect(ol.contains(zero)).toBe(false)
    const li = within(card).getByText(/Pre-Licensing Lessons/).closest('li')!
    expect(li.textContent).not.toContain('37%')
  })

  it('leaves Testing’s rail with no scale at all', () => {
    /* `markerLabel` gates every arm, and Testing passes none — so the shared
       rail is untouched whichever variant is selected. */
    renderShell(T1)
    const caps = [...document.querySelectorAll('ol[aria-label="Study journey stops"] span')]
      .map((el) => el.textContent?.trim())
      .filter((t) => t === '0' || t === '100' || t === '37%')
    expect(caps).toEqual([])
  })
})

describe('the six-tile grid', () => {
  /* 2026-10-01, the direct ask: one set of square tiles on the right rail,
     replacing the My Courses / Certificates pair AND the Quick links card. */

  it('draws the six, in order, as squares', () => {
    /* ⚠ PINS `square`. `stacked` became the default on 2026-10-02 — six
       squares two-across pushed the exam card and the readiness slot well
       below the fold, and these six are destinations rather than things to
       dwell on. The shape claims below belong to the opt-in arm now. */
    renderShell(`${T3}&ff=home-tile-style:square`)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    expect([...grid.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual([
      'My Courses',
      'My Certificates',
      'Flashcards',
      'Exam Information',
      'Applying for License',
      'State Requirements',
    ])
    /* ⚠ `aspect-ratio`, NOT A FIXED HEIGHT. The rail's width moves with the
       viewport, so a hard-coded height would be square at exactly one window
       size. jsdom does no layout, so the style is the only thing assertable. */
    /* ⚠ `'1 / 1'`, NOT `'1'` — the CSSOM normalises the shorthand, so reading
       back what was written fails. */
    expect((grid.querySelector('button') as HTMLElement).style.aspectRatio).toBe('1 / 1')
  })

  it('is an outline CTA that reverses on hover, styled by class not inline', () => {
    /* 2026-10-01, the direct ask ("remove the white background ... on hover, it
       will reverse").

       ⚠ THE ASSERTION IS THAT THE COLOURS ARE *NOT* INLINE. A hover cannot be
       expressed as an inline style, so the rest state has to live in the same
       class as its reversal — and an inline `background` or `color` left behind
       would BEAT the class in the cascade and silently kill the hover. That is
       the trap `tokens.css` already records for `.cre-stop-title`. Verified in
       the browser: transparent/navy at rest, navy fill with white text and icon
       on hover. */
    renderShell(T3)
    const tile = screen
      .getByRole('navigation', { name: 'Learning areas' })
      .querySelector('button') as HTMLElement
    expect(tile.className).toContain('cre-tile-cta')
    expect(tile.style.background).toBe('')
    expect(tile.style.backgroundColor).toBe('')
    expect(tile.style.color).toBe('')
    expect(tile.style.border).toBe('')
  })

  it('keeps the CTA ids those controls already carried', () => {
    /* ⚠ THE WHOLE POINT OF NOT RE-TAGGING. `nav.courses`, `home.quick-exam-info`
       and the rest are named in sessions already scripted against them; a
       moderated run that breaks one must break it here too. Flashcards is the
       one new control and takes `nav.compass`, which is where it goes. */
    renderShell(T3)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    expect([...grid.querySelectorAll('button')].map((b) => b.getAttribute('data-cta-id'))).toEqual([
      'nav.courses',
      'nav.certificates',
      'nav.compass',
      'home.quick-exam-info',
      'home.quick-get-licensed',
      'home.state-requirements',
    ])
  })

  it('stacks into long rows on `home-tile-style: stacked`', () => {
    /* 2026-10-01, the direct ask ("keep the tiles as default, but add a
       variant"). ⚠ THE SAME SIX, THE SAME ORDER, THE SAME CTA IDS — only the
       shape moves, which is the whole reason the two arms are comparable. A
       variant that also re-ordered or re-tagged would be measuring two things. */
    renderShell(`${T3}&ff=home-tile-style:stacked`)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    const buttons = [...grid.querySelectorAll('button')] as HTMLElement[]
    expect(buttons.map((b) => b.getAttribute('data-cta-id'))).toEqual([
      'nav.courses',
      'nav.certificates',
      'nav.compass',
      'home.quick-exam-info',
      'home.quick-get-licensed',
      'home.state-requirements',
    ])
    /* One column, and no longer square. */
    expect((grid as HTMLElement).style.gridTemplateColumns).toBe('minmax(0, 1fr)')
    expect(buttons[0].style.aspectRatio).toBe('')
    /* ⚠ STILL `.cre-tile-cta`, PLUS `--bare`. Both arms share the ink and the
       fill-on-hover; the stacked one drops the outline at rest (2026-10-01, the
       direct ask) because six full-width outlines one under another read as six
       boxes rather than a list.

       ⚠ `--bare` MAKES THE BORDER TRANSPARENT, it does not remove it. The 1px
       stays in the box so the row height and the label's left edge are
       identical in both arms — `border: 0` would shift every label a pixel and
       make the variant differ by more than the ask. Verified in the browser:
       1px wide, rgba(0,0,0,0). */
    expect(buttons[0].className).toContain('cre-tile-cta')
    expect(buttons[0].className).toContain('cre-tile-cta--bare')
  })

  it('defaults to the stacked rows now, with square the opt-in', () => {
    /* ⚠ FLIPPED 2026-10-02, the direct ask. The rows let the whole right rail —
       exam card, readiness slot and all six destinations — sit above the fold,
       which six squares two-across did not. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'home-tile-style')
    expect(flag?.defaultVariant).toBe('stacked')
    renderShell(T3)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    expect((grid as HTMLElement).style.gridTemplateColumns).toBe('minmax(0, 1fr)')
  })

  it('keeps the outline on the squares, where the shape needs an edge', () => {
    /* ⚠ `--bare` BELONGS TO THE STACKED ARM ALONE. A square with no edge has
       no shape; six full-width outlines stacked read as six boxes. */
    renderShell(`${T3}&ff=home-tile-style:square`)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    expect((grid.querySelector('button') as HTMLElement).className).not.toContain('--bare')
  })

  it('leaves Testing with the two-tile strip and its Quick links card', () => {
    renderShell(T1)
    const grid = screen.getByRole('navigation', { name: 'Learning areas' })
    expect([...grid.querySelectorAll('button')].map((b) => b.textContent?.trim())).toEqual([
      'My Courses',
      'Certificates',
    ])
    expect(document.querySelector('section[aria-label="Quick links"]')).toBeTruthy()
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
    /* ⚠ NO "Quick links" ANY MORE — the six-tile grid absorbed it on
       2026-10-01, so the rail is the exam card and the grid. */
    /* ⚠ THE READINESS STUB JOINED on 2026-10-01, between the exam card and the
       tiles. Order is the assertion: the ask placed it directly below the exam
       card, and a stub that drifted to the foot of the rail would still pass a
       presence check. */
    expect(siblings).toEqual([
      'Exam Date',
      'Your Study Pace / Exam Readiness',
      'Learning areas',
    ])
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
    for (const label of ['Pass State Exam', 'Get Licensed in New York', 'Exam Date']) {
      expect(document.querySelector(`section[aria-label="${label}"]`), label).toBeTruthy()
    }
    /* ⚠ THE QUICK LINKS CARD IS GONE on this version, absorbed into the
       six-tile grid (2026-10-01) — asserted ABSENT, because the three
       destinations it carried are now tiles and rendering both would be every
       sheet shortcut twice. Testing still has the card; pinned below. */
    expect(document.querySelector('section[aria-label="Quick links"]')).toBeNull()
  })

  it('drops Readiness from the rail, exactly as Testing does', () => {
    renderShell(T3)
    expect(screen.queryByRole('button', { name: 'Readiness' })).toBeNull()
  })
})

/**
 * THE STEP LINKS — 2026-10-02, the direct ask: Exam Information at the foot of
 * Pass State Exam; Applying for License and State Requirements at the foot of
 * Get Licensed.
 *
 * ⚠ THE THING WORTH PINNING IS WHICH SHEET EACH ONE OPENS, not that a link
 * exists. All three destinations are already on screen as tiles in the right
 * rail, so a link wired to the wrong handler renders perfectly, reads
 * perfectly, and opens the neighbour's sheet — and the only way to notice is
 * to press it.
 *
 * ⚠ AND THAT THEY ARE INSIDE THE OPEN BODY. The disclosure is closed at rest;
 * a link that escaped to the header row would be a second control competing
 * with the one that opens the step.
 */
describe('Testing 3 — the sheet links at the foot of Steps 2 and 3', () => {
  const stepSection = (name: RegExp) =>
    screen.getByRole('region', { name }) as HTMLElement

  /** Opens a disclosure and returns it. */
  function openStep(name: RegExp) {
    const section = stepSection(name)
    fireEvent.click(within(section).getAllByRole('button')[0])
    return section
  }

  it('hides them until the step is opened', () => {
    /* Closed, the step is its number and its heading and nothing else — the
       whole point of the disclosure. A link visible at rest would undo it. */
    renderShell(T3)
    const section = stepSection(/^Pass State Exam$/)
    expect(within(section).queryByText('Exam Information')).toBeNull()
  })

  it('puts Exam Information under Pass State Exam, and nothing else', () => {
    renderShell(T3)
    const section = openStep(/^Pass State Exam$/)
    const links = [...section.querySelectorAll('[data-cta-id]')].map((b) => b.textContent)
    expect(links).toEqual(['Exam Information'])
  })

  it('puts BOTH licensing links under Get Licensed, in the asked order', () => {
    /* The order is the ask's order. Applying for License is the step's own
       subject; State Requirements is the state's rules behind it. */
    renderShell(T3)
    const section = openStep(/^Get Licensed/)
    const links = [...section.querySelectorAll('[data-cta-id]')].map((b) => b.textContent)
    expect(links).toEqual(['Applying for License', 'State Requirements'])
  })

  it('opens the EXAM sheet from Exam Information, not the licensing one', () => {
    /* ⚠ THE ASSERTION THAT EARNS ITS KEEP. Both links are two lines apart in
       `stepLinks` and both take `onOpenStep`; swapping the two ids is a
       one-character change that nothing else would catch. */
    renderShell(T3)
    const section = openStep(/^Pass State Exam$/)
    fireEvent.click(within(section).getByText('Exam Information'))
    expect(screen.getByRole('dialog', { name: /Exam Details/i })).toBeTruthy()
  })

  it('opens the LICENSING sheet from Applying for License', () => {
    renderShell(T3)
    const section = openStep(/^Get Licensed/)
    fireEvent.click(within(section).getByText('Applying for License'))
    expect(screen.getByRole('dialog', { name: /Apply for your License/i })).toBeTruthy()
  })

  it('reuses the right rail’s CTA ids rather than minting new ones', () => {
    /* ⚠ DELIBERATE DUPLICATION. "Do they find Exam Information" is ONE research
       question; two ids would let a moderated run kill one copy and leave the
       other live, and the participant would simply press the survivor. The cost
       — a session cannot tell the two placements apart — is recorded on
       `stepLinks`. */
    renderShell(T3)
    const exam = openStep(/^Pass State Exam$/)
    expect(
      exam.querySelector('[data-cta-id="home.quick-exam-info"]'),
    ).toBeTruthy()
    const licence = openStep(/^Get Licensed/)
    expect(
      licence.querySelector('[data-cta-id="home.quick-get-licensed"]'),
    ).toBeTruthy()
    expect(
      licence.querySelector('[data-cta-id="home.state-requirements"]'),
    ).toBeTruthy()
  })

  it('carries no inline colour, so the dark theme can re-point them', () => {
    /* The trap `.cre-cta-ink`'s own note in `tokens.css` records: an inline
       `color` beats the stylesheet and looks correct in light. */
    renderShell(T3)
    const section = openStep(/^Pass State Exam$/)
    const link = within(section).getByText('Exam Information').closest('button')!
    expect(link.className).toContain('cre-link-action')
    expect(link.className).toContain('cre-cta-ink')
    expect(link.style.color).toBe('')
  })
})

/**
 * THE RIGHT COLUMN'S STROKE — 2026-10-02, the direct ask: "stroke border on
 * these containers should match the border of the current course".
 *
 * ⚠ "MATCH" IS THE ASSERTION, so the test reads the course card's own border
 * and compares, rather than restating `1px solid var(--color-primary-100)`
 * three times. Restyling the course card should move this test with it — a
 * hard-coded literal would let the two drift apart while every line still
 * passed, which is the whole failure the ask is correcting.
 *
 * ⚠ AND THE OTHER TWO VERSIONS KEEP THEIR STROKELESS FRAME. `journeyCards`
 * turns on for Testing, Testing 2 and Testing 3 alike, so a border added to the
 * SHARED shell would silently reverse their own 2026-09-21 "remove stroke" ask.
 */
describe('Testing 3 — the right column matches the course card’s edge', () => {
  const borderOf = (label: string) =>
    (document.querySelector(`section[aria-label="${label}"]`) as HTMLElement | null)?.style.border

  it('gives the exam card and the readiness stub the course card’s border', () => {
    renderShell(T3)
    const course = borderOf('Current course')
    expect(course).toBeTruthy()
    expect(borderOf('Exam Date')).toBe(course)
    expect(borderOf('Your Study Pace / Exam Readiness')).toBe(course)
  })

  it('leaves Testing’s frame strokeless', () => {
    /* The 2026-09-21 ask on THAT version, which this change must not reverse on
       its behalf — and nothing on Testing's screen would explain the stroke if
       it did. */
    renderShell(T1)
    expect(borderOf('Exam Date')).toBeFalsy()
  })
})
