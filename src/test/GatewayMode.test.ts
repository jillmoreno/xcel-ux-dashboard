import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import {
  isPublicGateway,
  isTestingGateway,
  parseGatewayMode,
} from '@/data/gatewayMode'

describe('the user-test gateway — VITE_GATEWAY_MODE=testing', () => {
  /*
   * 2026-09-23, the direct ask: "i don't want the testers to see the ux
   * dashboard, just the link to this specific testing instance."
   *
   * ⚠ `public` WAS NOT ENOUGH, which is the whole reason this mode exists. The
   * public build TRIMS the project list and still serves it at `/`: a
   * stakeholder is meant to browse. A participant is not — they are handed one
   * link to one screen, and a project list, even a trimmed one behind a
   * password they were given, tells them they are inside a prototype gallery
   * belonging to a design team. That reframes everything they then say about
   * the product.
   */
  it('parses, and still fails towards the full app', () => {
    expect(parseGatewayMode('testing')).toBe('testing')
    expect(parseGatewayMode('  TESTING ')).toBe('testing')
    /* The direction `parseGatewayMode` has always failed in: a typo shows the
       maintainer everything rather than silently hiding it. A third value must
       not change that. */
    expect(parseGatewayMode('testng')).toBe('full')
    expect(parseGatewayMode(undefined)).toBe('full')
    expect(parseGatewayMode('')).toBe('full')
  })

  it('is the one trimmed build — `isPublicGateway` answers true here alone', () => {
    /* The public build is retired (2026-10-15); `isPublicGateway` keeps its
       name for its twenty call sites and now means exactly "the testing
       build". If a second trimmed mode ever returns, it goes in here too. */
    vi.stubEnv('VITE_GATEWAY_MODE', 'testing')
    expect(isPublicGateway()).toBe(true)
    expect(isTestingGateway()).toBe(true)
    vi.unstubAllEnvs()
  })

  it('reads a leftover `public` as the full build — that site is retired (2026-10-15)', () => {
    vi.stubEnv('VITE_GATEWAY_MODE', 'public')
    expect(isPublicGateway()).toBe(false)
    expect(isTestingGateway()).toBe(false)
    vi.unstubAllEnvs()

    vi.stubEnv('VITE_GATEWAY_MODE', 'full')
    expect(isPublicGateway()).toBe(false)
    expect(isTestingGateway()).toBe(false)
    vi.unstubAllEnvs()
  })

  it('404s the standalone prototypes at the edge', () => {
    /* `public/prototypes/` are static files; no client-side gate can hide a
       file the CDN serves on request. The postbuild writes `_redirects` for
       both trimmed modes — asserted by reading the script, because running a
       real build here would cost more than the claim is worth. */
    const script = readFileSync('scripts/public-redirects.mjs', 'utf8')
    expect(script).toMatch(/TRIMMED[^\n]*=[^\n]*new Set\(\[[^\]]*'testing'/)
  })
})
