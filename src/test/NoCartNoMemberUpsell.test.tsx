import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, supportsMembership } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'

/**
 * NO CART, NO MEMBER UPSELLS — 2026-09-21, the direct ask.
 *
 * Two removals with DIFFERENT mechanisms, which is the whole point of this
 * file:
 *
 *   - the membership upsells are a CORRECTNESS fix behind `supportsMembership`,
 *     so they return on their own for a brand that sells one, and get NO
 *     archive row;
 *   - the cart is EDITORIAL, so it is unwired + archived.
 *
 * The upsell assertions all seed `tier: 'non-member'` deliberately. That is the
 * state that produced the bug — `supportsMembership`'s own note calls it
 * "SUPPRESS, NEVER DOWNGRADE" and lists four surfaces it breaks — and a test
 * seeding `high` would pass on the `access === 'full'` guard that was already
 * there, i.e. for the wrong reason.
 */

/** Source with comments removed — a note explaining a removal names the thing
 *  it removed, so a naive source match reads its own tombstone as the bug. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function seed(tier: string, flags: Record<string, unknown> = {}) {
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier }))
  window.localStorage.setItem('cgp.featureFlags', JSON.stringify(flags))
}

function renderShell(url = '/dashboard-rebrand') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <LearningPathsPanelProvider>
            <JumpBackInPanelProvider>
              <PlatformShell />
            </JumpBackInPanelProvider>
          </LearningPathsPanelProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('the header carries no cart', () => {
  /*
   * ASSERTED AT SOURCE, deliberately — and the first version of this file got
   * it wrong in the way worth recording.
   *
   * It rendered `PlatformShell` and asserted `queryByLabelText('Cart')` was
   * null. That PASSED before the change was even made, because `PlatformShell`
   * does not render the Header at all — `AppLayout` does, above the
   * `<Outlet/>`. So the assertion was measuring a component that was never in
   * the tree: the exact "passes just as happily for an unrelated reason" trap
   * CLAUDE.md records for presence checks, hit from the absence side.
   *
   * THE DOM PROOF LIVES IN `Header.test.tsx`, which already mounts the real
   * Header under its seven providers: its cart assertion was INVERTED rather
   * than deleted, the same treatment the Membership link beside it gets. What
   * is left here is the ARCHIVE-CONVENTION half — no call site, component
   * kept and exported, neighbours intact — which is a source question rather
   * than a rendered one. The `HeaderAccountMenu.test.tsx` /
   * `ALLOWED_PROTOCOLS` pattern; verified to fail by re-adding the call site.
   */
  // A PLAIN RELATIVE PATH, like the two sibling reads in
  // `HeaderAccountMenu.test.tsx` — NOT `new URL(…, import.meta.url)`. Under the
  // jsdom environment that `URL` is jsdom's, and Node's `readFileSync` rejects
  // it ("must be of scheme file"), which fails the whole file at collection.
  // CLAUDE.md records the same trap taking out `UxDashboard.smoke.test.tsx`.
  const HEADER_SRC = stripComments(readFileSync('src/components/layout/Header.tsx', 'utf8'))

  it('has no `<CartButton />` call site', () => {
    expect(HEADER_SRC).not.toMatch(/<CartButton\s*\/>/)
  })

  it('keeps the component in the repo, exported, per the archive convention', () => {
    // Unwired, not deleted — and EXPORTED, because an unreferenced local
    // function is a lint error (the `NavProfileHeader` precedent). Bringing it
    // back must be a re-wire, never a rebuild.
    expect(HEADER_SRC).toMatch(/export function CartButton\(/)
  })

  it('keeps the rest of the utilities cluster', () => {
    // Guards the removal from over-reaching: the bell and the account menu are
    // the two controls that were meant to stay.
    expect(HEADER_SRC).toMatch(/<NotificationsMenu \/>/)
    expect(HEADER_SRC).toMatch(/<AccountMenu \/>/)
  })
})

describe('no membership upsell reaches XCEL', () => {
  it('renders no upsell band, even at the non-member tier', () => {
    seed('non-member')
    renderShell()
    // The band's own title. It rendered "Unlock Membership Benefits. Starting
    // at  / year" — with NOTHING between "at" and "/", because XCEL's price
    // fixture is deliberately blank.
    expect(screen.queryByText(/Unlock Membership Benefits/)).toBeNull()
    expect(document.body.textContent).not.toMatch(/Starting at\s+\/\s*year/)
  })

  it('prints no "Member Exclusive" with the Career Tools flag ON', () => {
    // The bug the flag audit recorded and left. It is default-off, so the flag
    // has to be seeded ON — a test rendering the default would pass while the
    // defect sat one toggle away.
    seed('non-member', { 'dashboard-career-tools': { enabled: true } })
    renderShell()
    expect(screen.queryByText('Member Exclusive')).toBeNull()
    expect(document.body.textContent).not.toMatch(/included with membership/i)
  })

  it('offers no membership CTA anywhere on the overview', () => {
    seed('non-member', { 'dashboard-career-tools': { enabled: true } })
    renderShell()
    expect(screen.queryByRole('button', { name: /Explore Membership|Upgrade Membership/ })).toBeNull()
  })

  it('is suppressed by the BRAND predicate, not by this learner’s tier', () => {
    // The root cause this predicate keeps catching: XCEL's only tier is `high`,
    // so every `isMember` / tier-keyed check passes for it. The question that
    // has to be asked first is whether the brand sells a membership at all.
    expect(supportsMembership('xcel')).toBe(false)
  })
})

describe('the archive convention is followed per removal', () => {
  it('archives the cart, and only the cart', () => {
    const ids = ARCHIVED_ITEMS.map((a) => a.id)
    expect(ids).toContain('header-cart')
    // The upsells must NOT have a row: they are gated, not archived, and a row
    // would tell the next person to re-add something the brand predicate is
    // deliberately withholding — the same call the Membership Plan card made.
    expect(ids.some((id) => /upsell|career-tools/.test(id))).toBe(false)
  })

  it('gives the cart a restore note that names the call site', () => {
    // `restoreNote` is the field the convention says is most often written too
    // thinly — it has to name the file and the call site, not just the idea.
    const row = ARCHIVED_ITEMS.find((a) => a.id === 'header-cart')!
    expect(row.location).toMatch(/Header\.tsx/)
    expect(row.restoreNote).toMatch(/utilities/)
    // And what was deliberately NOT restored — the dead `to="#"`.
    expect(row.restoreNote).toMatch(/to="#"|href/)
  })
})
