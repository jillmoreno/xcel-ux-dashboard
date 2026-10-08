import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'
import { useCourseChrome } from '@/components/learning/courseTakeover'

/**
 * THE COURSE CONTENT'S TWO VERSIONS — `compass-session-chrome`, 2026-10-08, the
 * direct ask: "2 versions of the course content, one that takes over the whole
 * screen, and another one that actually is below the global header."
 *
 * ⚠ WHAT THESE PIN IS THE CHROME STORE, NOT THE HEADER. `<Header />` lives in
 * `AppLayout`, above the outlet; the session renders deep inside
 * `PlatformShell`. There is no prop path between them — `courseTakeover` is a
 * store precisely because the two cannot see each other — so the honest
 * assertion is the value the session WRITES, which is the whole of its side of
 * the contract. The header reading it is pinned where the header is tested.
 *
 * ⚠ AND THE CLEANUP MATTERS AS MUCH AS THE SET. The store is live UI state,
 * never persisted; a session that unmounted without putting it back to `none`
 * would strand the next page headerless with nothing on screen to explain it.
 *
 * ⚠ READ THROUGH THE HOOK, via a probe mounted beside the session, rather than
 * by exporting a getter. `courseTakeover` deliberately exposes a setter and a
 * hook and nothing else; adding a getter so a test could skip the subscription
 * would widen the module's surface for test convenience and stop exercising the
 * path the header actually uses.
 */

/** Renders the store's current value so a test can read it off the DOM. */
function ChromeProbe() {
  return <span data-chrome={useCourseChrome()} />
}

const chromeNow = () =>
  document.querySelector('[data-chrome]')?.getAttribute('data-chrome') ?? null

function renderSession(ff?: string) {
  window.history.replaceState({}, '', ff ? `/dashboard-rebrand?ff=${ff}` : '/dashboard-rebrand')
  return render(
    <MemoryRouter initialEntries={[ff ? `/dashboard-rebrand?ff=${ff}` : '/dashboard-rebrand']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <ChromeProbe />
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('compass-session-chrome', () => {
  it('takes the whole frame by default', () => {
    /* ⚠ THE DEFAULT IS WHAT SHIPS, so the flag changes nothing until someone
       picks. A branch that defaulted to the new arm would move a live surface
       for every reviewer who never opened the design bar. */
    const { unmount } = renderSession()
    expect(chromeNow()).toBe('takeover')
    unmount()
    expect(chromeNow()).toBeNull()
  })

  it('keeps the global header on the in-shell arm', () => {
    /* `course`, not a fourth chrome state — `courseTakeover` has carried this
       arm since 2026-09-23 for Option 1's player, and it is the one that keeps
       the header with a thicker bottom stroke. */
    const { unmount } = renderSession('compass-session-chrome:in-shell')
    expect(chromeNow()).toBe('course')
    unmount()
    expect(chromeNow()).toBeNull()
  })

  it('⚠ falls back to full screen on an unknown arm', () => {
    /* A stale stored value or a hand-edited link must not leave a reviewer in a
       shape nobody chose. The component reads `=== 'in-shell'`, so anything
       else is the shipped arm. */
    renderSession('compass-session-chrome:nonsense')
    expect(chromeNow()).toBe('takeover')
  })

  it('is a DESIGN control, scoped, and defaults to the shipped arm', () => {
    /* ⚠ `surface: 'design'` keeps it off the stakeholders' bar — it is an open
       question inside one exploration, not a product axis. The scope says whose
       BAR shows it; the arm applies wherever the session renders. */
    const f = FEATURE_FLAGS.find((x) => x.key === 'compass-session-chrome')!
    expect(f.surface).toBe('design')
    expect(f.versions).toContain('hybrid-pacing')
    expect(f.defaultVariant).toBe('full-screen')
    expect(f.variants?.map((v) => v.value)).toEqual(['full-screen', 'in-shell'])
  })
})
