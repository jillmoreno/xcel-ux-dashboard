import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach } from 'vitest'
import { AccountProvider, type Brand, type Membership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { DashboardHeroBand } from '@/components/dashboard/DashboardHeroBand'

function renderBand(
  brand: Brand = 'cre',
  membership: Membership = 'member',
) {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand, membership }),
  )
  return render(
    <AccountProvider>
      <MemoryRouter>
        <FeatureFlagProvider>
          <DashboardHeroBand />
        </FeatureFlagProvider>
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('DashboardHeroBand — greeting', () => {
  it('renders the <h1> with the first name from AccountContext', () => {
    renderBand('cre')
    expect(
      screen.getByRole('heading', { level: 1, name: /sarah/i }),
    ).toBeInTheDocument()
  })

  it('returning user (CRE — has credits + certs) gets "Hi Sarah"', () => {
    renderBand('cre')
    expect(
      screen.getByRole('heading', { level: 1, name: /^hi sarah$/i }),
    ).toBeInTheDocument()
  })

  it('new user (STC — 0 credits, 0 certs) gets "Welcome, Marcus" — no "back"', () => {
    renderBand('stc')
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent(/^Welcome, Marcus$/)
    expect(h1).not.toHaveTextContent(/back/i)
  })

  it('does not throw when motto is undefined (STC fixture)', () => {
    // STC's user has no `motto`. The component should fall back to
    // the onboarding string and render without errors.
    expect(() => renderBand('stc')).not.toThrow()
    // Quote slot should hold the onboarding fallback.
    expect(
      screen.getByText(/welcome aboard — pick a path to get started\./i),
    ).toBeInTheDocument()
  })
})

describe('DashboardHeroBand — Pro pill', () => {
  it('renders Pro pill when membership === "member"', () => {
    renderBand('cre', 'member')
    // Exact-match aria-label so the upgrade CTA in the non-member
    // case (aria-label "Upgrade to Pro membership") doesn't trip the
    // regex search.
    expect(
      screen.getByLabelText('Pro membership'),
    ).toBeInTheDocument()
  })

  it('does NOT render Pro pill when membership === "non-member"', () => {
    renderBand('cre', 'non-member')
    expect(
      screen.queryByLabelText('Pro membership'),
    ).not.toBeInTheDocument()
  })
})

describe('DashboardHeroBand — avatar', () => {
  // The Avatar primitive renders a gem badge only when `pro={true}`,
  // which the band wires from `membership === 'member'`. The gem
  // itself doesn't carry a stable text label, so we assert it
  // structurally — the Avatar component renders a `<Gem>` icon when
  // pro, and that's the only SVG outside the band's <h1>/pro-pill.
  it('Avatar gem badge renders for members only', () => {
    const { container: memberContainer } = renderBand('cre', 'member')
    // Member avatar wraps two SVGs: one for the image fallback (none
    // here since we have an imageUrl) + the Gem badge. Just count
    // SVGs inside the avatar's positioned wrapper.
    const memberSvgs = memberContainer.querySelectorAll('svg')
    expect(memberSvgs.length).toBeGreaterThanOrEqual(1)

    // Wipe and re-render as non-member.
    window.localStorage.clear()
    const { container: nonMemberContainer } = renderBand('cre', 'non-member')
    // Non-member avatar has no Gem badge → SVG count drops.
    const nonMemberSvgs = nonMemberContainer.querySelectorAll('svg')
    expect(memberSvgs.length).toBeGreaterThan(nonMemberSvgs.length)
  })
})

describe('DashboardHeroBand — stat chips', () => {
  it('renders exactly 4 stat chips in the documented order for CRE', () => {
    renderBand('cre', 'member')
    // Read the 4 labels off the DOM in document order.
    const labels = ['Member Since', 'Credits', 'Certificates', 'Saved']
    for (const label of labels) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    // The labels span text-content of the chip wrappers; assert order
    // by finding all 4 and verifying their text matches `labels` in
    // sequence.
    const found = labels.map((l) => screen.getByText(l))
    for (let i = 1; i < found.length; i++) {
      expect(
        found[i - 1].compareDocumentPosition(found[i]) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    }
  })

  it('labels are sentence-case in source; CSS lifts them to uppercase', () => {
    renderBand('cre', 'member')
    const credits = screen.getByText('Credits')
    expect(credits.textContent).toBe('Credits')
    expect(credits).toHaveStyle({ textTransform: 'uppercase' })
  })

  it('CRE values render correctly (Member Since 2024 / 15 / 12 / $842)', () => {
    renderBand('cre', 'member')
    expect(screen.getByText('2024')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('$842')).toBeInTheDocument()
  })

  it('CRE sub-lines render ("1 year, 54 days" / "total completed" / "lifetime earned" / "this year")', () => {
    renderBand('cre', 'member')
    expect(screen.getByText('1 year, 54 days')).toBeInTheDocument()
    expect(screen.getByText('total completed')).toBeInTheDocument()
    expect(screen.getByText('lifetime earned')).toBeInTheDocument()
    expect(screen.getByText('this year')).toBeInTheDocument()
  })

  it('dollar amount formats with commas via Intl — Elite reads "$1,180"', () => {
    renderBand('elite', 'member')
    expect(screen.getByText('$1,180')).toBeInTheDocument()
  })
})

describe('DashboardHeroBand — new user faded stats', () => {
  it('new user (STC, 0 credits + 0 certs) drops the stats row to opacity 0.65', () => {
    renderBand('stc', 'member')
    // The stats container is marked with data-faded="true" — find it
    // and verify the inline opacity.
    const faded = document.querySelector('[data-faded="true"]')
    expect(faded).not.toBeNull()
    expect(faded as HTMLElement).toHaveStyle({ opacity: '0.65' })
  })

  it('returning user (CRE) does NOT apply the faded marker', () => {
    renderBand('cre', 'member')
    expect(document.querySelector('[data-faded="true"]')).toBeNull()
  })
})

describe('DashboardHeroBand — non-Pro upgrade card', () => {
  it('replaces the 4th chip with an upgrade card linking to /membership/plans', () => {
    renderBand('cre', 'non-member')
    const cta = screen.getByRole('link', {
      name: /upgrade to pro membership/i,
    })
    expect(cta).toHaveAttribute('href', '/membership/plans')
    // Content: label "Upgrade to Pro" + value "Save 20% on courses".
    expect(within(cta).getByText(/upgrade to pro/i)).toBeInTheDocument()
    expect(within(cta).getByText(/save 20% on courses/i)).toBeInTheDocument()
  })

  it('omits the "Saved" stat chip when user is non-member', () => {
    renderBand('cre', 'non-member')
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
    expect(screen.queryByText(/this year/i)).not.toBeInTheDocument()
  })

  it('still renders the 3 leading stat chips when non-member', () => {
    renderBand('cre', 'non-member')
    // Non-members lead with "Learner Since" (members get "Member Since").
    expect(screen.getByText('Learner Since')).toBeInTheDocument()
    expect(screen.getByText('Credits')).toBeInTheDocument()
    expect(screen.getByText('Certificates')).toBeInTheDocument()
  })
})

describe('DashboardHeroBand — brand switching', () => {
  it("McKissock surfaces Patricia's name + McKissock-specific stats", () => {
    renderBand('mckissock', 'member')
    expect(
      screen.getByRole('heading', { level: 1, name: /patricia/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('$510')).toBeInTheDocument()
  })

  it("Elite surfaces the account name + Elite-specific stats", () => {
    renderBand('elite', 'member')
    expect(
      screen.getByRole('heading', { level: 1, name: /sarah/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('38')).toBeInTheDocument()
  })

  it("band background is var(--color-primary-500) — the brand-themed teal", () => {
    // The band itself is the first direct child of the rendered tree.
    // We can't read the *computed* color (jsdom doesn't resolve CSS
    // variables), but we can verify the inline style references the
    // brand-aware token — proving the variable is wired through.
    const { container } = renderBand('cre', 'member')
    const band = container.firstElementChild as HTMLElement
    expect(band.style.background).toBe('var(--color-primary-500)')
  })
})
