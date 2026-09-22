import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StudyPaceTile } from '@/components/learning/StudyPaceTile'

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
const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Adjust' }))
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
  it('opens with the three aims, days a week, an exam field and the plan switch', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    expect(within(dialog).getAllByRole('radio', { name: /a night|won’t fit/i }).length).toBeGreaterThanOrEqual(2)
    expect(within(dialog).getByRole('radiogroup', { name: 'Days a week' })).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Exam date/)).toBeInTheDocument()
    expect(within(dialog).getByRole('switch', { name: 'Create a study plan' })).toBeInTheDocument()
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
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const field = within(dialog).getByLabelText(/Exam date/)
    await user.clear(field)
    await user.type(field, '2026-10-10')
    const note = dialog.querySelector('[data-binding]')
    expect(note?.getAttribute('data-binding')).toBe('exam')
    expect(note?.textContent).toMatch(/exam date is the one doing the work/i)
    // …and it names the OTHER date, so the learner can see what it beat.
    expect(note?.textContent).toMatch(/Oct 18/)
  })

  it('leaves access binding when the exam sits past the window', async () => {
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const field = within(dialog).getByLabelText(/Exam date/)
    await user.clear(field)
    await user.type(field, '2026-12-15')
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
