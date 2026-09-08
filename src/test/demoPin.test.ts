import { describe, it, expect } from 'vitest'
import { parseDemoTarget } from '@/data/demoPin'

describe('parseDemoTarget — VITE_DEMO_TARGET → in-app redirect path', () => {
  it('keeps a bare in-app path (+ query) as-is', () => {
    const path = '/dashboard-rebrand?brand=cre&membership=member&tier=low&prog=progress-at-risk&present=1'
    expect(parseDemoTarget(path)).toBe(path)
  })

  it('strips the origin from a full Share Demo URL (paste the whole link)', () => {
    expect(
      parseDemoTarget(
        'https://ux-lms-dashboard.netlify.app/dashboard-rebrand?brand=cre&present=1',
      ),
    ).toBe('/dashboard-rebrand?brand=cre&present=1')
  })

  it('trims surrounding whitespace', () => {
    expect(parseDemoTarget('  /dashboard-rebrand?present=1  ')).toBe(
      '/dashboard-rebrand?present=1',
    )
  })

  it('returns null when unset / empty / non-string', () => {
    expect(parseDemoTarget(undefined)).toBeNull()
    expect(parseDemoTarget('')).toBeNull()
    expect(parseDemoTarget('   ')).toBeNull()
    expect(parseDemoTarget(42)).toBeNull()
  })

  it('rejects off-site + non-absolute values (open-redirect guard)', () => {
    expect(parseDemoTarget('//evil.example.com/x')).toBeNull() // protocol-less host
    expect(parseDemoTarget('dashboard-rebrand?present=1')).toBeNull() // not app-absolute
    expect(parseDemoTarget('ftp://nope')).toBeNull()
  })
})
