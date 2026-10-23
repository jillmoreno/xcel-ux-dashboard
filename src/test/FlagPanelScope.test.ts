import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { flagScopeForPath } from '@/components/account/FeatureFlagPanel'

/**
 * A FLAG NEEDS TWO THINGS TO BE REACHABLE, AND SETTING ONE IS SILENT.
 *
 * `page: 'dashboard-rebrand'` on the flag decides which page CARD it counts
 * under. `REBRAND_FLAGS` in `FeatureFlagPanel` decides what the panel RENDERS
 * on that route. Set `page` alone and the flag exists, type-checks, counts,
 * works via `?ff=` — and never appears where anyone would look for it. No
 * error, no failing test, nothing to notice.
 *
 * ⚠ THAT IS NOT HYPOTHETICAL. Seven flags shipped that way between 2026-09-24
 * and 2026-09-28 and were demoed by hand-editing URLs for four days, because
 * nobody thought to open the panel. This is the test that would have caught the
 * first one.
 */

const REBRAND = '/dashboard-rebrand'

/**
 * Flags deliberately kept OUT of the rebrand panel.
 *
 * ⚠ ADDING TO THIS LIST IS A DECISION, not a way to make the test pass. The
 * question to answer first is "where else can someone reach this?" — if the
 * answer is "nowhere", the flag belongs in the panel.
 */
const INTENTIONALLY_OUT_OF_PANEL = new Set([
  /* Exposed as dedicated dropdowns on the always-visible Demo Controls bar, so
     a panel row would be a redundant and worse copy of a control already on
     screen. `REBRAND_FLAGS` carries this reasoning for the first two in its own
     comment; the third is the same case. */
  'dashboard-progress-state',
  'dashboard-education-type',
  /* `dashboard-navigation` was the fourth. Archived 2026-10-01 with its
     dropdown; a key that is not in the catalog cannot be out of the panel. */
  'readiness-state',
  /* THE COURSE DROPDOWN — 2026-10-15. Same reason as the three above, and it
     carries BOTH its axes on the bar: the course, and the Regulated /
     Unregulated sequencing nested under it. */
  'dashboard-course-state',
  /* THE ACCESS-WINDOW DROPDOWN — 2026-10-15, "Expires". Its own pill on the
     same bar; eight rows is too many to nest under Course. */
  'dashboard-course-expiry',
  /* THE INVITE FLOW'S VERSION — 2026-10-22. Reached from the Invite Flow
     Versions picker, which the demo bar's version control opens on the four
     `/end-to-end-demo` routes. It is out of the panel for the reason the
     DASHBOARD Version row was taken out of it on 2026-10-05: a version gets ONE
     route to it, and a panel row beside a picker is the same destination twice,
     with the row being the worse of the two (a segmented control of bare "V1 /
     V2" against cards that say what each version IS and when it changed).

     ⚠ WHAT IT COSTS, so it is a decision rather than a discovery: unlike the
     dropdowns above, this control is NOT on the bar everywhere — it only
     replaces the dashboard picker on the invite routes. So from
     `/dashboard-rebrand` there is no way to change the invite version before
     walking into the flow. That is survivable because the picker navigates to
     the flow's first screen when you pick, so the natural order (go to the
     flow, then switch) works — and if it turns out to be wrong, the fix is a
     panel row here, not a second button on the bar. */
  'invite-flow-version',

  /* ⚠ REVIEWED AND EMPTIED, 2026-09-28. Four flags sat here as "unreviewed"
     for one commit — `study-pace-widget`, `dashboard-journey-complete`,
     `header-notifications`, `notification-state`. Git history settled it: none
     had ever been in `REBRAND_FLAGS`, so they were never deliberate exclusions,
     just older instances of the same miss. All four are in the panel now.

     The list is deliberately left holding ONLY the four with a real reason.
     A long exemption list is how this test stops meaning anything. */
])

describe('the rebrand flag panel', () => {
  const scope = flagScopeForPath(REBRAND)

  it('is scoped at all', () => {
    /* An unscoped route shows every flag, which would make the rest of this
       file vacuous. */
    expect(scope).not.toBeNull()
    expect(scope!.length).toBeGreaterThan(10)
  })

  it('renders every flag that claims the rebrand page', () => {
    /* ⚠ THE ONE THAT BITES. A flag whose `page` says dashboard-rebrand is
       claiming to be a rebrand flag; if the panel does not render it, it is
       reachable only by hand-editing a URL. */
    const claimed = FEATURE_FLAGS.filter(
      (f) => f.page === 'dashboard-rebrand' || f.extraPages?.includes('dashboard-rebrand'),
    ).map((f) => f.key)
    expect(claimed.length).toBeGreaterThan(20)

    const missing = claimed.filter(
      (k) => !scope!.includes(k) && !INTENTIONALLY_OUT_OF_PANEL.has(k),
    )
    expect(
      missing,
      `These flags say page: 'dashboard-rebrand' but the panel does not render them on that route, ` +
        `so the only way to reach them is hand-editing ?ff= :\n  ${missing.join('\n  ')}\n\n` +
        `Add them to REBRAND_FLAGS in FeatureFlagPanel.tsx — or, if they are deliberately ` +
        `reachable elsewhere, to INTENTIONALLY_OUT_OF_PANEL here WITH the reason.`,
    ).toEqual([])
  })

  it('has no scope entry for a flag that does not exist', () => {
    /* The other direction: a renamed or archived flag leaves a dead key in the
       scope, which renders nothing and is invisible until someone greps. */
    const keys = new Set(FEATURE_FLAGS.map((f) => f.key))
    const dead = scope!.filter((k) => !keys.has(k))
    expect(dead, `REBRAND_FLAGS names flags that are not in the catalog: ${dead.join(', ')}`).toEqual(
      [],
    )
  })

  it('keeps the exemption list honest', () => {
    /* An exemption for a flag that IS in the panel, or that no longer exists,
       is stale reasoning someone will later trust. */
    const keys = new Set(FEATURE_FLAGS.map((f) => f.key))
    for (const k of INTENTIONALLY_OUT_OF_PANEL) {
      expect(keys.has(k), `${k} is exempted but no longer in the catalog`).toBe(true)
      expect(scope!.includes(k), `${k} is exempted but IS in the panel — drop the exemption`).toBe(
        false,
      )
    }
  })
})
