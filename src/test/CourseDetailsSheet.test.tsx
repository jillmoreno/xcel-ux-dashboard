import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { CourseDetailsPanel } from '@/components/courses/CourseDetailsPanel'
import { CourseSheet } from '@/components/courses/CourseSheet'
import type { CourseCardData } from '@/components/courses/CourseCard'
import { AccountProvider, defaultMemberTier, type Brand } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { certificateForCourse } from '@/data/certificateFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'
import { getCatalogFixtures } from '@/data/catalog'
import { INSTRUCTOR } from '@/components/courses/courseSheetFixtures'

/**
 * The post-purchase Course Details sheet. Most of these assertions are about
 * the sheet NOT saying something — no second copy of the name, no rating, no
 * progress on an expired course, no empty danger container — because this sheet
 * replaced a deliberate blank placeholder and every one of those is a thing it
 * could plausibly have grown.
 */

function seed(brand: Brand, membership: 'member' | 'non-member' = 'member') {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({
      brand,
      tier: membership === 'member' ? defaultMemberTier(brand) : 'non-member',
    }),
  )
}

function course(brand: Brand, id: string): CourseCardData {
  const found = myCoursesFor(brand).find((c) => c.id === id)
  if (!found) throw new Error(`no fixture course ${id} on ${brand}`)
  return found
}

function openSheet(data: CourseCardData, brand: Brand = 'cre', membership: 'member' | 'non-member' = 'member') {
  seed(brand, membership)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <CourseDetailsPanel open onClose={() => {}} course={data} />
      </AccountProvider>
    </MemoryRouter>,
  )
}

const dialog = () => screen.getByRole('dialog')
const row = (name: RegExp) => within(dialog()).queryByRole('button', { name })

beforeEach(() => {
  window.localStorage.clear()
})

describe('the sheet shell', () => {
  it('is titled with the course name, and the hero does not repeat it', () => {
    // Decision 12. The pre-purchase sheet keeps its generic "Course Details"
    // because it sits in a flow; this one is about a course you already own.
    const data = course('cre', 'mc-agency-law')
    openSheet(data)
    expect(screen.getByRole('heading', { level: 2, name: data.title })).toBeInTheDocument()
    // Exactly one VISIBLE copy of the name — the heading. (`Sheet` also renders
    // an sr-only span carrying the accessible name; that one is required.)
    const visible = within(dialog())
      .getAllByText(data.title)
      .filter((el) => el.tagName !== 'SPAN')
    expect(visible).toHaveLength(1)
    expect(visible[0].tagName).toBe('H2')
  })

  it('shows no instructor and no rating in the hero', () => {
    // Decision 14 — a rating is a purchase-decision signal you cannot act on
    // once you own the course. The instructor moved behind About the Course.
    const data = course('cre', 'mc-agency-law')
    expect(data.rating).toBeGreaterThan(0) // the fixture HAS one; the sheet just doesn't show it
    openSheet(data)
    expect(within(dialog()).queryByText(String(data.rating))).toBeNull()
    // The instructor's NAME, not the word — the About the Course row legitimately
    // says "Description, instructor and schedule", which is a pointer to where
    // the instructor now lives rather than the instructor itself.
    expect(within(dialog()).queryByText(INSTRUCTOR.name)).toBeNull()
  })

  it('swaps to the tabs, turns the control into Back, and Esc returns to the hub', () => {
    openSheet(course('cre', 'mc-agency-law'))
    expect(screen.getByRole('button', { name: /close course details/i })).toBeInTheDocument()

    fireEvent.click(row(/About the Course/i)!)
    // `role="tab"`, not `button` — the tabs announce their selection through
    // `aria-selected`. They shipped as bare buttons when they were extracted
    // and that was a regression (a11y S28); this pins the semantics.
    expect(screen.getByRole('tab', { name: 'Description', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back to course details/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close course details/i })).toBeNull()

    // ⚠ THE POINT OF THIS TEST. A header that says "Back" while Escape ejects
    // you out of the sheet is two outcomes from one intent. All three dismiss
    // gestures have to agree.
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(row(/About the Course/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close course details/i })).toBeInTheDocument()
  })
})

