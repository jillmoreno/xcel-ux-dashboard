import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { isDemoControlsEnabled } from '@/components/prototype/demoControlsUtil'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'

/**
 * START — WHERE THE DEMO OPENS (2026-10-16). Replaced Eric's `atlas-e2e-page`
 * design control: same idea, every version, on the amber bar.
 *
 * ⚠ THE BAR'S SCOPE IS HALF THE FEATURE, and it is the half that is easy to
 * revert by accident. Three of the five options are pages under
 * `/end-to-end-demo`, and the demo bar rendered ONLY on `/dashboard-rebrand`
 * until this change — so on the old scope the control vanished the moment it
 * was used, because the bar carrying it did not render where it had just sent
 * you. The scope case below is therefore not a detail: narrow it again and
 * Start becomes one-way, with nothing failing except this.
 */
describe('the Start demo control', () => {
  const flag = FEATURE_FLAGS.find((f) => f.key === 'demo-start-point')

  it('is a DEMO control — no design surface, no owner, no version list', () => {
    expect(flag, 'demo-start-point is missing from the catalog').toBeDefined()
    // These three are what made the old control one person's, on one version.
    expect(flag?.surface, 'a design surface would put it on the cyan bar').toBeUndefined()
    expect(flag?.owner, 'an owner scopes it to one designer’s tab').toBeUndefined()
    expect(flag?.versions, 'a version list is what "available for all" rules out').toBeUndefined()
  })

  it('offers the five start points, in journey order', () => {
    expect(flag?.variants?.map((v) => v.value)).toEqual([
      'invite',
      'checkout',
      'confirmation',
      'atlas',
      'compass',
    ])
    expect(flag?.variants?.map((v) => v.label)).toEqual([
      'Invite',
      'Checkout',
      'Confirmation',
      'Atlas',
      'Compass',
    ])
  })

  it('defaults to Atlas — the route a bare /dashboard-rebrand already is', () => {
    // A default that disagreed with the route it loads on would make every
    // plain load look like a pick the reviewer did not make.
    expect(flag?.defaultVariant).toBe('atlas')
    expect(flag?.defaultEnabled).toBe(true)
  })

  it('the demo bar renders on the pages Start can send you to', () => {
    expect(isDemoControlsEnabled('/dashboard-rebrand')).toBe(true)
    expect(isDemoControlsEnabled('/end-to-end-demo')).toBe(true)
    expect(isDemoControlsEnabled('/end-to-end-demo/checkout')).toBe(true)
    expect(isDemoControlsEnabled('/end-to-end-demo/confirmation')).toBe(true)
    // …and nowhere else: the gateway must never grow a demo bar.
    expect(isDemoControlsEnabled('/')).toBe(false)
    expect(isDemoControlsEnabled('/links')).toBe(false)
  })

  it('the control it replaced is archived, not just deleted', () => {
    const row = ARCHIVED_ITEMS.find((i) => i.id === 'atlas-e2e-page-control')
    expect(row, 'the archive convention: unwire and record, never delete outright').toBeDefined()
    expect(row?.flag).toContain('atlas-e2e-page')
    // The restoreNote must name what restoring it does NOT undo — the trap
    // that convention exists to close.
    expect(row?.restoreNote).toContain('DELIBERATELY NOT RESTORED')
    expect(row?.restoreNote).toContain('isDemoControlsEnabled')
  })

  it('no flag named atlas-e2e-page is left in the catalog', () => {
    // Both present would be two controls for one decision, disagreeing.
    expect(FEATURE_FLAGS.find((f) => f.key === 'atlas-e2e-page')).toBeUndefined()
  })
})
