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
  dateFromIso,
  daysBetween,
} from '@/lib/studyPace'

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
    renderTile({ layout: 'card', onStart: () => {}, ...props })

  it('states the evening and the nights the model derives', () => {
    renderCard()
    const preset = defaultPreset(model())
    /* ASSERTED ON `textContent`, not via `getByText`: the head line bolds its
       own figure, and `getByText`'s default matcher reads only an element's
       DIRECT text nodes — so a sentence split by a `<b>` is invisible to it.
       That is the "broken up by multiple elements" trap, and it fails as a
       missing element rather than as a wrong string. */
    expect(document.body.textContent).toContain(
      `About ${formatEvening(preset.minsPerNight)} a night, ${preset.nights} nights a week.`,
    )
  })

  it('the room it claims agrees with the access date it names', () => {
    /* THE TWO HALVES OF ONE SENTENCE, checked against each other and against
       the model: the days of slack, and the date they are slack before. A card
       reading "5 days before access ends on Oct 18" while the finish it just
       printed is six days earlier is the kind of disagreement that looks
       perfectly plausible on screen. */
    renderCard()
    const preset = defaultPreset(model())
    const claim = /(\d+) days? before access ends on ([A-Z][a-z]{2} \d+)/.exec(
      document.body.textContent ?? '',
    )
    expect(claim).toBeTruthy()
    const [, days, date] = claim as RegExpExecArray
    /* The date is the learner's OWN expiry, not the model's `hardEndIso` — that
       is a day earlier, because finishing the day access dies is not finishing.
       Printing the internal ceiling would be the card disagreeing by one day
       with the date on the learner's receipt. */
    expect(date).toBe(formatPaceDate('2026-10-18'))
    expect(Number(days)).toBe(
      daysBetween(dateFromIso(preset.finishIso) as Date, dateFromIso('2026-10-18') as Date),
    )
    // …and it is the finish the model derived, not a second one.
    expect(document.body.textContent).toContain(formatPaceDate(preset.finishIso))
  })

  it('explains where the number came from only while it is still ours', async () => {
    const user = userEvent.setup()
    renderCard()
    expect(screen.getByText(/Set from when your access ends, not from a guess/)).toBeInTheDocument()
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: /Full window|Relaxed/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    expect(screen.queryByText(/not from a guess/)).toBeNull()
  })

  it('names the CEILING, never a window length', () => {
    /* The prototype said "set from your 30-day access" — true of the window it
       assumed, false of any course whose access differs, and unknowable from
       what this component is given. The ceiling is the fact the model actually
       used, it is already on screen, and it stays true when an exam date takes
       over as the thing doing the work. */
    renderCard()
    expect(screen.queryByText(/\d+-day access/)).toBeNull()
  })

  it('follows the exam date when that is what binds', async () => {
    const user = userEvent.setup()
    renderCard()
    const dialog = await openSheet(user)
    const field = within(dialog).getByLabelText(/Exam date/)
    await user.clear(field)
    await user.type(field, '2026-10-10')
    await user.click(within(dialog).getByRole('button', { name: 'Save pace' }))
    // The sentence and the timeline label both move onto the exam, together —
    // a card explaining itself against one ceiling while drawing another is the
    // silent switch `binding` exists to prevent.
    expect(screen.getByText(/before your exam on/)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Exam · ${formatPaceDate('2026-10-10')}`))).toBeInTheDocument()
  })

  it('draws the timeline from Today to the ceiling, and hides it from the reader', () => {
    /* DECORATION: every fact it draws is printed in words in the sentence above
       it and in its own two labels, so the graphic carries nothing on its own.
       That is what keeps the accessible name off colour and off position. */
    renderCard()
    expect(screen.getByText('Today')).toBeInTheDocument()
    expect(screen.getByText(`Access ends · ${formatPaceDate('2026-10-18')}`)).toBeInTheDocument()
    // No `role="img"` with a described graphic — the square tile's timeline
    // needs one because it has no labels; this one has them.
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('claims no deadline on a course that has none', () => {
    /* No access window and no exam date: the model has nothing to aim at and
       falls back to its default horizon. The card must then claim no ceiling,
       name the date as a target rather than a cut-off, and draw no end-stop. */
    renderCard({ accessExpiresAt: undefined })
    expect(screen.queryByText(/before access ends/)).toBeNull()
    expect(screen.queryByText(/not from a guess/)).toBeNull()
    expect(screen.getByText(/no access deadline, so that date is a suggested target/)).toBeInTheDocument()
    expect(screen.queryByText(/Access ends ·/)).toBeNull()
  })

  it('operates two things, and they are Start and Adjust', () => {
    renderCard()
    expect(screen.getAllByRole('button').map((b) => b.textContent?.trim())).toEqual([
      'Start studying',
      'Adjust',
    ])
    // The square's floor is gone with the square: no `Details →`, and no preset
    // strip — the claim `StudyPaceTile — the tile operates nothing` makes above.
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('omits Start when there is nothing for it to start', () => {
    // A "Start studying" that starts nothing is the invented affordance this
    // version keeps refusing; the button is dropped rather than rendered inert.
    renderCard({ onStart: undefined })
    expect(screen.getAllByRole('button').map((b) => b.textContent?.trim())).toEqual(['Adjust'])
  })

  it('takes the primary CTA off the Brick and the secondary off inline ink', () => {
    /* `--color-action` is a FILL colour measuring 2.05:1 as TEXT on the dark
       shell, and this version moved every CTA onto the primary ramp — navy
       means "do this", red means "this is an assessment". Adjust takes BOTH its
       ink and its stroke from `.cre-cta-ink` (`borderColor: currentColor`), so
       the dark-mode swap reaches the outline without a second declaration and
       no inline value can beat the class. */
    renderCard()
    const [start, adjust] = screen.getAllByRole('button')
    /* ASSERTED AS THE ABSENCE OF INLINE COLOUR, not the presence of a token.
       `.cre-cta-fill` carries the fill AND the label ink because the pair has
       to INVERT in dark — the navy is 2.75:1 against the dark card, under the
       3:1 a control's shape needs — and an inline `background` would beat the
       class while looking correct in light mode. That is the failure mode this
       pins: a button that renders, passes tsc and dissolves in one theme. */
    expect(start.className).toContain('cre-cta-fill')
    expect(start.style.background).toBe('')
    expect(start.style.color).toBe('')
    expect(adjust.className).toContain('cre-cta-ink')
    expect(adjust.style.color).toBe('')
    expect(adjust.style.borderColor).not.toMatch(/rgb|#|var\(/)
  })

  it('carries the provenance in its eyebrow, and flips it on first touch', async () => {
    const user = userEvent.setup()
    renderCard()
    const eyebrow = () => screen.getByText(/^Study Pace$/).parentElement as HTMLElement
    expect(eyebrow().textContent).toContain('Study Pace · recommended')
    const dialog = await openSheet(user)
    await user.click(within(dialog).getByRole('radio', { name: '6' }))
    expect(eyebrow().textContent).toContain('Study Pace · yours')
  })

  it('keeps the square shape untouched in the default layout', () => {
    // The card is a fifth treatment, not a replacement: Testing 2's tile still
    // renders exactly as it did, with one control on a 1:1 tile.
    renderTile()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByText('Study Pace')).toBeInTheDocument()
  })
})
