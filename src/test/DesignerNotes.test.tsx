import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { PrototypeFeaturePage } from '@/pages/PrototypeFeaturePage'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'
import { featureHandoffMarkdown } from '@/components/prototype/handoffMarkdown'
import skeleton from './fixtures/handoffSkeleton'

/**
 * DESIGNER'S NOTES — 2026-10-26, Jillienne: "They will be blank on default,
 * and you can ask the designer for any additional notes when the handoff is
 * being created."
 *
 * Two things that follow, pinned here: the section is DRAWN when empty (so
 * "nothing to add" is visible, the same reasoning as the Questions
 * placeholder), and the Markdown export carries it only when there is
 * something — an empty heading in a ticket reads as a gap in the work.
 */
describe("designer's notes", () => {
  it('renders the blank default on a handoff that has none', () => {
    // Any catalog handoff without the field — the page reads the catalog, so
    // this is the real default a reader sees, not a constructed one.
    const row = PROTOTYPE_FEATURES.find(
      (f) => f.category === 'dev-handoff' && f.devHandoff?.uiComponents?.length && !f.devHandoff.designerNotes,
    )
    expect(row, 'no catalog handoff without designerNotes to check the default on').toBeTruthy()
    render(
      <MemoryRouter initialEntries={[`/prototype/${row!.id}`]}>
        <AccountProvider>
          <ThemeProvider>
            <PrototypeFeaturePage featureId={row!.id} embedded />
          </ThemeProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getAllByText('No designer’s notes on this handoff yet.').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Designer’s Notes/).length).toBeGreaterThan(0)
  })

  it('exports the notes only when there are some', () => {
    const blank = featureHandoffMarkdown(skeleton, 'https://x.test')
    expect(blank).not.toContain("## Designer's notes")

    const withNotes = featureHandoffMarkdown(
      {
        ...skeleton,
        devHandoff: {
          ...skeleton.devHandoff!,
          designerNotes: ['Ship the card before the history endpoint exists.', '  ', 'Mock the count at 0.'],
        },
      },
      'https://x.test',
    )
    expect(withNotes).toContain("## Designer's notes\n\nShip the card before the history endpoint exists.\n\nMock the count at 0.")
    // Blank entries are dropped, not emitted as empty paragraphs.
    expect(withNotes).not.toMatch(/\n {2,}\n/)
  })

  it('the README skeleton carries the field, blank', () => {
    expect(skeleton.devHandoff?.designerNotes).toEqual([])
  })
})
