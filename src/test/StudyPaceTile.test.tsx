import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StudyPaceTile } from '@/components/learning/StudyPaceTile'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  defaultWeekdays,
  WEEKDAY_LABELS,
} from '@/lib/studyPace'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * The two claims this widget exists to keep, and which a refactor is most
 * likely to break quietly:
 *
 *   1. **The TILE operates nothing.** One control, Adjust. Everything else is
 *      in the sheet. A preset strip creeping back onto the tile is the exact
 *      regression Jillienne asked to prevent on 2026-09-21.
 *   2. **TWO ceilings, and the sheet says which binds.** An exam date inside
 *      the access window has to take over AND be explained; one outside it must
 *      leave access binding. A pace that switches ceilings silently is how a
 *      learner stops believing the number.
 *
 * Everything else is covered by `studyPace.test.ts`, which tests the model
 * directly — these are about the surface.
 */

const TODAY = new Date(2026, 8, 18) // Fri 18 Sep 2026

function renderTile(props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {}) {
  return render(
    <MemoryRouter>
      <StudyPaceTile
        today={TODAY}
        hoursRemaining={24}
        accessExpiresAt="2026-10-18"
        courseTitle="Life & Health Pre-License Course"
        detailsTo="/dashboard-rebrand?section=study-plan"
        {...props}
      />
    </MemoryRouter>,
  )
}

/** The sheet renders in a portal, so query the dialog rather than the tile. */
const sheet = () => screen.getByRole('dialog')
/**
 * Open the sheet from whichever control the current shape offers — "Adjust" on
 * the square, "Customize Study Plan" on the card since the 2026-09-21 redesign.
 *
 * MATCHED BY ROLE, not by label, precisely because the label differs and the
 * CLAIM does not: both shapes open the SAME sheet, which is the reuse the card
 * variant rests on. A helper pinned to one label would make a rename read as a
 * broken sheet.
 */
const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Adjust|Customize Study Plan/ }))
  return sheet()
}

describe('StudyPaceTile — the tile operates nothing', () => {
  it('offers exactly one control, and it is Adjust', () => {
    renderTile()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('Adjust')
  })

  it('carries no preset or nights control', () => {
    renderTile()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByText(/Relaxed|Focused/)).toBeNull()
  })

  it('states a derived pace and the date it finishes', () => {
    renderTile()
    expect(screen.getByText(/a night · \d nights a week/)).toBeInTheDocument()
    expect(screen.getByText(/Finishes by/)).toBeInTheDocument()
  })

  it('calls the number "Recommended" only while it is still ours', async () => {
    const user = userEvent.setup()
    renderTile()
    expect(screen.getByText('Recommended')).toBeInTheDocument()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: /Full window|Relaxed/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    // The tile now names the learner's own choice instead of claiming credit.
    expect(screen.queryByText('Recommended')).toBeNull()
  })

  it('links Details at a real in-shell address', () => {
    renderTile()
    expect(screen.getByRole('link', { name: /Details/ })).toHaveAttribute(
      'href',
      '/dashboard-rebrand?section=study-plan',
    )
  })
})

