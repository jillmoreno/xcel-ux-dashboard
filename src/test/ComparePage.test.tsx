import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { ComparePage } from '@/pages/ComparePage'
import { COMPARE_DECKS } from '@/data/compareDecks'
import { COMPASS_READINESS_CELLS } from '@/pages/compare/compassReadiness'
import { JEFF_MVP_READINESS_COPY } from '@/data/compassJeffMvpFixtures'

/**
 * `/compare/compass-readiness` — 2026-11-16. What it pins:
 *
 *   · every widget the deck declares has a cell for every version, so a row
 *     never says "Not on this version" by accident (a missing key in the
 *     render table is a typo, not a design decision);
 *   · side by side draws BOTH versions' real blocks — V1's copy and Refined's
 *     copy on one page — and the single-version layouts draw one;
 *   · the Refined hero control flips between the two arms and lands in the
 *     address, which is what makes a comparison linkable;
 *   · with no notes endpoint, the note fields are present but disabled, and
 *     the page says so rather than failing.
 */

function mount(path = '/compare/compass-readiness') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <Routes>
          <Route path="/compare/:compareId" element={<ComparePage />} />
        </Routes>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  // No endpoint in jsdom: the fetch rejects, the page settles on read-only.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no endpoint'))))
})

describe('the compare decks', () => {
  it('have a render cell for every widget on every version', () => {
    const tables: Record<string, typeof COMPASS_READINESS_CELLS> = { 'compass-readiness': COMPASS_READINESS_CELLS }
    for (const deck of COMPARE_DECKS) {
      const cells = tables[deck.id]
      expect(cells, `no render table for deck ${deck.id}`).toBeTruthy()
      for (const w of deck.widgets) {
        for (const v of deck.versions) {
          if (w.only && w.only !== v.id) continue
          expect(cells[w.id]?.[v.id], `${deck.id}: widget "${w.id}" has no cell for version "${v.id}"`).toBeTypeOf(
            'function',
          )
        }
      }
      for (const c of deck.controls) {
        for (const id of c.widgets) {
          expect(
            deck.widgets.some((w) => w.id === id),
            `${deck.id}: control "${c.key}" names a widget "${id}" that is not in the deck`,
          ).toBe(true)
        }
        expect(c.options.some((o) => o.value === c.defaultValue)).toBe(true)
      }
    }
  })
})

describe('/compare/compass-readiness', () => {
  it('draws both versions side by side by default, with the real copy on each', async () => {
    mount()
    // V1's lead and Refined's lead are both on the page.
    expect(await screen.findByText(JEFF_MVP_READINESS_COPY.lead)).toBeInTheDocument()
    expect(screen.getByText(/How likely you are to pass/)).toBeInTheDocument()
    // One column head per version.
    const heads = document.querySelectorAll('.cmp-colhead__label')
    expect([...heads].map((h) => h.textContent)).toEqual(['V1 · Jeff’s MVP', 'Refined'])
    // Every widget is a numbered row.
    const deck = COMPARE_DECKS.find((d) => d.id === 'compass-readiness')!
    const rows = [...document.querySelectorAll('.cmp-row__title')].map((h) => h.textContent)
    expect(rows).toEqual(deck.widgets.map((w) => w.title))
  })

  it('shows one version in the single-column layouts', async () => {
    mount('/compare/compass-readiness?layout=refined')
    expect(await screen.findByText(/How likely you are to pass/)).toBeInTheDocument()
    expect(screen.queryByText(JEFF_MVP_READINESS_COPY.lead)).toBeNull()
  })

  it('flips the Refined hero between its two arms from the address', async () => {
    const { container } = mount('/compare/compass-readiness?hero=single')
    await screen.findByText(/How likely you are to pass/)
    expect(container.querySelector('.cre-rdr-hero')?.getAttribute('data-hero')).toBe('single')
  })

  it('moves the hero control into the address when clicked', async () => {
    const user = userEvent.setup()
    const { container } = mount()
    await screen.findByText(/How likely you are to pass/)
    expect(container.querySelector('.cre-rdr-hero')?.getAttribute('data-hero')).toBe('rings')
    const bar = screen.getByRole('tablist', { name: 'Hero' })
    await user.click(within(bar).getByRole('tab', { name: 'Single ring' }))
    expect(container.querySelector('.cre-rdr-hero')?.getAttribute('data-hero')).toBe('single')
  })

  it('opens the levels panel on both sides from one control', async () => {
    mount('/compare/compass-readiness?levels=open')
    await screen.findByText(/How likely you are to pass/)
    expect(screen.getByRole('button', { name: /What do these levels mean/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /What the levels mean/ })).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps the note fields but disables them when there is no endpoint', async () => {
    mount()
    expect(await screen.findByText(/Notes are read-only here/)).toBeInTheDocument()
    for (const f of screen.getAllByRole('textbox')) expect(f).toBeDisabled()
  })

  it('says so for a deck that does not exist', () => {
    mount('/compare/nope')
    expect(screen.getByText(/No comparison called/)).toBeInTheDocument()
  })
})