describe('the status zone', () => {
  it('names the reason on a pending certificate, and opens the action panel', () => {
    // The card's tag deliberately withheld the reason (decision 3); this is the
    // one surface that pays that restraint off.
    openSheet(course('cre', 'mc-bpo'))
    const line = within(dialog()).getByRole('button', { name: /Certificate pending — Survey Required/i })
    fireEvent.click(line)
    expect(screen.getByRole('heading', { name: 'Certificate Details' })).toBeInTheDocument()
  })

  it('reads ISSUED for a certificate that is issued but not yet roster-reported', () => {
    // ⚠ THE TRAP. `reporting: 'pending-roster'` sits on an already-issued
    // certificate. Key the pending branch off `status === 'action-required'`,
    // never off the word "pending".
    const cert = certificateForCourse('cre', 'mc-workforce-housing')
    expect(cert?.status).toBe('completed')
    expect(cert?.reporting?.status).toBe('pending-roster')

    openSheet(course('cre', 'mc-workforce-housing'))
    expect(within(dialog()).getByText(/Certificate issued/i)).toBeInTheDocument()
    expect(within(dialog()).queryByText(/Certificate pending/i)).toBeNull()
  })

  it('KEEPS the progress an expired course earned, and names it', () => {
    // REVERSED 2026-09-08. This used to assert the opposite — no bar, no
    // percentage anywhere — on the reasoning that a frozen 30% reads as a
    // promise the work comes back. The call now is that the number is a record
    // of what the learner did, and hiding it erased their effort to avoid a
    // misreading the charcoal fill already prevents.
    const data = course('cre', 'mc-cre-commercial-leasing')
    expect(data.progress).toBe(30)
    openSheet(data)
    expect(within(dialog()).getByText('30%')).toBeInTheDocument()
    const bar = dialog().querySelector('[role="progressbar"]')
    expect(bar).not.toBeNull()
    expect(bar).toHaveAttribute('aria-valuenow', '30')
  })

  it('still refuses to promise the progress is resumable', () => {
    // The half that did NOT change. Showing what they did is a record;
    // "pick up where you left off" is a claim about LMS behaviour nobody here
    // can make, to someone about to pay to come back.
    openSheet(course('cre', 'mc-cre-commercial-leasing'))
    expect(row(/Enrol again/i)).toHaveTextContent('Get access to this course again.')
    expect(dialog().textContent).not.toMatch(/pick up where you left off/i)
  })
})

describe('the action list', () => {
  it('leads with View Certificate on a completed course, and drops Swap, Externally and the danger group', () => {
    openSheet(course('cre', 'mc-agency-law'))
    const rows = within(dialog()).getAllByRole('button')
    // First ACTION row (after the header's Close control) is View Certificate.
    expect(rows[1]).toHaveTextContent('View Certificate')

    expect(row(/Completed Externally/i)).toBeNull()
    expect(row(/Swap Course/i)).toBeNull()
    expect(row(/Remove Course/i)).toBeNull()
    // The container is ABSENT, not empty — an empty bordered box above a 20px
    // gap is worse than no group.
    expect(dialog().querySelector('.cre-manage-row--danger')).toBeNull()
  })

  it('leads with Enrol again on an expired course, and Go to Course is gone rather than disabled', () => {
    openSheet(course('cre', 'mc-cre-commercial-leasing'))
    const rows = within(dialog()).getAllByRole('button')
    expect(rows[1]).toHaveTextContent('Enrol again')
    // Absent. A greyed row that still reads "Go to Course" is the design
    // insisting on an affordance it no longer has.
    expect(row(/Go to Course/i)).toBeNull()
    expect(row(/Enrol again/i)).toHaveTextContent('Get access to this course again.')
  })

  it('drops Remove and narrows the Swap copy for a non-member', () => {
    openSheet(course('cre', 'mc-cre-1031-exchange'), 'cre', 'non-member')
    expect(row(/Remove Course/i)).toBeNull()
    expect(dialog().querySelector('.cre-manage-row--danger')).toBeNull()
    expect(row(/Swap Course/i)).toHaveTextContent('Exchange for another date, or a course of equal value.')
  })

  it('names the real percentage in the Swap and Remove sub-lines when in progress', () => {
    // "Your progress is not kept" is easy to skim past; "Your 45% progress is
    // not kept" is not. Same move the membership copy makes by printing a real
    // date instead of "soon".
    const data = course('cre', 'mc-cre-1031-exchange')
    expect(data.status).toBe('in-progress')
    const pct = `${Math.round(data.progress ?? 0)}%`
    openSheet(data)
    expect(row(/Swap Course/i)).toHaveTextContent(`Your ${pct} progress is not kept.`)
    expect(row(/Remove Course/i)).toHaveTextContent(`Your ${pct} progress is not kept.`)
  })
})

describe('the tabs', () => {
  function openTabs() {
    openSheet(course('cre', 'mc-agency-law'))
    fireEvent.click(row(/About the Course/i)!)
  }

  it('puts only the selected tab in the tab order', () => {
    // Roving tabindex — Tab moves PAST the strip to the panel rather than
    // through every tab in it.
    openTabs()
    expect(screen.getByRole('tab', { name: 'Description' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Instructor' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection with the arrow keys, and wraps', () => {
    openTabs()
    const list = screen.getByRole('tablist')
    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Instructor', selected: true })).toBeInTheDocument()
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Description', selected: true })).toBeInTheDocument()
    // Wraps backwards off the first tab to the last.
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    const tabs = screen.getAllByRole('tab')
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('gives the panel a focus stop, since it holds no focusable content', () => {
    openTabs()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0')
  })
})

describe('the tab extraction', () => {
  it('leaves CourseSheet rendering its three tabs unchanged', () => {
    seed('cre')
    // A live course — the state where all three tabs show.
    const live = getCatalogFixtures('cre').individualCourses.find(
      (c) => c.delivery === 'webinar' || c.delivery === 'in-person',
    )
    expect(live).toBeDefined()
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <CourseSheet open onClose={() => {}} data={live!} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('tablist', { name: 'Course details' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Description', selected: true })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Instructor', selected: false })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Schedule', selected: false })).toBeInTheDocument()
    // Exactly one panel, labelled by the selected tab.
    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', { name: 'Description' }).id,
    )
  })
})