describe('StudyPaceSheet — the four groups', () => {
  it('opens with the aims, days a week and the plan switch', async () => {
    /* THREE GROUPS as of 2026-09-21, not four: the exam-date group was hidden
       (the direct ask). The DATE is not gone — it is captured on the Schedule
       State Exam card and reaches this model through `examDateStore`, which is
       what the two-ceiling tests below now drive it with. Asserted as an
       absence too, so the field coming back is a decision rather than a drift. */
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    expect(within(dialog).getAllByRole('radio', { name: /a night|won’t fit/i }).length).toBeGreaterThanOrEqual(2)
    expect(within(dialog).getByRole('radiogroup', { name: 'Days a week' })).toBeInTheDocument()
    expect(within(dialog).getByRole('switch', { name: 'Create a study plan' })).toBeInTheDocument()
    expect(within(dialog).queryByLabelText(/Exam date/)).toBeNull()
  })

  it('starts on Recommended', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const checked = within(dialog).getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true')
    expect(checked.some((r) => r.getAttribute('data-preset') === 'recommended')).toBe(true)
  })

  it('re-prices the SHEET live, and the tile only on Save', async () => {
    /* REWRITTEN 2026-09-21 with the draft save contract. It asserted the TILE
       changing the instant a segment was clicked, which was true because
       `set()` wrote straight through to the parent — the same write-through
       that made "Save pace" describe one field in four and left a Cancel button
       with nothing to restore.

       The feedback the old behaviour gave is NOT gone, it moved inside the
       panel: the sheet's own figures still re-price on every click. So this
       asserts both halves — live in the sheet, committed on Save — which is the
       contract itself rather than one visible consequence of it. */
    const user = userEvent.setup()
    renderTile()
    const before = screen.getByText(/a night · \d nights a week/).textContent
    const dialog = await openSheet(user)
    const evening = () =>
      within(dialog).getByRole('radio', { name: /Recommended/ }).textContent

    const beforeInSheet = evening()
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    // The sheet moved…
    expect(evening()).not.toBe(beforeInSheet)
    // …and the tile has not, because nothing has been committed.
    expect(screen.getByText(/a night · \d nights a week/).textContent).toBe(before)

    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    expect(screen.getByText(/a night · 6 nights a week/)).toBeInTheDocument()
  })

  it('discards the draft on Cancel', async () => {
    // The other half of the contract, and the reason Cancel could not exist
    // before: with the old write-through there was nothing left to discard.
    const user = userEvent.setup()
    renderTile()
    const before = screen.getByText(/a night · \d nights a week/).textContent
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText(/a night · \d nights a week/).textContent).toBe(before)
    // …and re-opening shows the SAVED state, not the abandoned draft.
    const again = await openSheet(user)
    expect(within(again).getByRole('radio', { name: '6' })).toHaveAttribute('aria-checked', 'false')
  })
})

describe('StudyPaceSheet — two ceilings', () => {
  it('names the access window while there is no exam date', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    expect(within(dialog).getByText(/These come from your course access/)).toBeInTheDocument()
  })

  it('hands the ceiling to an exam date inside the window, and says so', async () => {
    /* THE DATE ARRIVES AS A PROP now, not typed into this sheet — the field was
       hidden on 2026-09-21 and the Schedule State Exam card is where a learner
       enters one. The CLAIM is untouched: an exam inside the access window has
       to take the ceiling AND be explained. Only the input moved. */
    const user = userEvent.setup()
    renderTile({ examDate: '2026-10-10' })
    const dialog = await openSheet(user)
    const note = dialog.querySelector('[data-binding]')
    expect(note?.getAttribute('data-binding')).toBe('exam')
    expect(note?.textContent).toMatch(/exam date is the one doing the work/i)
    // …and it names the OTHER date, so the learner can see what it beat.
    expect(note?.textContent).toMatch(/Oct 18/)
  })

  it('leaves access binding when the exam sits past the window', async () => {
    const user = userEvent.setup()
    renderTile({ examDate: '2026-12-15' })
    const dialog = await openSheet(user)
    const note = dialog.querySelector('[data-binding]')
    expect(note?.getAttribute('data-binding')).toBe('access')
    expect(note?.textContent).toMatch(/access is still the one doing the work/i)
  })
})

