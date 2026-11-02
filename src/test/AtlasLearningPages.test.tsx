import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { atlasCoursesFor } from '@/data/atlasCourseCards'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * THE ATLAS LEARNING PAGES — My Courses and My Certificates, 2026-11-02.
 *
 * Both were reachable from Home's Quick Links and both were INERT, which the
 * Quick Links dev handoff records in its own CTA list: "My Courses" and "My
 * Certificates" each read `does: 'To be designed.'`. What this file pins is
 * the shape of the answer, and most of it is about what must NOT move.
 *
 * ⚠ THE OWNERSHIP SPLIT IS THE POINT OF HALF THESE CASES. Everything new is
 * scoped to the BASELINE — Jill/Atlas-Main and End-to-End Demo, the versions
 * the Atlas Learning and End-to-End rows open. Eric's WIP and White keep the
 * pages he asked for on 2026-10-13, and the cases below say so by rendering
 * his version and asserting the OLD behaviour. A change that quietly widens a
 * flag to every Atlas version fails here, which is the alarm this file exists
 * to be: `isEricAtlasWhiteLike` is a superset of `isE2ELikeVersion`, so
 * reaching for the familiar helper is the easy mistake.
 */
afterEach(cleanup)

const BASELINE = 'jill-atlas-main'
const ERIC_WIP = 'eric-atlas-v3'

