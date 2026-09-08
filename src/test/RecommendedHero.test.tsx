import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { MembershipSectionHero } from '@/components/layout/MembershipSectionHero'
import { SECTION_HERO_META } from '@/data/membership/sectionHeroMeta'

/**
 * The Recommended for You page's section hero. Backs the dev-handoff `rec-hero`
 * live preview. Recommended for You is an all-users browse surface — `recommended`
 * is excluded from `MEMBERSHIP_EYEBROW_SECTIONS`, so the shell passes NO
 * `membershipEyebrow` and the hero renders no "Included with your membership"
 * eyebrow for ANY tier (non-member or member). These tests render the hero exactly as
 * the page does (no eyebrow prop) and assert the framing is absent at every tier.
 */

const META = SECTION_HERO_META.recommended

function seedTier(tier: 'non-member' | 'low' | 'high') {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'elite', tier }))
}

// The page renders the hero WITHOUT a membershipEyebrow (all-users surface).
function renderHero() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <MembershipSectionHero
          section="recommended"
          title={META.title}
          description={META.description}
          searchPlaceholder={META.searchPlaceholder}
        />
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('Recommended for You — section hero (all-users, no membership eyebrow)', () => {
  for (const tier of ['non-member', 'low', 'high'] as const) {
    it(`renders the title and NO membership eyebrow at tier "${tier}"`, () => {
      seedTier(tier)
      renderHero()
      expect(screen.getByRole('heading', { name: META.title })).toBeInTheDocument()
      // No "Included with your membership" framing for any tier — the hero is
      // membership-agnostic on this all-users browse surface.
      expect(screen.queryByText(/included with your/i)).toBeNull()
    })
  }
})