describe('StudyPaceSheet — the study plan calendar', () => {
  it('asks which days only once the calendar is switched on', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    expect(within(dialog).queryByRole('group', { name: 'Study days' })).toBeNull()
    await user.click(within(dialog).getByRole('switch', { name: 'Create a study plan' }))
    expect(within(dialog).getByRole('group', { name: 'Study days' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText('Usual start time')).toBeInTheDocument()
  })

  it('pre-ticks as many days as the chosen pace, and previews real dated sessions', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('switch', { name: 'Create a study plan' }))
    const pressed = within(dialog)
      .getAllByRole('button', { pressed: true })
      .filter((b) => b.hasAttribute('data-weekday'))
    const nights = Number(screen.getByText(/a night · (\d) nights a week/).textContent!.match(/(\d) nights/)![1])
    expect(pressed).toHaveLength(nights)
    expect(dialog.querySelectorAll('[data-session]').length).toBeGreaterThan(0)
  })

  it('lets un-ticking a day re-price the pace rather than disagreeing with it', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('switch', { name: 'Create a study plan' }))
    const before = Number(screen.getByText(/a night · (\d) nights a week/).textContent!.match(/(\d) nights/)![1])
    const firstTicked = within(dialog)
      .getAllByRole('button', { pressed: true })
      .find((b) => b.hasAttribute('data-weekday'))!
    await user.click(firstTicked)
    /* ASSERTED IN THE SHEET, then on the tile after Save — the draft contract.
       The claim is unchanged: un-ticking a day re-prices the pace rather than
       letting the count and the calendar disagree. */
    expect(
      within(dialog).getByRole('radio', { name: String(before - 1) }),
    ).toHaveAttribute('aria-checked', 'true')
    await user.click(within(dialog).getByRole('button', { name: /Save pace/ }))
    expect(screen.getByText(new RegExp(`a night · ${before - 1} nights a week`))).toBeInTheDocument()
  })

  it('keeps the learner’s choices when the sheet is closed and reopened', async () => {
    const user = userEvent.setup()
    renderTile()
    let dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    dialog = await openSheet(user)
    const six = within(dialog).getByRole('radio', { name: '6' })
    expect(six).toHaveAttribute('aria-checked', 'true')
  })

  it('resets everything back to the recommendation', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    await user.click(within(dialog).getByRole('switch', { name: 'Create a study plan' }))
    await user.click(within(dialog).getByRole('button', { name: 'Reset to recommended' }))
    expect(within(dialog).queryByRole('group', { name: 'Study days' })).toBeNull()
    // The tile's pill is back to "Recommended". Scoped past the dialog, because
    // the sheet's own Recommended chip is still on screen — a bare
    // `getByText('Recommended')` matches both and throws.
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    expect(screen.getByText('Recommended')).toBeInTheDocument()
    expect(screen.getByText(/a night · 4 nights a week/)).toBeInTheDocument()
  })
})

/**
 * THE CARD SHAPE — `layout="card"`, the Testing version's `presets` pacing
 * treatment (2026-09-21). Ported from `xcel-pace-presets.html` §02.
 *
 * These are here rather than in `TestingVersion.test.tsx` because the claims
 * are about AGREEMENT WITH THE MODEL, and that needs a ceiling to agree about.
 * The course the band paces on Testing carries no `expiresAt` at all, so the
 * integration suite can only pin the card's internal consistency and its
 * wiring; a ceiling is a prop here, so this is where the arithmetic lives.
 *
 * Nothing below asserts a literal date or a literal day count — every figure
 * comes back out of `studyPace` and is compared to what the card printed.
 */
