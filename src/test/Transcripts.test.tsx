import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { TranscriptPrintPage } from '@/pages/TranscriptPrintPage'
import {
  filterTranscripts,
  searchTranscripts,
  transcriptsFor,
  transcriptYear,
} from '@/data/transcriptFixtures'

/**
 * TRANSCRIPTS — the account section's course history, from Figma 2009:28153.
 *
 * It replaced an `AccountSectionPlaceholder` reading "Transcripts — not built
 * yet", so the first thing worth asserting is that the placeholder is gone:
 * that stub was reachable from the sub-nav for weeks and the nav promising a
 * page that says "not built" is the exact state this closed.
 */
afterEach(cleanup)

function renderSection(query = 'section=transcripts') {
  window.history.replaceState({}, '', `/dashboard-rebrand?demo=1&${query}`)
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&${query}`]}>
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

function renderPrint(query = '') {
  window.history.replaceState({}, '', `/print/transcript${query}`)
  return render(
    <MemoryRouter initialEntries={[`/print/transcript${query}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <TranscriptPrintPage />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const bodyRows = () => document.querySelectorAll('tbody tr')

describe('the Transcripts section', () => {
  it('is a page now, not the "not built yet" stub', () => {
    renderSection()
    expect(screen.queryByText(/not built yet/i)).toBeNull()
    expect(screen.getByRole('table')).toBeTruthy()
  })

  /* ⚠ VERBATIM, and asserted because it is the one thing on this page that
     must not be trimmed. The page's own name for itself is "not official"; a
     well-meaning copy edit that shortens this produces a transcript-looking
     sheet with no caveat on it. */
  it('leads with the disclaimer, with "official" emphasised', () => {
    renderSection()
    const note = screen.getByText(/These are not/)
    expect(note.textContent).toContain(
      'transcripts and shouldn’t be used in place of signed course completion certificates',
    )
    expect(note.textContent).toContain('try printing them individually')
    expect(within(note).getByText('official').tagName).toBe('STRONG')
  })

  it('draws the design’s six columns, in order', () => {
    renderSection()
    const headers = [...document.querySelectorAll('thead th')].map((th) => th.textContent?.trim())
    expect(headers).toEqual([
      'Course Name',
      'License Type/Profession',
      'State',
      'Hours',
      'Date Enrolled',
      'Date Completed',
    ])
  })

  it('shows the whole history with the total beside the filters', () => {
    renderSection()
    const total = transcriptsFor('xcel').length
    expect(screen.getByText(`Showing ${total} Results`)).toBeTruthy()
    expect(bodyRows().length).toBe(total)
  })

  /* The two year filters must PARTITION the history — every completion is
     either this year or before it. A row that fell through both would simply
     be invisible on two of the three tabs, which is the kind of gap nobody
     reports because nobody knows to look. */
  it('partitions the history between the two year filters', () => {
    const all = transcriptsFor('xcel')
    const thisYear = filterTranscripts(all, 'this-year')
    const previous = filterTranscripts(all, 'previous-years')
    expect(thisYear.length).toBeGreaterThan(0)
    expect(previous.length).toBeGreaterThan(0)
    expect(thisYear.length + previous.length).toBe(all.length)
    const year = transcriptYear()
    for (const r of thisYear) expect(Number(r.completedDate.slice(0, 4))).toBe(year)
    for (const r of previous) expect(Number(r.completedDate.slice(0, 4))).toBeLessThan(year)
  })

  it('narrows the table and the count together when a filter is picked', () => {
    renderSection()
    const expected = filterTranscripts(transcriptsFor('xcel'), 'this-year').length
    fireEvent.click(screen.getByRole('tab', { name: 'Completed This Year' }))
    expect(screen.getByText(`Showing ${expected} Results`)).toBeTruthy()
    expect(bodyRows().length).toBe(expected)
  })

  it('tells "nothing matches" apart from "nothing completed"', () => {
    renderSection()
    fireEvent.change(screen.getByPlaceholderText(/Search by Course Name/), {
      target: { value: 'qqqq' },
    })
    expect(screen.getByText('No results')).toBeTruthy()
    // The history is not empty, so it must not claim the learner has finished
    // nothing — that would send them to the catalogue instead of the search box.
    expect(screen.queryByText('No completed courses yet')).toBeNull()
  })

  /* A non-credit completion earns no hours and still belongs on the history —
     the design's own data has one. Printing a blank instead of 0 would read as
     missing data; dropping the row would make this not a history. */
  it('keeps zero-hour rows, and prints the zero', () => {
    const zero = transcriptsFor('xcel').filter((r) => r.hours === 0)
    expect(zero.length).toBeGreaterThan(0)
    renderSection()
    const row = screen.getByRole('row', { name: new RegExp(zero[0].title) })
    expect(within(row).getByText('0')).toBeTruthy()
  })

  it('sorts a column when its header is pressed', () => {
    renderSection()
    const header = screen.getByRole('columnheader', { name: /Course Name/ })
    fireEvent.click(within(header).getByRole('button'))
    expect(header.getAttribute('aria-sort')).toBe('ascending')
    const titles = [...bodyRows()].map((r) => r.querySelector('th')?.textContent ?? '')
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)))
  })
})

describe('searchTranscripts', () => {
  const all = transcriptsFor('xcel')

  it('matches the three fields its placeholder promises', () => {
    expect(searchTranscripts(all, 'ethics').length).toBeGreaterThan(0)
    expect(searchTranscripts(all, 'Pre-Licensing').length).toBeGreaterThan(0)
    expect(searchTranscripts(all, 'Texas').length).toBeGreaterThan(0)
  })

  /* ⚠ AND NOT THE OTHERS, deliberately. A learner typing "4" means a course
     with 4 in its name, not every four-hour course; and no date format a person
     types matches the ISO the record stores, so searching dates would look
     broken rather than absent. */
  it('does not match hours or dates', () => {
    const byHours = searchTranscripts(all, '24')
    for (const r of byHours) {
      expect(`${r.title} ${r.profession} ${r.state}`.toLowerCase()).toContain('24')
    }
    expect(searchTranscripts(all, '2024-10-04')).toEqual([])
  })

  it('returns everything for an empty or blank query', () => {
    expect(searchTranscripts(all, '').length).toBe(all.length)
    expect(searchTranscripts(all, '   ').length).toBe(all.length)
  })
})

describe('the printed transcript', () => {
  it('carries the disclaimer into the document', () => {
    renderPrint()
    expect(screen.getByText(/These are not/).textContent).toContain(
      'shouldn’t be used in place of signed course completion certificates',
    )
  })

  it('totals the credit hours, in the header and at the foot', () => {
    renderPrint()
    const expected = transcriptsFor('xcel').reduce((n, r) => n + r.hours, 0)
    expect(screen.getAllByText(String(expected)).length).toBeGreaterThanOrEqual(2)
  })

  /* The learner pressed Download All while looking at one year; the sheet has
     to be that year, or it is a different document from the one on screen. */
  it('prints the filter it was opened with', () => {
    renderPrint('?filter=this-year')
    const expected = filterTranscripts(transcriptsFor('xcel'), 'this-year').length
    expect(bodyRows().length).toBe(expected)
    expect(screen.getByText(`Completed in ${transcriptYear()}`)).toBeTruthy()
  })

  it('falls back to the whole history on an unknown filter', () => {
    renderPrint('?filter=nonsense')
    expect(bodyRows().length).toBe(transcriptsFor('xcel').length)
    expect(screen.getByText('All completed courses')).toBeTruthy()
  })
})
