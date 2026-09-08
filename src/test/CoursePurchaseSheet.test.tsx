import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { CourseSheetSwitch } from '@/components/courses/CourseSheetSwitch'
import { AccountProvider, type MembershipTier } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { getCatalogFixtures } from '@/data/catalog'

// The Figma course: Elite (Healthcare) "Sepsis: Recognition & Response" —
// $19 one-time, Passport-only entitlement, so a non-member resolves to `priced` and
// gets all three enroll options (one-time + Passport Lite + Passport).
const sepsis = getCatalogFixtures('elite').individualCourses.find((c) => c.id === 'c-sepsis')!

/** Match a price whose cents render as a superscript — the composed text
 *  ("$99.99") is split across a dollar text node + a <sup>, so match the
 *  deepest element whose full textContent equals the price. */
function fullPrice(sheet: HTMLElement, full: string) {
  return within(sheet).getAllByText((_content, node) => {
    if (!node || node.textContent !== full) return false
    return !Array.from(node.children).some((c) => c.textContent === full)
  })
}

/** Seed the persisted account so AccountProvider hydrates into the state we
 *  want (same approach as AchievementsPage.test.tsx). */
function seedAccount(tier: MembershipTier) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', tier }))
}

/** Render the switch with the flag pinned via `?ff=` — the read-only URL
 *  override the two prototype links use — and the given account tier. */
function renderFlow(variant: 'current' | 'new', tier: MembershipTier = 'non-member') {
  seedAccount(tier)
  window.history.replaceState({}, '', `/catalog?ff=catalog-upsell-flow:${variant}`)
  return render(
    <MemoryRouter>
      <FeatureFlagProvider>
        <AccountProvider>
          <CourseSheetSwitch open onClose={() => {}} data={sepsis} />
        </AccountProvider>
      </FeatureFlagProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('catalog-upsell-flow = current', () => {
  it('opens today’s single-screen sheet — price + Add to Cart, tabs inline', async () => {
    renderFlow('current')
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })
    expect(within(sheet).getByRole('button', { name: /^add to cart$/i })).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /course overview/i })).toBeInTheDocument()
    // The new flow's affordances must NOT be present in the control arm.
    expect(within(sheet).queryByText(/choose how to enroll/i)).not.toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: /view course details/i })).not.toBeInTheDocument()
  })
})

describe('catalog-upsell-flow = new', () => {
  it('shows the three enroll options with one-time pre-selected', () => {
    renderFlow('new')
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })

    expect(within(sheet).getByText(/choose how to enroll/i)).toBeInTheDocument()
    expect(within(sheet).getByText(/complete purchase/i)).toBeInTheDocument()
    expect(within(sheet).getByText('BEST VALUE')).toBeInTheDocument()

    // One-time + both Elite tiers. "One-time purchase" appears twice — the
    // enroll row + the step-2 summary title (it's the default selection).
    expect(within(sheet).getAllByText('One-time purchase').length).toBeGreaterThanOrEqual(2)
    expect(within(sheet).getByText('Passport Lite Membership')).toBeInTheDocument()
    expect(within(sheet).getByText('Passport Membership')).toBeInTheDocument()
    // Prices — cents render as a superscript, so match the composed node text.
    expect(fullPrice(sheet, '$19.00').length).toBeGreaterThan(0)
    expect(fullPrice(sheet, '$48').length).toBeGreaterThan(0) // whole → no cents
    expect(fullPrice(sheet, '$99.99').length).toBeGreaterThan(0)

    const radios = within(sheet).getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toBeChecked() // one-time — the default selection
    expect(radios[1]).not.toBeChecked() // Passport Lite
    expect(radios[2]).not.toBeChecked() // Passport

    // Step 2 CTA reflects the one-time default.
    expect(
      within(sheet).getByRole('button', { name: /add course to cart/i }),
    ).toBeInTheDocument()
  })

  it('re-labels step 2 and the CTA when a membership plan is chosen', async () => {
    const user = userEvent.setup()
    renderFlow('new')
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })

    await user.click(within(sheet).getByText('Passport Membership'))

    // Step-2 summary is now two lines: the billing cadence on top, plan below
    // (mirroring the one-time layout). "Passport Membership" = enroll row + summary.
    expect(within(sheet).getAllByText('Passport Membership').length).toBeGreaterThanOrEqual(2)
    expect(within(sheet).getByText('Billed yearly')).toBeInTheDocument()
    expect(
      within(sheet).getByRole('button', { name: /add membership to cart/i }),
    ).toBeInTheDocument()
    expect(
      within(sheet).queryByRole('button', { name: /add course to cart/i }),
    ).not.toBeInTheDocument()
  })

  it('swaps to Course Details in place and back, keeping the enroll selection', async () => {
    const user = userEvent.setup()
    renderFlow('new')

    // Pick a non-default option (the top tier) so we can prove it survives.
    let sheet = screen.getByRole('dialog', { name: /purchase course/i })
    await user.click(within(sheet).getByText('Passport Membership'))
    await user.click(within(sheet).getByRole('button', { name: /view course details/i }))

    // Same sheet, new view — title + tabs change, the sheet is not replaced.
    sheet = screen.getByRole('dialog', { name: /course details/i })
    expect(within(sheet).getByRole('heading', { name: /course details/i })).toBeInTheDocument()
    expect(within(sheet).getByRole('tab', { name: /description/i })).toBeInTheDocument()
    expect(within(sheet).getByText(/What you’ll learn/i)).toBeInTheDocument()
    // Webinar → the Schedule tab is offered.
    expect(within(sheet).getByRole('tab', { name: /schedule/i })).toBeInTheDocument()

    await user.click(within(sheet).getByRole('button', { name: /back to purchase/i }))

    sheet = screen.getByRole('dialog', { name: /purchase course/i })
    const radios = within(sheet).getAllByRole('radio')
    expect(radios[2]).toBeChecked() // Passport still selected
    expect(
      within(sheet).getByRole('button', { name: /add membership to cart/i }),
    ).toBeInTheDocument()
  })

  it('fires the Added-to-Cart confirmation toast when a plan is added', async () => {
    const user = userEvent.setup()
    renderFlow('new')
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })

    await user.click(within(sheet).getByText('Passport Membership'))
    await user.click(within(sheet).getByRole('button', { name: /add membership to cart/i }))

    // The richer cart toast (Figma 471:19219) is portaled to the body — it
    // confirms the added plan and offers Continue Shopping / View Cart.
    const toast = screen.getByText('Added to Cart').closest('.cre-add-to-cart-toast') as HTMLElement
    expect(toast).not.toBeNull()
    expect(within(toast).getByText('Passport Membership')).toBeInTheDocument()
    expect(within(toast).getByText('$99.99/yr')).toBeInTheDocument()
    expect(within(toast).getByRole('button', { name: /view cart/i })).toBeInTheDocument()
    expect(within(toast).getByRole('button', { name: /continue shopping/i })).toBeInTheDocument()
  })

  it('keeps the current sheet for a member already entitled to the course', () => {
    // A full Passport member is `included` — the new purchase flow must not
    // offer them something they already own.
    renderFlow('new', 'high')
    const sheet = screen.getByRole('dialog', { name: /purchase course/i })
    expect(within(sheet).queryByText(/choose how to enroll/i)).not.toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /^enroll in course$/i })).toBeInTheDocument()
  })
})
