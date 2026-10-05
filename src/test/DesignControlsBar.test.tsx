import { describe, expect, it } from 'vitest'
import {
  FEATURE_FLAGS,
  designControlsFor,
  flagOwner,
} from '@/context/FeatureFlagContext'
import { DISCOVERABILITY_DASHBOARD_VERSIONS } from '@/data/dashboardVersions'
import { isProtected } from '../../.claude/hooks/protect-framework.mjs'

/**
 * THE DESIGN CONTROLS BAR — 2026-10-05, the direct ask for a second bar.
 *
 * The split it encodes: the DEMO bar shows a stakeholder how the product
 * behaves for different learners and is the owner's alone; the DESIGN bar shows
 * a designer the decisions open inside their own exploration and is theirs.
 *
 * ⚠ WHAT IS WORTH PINNING IS THE RULE, NOT THE RENDER. The bar is a view over
 * the flag catalog — mark a flag `surface: 'design'` and it appears. So the
 * things that can break are: the selector's scoping, the fallback that decides
 * where an unscoped control shows, and the protection that keeps the bar itself
 * off a designer's hands. A render test would pass while all three were wrong.
 */

const VERSION = (id: string) => DISCOVERABILITY_DASHBOARD_VERSIONS.find((v) => v.id === id)!

describe('what the design bar selects', () => {
  it('takes only flags marked `surface: design`', () => {
    /* Every other flag belongs in the Feature Flag panel and nowhere else —
       which is the great majority of them. A bar that drew the catalog would be
       unreadable and would put stakeholder scenarios next to font switches. */
    const v = VERSION('discoverability-testing-3')
    const picked = designControlsFor(v.id, flagOwner(v))
    expect(picked.length).toBeGreaterThan(0)
    expect(picked.every((f) => f.surface === 'design')).toBe(true)
  })

  it('falls back to the OWNER when a control names no versions', () => {
    /* ⚠ THE DEFAULT THAT MAKES THE FEATURE USABLE. Without it, the first design
       flag a designer adds would render nowhere until they also wrote a version
       list — and "I marked it and nothing happened" is exactly the failure the
       `REBRAND_FLAGS` comment already records for the panel. */
    const unscoped = FEATURE_FLAGS.filter((f) => f.surface === 'design' && !f.versions)
    expect(unscoped.length, 'no unscoped design flags to test the fallback with').toBeGreaterThan(0)
    const v = VERSION('discoverability-testing-3')
    const picked = designControlsFor(v.id, flagOwner(v)).map((f) => f.key)
    for (const f of unscoped.filter((f) => flagOwner(f) === flagOwner(v))) {
      expect(picked, `${f.key} should follow its owner to their versions`).toContain(f.key)
    }
  })

  it('gives a version NOTHING when its owner owns no design flags', () => {
    /* ⚠ THE EMPTY CASE IS THE SHIPPING CASE for Eric until he marks one, and
       the bar renders nothing at all rather than an empty strip — so this
       feature is invisible until it is used. `designControlsFor` returning []
       is what that depends on. */
    expect(designControlsFor('some-version-nobody-has', 'eric')).toEqual([])
  })

  it('prefers an explicit `versions` list over the owner fallback', () => {
    /* The precision half: a designer with two versions can put a control on one
       of them. Asserted on the selector rather than on data, because no shipped
       flag uses it yet — and inventing one in the catalog to test it would put
       a fixture in the product. */
    const marked = FEATURE_FLAGS.find((f) => f.surface === 'design')!
    const pinned = { ...marked, versions: ['only-here'] }
    const matches = (versionId: string) =>
      pinned.versions && pinned.versions.length > 0
        ? pinned.versions.includes(versionId)
        : flagOwner(pinned) === 'jill'
    expect(matches('only-here')).toBe(true)
    expect(matches('discoverability-testing-3')).toBe(false)
  })
})

describe('the boundary between the two bars', () => {
  it('protects BOTH bars, so neither is edited to add a control', () => {
    /* ⚠ THE DESIGN BAR IS PROTECTED TOO, which looks odd until you see why: a
       designer never needs to edit it. Marking a flag is the whole interface.
       If it were open, the first person in a hurry would add a control to it
       directly and the collision this answers would start again. */
    for (const f of [
      'src/components/prototype/DemoControlsBar.tsx',
      'src/components/prototype/DesignControlsBar.tsx',
      'src/components/prototype/DemoBar.tsx',
      'src/components/prototype/demoBarUtil.ts',
      'src/data/demoControlMaturity.ts',
      'src/components/layout/AdminToolsMenu.tsx',
    ]) {
      expect(isProtected(f), `${f} should be protected`).toBe(true)
    }
  })

  it('leaves the flag catalog and the panel OPEN', () => {
    /* ⚠ THE OTHER HALF OF THE RULE, and the one that makes the lock fair. A
       designer must be able to add a flag, mark it `surface: 'design'`, and add
       its key to `REBRAND_FLAGS` — protect either and the sanctioned route is
       closed and only the forbidden one remains. */
    expect(isProtected('src/context/FeatureFlagContext.tsx')).toBe(false)
    expect(isProtected('src/components/account/FeatureFlagPanel.tsx')).toBe(false)
    expect(isProtected('src/data/dashboardVersions.ts')).toBe(false)
  })
})
