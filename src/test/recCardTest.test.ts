import { describe, it, expect, afterEach, vi } from 'vitest'
import { recCardEnvTarget, recCardTestPath } from '@/data/recCardTest'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('recCardEnvTarget — single-arm deploy pin', () => {
  it('returns null when unpinned (the normal full app / main site)', () => {
    expect(recCardEnvTarget()).toBeNull()
  })

  it('pins the arm from VITE_REC_CARD_ARM, defaulting to non-member', () => {
    vi.stubEnv('VITE_REC_CARD_ARM', 'compact')
    expect(recCardEnvTarget()).toEqual({ variant: 'compact', membership: 'non-member' })
  })

  it('honors VITE_REC_CARD_MEMBERSHIP=member', () => {
    vi.stubEnv('VITE_REC_CARD_ARM', 'trending')
    vi.stubEnv('VITE_REC_CARD_MEMBERSHIP', 'member')
    expect(recCardEnvTarget()).toEqual({ variant: 'trending', membership: 'member' })
  })

  it('ignores an unrecognized arm value', () => {
    vi.stubEnv('VITE_REC_CARD_ARM', 'nope')
    expect(recCardEnvTarget()).toBeNull()
  })
})

describe('recCardTestPath — the chrome-free CRE Home path', () => {
  it('pins the arm on the CRE member Home with chrome hidden by default', () => {
    expect(recCardTestPath('compact')).toBe(
      '/dashboard-rebrand?brand=cre&membership=member&ff=home-recommended-card-ab:compact&chrome=off',
    )
  })

  it('supports the non-member arm, still chrome-free', () => {
    const nonMember = recCardTestPath('trending', 'non-member')
    expect(nonMember).toContain('membership=non-member')
    expect(nonMember).toContain('ff=home-recommended-card-ab:trending')
    expect(nonMember).toContain('chrome=off')
  })
})
