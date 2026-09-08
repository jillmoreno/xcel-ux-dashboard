import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { CourseSheet } from '@/components/courses/CourseSheet'
import { AccountProvider } from '@/context/AccountContext'
import { INDIVIDUAL_COURSES } from '@/data/catalogFixtures'

// Pick the first in-person course in the fixtures — same one a member would
// land on by clicking an "Included with Membership" card in the catalog. The
// default AccountProvider state is a member (CRE Plus tier), and the course
// carries no entitlement override, so the sheet resolves to the "included"
// (Enroll) state.
const inPersonCourse = INDIVIDUAL_COURSES.find((c) => c.delivery === 'in-person')!

function renderSheet() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <CourseSheet open onClose={() => {}} data={inPersonCourse} />
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('CourseSheet → Enroll (Pro / In-Person)', () => {
  it('opens the Reserve Your Seat modal with course name, schedule, and venue', async () => {
    const user = userEvent.setup()
    renderSheet()

    // The sheet itself is a dialog ("Purchase Course"); narrow to its
    // visible Enroll CTA before opening the confirmation modal.
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })
    await user.click(within(sheet).getByRole('button', { name: /^enroll in course$/i }))

    // After clicking, a second dialog (the confirmation modal) appears.
    const modal = await screen.findByRole('dialog', { name: /reserve your seat/i })
    expect(within(modal).getByRole('heading', { name: /reserve your seat/i })).toBeInTheDocument()

    // Course name / date / time / location all mirror the sheet view's data.
    expect(within(modal).getByText(inPersonCourse.title)).toBeInTheDocument()
    expect(within(modal).getByText(/superior school of real estate/i)).toBeInTheDocument()

    // Date / Time row mirrors the sheet header's 3rd + 4th lines —
    // date range + session count, then meeting cadence.
    expect(within(modal).getByText(/Fri April 7 - Fri April 14 \| 5 Sessions/)).toBeInTheDocument()
    expect(within(modal).getByText(/Class meets M\/T\/W/)).toBeInTheDocument()
  })

  it('shows the success toast after confirming enrollment', async () => {
    const user = userEvent.setup()
    renderSheet()

    const sheet = screen.getByRole('dialog', { name: /purchase course/i })
    await user.click(within(sheet).getByRole('button', { name: /^enroll in course$/i }))

    const modal = await screen.findByRole('dialog', { name: /reserve your seat/i })
    await user.click(within(modal).getByRole('button', { name: /^enroll in course$/i }))

    const toast = await screen.findByRole('status')
    expect(within(toast).getByText(/success\. you did it!/i)).toBeInTheDocument()
    expect(within(toast).getByText(inPersonCourse.title)).toBeInTheDocument()
    expect(within(toast).getByRole('button', { name: /go to course details/i })).toBeInTheDocument()
  })
})
