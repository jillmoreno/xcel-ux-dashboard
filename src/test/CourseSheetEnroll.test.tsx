import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { EnrollmentConfirmationModal } from '@/components/courses/EnrollmentConfirmationModal'
import { AccountProvider } from '@/context/AccountContext'
import { ChalkboardUser } from '@/icons'

/**
 * The Reserve Your Seat confirmation, tested on the MODAL rather than through
 * `CourseSheet`.
 *
 * The LMS drove this end-to-end: pick the first `delivery: 'in-person'` course
 * out of the brand fixtures, open its sheet, click "Enroll in Course", assert
 * the modal. Neither half of that reaches XCEL.
 *
 *   1. XCEL's catalog has no in-person courses. It sells online and
 *      livestream/webinar training, which is right for insurance
 *      pre-licensing — so there is nothing to find, and authoring a fake
 *      in-person course would put a delivery mode in the demo catalogue that
 *      the brand does not offer.
 *
 *   2. More fundamentally, the "Enroll in Course" CTA is gated on `isIncluded`
 *      in CourseSheet — the course being covered by the learner's membership.
 *      `resolveCommerceState` short-circuits to `priced` for a brand with no
 *      membership, so XCEL's sheet shows "Add to Cart" and NEVER the enrol
 *      path. The sheet→modal step is structurally unreachable here, not merely
 *      unfixtured.
 *
 * The modal itself is live, shared code, so this keeps real coverage: the seat
 * lead copy, the three detail rows, and the confirm callback. Restore the
 * end-to-end form alongside a brand whose membership includes courses.
 */

const SCHEDULE = ['Fri April 7 - Fri April 14 | 5 Sessions', 'Class meets M/T/W']
const LOCATION = ['Superior School of Real Estate', '13950 Ballantyne Corporate Pl']
const COURSE_TITLE = 'Life & Health Exam Cram — Classroom'

function renderModal(onConfirm: () => void = () => {}) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <EnrollmentConfirmationModal
          open
          onClose={() => {}}
          onConfirm={onConfirm}
          icon={<ChalkboardUser size={44} aria-hidden />}
          lead={
            <>
              <p style={{ margin: 0, fontWeight: 600 }}>Only 12 seats remain for this course.</p>
              <p style={{ margin: 0 }}>
                Your membership includes access at no extra cost—please enroll only if you plan
                to attend.
              </p>
            </>
          }
          rows={[
            { label: 'Course Name:', lines: [COURSE_TITLE] },
            { label: 'Date / Time:', lines: SCHEDULE },
            { label: 'Location:', lines: LOCATION },
          ]}
        />
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('Reserve Your Seat (in-person enrollment confirmation)', () => {
  it('names the course, the schedule and the venue', () => {
    renderModal()
    const modal = screen.getByRole('dialog', { name: /reserve your seat/i })
    expect(within(modal).getByRole('heading', { name: /reserve your seat/i })).toBeInTheDocument()

    // Course name / date / time / location all mirror the sheet view's data.
    expect(within(modal).getByText(COURSE_TITLE)).toBeInTheDocument()
    expect(within(modal).getByText(/superior school of real estate/i)).toBeInTheDocument()

    // Date / Time row mirrors the sheet header's 3rd + 4th lines — date range
    // + session count, then meeting cadence.
    expect(within(modal).getByText(/Fri April 7 - Fri April 14 \| 5 Sessions/)).toBeInTheDocument()
    expect(within(modal).getByText(/Class meets M\/T\/W/)).toBeInTheDocument()

    // The seat-scarcity lead is what distinguishes this from the webinar
    // ("Shipping Details") arm of the same modal.
    expect(within(modal).getByText(/only 12 seats remain/i)).toBeInTheDocument()
  })

  it('fires onConfirm from the CTA — the step that commits the seat', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    renderModal(onConfirm)

    const modal = screen.getByRole('dialog', { name: /reserve your seat/i })
    await user.click(within(modal).getByRole('button', { name: /^enroll in course$/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
