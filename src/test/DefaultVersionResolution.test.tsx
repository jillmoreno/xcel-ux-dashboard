import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearningPathsPanelProvider } from '@/components/learning/LearningPathsPanelContext'
import { JumpBackInPanelProvider } from '@/components/dashboard/JumpBackInPanelContext'
import { PlatformShell } from '@/components/layout/PlatformShell'
import {
  DISCOVERABILITY_DASHBOARD_VERSIONS,
  defaultDiscoverabilityVersionFor,
  resolveDashboardVersion,
} from '@/data/dashboardVersions'

/**
 * A BARE URL RENDERS ONE VERSION — 2026-10-06, after a promotion shipped a
 * screen made of two.
 *
 * WHAT HAPPENED. `isAtlasCompassNavVersion` and `isHybridV1Version` were read at
 * twelve call sites and eleven of them passed `params.get('version')` RAW, with
 * no fallback to `defaultDiscoverabilityVersionFor`. That was invisible for as
 * long as it was wrong, because every default the product had ever had — QE
 * Focused, Testing, Testing 3 — sits OUTSIDE the Atlas family, so
 * `predicate(null)` and `predicate(theDefault)` both answered false and the raw
 * reads were right by coincidence.
 *
 * Hybrid V1 became the default and broke all eleven at once. A fresh
 * `/dashboard-rebrand?demo=1` drew the Atlas top nav (the one site that
 * resolved) over Testing 3's combined course card (the eleven that did not),
 * with the journey showing the old stop titles. Neither version — a blend.
 *
 * ⚠ AND 1630 TESTS WERE GREEN THROUGH ALL OF IT, which is the reason this file
 * exists rather than one more assertion in an existing suite. Every version
 * suite names its own version in the URL (`?version=discoverability-testing-3`),
 * which is right for testing that version and is exactly what makes the bare
 * case unreachable: NOTHING rendered the shell with no `?version=` and asked
 * what came back. The defect lived in the gap between the suites.
 *
 * ⚠ SO THE SUBJECT IS THE RESOLUTION, NOT HYBRID V1. These tests are written to
 * survive the default moving again — they ask "does the bare URL agree with the
 * default", never "is it Hybrid". The day the default moves to a non-Atlas
 * version they keep passing and keep meaning the same thing.
 */

function renderShell(url: string) {
  /* The same mirroring `Testing3Version.test.tsx` documents: `?ff=` is read from
     `window.location`, never from the router entry. Nothing here pins a flag,
     and the bare location is the point — but a helper that quietly left a stale
     location behind would make the next test that does pin one fail oddly. */
  window.history.replaceState({}, '', '/dashboard-rebrand')
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

afterEach(cleanup)

describe('a bare /dashboard-rebrand resolves to the default version', () => {
  const DEFAULT_ID = defaultDiscoverabilityVersionFor('xcel')
  /* Any shipped version that is NOT the default — used by the second test to
     prove the first one is not vacuous. Derived rather than named so neither
     test has to be touched when the default moves. */
  const OTHER_ID = DISCOVERABILITY_DASHBOARD_VERSIONS.map((v) => v.id).find(
    (id) => id !== DEFAULT_ID,
  )!

  function homeText(url: string) {
    const { container } = renderShell(url)
    const text = container.textContent ?? ''
    cleanup()
    return text
  }

  it('renders the SAME home with no ?version= as with the default named', () => {
    /* ⚠ THE WHOLE CLAIM, AND IT IS A COMPARISON RATHER THAN A FIXED STRING.
       Asserting "the bare URL shows Hybrid's lesson block" would pin this file
       to one version and have to be rewritten on the next promotion — and a
       rewritten test is one nobody trusts. Two renders of the same shell, one
       bare and one explicit, must agree; what they agree ON is free to change.

       Before 2026-10-06 these differed: the bare render drew Testing 3's
       combined course card under chrome that had already resolved to Hybrid. */
    expect(homeText('/dashboard-rebrand?demo=1')).toBe(
      homeText(`/dashboard-rebrand?demo=1&version=${DEFAULT_ID}`),
    )
  })

  it('and a DIFFERENT home from a version that is not the default', () => {
    /* ⚠ THE GUARD THAT MAKES THE TEST ABOVE MEAN ANYTHING. If every version
       rendered the same text — a harness that silently failed to mount the
       band, say — the equality above would pass and prove nothing at all. This
       is the half that fails in that case.

       ⚠ IT ALSO PINS THAT `?version=` STILL WORKS, which is the opposite way
       the resolution fix could have gone wrong: a resolver returning the
       default unconditionally would make every pinned version link inert and
       leave the first test passing. */
    expect(homeText('/dashboard-rebrand?demo=1')).not.toBe(
      homeText(`/dashboard-rebrand?demo=1&version=${OTHER_ID}`),
    )
  })
})

describe('resolveDashboardVersion', () => {
  it('passes a named version through untouched', () => {
    /* The half that is easy to break while fixing the other: a resolver that
       returned the default unconditionally would make every `?version=` link in
       every shared URL inert, and the bare case above would still pass. */
    expect(resolveDashboardVersion('eric-atlas-v1', 'xcel')).toBe('eric-atlas-v1')
  })

  it('answers the brand default for null AND undefined', () => {
    /* Both spellings reach it in practice — `params.get()` gives `null`, an
       optional prop gives `undefined`, and `??` treats them alike. Pinned
       because a later rewrite to `|| ` or `=== null` would quietly drop one, and
       the symptom would be the blend again rather than an error. */
    expect(resolveDashboardVersion(null, 'xcel')).toBe(defaultDiscoverabilityVersionFor('xcel'))
    expect(resolveDashboardVersion(undefined, 'xcel')).toBe(
      defaultDiscoverabilityVersionFor('xcel'),
    )
  })

  it('does NOT treat the empty string as absent', () => {
    /* ⚠ `?version=` WITH NOTHING AFTER IT IS A TYPO, NOT A DEFAULT, and `??`
       is what keeps the two apart — `||` would fold them together. An empty
       version matches no entry, so the app falls back to its own per-predicate
       answers rather than silently rendering the baseline, which is the
       behaviour the rest of the code already assumes. */
    expect(resolveDashboardVersion('', 'xcel')).toBe('')
  })
})
