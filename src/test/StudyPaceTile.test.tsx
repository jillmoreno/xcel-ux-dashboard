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

  it('re-prices the tile when days a week changes', async () => {
    const user = userEvent.setup()
    renderTile()
    const before = screen.getByText(/a night · \d nights a week/).textContent
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    expect(screen.getByText(/a night · 6 nights a week/)).toBeInTheDocument()
    expect(screen.getByText(/a night · \d nights a week/).textContent).not.toBe(before)
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
