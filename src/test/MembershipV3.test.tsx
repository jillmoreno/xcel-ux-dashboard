import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider, type Brand, type Membership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { MembershipLandingPage } from '@/pages/MembershipLandingPage'

/** Seed the active brand + membership the way the app persists it. */
function seedAccount(brand: Brand, membership: Membership) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, membership }))
}

function renderAt(url: string) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <LearningPathsPanelProvider>
          <JumpBackInPanelProvider>
            <MemoryRouter initialEntries={[url]}>
              <Routes>
                <Route path="/membership" element={<MembershipLandingPage />} />
              </Routes>
            </MemoryRouter>
          </JumpBackInPanelProvider>
        </LearningPathsPanelProvider>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

/** The group `<section>` that owns a given section title — lets us count
 *  the product cards (`.cre-passport-prod`) scoped to that group. */
function groupSection(title: string): HTMLElement {
  const heading = screen.getByText(title)
  const section = heading.closest('section')
  if (!section) throw new Error(`No <section> ancestor for "${title}"`)
  return section as HTMLElement
}

const LEARNING_LIBRARY = 'Your Resource Library'
const EXAM_PREP = 'Exam & certification prep'
const CAREER_TOOLS = 'Career tools, powered by Rubi AI'

beforeEach(() => {
  window.localStorage.clear()
})

describe('MembershipV3 — grouped sections', () => {
  it.each<[label: string, membership: Membership]>([
    ['member', 'member'],
    ['non-member', 'non-member'],
  ])('renders all three section titles for an Elite %s', (_label, membership) => {
    seedAccount('elite', membership)
    renderAt('/membership?version=v3')
    expect(screen.getByText(LEARNING_LIBRARY)).toBeInTheDocument()
    expect(screen.getByText(EXAM_PREP)).toBeInTheDocument()
    expect(screen.getByText(CAREER_TOOLS)).toBeInTheDocument()
  })

  it.each<[label: string, membership: Membership]>([
    ['member', 'member'],
    ['non-member', 'non-member'],
  ])('groups the products 5 / 1 / 3 for an Elite %s', (_label, membership) => {
    seedAccount('elite', membership)
    renderAt('/membership?version=v3')
    expect(groupSection(LEARNING_LIBRARY).querySelectorAll('.cre-passport-prod')).toHaveLength(5)
    expect(groupSection(EXAM_PREP).querySelectorAll('.cre-passport-prod')).toHaveLength(1)
    expect(groupSection(CAREER_TOOLS).querySelectorAll('.cre-passport-prod')).toHaveLength(3)
  })

  it('puts the "Rubi AI" accent pill on Career Tools cards but not Resource Library', () => {
    seedAccount('elite', 'member')
    renderAt('/membership?version=v3')
    // One "Rubi AI" pill per Career Tools card (3); the section title
    // "Career tools, powered by Rubi AI" is a different full string so it
    // doesn't match the exact-text query.
    expect(within(groupSection(CAREER_TOOLS)).getAllByText('Rubi AI')).toHaveLength(3)
    expect(within(groupSection(LEARNING_LIBRARY)).queryByText('Rubi AI')).not.toBeInTheDocument()
  })

  it('drops the standalone Rubi AI band on the v3 join view (it stays on v2)', () => {
    const bandHeading = 'A career coach built into your membership.'
    seedAccount('elite', 'non-member')

    const { unmount } = renderAt('/membership?version=v3')
    expect(screen.queryByText(bandHeading)).not.toBeInTheDocument()
    unmount()

    renderAt('/membership?version=v2')
    expect(screen.getByText(bandHeading)).toBeInTheDocument()
  })

  it('falls back to v1 for a non-Elite brand even at ?version=v3', () => {
    seedAccount('cre', 'member')
    renderAt('/membership?version=v3')
    // V1-only tab; the grouped sections never render.
    expect(screen.getByText('VIP Partner Offerings')).toBeInTheDocument()
    expect(screen.queryByText(LEARNING_LIBRARY)).not.toBeInTheDocument()
  })
})

describe('MembershipV2 — single grid is unaffected by V3', () => {
  it('renders the 9-card grid under one header, with no per-group titles (non-member)', () => {
    seedAccount('elite', 'non-member')
    const { container } = renderAt('/membership?version=v2')
    expect(container.querySelectorAll('.cre-passport-prod')).toHaveLength(9)
    expect(screen.getByText('Everything in your Passport')).toBeInTheDocument()
    expect(screen.queryByText(LEARNING_LIBRARY)).not.toBeInTheDocument()
    expect(screen.queryByText(CAREER_TOOLS)).not.toBeInTheDocument()
  })

  it('renders the 9-card grid under one header, with no per-group titles (member)', () => {
    seedAccount('elite', 'member')
    const { container } = renderAt('/membership?version=v2')
    expect(container.querySelectorAll('.cre-passport-prod')).toHaveLength(9)
    expect(screen.getByText('Your benefits at a glance')).toBeInTheDocument()
    expect(screen.queryByText(LEARNING_LIBRARY)).not.toBeInTheDocument()
    expect(screen.queryByText(CAREER_TOOLS)).not.toBeInTheDocument()
  })
})