describe('StudyPaceTile — the presets card', () => {
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 24, accessExpiresAt: '2026-10-18' })

  const renderCard = (props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {}) =>
    renderTile({ layout: 'card', ...props })

  it('states the evening and the week the model derives', () => {
    renderCard()
    const preset = defaultPreset(model())
    /* ASSERTED ON `textContent`, not via `getByText`: the headline sets its own
       figure at a larger size, which makes it a child element, and
       `getByText`'s default matcher reads only an element's DIRECT text nodes —
       so a sentence split by a `<span>` is invisible to it. That is the "broken
       up by multiple elements" trap, and it fails as a missing element rather
       than as a wrong string.

       BOTH FIGURES COME FROM ONE FORMATTER. The design sets the nightly figure
       and its unit at different sizes, so the card splits `formatEvening`'s
       output rather than deriving the number again — a second rounding here is
       how "1¾ hours a night" and "8¾ hours a week" would stop being the same
       arithmetic. */
    expect(document.body.textContent).toContain(
      `About ${formatEvening(preset.minsPerNight)} a night, ${formatEvening(preset.minsPerWeek)} a week`,
    )
  })

  it('draws the week, shading the nights the pace falls on', () => {
    /* THE DESIGN'S BIGGEST ADDITION. The old card said "5 nights a week" and
       left the learner to picture it.

       The days are NOT invented for this strip: with no plan built it renders
       `defaultWeekdays(nights)` — the same helper the sheet uses to propose a
       calendar, moved to `@/lib/studyPace` when this second caller arrived. Two
       surfaces deriving "which nights" apart from each other is how a card
       comes to shade Mon–Thu while the plan behind it builds Mon–Wed + Fri. */
    renderCard()
    const preset = defaultPreset(model())
    const strip = document.querySelector('[aria-hidden]')!
    const cells = Array.from(strip.querySelectorAll('span'))
    /* INITIALS as of 2026-09-21, when the strip became circular indicators —
       "WED" does not fit a 28px dot at a legible size. Compared against the
       shared labels rather than a literal list, so the two cannot drift. */
    expect(cells.map((c) => c.textContent)).toEqual(WEEKDAY_LABELS.map((d) => d[0]))
    const shaded = cells.filter((c) => c.style.background !== 'transparent')
    expect(shaded).toHaveLength(preset.nights)
    // …and they are the FIRST n, Monday-first — the helper's own rule.
    expect(shaded.map((c) => c.textContent)).toEqual(
      defaultWeekdays(preset.nights).map((i) => WEEKDAY_LABELS[i][0]),
    )
  })

  it('hides the strip from a screen reader, because the sentence says it', () => {
    /* The accessible name must never depend on which cells are filled. The
       headline above already states the pace in words, so a reader walking
       seven day names to count four of them learns nothing new. */
    renderCard()
    const strip = document.querySelector('[aria-hidden]')!
    expect(strip.getAttribute('aria-hidden')).not.toBeNull()
  })

  it('states the window and the finish date it lands on', () => {
    /* THE THREE BODY LINES, checked against the model rather than as strings:
       the days left agree with the ceiling the model resolved, the access date
       is the learner's OWN expiry (not `hardEndIso`, which is a day earlier
       because finishing the day access dies is not finishing), and the finish
       is the preset's. */
    renderCard()
    const preset = defaultPreset(model())
    const text = document.body.textContent ?? ''
    expect(text).toContain(`You have ${model().daysToCeiling} days left to finish`)
    expect(text).toContain(`Access ends on ${formatPaceDate('2026-10-18')}`)
    expect(text).toContain(`you will finish around ${formatPaceDate(preset.finishIso)}`)
  })

  it('follows the exam date when that is what binds', () => {
    /* Driven by the PROP as of 2026-09-21 — the sheet's exam field was hidden,
       and this is the path a real one takes anyway: the Schedule State Exam
       card writes `examDateStore`, the band threads it here. */
    renderCard({ examDate: '2026-10-10' })
    // The window line moves onto the exam — a card explaining itself against
    // one ceiling while the model priced another is the silent switch
    // `binding` exists to prevent.
    expect(document.body.textContent).toContain(`Your exam is on ${formatPaceDate('2026-10-10')}`)
    expect(document.body.textContent).not.toMatch(/Access ends on/)
  })

  it('claims no deadline on a course that has none', () => {
    /* No access window and no exam date: the model has nothing to aim at and
       falls back to its default horizon. The card must NOT then say "you have N
       days left to finish the course material" — that is a deadline the data
       does not have — and names the date as a target instead. */
    renderCard({ accessExpiresAt: undefined })
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/left to finish the course material/)
    expect(text).not.toMatch(/Access ends on/)
    expect(text).toMatch(/no access deadline, so the date below is a suggested target/)
    // …and it still states the finish, which is the one thing it can.
    expect(text).toMatch(/you will finish around/)
  })

  it('operates exactly one thing, and it opens the shared sheet', () => {
    /* The claim the square makes too: this is a statement, not a control panel.
       The redesign replaced Start studying + Adjust with one link, so the count
       went from two to one — and `Details →` is still absent, because the
       buttons ARE this card's floor. */
    renderCard()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Customize Study Plan'])
    expect(buttons[0].getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('takes the CTA off the design’s magenta and off inline ink', () => {
    /* ⚠ THE DESIGN SPECIFIES `#a24796`. That is the CRE file's accent; on XCEL
       the equivalent ramp is the Brick, a FILL colour measuring 2.05:1 as TEXT
       on the dark shell and the ramp this version deliberately moved every CTA
       off on 2026-09-16 ("navy means do this; red means this is an
       assessment"). `.cre-cta-ink` owns that decision and carries the dark-mode
       swap a hex cannot — so the assertion is the ABSENCE of an inline colour,
       which is what lets the class win. */
    renderCard()
    const cta = screen.getByRole('button', { name: /Customize Study Plan/ })
    expect(cta.className).toContain('cre-cta-ink')
    expect(cta.style.color).toBe('')
    expect(document.body.innerHTML).not.toMatch(/a24796/i)
  })

  it('carries the provenance in its eyebrow, and flips it on first touch', async () => {
    /* The prototype's §02 finding, kept through the redesign: the product
       should not go on calling a figure the learner picked a recommendation.
       The chip that used to say it is gone — it was the same word the eyebrow
       says — so the eyebrow is where it lives now. */
    const user = userEvent.setup()
    renderCard()
    expect(screen.getByText('Recommended Study Pace')).toBeInTheDocument()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    /* SAVE FIRST, as of the sheet's draft contract. The eyebrow follows
       `choices`, and nothing reaches `choices` until Save — which is the point
       of that change, not a wrinkle in this test: a card that re-titled itself
       "Your Study Pace" while the learner was still deciding, and could still
       press Cancel, would be claiming a choice they had not made. */
    await user.click(within(dialog).getByRole('button', { name: /Save pace/ }))
    expect(screen.getByText('Your Study Pace')).toBeInTheDocument()
    expect(screen.queryByText('Recommended Study Pace')).toBeNull()
  })

  it('keeps the square shape untouched in the default layout', () => {
    // The card is a fifth treatment, not a replacement: Testing 2's tile still
    // renders exactly as it did, with one control on a 1:1 tile.
    renderTile()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByText('Study Pace')).toBeInTheDocument()
  })
})

