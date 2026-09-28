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
     comment; the other two are the same case. */
  'dashboard-progress-state',
  'dashboard-education-type',
  'dashboard-navigation',
  'readiness-state',

  /* ⚠ THESE FOUR PREDATE THIS TEST AND ARE UNREVIEWED. They are listed to pin
     the CURRENT state, not to bless it — each is on the rebrand page, absent
     from the panel, and has no demo-bar control that I could find. If one of
     them turns out to be an oversight like the seven above, the fix is to add
     it to `REBRAND_FLAGS` and delete the line here. */
  'study-pace-widget',
  'dashboard-journey-complete',
  'header-notifications',
  'notification-state',
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
