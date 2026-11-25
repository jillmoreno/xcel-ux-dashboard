import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'
import { certificateStatus, prelicensingTranscriptsFor, transcriptsFor } from '@/data/transcriptFixtures'
import { FIXTURE_TODAY } from '@/data/myCoursesFixtures'

/**
 * CERTIFICATES & TRANSCRIPTS TO THE PRD (2026-11-25) — `TranscriptsPanelV2`
 * behind `transcripts-certificate-statuses`, on by default on this branch. The
 * Certificates and Transcripts PRD (Chi Wang): §3a the table, §3b the
 * certificate and its statuses. The 2026-11-19 page keeps its own suite,
 * `Transcripts.test.tsx`, with the flag held off.
 */
afterEach(cleanup)

function renderSection(query = 'section=certificates') {
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

const SUBHEADING = 'See how you did in every program you’ve completed, and download the certificates you need for your state exam or license.'
const bodyRows = () => [...document.querySelectorAll<HTMLTableRowElement>('tbody tr')]
const rowFor = (title: string, state: string) =>
  bodyRows().find((r) => r.querySelector('th')?.textContent === title && [...r.querySelectorAll('td')].some((td) => td.textContent === state))!

describe('the flag', () => {
  it('is in the catalog, on by default on this branch, under Navigation', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'transcripts-certificate-statuses')!
    expect(flag).toBeTruthy()
    expect(flag.defaultEnabled).toBe(true)
    expect(flag.group).toBe('Navigation')
    expect(flag.page).toBe('dashboard-rebrand')
  })
})

describe('the page, reached both ways', () => {
  /* The page is reached two ways — the nav row (?section=certificates) and the profile dropdown (?section=transcripts) —
     and must be the same page both ways. */
  for (const section of ['certificates', 'transcripts']) {
    it(`draws the PRD page under ?section=${section}: the sub-heading, no disclaimer, no search, no filters, no export`, () => {
      renderSection(`section=${section}`)
      expect(screen.getByTestId('transcripts-subheading').textContent).toBe(SUBHEADING)
      expect(screen.queryByText(/Transcripts are not/)).toBeNull()
      expect(screen.queryByPlaceholderText(/Search by Course Name/)).toBeNull()
      expect(screen.queryByRole('tab', { name: 'Completed This Year' })).toBeNull()
      expect(screen.queryByRole('button', { name: /Download Transcript/ })).toBeNull()
      expect(screen.getByRole('table')).toBeTruthy()
    })
  }

  it('keeps the count above the table, and the 2026-11-19 columns', () => {
    renderSection()
    const total = prelicensingTranscriptsFor('xcel').length
    expect(screen.getByText(`Showing ${total} Results`)).toBeTruthy()
    expect(bodyRows().length).toBe(total)
    const headers = [...document.querySelectorAll('thead th')].map((th) => th.textContent?.trim())
    expect(headers).toEqual(['Program', 'License Line', 'State', 'Hours', 'Completed', 'Final Score', 'Certificate'])
  })

  it('lists the pre-licensing history, not the CE one the original draws', () => {
    renderSection()
    expect(screen.queryByText('Insurance Ethics')).toBeNull()
    expect(screen.queryByText('Prep Review Course')).toBeNull()
    for (const r of prelicensingTranscriptsFor('xcel')) expect(r.profession).toBe('Insurance Pre-Licensing')
    // The CE list is untouched for the original and the print route.
    expect(transcriptsFor('xcel').some((r) => r.title === 'Insurance Ethics')).toBe(true)
  })

  it('still sorts a column when its header is pressed', () => {
    renderSection()
    const header = screen.getByRole('columnheader', { name: /State/ })
    fireEvent.click(within(header).getByRole('button'))
    expect(header.getAttribute('aria-sort')).toBe('ascending')
    const states = bodyRows().map((r) => r.querySelectorAll('td')[1].textContent ?? '')
    expect(states).toEqual([...states].sort((a, b) => a.localeCompare(b)))
  })
})

describe('the program opens the course (PRD §3a field 1)', () => {
  it('links a row with a course in the library to /courses/{id}, and leaves one without as text', () => {
    renderSection()
    const links = screen.getAllByTestId('transcript-program-link')
    expect(links.length).toBeGreaterThan(0)
    for (const a of links) expect(a.getAttribute('href')).toMatch(/^\/courses\/mc-xcel-/)
    const texas = rowFor('Property & Casualty Pre-License Course', 'Texas')
    expect(within(texas).queryByTestId('transcript-program-link')).toBeNull()
  })
})