/**
 * THE REBUILD — 2026-09-21. Structure, keyboard and the save contract.
 *
 * jsdom has no layout, so the clipping bug this rebuild exists to fix cannot be
 * measured here. What CAN be pinned is the shape that fixes it: three flex
 * children, the middle one scrolling, the footer a SIBLING of it rather than
 * the last thing inside. Those are the conditions the fix rests on, and they
 * are what a later edit would undo by accident.
 */
describe('StudyPaceSheet — the rebuilt shell', () => {
  it('renders a scroll body with the footer OUTSIDE it', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const body = dialog.querySelector('.cre-pace-sheet__body')!
    const footer = dialog.querySelector('.cre-pace-sheet__footer')!
    expect(body).toBeTruthy()
    expect(footer).toBeTruthy()
    /* THE LOAD-BEARING ASSERTION. A footer INSIDE the scrolling region scrolls
       away with the content, which is the bug wearing a different hat — Save
       still unreachable, just for a new reason. Siblings, sharing one flex
       parent. */
    expect(body.contains(footer)).toBe(false)
    expect(footer.parentElement).toBe(body.parentElement)
    // …and the body is the element that scrolls, not the panel.
    expect(dialog.querySelector('.cre-pace-sheet__header')!.parentElement).toBe(body.parentElement)
  })

  it('has a visible title and a Close button', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const heading = within(dialog).getByRole('heading', { name: '', hidden: true })
    expect(heading.textContent).toBe('Adjust your pace')
    /* `aria-hidden` ON PURPOSE: `Sheet` renders its own sr-only copy for
       `aria-labelledby`, so an exposed second one gives the dialog a doubled
       accessible name. The heading is for eyes; the sr-only one is the name. */
    expect(heading).toHaveAttribute('aria-hidden')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeTruthy()
  })
})

describe('StudyPaceSheet — keyboard', () => {
  it('is ONE tab stop per radio group, with arrows moving selection', async () => {
    /* Both groups were lists of tabbable `role="radio"` buttons: seven stops to
       cross the sheet, and none of the arrow behaviour the role promises. A
       custom radio group has to match the native one or it should not claim the
       role. */
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const nights = within(dialog).getByRole('radiogroup', { name: 'Days a week' })
    const options = within(nights).getAllByRole('radio')
    const tabbable = options.filter((o) => o.getAttribute('tabindex') === '0')
    expect(tabbable).toHaveLength(1)
    expect(tabbable[0]).toHaveAttribute('aria-checked', 'true')

    tabbable[0].focus()
    await user.keyboard('{ArrowRight}')
    const after = within(nights)
      .getAllByRole('radio')
      .find((o) => o.getAttribute('aria-checked') === 'true')!
    expect(after).not.toBe(tabbable[0])
    // …and it MOVED as well as selected, which is the native behaviour.
    expect(after).toHaveFocus()

    await user.keyboard('{Home}')
    expect(
      within(nights).getAllByRole('radio')[0].getAttribute('aria-checked'),
    ).toBe('true')
  })

  it('moves the aim rows with up/down, and keeps them one stop', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const aims = within(dialog).getByRole('radiogroup', { name: 'Finish date' })
    const rows = within(aims).getAllByRole('radio')
    expect(rows.filter((r) => r.getAttribute('tabindex') === '0')).toHaveLength(1)
    const checked = rows.find((r) => r.getAttribute('aria-checked') === 'true')!
    checked.focus()
    await user.keyboard('{ArrowDown}')
    const after = within(aims)
      .getAllByRole('radio')
      .find((r) => r.getAttribute('aria-checked') === 'true')!
    expect(after).not.toBe(checked)
  })
})

