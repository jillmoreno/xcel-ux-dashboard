import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AccountProvider, type Brand, type Membership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { MembershipLandingPage } from '@/pages/MembershipLandingPage'
import { MembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanel'
import {
  readDefaultMembershipVersion,
  writeDefaultMembershipVersion,
} from '@/data/membershipVersions'

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

beforeEach(() => {
  window.localStorage.clear()
})

describe('MembershipLandingPage — version selection', () => {
  it('renders the original (v1) page by default (no ?version)', () => {
    seedAccount('elite', 'member')
    renderAt('/membership')
    // The v1 tab nav ("VIP Partner Offerings") is unique to the original
    // page; the v2 redesign has no such tab.
    expect(screen.getByText('VIP Partner Offerings')).toBeInTheDocument()
    expect(screen.queryByText('How FHEA Passport works')).not.toBeInTheDocument()
  })

  it('renders the v2 member benefits view for an Elite member at ?version=v2', () => {
    seedAccount('elite', 'member')
    renderAt('/membership?version=v2')
    expect(screen.getByText('Your benefits at a glance')).toBeInTheDocument()
    // Member view has no join-page sections.
    expect(screen.queryByText('How FHEA Passport works')).not.toBeInTheDocument()
  })

  it('renders the v2 join view for an Elite non-member at ?version=v2', () => {
    seedAccount('elite', 'non-member')
    renderAt('/membership?version=v2')
    expect(screen.getByText('How FHEA Passport works')).toBeInTheDocument()
    expect(screen.getByText('Passport vs. Passport Lite')).toBeInTheDocument()
  })

  it('falls back to v1 for a non-Elite brand even at ?version=v2', () => {
    seedAccount('cre', 'member')
    renderAt('/membership?version=v2')
    expect(screen.getByText('VIP Partner Offerings')).toBeInTheDocument()
    expect(screen.queryByText('How FHEA Passport works')).not.toBeInTheDocument()
  })

  it('falls back to v1 silently for an unrecognized ?version', () => {
    seedAccount('elite', 'member')
    renderAt('/membership?version=foo')
    expect(screen.getByText('VIP Partner Offerings')).toBeInTheDocument()
    expect(screen.queryByText('Your benefits at a glance')).not.toBeInTheDocument()
  })

  it('lands on the stored default (v2) on a fresh visit with no param', () => {
    seedAccount('elite', 'member')
    writeDefaultMembershipVersion('v2')
    renderAt('/membership')
    expect(screen.getByText('Your benefits at a glance')).toBeInTheDocument()
  })
})

describe('MembershipV2 — products', () => {
  it('renders all 9 product cards (non-member) with no live-status badges', () => {
    seedAccount('elite', 'non-member')
    const { container } = renderAt('/membership?version=v2')
    // 9 product cards in the grid.
    expect(container.querySelectorAll('.cre-passport-prod')).toHaveLength(9)
    // Grid-unique titles (a few product titles also appear in the hero
    // "Your Passport includes" card, so assert on grid-only ones).
    expect(screen.getByText('Specialty certification exam prep bundles')).toBeInTheDocument()
    expect(screen.getByText('Specialty & role transition CE courses')).toBeInTheDocument()
    // Live-status / "coming soon" badges are gone — everything is
    // available to all members; tier is the only differentiator.
    expect(screen.queryByText('Available now')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming Q2')).not.toBeInTheDocument()
    expect(screen.queryByText('Coming Q3')).not.toBeInTheDocument()
  })

  it('splits the both-tier product (Podcasts) into two separate tier tags', () => {
    // Member view has no plan-comparison section, so tag counts are clean.
    seedAccount('elite', 'member')
    renderAt('/membership?version=v2')
    // The combined "Passport & Lite" tag is gone — it's now two pills.
    expect(screen.queryByText('Passport & Lite')).not.toBeInTheDocument()
    // Podcasts (both tiers) is the only product carrying a "Passport Lite" tag.
    expect(screen.getAllByText('Passport Lite')).toHaveLength(1)
    // Every product carries a "Passport" tag (8 passport-only + Podcasts).
    expect(screen.getAllByText('Passport').length).toBeGreaterThanOrEqual(8)
  })
})

describe('MembershipVersionsPanel — switcher', () => {
  it('lists both versions and fires onSelectVersion for the redesign', () => {
    const onSelect = vi.fn()
    render(
      <MembershipVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="v1"
        onSelectVersion={onSelect}
        defaultVersionId="v1"
        onSetDefault={() => {}}
      />,
    )
    // Each row label is rendered as "<ID> — <name>" (e.g. "V1 — Original").
    expect(screen.getByText('V1 — Original')).toBeInTheDocument()
    expect(screen.getByText('V2 — Redesign — Passport')).toBeInTheDocument()

    fireEvent.click(screen.getByText('V2 — Redesign — Passport'))
    expect(onSelect).toHaveBeenCalledWith('v2')
  })

  it('"Set as default" persists to cgp.membership.version', () => {
    const onSetDefault = vi.fn((id) => writeDefaultMembershipVersion(id))
    render(
      <MembershipVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="v1"
        onSelectVersion={() => {}}
        defaultVersionId="v1"
        onSetDefault={onSetDefault}
      />,
    )
    // Every non-default row exposes a "Set as default" trigger (v2 + v3
    // once V3 shipped), so scope to the v2 ("Redesign — Passport") row.
    const v2Row = screen.getByText('V2 — Redesign — Passport').closest('li')
    if (!v2Row) throw new Error('No <li> row for the v2 version')
    fireEvent.click(within(v2Row as HTMLElement).getByRole('button', { name: 'Set as default' }))
    expect(onSetDefault).toHaveBeenCalledWith('v2')
    expect(readDefaultMembershipVersion()).toBe('v2')
  })
})
