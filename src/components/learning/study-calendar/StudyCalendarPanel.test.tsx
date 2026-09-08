import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { StudyCalendarPanel } from './StudyCalendarPanel'

/**
 * Snapshot tests for the three STC Study Calendar branches:
 *   - Member with a calendar     → renders the real panel.
 *   - Non-Member                 → renders the locked-state overlay.
 *   - Member without a calendar  → renders the empty state.
 *
 * `AccountProvider` reads its initial brand / membership from
 * `localStorage` under `cgp.account` — each test pre-seeds that key
 * so the provider boots into the brand we want without needing a
 * test-only context shim.
 */
function renderPanel(pathId = 'series-79-15day') {
  return render(
    <MemoryRouter initialEntries={[`/my-learning/path?id=${pathId}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <StudyCalendarPanel pathId={pathId} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

function seedAccount(brand: 'cre' | 'stc', membership: 'member' | 'non-member') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand, membership }))
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('StudyCalendarPanel', () => {
  it('renders the real panel for an STC Member on a path that has a calendar', () => {
    seedAccount('stc', 'member')
    const { asFragment } = renderPanel('series-79-15day')

    // View toggle is present — Member render only. The toggle is a
    // `<PillTabs>` so each option is `role="tab"`, not button.
    expect(
      screen.getByRole('tab', { name: /^daily$/i }),
    ).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders the locked-state overlay for an STC Non-Member', () => {
    seedAccount('stc', 'non-member')
    const { asFragment } = renderPanel('series-79-15day')

    // The locked-state CTA wraps the dimmed Daily preview.
    expect(
      screen.getByRole('region', { name: /study calendar — stc membership required/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /get stc membership/i }),
    ).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })

  it('renders the empty state on an STC path without a calendar', () => {
    seedAccount('stc', 'member')
    const { asFragment } = renderPanel('lp-stc-unknown')

    expect(
      screen.getByRole('region', { name: /study plan unavailable/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/no study plan assigned to this path/i)).toBeInTheDocument()
    expect(asFragment()).toMatchSnapshot()
  })
})
