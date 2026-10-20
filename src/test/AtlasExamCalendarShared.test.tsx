import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AtlasExamCalendar } from '@/components/compass/AtlasExamCalendar'
import { AtlasExamDateCard } from '@/components/compass/AtlasExamDateCard'

afterEach(cleanup)

/**
 * ONE CALENDAR, TWO CARDS — `AtlasExamCalendar`, extracted 2026-10-20 from
 * `AtlasExamDateCard` so the Atlas Home's exam prompt could show the Figma grid
 * rather than a third month grid typed into the Home.
 *
 * ⚠ WHAT IS PINNED IS THAT SHARING IT COSTS ERIC NOTHING. Two props exist only
 * for the Home — `today` and `onRemove` — and both default to the behaviour the
 * card had before the extraction. A regression here is a change to a surface
 * nobody was editing, which is the failure mode the fork rule in CLAUDE.md
 * exists to prevent and the one an extraction reintroduces if it is careless.
 */
describe('the shared exam calendar', () => {
  const noop = () => {}

  it('defaults to the wall clock, which is what Eric’s card has always used', () => {
    render(<AtlasExamCalendar onCancel={noop} onSave={noop} />)
    const now = new Date()
    const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    expect(screen.getByRole('grid', { name: month })).toBeTruthy()
  })

  it('opens on the clock it is given instead', () => {
    render(<AtlasExamCalendar today={new Date(2026, 4, 11)} onCancel={noop} onSave={noop} />)
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeTruthy()
  })

  /* ⚠ THE FOOTER IS A PAIR WITHOUT `onRemove`, and `flex-end` with it — if that
     flipped to `space-between` unconditionally, Cancel would drift to the far
     side of Eric's card and the pair would stop reading as a pair. */
  it('offers no Remove, and keeps the pair right-aligned, when none is passed', () => {
    render(<AtlasExamCalendar onCancel={noop} onSave={noop} />)
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
    const save = screen.getByRole('button', { name: 'Set Exam Date' })
    expect(save.parentElement?.parentElement?.style.justifyContent).toBe('flex-end')
  })

  it('draws Remove first, in error red, when one is passed', () => {
    render(<AtlasExamCalendar onCancel={noop} onSave={noop} onRemove={noop} />)
    const remove = screen.getByRole('button', { name: 'Remove' })
    expect(remove.style.color).toBe('var(--color-error-600)')
    /* First in the row — "the left side of this line". */
    const row = remove.parentElement!
    expect(row.style.justifyContent).toBe('space-between')
    expect(row.firstElementChild).toBe(remove)
  })

  it('Eric’s card still renders the calendar, and still offers no Remove', () => {
    render(<AtlasExamDateCard />)
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }))
    expect(screen.getByRole('button', { name: 'Set Exam Date' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })
})
