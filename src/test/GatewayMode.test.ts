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

  it('hides everything the public build hides, and then more', () => {
    /* ⚠ THE SUBSET RELATION IS THE CLAIM. `isPublicGateway` is written as
       `!== 'full'` precisely so a new mode inherits the trim; if it ever
       becomes a list of modes and this one is forgotten, a participant sees
       the Design section. */
    vi.stubEnv('VITE_GATEWAY_MODE', 'testing')
    expect(isPublicGateway()).toBe(true)
    expect(isTestingGateway()).toBe(true)
    vi.unstubAllEnvs()
  })

  it('leaves the public and full builds exactly as they were', () => {
    vi.stubEnv('VITE_GATEWAY_MODE', 'public')
    expect(isPublicGateway()).toBe(true)
    expect(isTestingGateway()).toBe(false)
    vi.unstubAllEnvs()

    vi.stubEnv('VITE_GATEWAY_MODE', 'full')
    expect(isPublicGateway()).toBe(false)
    expect(isTestingGateway()).toBe(false)
    vi.unstubAllEnvs()
  })

  it('404s the standalone prototypes at the edge, like the public build', () => {
    /* `public/prototypes/` are static files; no client-side gate can hide a
       file the CDN serves on request. The postbuild writes `_redirects` for
       both trimmed modes — asserted by reading the script, because running a
       real build here would cost more than the claim is worth. */
    const script = readFileSync('scripts/public-redirects.mjs', 'utf8')
    expect(script).toMatch(/TRIMMED[^\n]*=[^\n]*new Set\(\[[^\]]*'testing'/)
  })
})