describe('StudyPaceSheet — the row that cannot be chosen', () => {
  it('stays focusable and explains itself', async () => {
    /* `aria-disabled`, NOT `disabled`. A disabled button drops out of the tab
       order and out of most screen-reader element lists — so the one row that
       most needs to say why it is unavailable becomes the one row a keyboard
       user cannot reach. The hours are set high enough that no preset fits. */
    const user = userEvent.setup()
    renderTile({ hoursRemaining: 4000 })
    const dialog = await openSheet(user)
    const unfittable = within(dialog)
      .getAllByRole('radio')
      .filter((r) => r.getAttribute('aria-disabled') === 'true')
    expect(unfittable.length).toBeGreaterThan(0)
    for (const row of unfittable) {
      // Focusable: not `disabled`, and carrying a real tabindex.
      expect(row).not.toBeDisabled()
      expect(row.getAttribute('tabindex')).not.toBeNull()
      // …and it names a reason, wired by id rather than left to the label.
      const describedBy = row.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      expect(dialog.querySelector(`#${describedBy}`)?.textContent).toMatch(/not enough time/i)
    }
  })
})

describe('StudyPaceSheet — spoken durations', () => {
  it('shows the fraction and speaks it in words', async () => {
    /* `1¾ hours` is right to SHOW and wrong to HEAR — screen readers render the
       vulgar fraction as "three quarters", "3/4" or nothing depending on the
       engine, on the one figure this sheet exists to convey. Both come out of
       the same rounding, so they can never disagree. */
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const row = within(dialog).getByRole('radio', { name: /Recommended/ })
    /* SCOPED TO THE EVENING CELL. The row's FIRST `[aria-hidden]` is the radio
       dot, which is an empty span — a bare `querySelector('[aria-hidden]')`
       finds it and asserts nothing about the figure. */
    const cell = row.querySelector('.cre-pace-sheet__aim-evening')!
    expect(cell.querySelector('.cre-sr-only')?.textContent).toMatch(/\d+ (hour|minute)/)
    // The glyph is still there, hidden from the reader rather than replaced.
    expect(cell.querySelector('[aria-hidden]')?.textContent).toMatch(/\d/)
  })
})

/**
 * THE WEEK STRIP READING ACTUAL ACTIVITY — 2026-09-21.
 *
 * Two modes, and which one shows turns on whether there is anything to read,
 * not on how far along the learner is. The data is AUTHORED per demo persona
 * (`STUDY_MINUTES_BY_VARIANT`) rather than derived from a progress percentage:
 * a week inferred from a total is the "observed rate" this version refuses
 * everywhere else — it would look right and be fiction.
 */