function renderShell(query: string) {
  /* ⚠ THE QUERY GOES ON `window.location` TOO, not just the router. `?ff=`
     overrides are read by `readUrlFlagOverrides` straight off
     `window.location.search` — deliberately, so a pinned link survives
     whatever the router is doing — so a MemoryRouter entry alone leaves every
     flag at its committed default and the test silently asserts the default
     twice. The router still needs its own copy for `useSearchParams`. */
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

const quickLinks = () => screen.queryByRole('navigation', { name: 'Quick links' })
const filterRail = () => screen.queryByRole('complementary', { name: 'My Courses filters' })

describe('My Courses on the Atlas baseline', () => {
  it('draws no Quick Links rail — the cards run full width', () => {
    renderShell(`section=courses&version=${BASELINE}`)
    expect(quickLinks()).toBeNull()
  })

  /* ⚠ THE FILTER RAIL IS THE ONE THAT CAME BACK BY ITSELF. `hideListControls`
     hides the search, the status pills and View Archived; the filter COLUMN
     was only ever absent because every host that passed that prop also passed
     an `aside` that replaced it. Drop the aside and six filter accordions
     reappear on a page with no other control on it. */
  it('draws no filter rail either, now that nothing replaces it', () => {
    renderShell(`section=courses&version=${BASELINE}`)
    expect(filterRail()).toBeNull()
    expect(screen.queryByText(/^\d+ Results?$/)).toBeNull()
  })

  it('renders the learner’s real library, not the three design cards', () => {
    renderShell(`section=courses&version=${BASELINE}`)
    // The design's three cards are a strict subset of nothing in the fixtures:
    // "Insurance Ethics" exists only in the library.
    expect(screen.getByText('Insurance Ethics')).toBeTruthy()
    expect(screen.queryByText('New York Life and Health Pre-licensing')).toBeNull()
  })

  /* "do NOT put a cta on the card" (2026-11-02). The shared card has never had
     one — this pins that choosing it did not bring the Atlas card's button
     along, which is the thing a future "unify the cards" change would break. */
  it('puts no call-to-action button on the card', () => {
    renderShell(`section=courses&version=${BASELINE}`)
    expect(screen.queryByRole('button', { name: 'Resume Course' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Begin Course' })).toBeNull()
  })

  it('brings the rail back when the flag says shown', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-pages-quick-links:shown`)
    expect(quickLinks()).toBeTruthy()
  })

  /* `getAllBy`, not `getBy`: the Atlas arm reads the LIBRARY by default
     (`atlas-courses-from-library`), and the XCEL fixtures hold several
     in-progress courses — one button each. */
  it('draws the Atlas card when the flag says atlas — with its button', () => {
    renderShell(`section=courses&version=${BASELINE}&ff=atlas-courses-card-style:atlas`)
    expect(screen.getAllByRole('button', { name: 'Resume Course' }).length).toBeGreaterThan(0)
  })

  /* Both arms off: the Atlas card drawing the design's own three cards, which
     is exactly the page as Eric promoted it. */
  it('falls all the way back to the three design cards', () => {
    renderShell(
      `section=courses&version=${BASELINE}` +
        `&ff=atlas-courses-card-style:atlas,atlas-courses-from-library:off`,
    )
    expect(screen.getByText('New York Life and Health Pre-licensing')).toBeTruthy()
    expect(screen.queryByText('Insurance Ethics')).toBeNull()
  })
})

/**
 * ⚠ THE ONLY DOOR, AND IT WAS SHUT (2026-11-02, Jillienne on the preview:
 * "when i click on my courses, my certificates in the preview right now, its
 * not working").
 *
 * `LINKS_OFF` in the Home file draws every navigating Quick Links row and
 * wires it to nothing — set on 2026-10-15 so the demo could not walk out of
 * itself, and correct while both pages were inert. Once the pages were real
 * the rows were still silent, so the pages were unreachable by clicking: the
 * work shipped behind a door that had been nailed shut a fortnight earlier.
 *
 * These two cases are the ones that would have caught it. They assert the
 * ROUTE, not the page — a page nobody can reach is not done.
 */
describe('Home’s Quick Links reach the two learning pages', () => {
  const clickRow = (label: string) =>
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Quick links' })).getByText(label))

  it('My Courses opens My Courses', () => {
    renderShell(`section=dashboard&version=${BASELINE}`)
    clickRow('My Courses')
    expect(screen.getByRole('heading', { name: 'My Courses' })).toBeTruthy()
  })

  it('My Certificates opens My Certificates', () => {
    renderShell(`section=dashboard&version=${BASELINE}`)
    clickRow('My Certificates')
    expect(screen.getByRole('heading', { name: 'My Certificates' })).toBeTruthy()
  })

  /* The rows go quiet again with the control off — which is what they did
     between 2026-10-15 and today, and what the demo wanted while the
     destinations were dead ends. */
  it('goes quiet again when the control is off', () => {
    renderShell(`section=dashboard&version=${BASELINE}&ff=atlas-home-opens-learning-pages:off`)
    clickRow('My Courses')
    expect(screen.queryByRole('heading', { name: 'My Courses' })).toBeNull()
  })
})

describe('Eric’s WIP keeps the page he asked for', () => {
  it('still has its Quick Links rail', () => {
    renderShell(`section=courses&version=${ERIC_WIP}`)
    expect(quickLinks()).toBeTruthy()
  })

  it('still draws the Atlas course card, not the shared one', () => {
    renderShell(`section=courses&version=${ERIC_WIP}`)
    expect(screen.getByText('New York Life and Health Pre-licensing')).toBeTruthy()
  })
})

describe('My Certificates on the Atlas baseline', () => {
  /* The heading read "Certificates" while the only link that reaches it — the
     Quick Links row — said "My Certificates", and My Courses beside it already
     carries the possessive. */
  it('is headed "My Certificates"', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    expect(screen.getByRole('heading', { name: 'My Certificates' })).toBeTruthy()
  })

  it('draws no Quick Links rail', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    expect(quickLinks()).toBeNull()
  })

  /* ⚠ THE PAGE HAD NO DOOR AT ALL. Both certificate cards gate `clickable` on
     `status === 'action-required'`, and `hideListControls` takes the status
     tabs — so the Action Required tab was unreachable and nothing on the page
     opened anything, while the kebab called `console.info`. */
  it('opens an issued certificate’s detail, with no Action Required banner', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    fireEvent.click(screen.getByRole('button', { name: /View details for Annuity Initial Training/ }))
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText('Certificate Issued')).toBeTruthy()
    expect(within(sheet).queryByText('Action Required')).toBeNull()
    // The thing the learner came for leads the actions.
    expect(within(sheet).getByText('View Certificate')).toBeTruthy()
  })

  /* A certificate for a course still under way: nothing has been issued, so
     there is no document to offer and no reporting line to print. */
  it('opens a not-yet-earned certificate on the in-progress arm', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    fireEvent.click(screen.getByRole('button', { name: /View details for Life & Health Pre-Licensing/ }))
    const sheet = screen.getByRole('dialog')
    expect(within(sheet).getByText('Not Yet Earned')).toBeTruthy()
    expect(within(sheet).queryByText('View Certificate')).toBeNull()
    expect(within(sheet).queryByText(/Certificate Issued:/)).toBeNull()
    expect(within(sheet).getByText('Continue Course')).toBeTruthy()
  })

  it('leaves the cards inert when the flag is off', () => {
    renderShell(`section=certificates&version=${BASELINE}&ff=atlas-certificates-open-detail:off`)
    expect(screen.queryByRole('button', { name: /View details for Annuity Initial Training/ })).toBeNull()
  })
})

/**
 * THE CERTIFICATE CARD AUDIT (2026-11-02, Jillienne: "the UI for the
 * certificates needs help. they also need to better match what is happening in
 * the LMS dashboard, audit and make some decisions there").
 *
 * Four findings, and each case below is one of them:
 *
 *   the pill said nothing   every card on a certificates page is a
 *                           certificate, so a "Certificate" pill is the one
 *                           thing it cannot distinguish — while the STATUS sat
 *                           at 11px in grey on the right.
 *   no profession           two continuing-education certificates in one state
 *                           differed only by title.
 *   no hover state          the whole card became a button and nothing said so.
 *   an empty card           the not-yet-earned card was a title over two rows
 *                           of blank space, because the rows it cannot fill are
 *                           sized by the tallest card in the row.
 */
describe('the certificates page draws the shared card', () => {
  it('spells the status out instead of pilling the obvious', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    expect(screen.getAllByText('COMPLETED').length).toBeGreaterThan(0)
    // The pill every card could wear, and therefore the one that told you
    // nothing. Its absence IS the finding.
    expect(screen.queryByText('Certificate')).toBeNull()
  })

  it('carries the profession line again', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    expect(screen.getAllByText('Insurance Continuing Education').length).toBeGreaterThan(0)
  })

  /* The accent custom property is what `.cre-cert-card` reads for the 6px hover
     stroke and the title underline. A card that opens has to say it does. */
  it('sets the accent the hover treatment reads', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    const card = screen.getByRole('button', { name: /View details for Annuity/ })
    expect(card.style.getPropertyValue('--cert-accent')).not.toBe('')
  })

  it('gives the not-yet-earned certificate a line rather than a hole', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    expect(screen.getByText('Issued when you complete the course')).toBeTruthy()
    expect(screen.getByText(/IN\s*PROGRESS/)).toBeTruthy()
  })

  /* ⚠ AND IT MUST NOT CLAIM TO BE EARNED. The record says `completed` — the
     not-yet-earned state is the host's word — so a card that read the status
     straight off the data would print COMPLETED over a certificate the learner
     has not got. */
  it('does not label the not-yet-earned certificate COMPLETED', () => {
    renderShell(`section=certificates&version=${BASELINE}`)
    const card = screen.getByRole('button', { name: /View details for Life & Health/ })
    expect(within(card).queryByText('COMPLETED')).toBeNull()
  })

  it('draws the Atlas card when the control says atlas', () => {
    renderShell(`section=certificates&version=${BASELINE}&ff=atlas-certificates-card-style:atlas`)
    expect(screen.getAllByText('Certificate').length).toBeGreaterThan(0)
    expect(screen.queryByText('COMPLETED')).toBeNull()
  })
})

describe('atlasCoursesFor — the library as Atlas cards', () => {
  /* ⚠ ARCHIVING IS A LOCATION, NOT A STATUS (decision 33/34), and the Atlas
     page has no View Archived link — so an archived card would sit on the only
     collection the page can show, byte-identical to an active one. */
  it('leaves archived records out', () => {
    const archived = myCoursesFor('xcel').filter((c) => c.archived)
    expect(archived.length).toBeGreaterThan(0)
    const ids = new Set(atlasCoursesFor('xcel').map((c) => c.id))
    for (const c of archived) expect(ids.has(c.id)).toBe(false)
  })

  /* Every card draws one date row inside a four-row subgrid, so the row cannot
     vanish for a course with no expiry — the LABEL changes instead. */
  it('labels the date row by what the course actually has', () => {
    const cards = atlasCoursesFor('xcel')
    const records = new Map(myCoursesFor('xcel').map((c) => [c.id, c]))
    for (const card of cards) {
      const record = records.get(card.id)!
      expect(card.availableDate).not.toBe('')
      if (record.myStatus === 'completed') expect(card.completed).toBe(true)
      else if (record.expiresAt) expect(card.dateLabel).toBeUndefined()
      else expect(card.dateLabel).toBe('Enrolled:')
    }
  })

  it('gives each lifecycle state its own button', () => {
    const records = new Map(myCoursesFor('xcel').map((c) => [c.id, c]))
    for (const card of atlasCoursesFor('xcel')) {
      const status = records.get(card.id)!.myStatus
      if (status === 'in-progress') expect(card.actionLabel).toBe('Resume Course')
      if (status === 'not-started') expect(card.actionLabel).toBe('Begin Course')
      if (status === 'completed') expect(card.actionLabel).toBe('Completed')
      if (status === 'failed') expect(card.actionLabel).toBe('Retake Course')
    }
  })

  /* `courseExpiryState` returns 'none' for a completed course whatever its
     dates say (ruling 5), so a finished course never wears "Due Soon". */
  it('never badges a completed course', () => {
    for (const card of atlasCoursesFor('xcel')) {
      if (card.completed) expect(card.badge).toBeUndefined()
    }
  })
})