describe('the five certificate statuses (PRD §3b)', () => {
  it('covers every status at least once in the demo rows', () => {
    const statuses = new Set(prelicensingTranscriptsFor('xcel').map((r) => certificateStatus(r)))
    expect([...statuses].sort()).toEqual(['address-required', 'expired', 'not-required', 'ready', 'voided'])
  })

  it('draws each status in the Certificate cell', () => {
    renderSection()
    // Ready, with an expiry — Florida's four years from 10/4/2024.
    const fl = rowFor('Life & Health Pre-License Course', 'Florida')
    expect(fl.getAttribute('data-certificate-status')).toBe('ready')
    expect(fl.textContent).toContain('Valid till 10/4/2028')
    expect(within(fl).getByRole('button', { name: /Download certificate/ })).toBeTruthy()
    // Ready, no expiry — New York.
    const ny = rowFor('Life, Accident & Health Pre-License Course', 'New York')
    expect(ny.getAttribute('data-certificate-status')).toBe('ready')
    expect(ny.textContent).toContain('No expiry')
    // Expired — Ohio Health, 180 days from 10/20/2025 is 4/18/2026, before the fixture's 5/11/2026. Still downloadable.
    const ohHealth = bodyRows().find((r) => r.querySelectorAll('td')[0].textContent === 'Health' && r.querySelectorAll('td')[1].textContent === 'Ohio')!
    expect(ohHealth.getAttribute('data-certificate-status')).toBe('expired')
    expect(ohHealth.textContent).toContain('Expired 4/18/2026')
    expect(ohHealth.textContent).toContain('Retake the course to sit the exam')
    expect(within(ohHealth).getByRole('button', { name: /Download certificate/ })).toBeTruthy()
    // Not required — Texas is unregulated; valid-until blank.
    const tx = rowFor('Property & Casualty Pre-License Course', 'Texas')
    expect(tx.getAttribute('data-certificate-status')).toBe('not-required')
    expect(tx.textContent).toContain('Not required')
    expect(tx.textContent).not.toMatch(/Valid till|No expiry/)
    expect(within(tx).queryByRole('button', { name: /Download certificate/ })).toBeNull()
    // Address required — Georgia, no home address on file.
    const ga = rowFor('Life & Health Pre-License Course', 'Georgia')
    expect(ga.getAttribute('data-certificate-status')).toBe('address-required')
    expect(within(ga).getByTestId('transcript-add-address').textContent).toBe('Add your home address')
    // Voided — the demo switch; the treatment only.
    const voided = rowFor('Property & Casualty Pre-License Course', 'Florida')
    expect(voided.getAttribute('data-certificate-status')).toBe('voided')
    expect(voided.textContent).toContain('Voided')
  })

  it('is the Ohio pair — one course, two licence lines, two rows, two completion dates (PRD §3a field 3)', () => {
    const ohio = prelicensingTranscriptsFor('xcel').filter((r) => r.state === 'Ohio')
    expect(ohio.map((r) => r.licenseLine).sort()).toEqual(['Health', 'Life'])
    expect(new Set(ohio.map((r) => r.completedDate)).size).toBe(2)
  })

  it('derives from the fixture day, not the wall clock', () => {
    const ohLife = prelicensingTranscriptsFor('xcel').find((r) => r.id === 't-xcel-pl-oh-life')!
    expect(certificateStatus(ohLife, FIXTURE_TODAY)).toBe('ready')
    // Pushed past 7/14/2026 it expires; the default argument is FIXTURE_TODAY.
    expect(certificateStatus(ohLife, new Date(2026, 6, 15))).toBe('expired')
    expect(certificateStatus(ohLife)).toBe(certificateStatus(ohLife, FIXTURE_TODAY))
  })
})

describe('the archive', () => {
  it('records the three controls and the disclaimer, each naming the unforked original and the flag', () => {
    for (const id of ['transcripts-search-filters-export', 'transcripts-not-official-disclaimer']) {
      const row = ARCHIVED_ITEMS.find((r) => r.id === id)!
      expect(row).toBeTruthy()
      expect(row.restoreNote).toContain('TranscriptsPanel.tsx')
      expect(row.restoreNote).toContain('transcripts-certificate-statuses')
    }
    expect(ARCHIVED_ITEMS.find((r) => r.id === 'transcripts-not-official-disclaimer')!.what).toContain('Transcripts are not “official”')
  })
})