describe('StudyPaceTile — the week strip reads real minutes', () => {
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 24, accessExpiresAt: '2026-10-18' })
  const renderCard = (props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {}) =>
    renderTile({ layout: 'card', ...props })

  /** The strip's cells, in order. */
  const cells = () =>
    [...document.querySelector('[aria-hidden]')!.querySelectorAll('span')] as HTMLElement[]
  /** How full a cell is drawn, 0–100. The fill is a bottom-up gradient stop. */
  const fillPct = (el: HTMLElement) =>
    Number(/([\d.]+)%/.exec(el.style.background)?.[1] ?? 0)

  const TODAY_INDEX = (TODAY.getDay() + 6) % 7

  it('fills each elapsed day by minutes against that day’s target', () => {
    const preset = defaultPreset(model())
    const target = preset.minsPerNight
    // A full day, a half day, and a day with nothing — all in the past.
    const week = [0, 0, 0, 0, 0, 0, 0]
    week[0] = target
    week[1] = target / 2
    renderCard({ weekMinutes: week })
    const c = cells()
    expect(fillPct(c[0])).toBe(100)
    expect(fillPct(c[1])).toBe(50)
    // A day with nothing studied is an empty ring, not a filled grey one.
    expect(c[2].style.background).toBe('transparent')
  })

  it('clamps a day that ran long to full, rather than overflowing it', () => {
    const preset = defaultPreset(model())
    const week = [preset.minsPerNight * 3, 0, 0, 0, 0, 0, 0]
    renderCard({ weekMinutes: week })
    expect(fillPct(cells()[0])).toBe(100)
  })

  it('leaves days that have not happened EMPTY, whatever the data says', () => {
    /* A Thursday that has not arrived is not a Thursday they missed, and
       filling it would say it was. The fixture authors the whole week — the
       later days become visible when the clock moves, not before. */
    const week = [0, 0, 0, 0, 0, 0, 0].map(() => 999)
    renderCard({ weekMinutes: week })
    const c = cells()
    for (let i = TODAY_INDEX + 1; i < 7; i += 1) {
      expect(c[i].style.background, `day ${i}`).toBe('transparent')
    }
  })

  it('falls back to the SUGGESTED week when there is nothing to read', () => {
    /* Absent minutes means "no week yet", not "a week of zeros" — a learner at
       0% has not had a bad week, they have not had a week. The strip states the
       nights the pace falls on instead, which is what it always did. */
    const preset = defaultPreset(model())
    renderCard()
    const shaded = cells().filter((c) => c.style.background !== 'transparent')
    expect(shaded).toHaveLength(preset.nights)
    // …and every one of them is drawn FULL: a suggestion has no partial state.
    for (const cell of shaded) expect(fillPct(cell)).toBe(100)
  })
})

describe('StudyPaceTile — the week that cannot be salvaged', () => {
  /* 32 hours of coursework against an 11-day window: `minsPerWeek` past
     `CEILING_MINS × 6`, which is the model's own definition of "no pace fits".
     The numbers are the `progress-off-track` fixture's, and the first assertion
     below pins that they still reach the state — a card test that silently
     stopped exercising the branch it names is the failure this guards. */
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 32, accessExpiresAt: '2026-09-29' })

  it('is the state the copy is written for', () => {
    expect(defaultPreset(model()).state).toBe('no')
  })

  it('names BOTH ways out and quotes no figure', () => {
    /* THE ONE RULE THIS COPY MUST KEEP — 2026-09-21. A pace reaching this state
       needs more than `CEILING_MINS` a night, and `CEILING_MINS`' own note says
       why printing it is wrong: "no number is honest there, and the answer is
       more time or fewer lessons, not a bigger figure." So the card says
       DRASTICALLY and names the two options the learner actually has. A
       well-meaning refactor that "helpfully" restores the nightly figure here
       is what this asserts against. */
    renderTile({ layout: 'card', hoursRemaining: 32, accessExpiresAt: '2026-09-29' })
    const text = document.body.textContent ?? ''
    expect(text).toContain('won’t fit before your access ends')
    expect(text).toContain('drastic jump in pace')
    expect(text).toContain('extending your course access')
    // No hours, no minutes, no nightly number — in any of the card's copy.
    expect(text).not.toMatch(/\d+\s*(hours?|minutes?|mins?)\s*a\s*night/i)
    // …and the one control the card ever offers is still there.
    expect(screen.getByRole('button', { name: /Customize Study Plan/ })).toBeTruthy()
  })

  it('is reachable from the demo controls, not just from the model', () => {
    /* THE SILENT FALLBACK THIS FIXES — 2026-09-21. `progress-off-track` lived
       in `DashboardProgressVariant` and in every `*_BY_VARIANT` map, and the
       "Pace — won't finish" persona set it, but it was never declared on the
       flag — so the seed was ignored, the dashboard fell back to On Track, and
       the whole branch above was unreachable dead copy that still type-checked
       and still passed every test. Pinning the catalog is the only assertion
       that would have caught it. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'dashboard-progress-state')!
    expect(flag.variants?.map((v) => v.value)).toContain('progress-off-track')
  })
})
