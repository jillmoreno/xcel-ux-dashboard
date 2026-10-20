import { describe, expect, it } from 'vitest'
import { defaultDiscoverabilityVersionFor, DISCOVERABILITY_DASHBOARD_VERSIONS } from '@/data/dashboardVersions'
import { END_TO_END_VERSION } from '@/pages/endToEndDemo'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'

/**
 * DOES THE DEFAULT ACTUALLY REACH THE FINAL PROTOTYPE? — 2026-10-20, Jillienne:
 * "make sure its going to be reflected on the final prototype".
 *
 * ⚠ IT DID NOT, AND NOTHING WOULD HAVE SAID SO. Setting the brand default to
 * `jill-atlas-main` moved every Prototypes row that carries no `?version=` —
 * but the FIRST row, the one headed "Final prototype — source of truth", opens
 * the end-to-end walk, and `EndToEndPageSync` appends `END_TO_END_VERSION` to
 * the URL. That constant was still `eric-atlas-e2e`. So the row claiming to be
 * what the product is right now showed a version the default had left behind,
 * while the rows beneath it showed the new one.
 *
 * ⚠ AND IT FAILS SILENTLY. Both ids resolve, both render an Atlas Home, and
 * the difference on the day was Step 2 and the pace card — nothing that reads
 * as "this page is stale". A pin is the only thing that catches it.
 */
describe('the brand default', () => {
  const DEFAULT_ID = defaultDiscoverabilityVersionFor('xcel')

  it('is the version the end-to-end walk pins', () => {
    expect(END_TO_END_VERSION).toBe(DEFAULT_ID)
  })

  it('is a version that still exists and is still pickable', () => {
    /* A default pointing at an archived id would render it (archiving keeps
       the branch) while being unreachable from the picker — so a reviewer who
       switched away could not switch back. */
    expect(DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id)).toContain(DEFAULT_ID)
  })

  /* ⚠ THE ROWS THAT CARRY NO VERSION ARE THE POINT OF THE DEFAULT. If one ever
     grows a `?version=`, it stops tracking `main`'s default and goes stale the
     same silent way the walk did — the Prototypes rule is that every row is
     `main`'s build, not a pinned one. */
  it('…and no Prototypes row pins a version of its own', () => {
    /* `to` is the row's own destination; `livePreviewUrl` is the one the
       Prototypes card opens. Neither may name a version. */
    const pinned = PROTOTYPE_FEATURES.filter((f) =>
      [f.to, f.livePreviewUrl].some((u) => typeof u === 'string' && u.includes('version=')),
    ).map((f) => f.id)
    expect(pinned).toEqual([])
  })
})
