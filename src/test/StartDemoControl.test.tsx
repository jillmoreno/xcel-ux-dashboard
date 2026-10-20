import { describe, expect, it } from 'vitest'
import { START_POINTS, resolveStartPoint, startPointAt } from '@/pages/endToEndDemo'
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

  /* ⚠ SIX BECAME THREE — 2026-10-20, Jillienne: "Lets COmbine Email, invite,
     Checkout, and Confirmation into 1 Invite & Checkout flow."

     The old case pinned the ORDER, because it was the order of the journey
     and the only thing making a six-option dropdown readable at a glance.
     That is the argument for the merge: four of the six WERE one journey,
     listed screen by screen beside two whole surfaces. One option for the
     flow, and the order is three real choices. */
  it('offers the three start points — the flow, then the two surfaces', () => {
    expect(flag?.variants?.map((v) => v.value)).toEqual([
      'invite-checkout',
      'atlas',
      'compass',
    ])
    expect(flag?.variants?.map((v) => v.label)).toEqual([
      'Invite & Checkout',
      'Atlas',
      'Compass',
    ])
  })

  /* ⚠ THE FOUR OLD IDS ARE IN EVERY REVIEWER'S BROWSER. `demo-start-point` is
     stored per browser, and most machines that have opened the demo hold one
     of them. Unresolved, the dropdown ticks nothing, its label falls back to
     "Atlas" while the page sits on the invite, and `START_POINTS[picked]` is
     undefined so the control navigates nowhere — dead on exactly the machines
     that have used it most. */
  it('still understands the four ids it replaced', () => {
    for (const old of ['email', 'invite', 'checkout', 'confirmation']) {
      expect(resolveStartPoint(old), old).toBe('invite-checkout')
    }
    expect(resolveStartPoint('atlas')).toBe('atlas')
    expect(resolveStartPoint('compass')).toBe('compass')
    expect(resolveStartPoint(undefined)).toBe('atlas')
    expect(resolveStartPoint('nonsense')).toBe('atlas')
  })

  /* ⚠ AND IT ANSWERS TO ALL FOUR ROUTES, which is the half that makes the
     control readable during the walk. Arriving on Checkout used to tick
     "Checkout"; now the whole journey reads "Invite & Checkout" instead of
     the control jumping between entries as the learner moves. The routes
     themselves are unchanged and still reachable by URL. */
  it('ticks the flow from anywhere inside it', () => {
    for (const path of [
      '/end-to-end-demo/email',
      '/end-to-end-demo',
      '/end-to-end-demo/checkout',
      '/end-to-end-demo/confirmation',
    ]) {
      expect(startPointAt(path, null), path).toBe('invite-checkout')
    }
    expect(startPointAt('/dashboard-rebrand', null)).toBe('atlas')
    expect(startPointAt('/dashboard-rebrand', 'compass')).toBe('compass')
    /* Still quiet on a page it does not name. */
    expect(startPointAt('/dashboard-rebrand', 'certificates')).toBeNull()
  })

  it('opens the flow at its first screen, the email', () => {
    expect(START_POINTS['invite-checkout'].pathname).toBe('/end-to-end-demo/email')
  })

  it('defaults to Atlas — the route a bare /dashboard-rebrand already is', () => {
    // A default that disagreed with the route it loads on would make every
    // plain load look like a pick the reviewer did not make.
    expect(flag?.defaultVariant).toBe('atlas')
    expect(flag?.defaultEnabled).toBe(true)
  })

  it('the demo bar renders on the pages Start can send you to', () => {
    expect(isDemoControlsEnabled('/dashboard-rebrand')).toBe(true)
    /* ⚠ THE EMAIL PAGE TOO (2026-10-19) — and this is the case the note at
       the top of this file is about. A new Start option whose page did not
       carry the bar would make the control one-way: it would send you there
       and then vanish, with nothing else failing. */
    expect(isDemoControlsEnabled('/end-to-end-demo/email')).toBe(true)
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
