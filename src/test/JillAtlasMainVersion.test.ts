import { describe, expect, it } from 'vitest'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  DISCOVERABILITY_DASHBOARD_VERSION_JILL_ATLAS_MAIN,
  isAtlasCompassNavVersion,
  isE2ELikeVersion,
  isEricAtlasWhiteLike,
  isQualifyingEducationVersion,
} from '@/data/dashboardVersions'
import { designControlsFor } from '@/context/FeatureFlagContext'
import { ATLAS_HEADER_V2_VERSIONS } from '@/components/layout/atlasHeaderV2'

/**
 * JILL/ATLAS-MAIN IS THE END-TO-END DEMO EVERYWHERE BUT ITS HOME — 2026-10-20,
 * Jillienne: "an exact copy of what the atlas home is looking like on Main so I
 * can implement these changes to that version to explore first".
 *
 * ⚠ "EXACT COPY" IS THE THING THAT DECAYS, which is why it is pinned rather
 * than described. The e2e id is compared against in thirty-odd places —
 * twenty-six design-control `versions` arrays, the header list, the shell's My
 * Courses row, the course override, and the two family helpers. A duplicate
 * that enumerated its own id in each would be exact for one day; the next
 * control scoped to the demo would reach the demo and not the copy, and the two
 * would drift with nothing on screen to say so.
 *
 * So the copy joins the FAMILY and keeps only its Home file. These cases are
 * the ones that would have caught the two that were missed on the first pass:
 * the design bar opened EMPTY, and the page resolved New York under a Home
 * built for Florida.
 */
describe('Jill/Atlas-Main, the End-to-End Demo’s duplicate', () => {
  const ID = DISCOVERABILITY_DASHBOARD_VERSION_JILL_ATLAS_MAIN.id

  it('is Jillienne’s, and is on the picker', () => {
    expect(DISCOVERABILITY_DASHBOARD_VERSION_JILL_ATLAS_MAIN.owner).toBe('jill')
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)).toContain(ID)
  })

  /* Each of these is a different thing the demo gets and a copy must get too:
     the White chrome, the Atlas rail and palette, the QE journey (so the demo
     bar cannot offer Continuing Ed over a pre-licensing path), and the two-row
     header. A copy failing any one of them is a comparison about chrome. */
  it('joins every family the demo belongs to', () => {
    expect(isE2ELikeVersion(ID)).toBe(true)
    expect(isEricAtlasWhiteLike(ID)).toBe(true)
    expect(isAtlasCompassNavVersion(ID)).toBe(true)
    expect(isQualifyingEducationVersion(ID)).toBe(true)
    expect(ATLAS_HEADER_V2_VERSIONS).toContain(ID)
  })

  /* ⚠ THE EMPTY-BAR CASE. Twenty-six controls name `eric-atlas-e2e` in their
     own `versions`; before `designControlsFor` asked the family, this returned
     almost nothing and the design bar opened blank — the flags still at their
     defaults, so the PAGE looked right and simply could not be adjusted. */
  it('carries the demo’s design controls, every one of them', () => {
    const demo = designControlsFor('eric-atlas-e2e', 'eric').map((f) => f.key)
    const copy = designControlsFor(ID, 'jill').map((f) => f.key)
    /* Home declares no surface, so this is the bar as it opens on it. The
       count is asserted only to keep the comparison from passing on two empty
       lists — the containment below is the real subject. */
    expect(demo.length).toBeGreaterThanOrEqual(8)
    expect(copy).toEqual(expect.arrayContaining(demo))
  })

  /* ⚠ AND ON A DECLARED SURFACE TOO. `designControlsFor` filters by surface
     before it filters by version, and the two rules are independent — a copy
     that inherited the bar on Home only would lose Anjani's Compass controls
     the moment the demo walked into a session, which is one of the pages this
     version reaches. */
  it('…on the Compass surfaces the demo reaches as well', () => {
    for (const surface of ['compass:overview', 'compass:session', 'compass:study-planner']) {
      const demo = designControlsFor('eric-atlas-e2e', 'eric', surface).map((f) => f.key)
      const copy = designControlsFor(ID, 'jill', surface).map((f) => f.key)
      expect(copy, surface).toEqual(expect.arrayContaining(demo))
    }
  })

  /* …and still wins its own name, or an exploration could never scope a
     control to itself alone. */
  it('a control named for the copy alone does not reach the demo', () => {
    expect(isE2ELikeVersion('eric-atlas-e2e')).toBe(true)
    const onlyCopy = { versions: [ID] }
    expect(onlyCopy.versions.includes('eric-atlas-e2e')).toBe(false)
  })
})
