import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HomeSectionTabs } from '@/components/layout/HomeSectionTabs'

/**
 * The Home tab strip — Option 4's stand-in for the rail (Figma 765:3801).
 *
 * ⚠ WHAT THESE TESTS PROTECT IS THE ABSENCE OF WIRING. The strip navigated for
 * one build, which was more than the design asks for; the point of a stub is
 * that it stays a stub until there is something authored to put under it.
 */

describe('the Home section tabs', () => {
  it('offers the three the frame draws, and opens on Courses', () => {
    render(<HomeSectionTabs />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Study Pace',
      'Courses',
      'Certificates',
    ])
    expect(screen.getByRole('tab', { name: /Courses/ }).getAttribute('aria-selected')).toBe('true')
  })

  it('moves the selection and renders nothing under it', async () => {
    /* ⚠ THE STUB ASSERTION. Selecting a tab is allowed to change the strip and
       NOTHING else — no panel, no content. If a `tabpanel` ever appears here,
       someone has populated the tabs and this test should be the conversation
       about whether that was meant. */
    const user = userEvent.setup()
    render(<HomeSectionTabs />)
    await user.click(screen.getByRole('tab', { name: /Study Pace/ }))
    expect(screen.getByRole('tab', { name: /Study Pace/ }).getAttribute('aria-selected')).toBe(
      'true',
    )
    expect(screen.getByRole('tab', { name: /Courses/ }).getAttribute('aria-selected')).toBe('false')
    expect(screen.queryAllByRole('tabpanel')).toHaveLength(0)
  })

  it('carries no link and no section id', () => {
    /* The two shapes that would make it navigation again. */
    const { container } = render(<HomeSectionTabs />)
    expect(container.querySelectorAll('a')).toHaveLength(0)
    expect(container.querySelectorAll('[data-cta-id]')).toHaveLength(0)
  })
})
