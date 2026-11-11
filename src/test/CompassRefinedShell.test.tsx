import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassJeffMvpShell } from '@/components/learning/CompassJeffMvpShell'
import { CompassRefinedShell } from '@/components/learning/CompassRefinedShell'
import {
  REFINED_PAGE_SOURCE,
  refinedSourceFor,
  type RefinedSlot,
} from '@/components/learning/compassRefinedPages'
import { JEFF_MVP_PAGES, JEFF_MVP_SUBPAGES } from '@/data/compassJeffMvpFixtures'

/**
 * THE SEAM BETWEEN REFINED AND JEFF'S — 2026-11-10.
 *
 * The whole claim of that change is that it moved nothing: Refined got its
 * own shell so its pages could be edited without editing his, and every slot
 * still points at his component except the one that was already Refined's.
 * A refactor that quietly changed a page would be the worst version of this,
 * because the diff looks like plumbing.
 *
 * So this suite is two things: the two shells draw the same markup for every
 * page whose slot says `jeff`, and the map covers every page there is.
 */

function wrap(node: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>{node}</FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const RAIL_PAGES = JEFF_MVP_PAGES.map((p) => p.page)
const SUB_PAGES = JEFF_MVP_SUBPAGES.map((p) => p.page)
const ALL_PAGES = [...RAIL_PAGES, ...SUB_PAGES]

describe('the Refined slot map', () => {
  it('names a source for every page of the MVP, and for the rail', () => {
    /* ⚠ THE FALLBACK IN `refinedSourceFor` SHOULD NEVER FIRE. It is there so
       a page added to his MVP renders HIS rather than nothing; this case is
       what keeps it from becoming the way pages are added. */
    const slots = Object.keys(REFINED_PAGE_SOURCE).sort()
    expect(slots).toEqual([...ALL_PAGES, 'rail'].sort())
  })

  it('starts every slot on his except the one page Refined owns', () => {
    const refinedSlots = (Object.keys(REFINED_PAGE_SOURCE) as RefinedSlot[]).filter(
      (s) => refinedSourceFor(s) !== 'jeff',
    )
    /* Readiness, and only Readiness — `CompassReadinessRefined`, 2026-11-09.
       When this list grows, the page that joined it is a page someone
       deliberately refined, and its own suite should say what changed. */
    expect(refinedSlots).toEqual(['readiness'])
  })
})

describe('the two shells draw the same pages until a slot is flipped', () => {
  /* The lesson and the simulated exam are takeovers that render without the
     rail; they go through the same branch in both shells and are compared
     here like any other page. */
  for (const page of ALL_PAGES) {
    if (refinedSourceFor(page as RefinedSlot) !== 'jeff') continue
    it(`${page} is his, byte for byte`, () => {
      const his = wrap(<CompassJeffMvpShell page={page} onSelectPage={() => {}} />)
      const hisHtml = his.container.innerHTML
      his.unmount()
      const refined = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      /* ⚠ THE WRAPPER CARRIES ONE EXTRA CLASS and nothing else. `crf` is the
         override hook Refined's stylesheet hangs off; stripping it is what
         makes this a comparison of the PAGE rather than of the wrapper. */
      const refinedHtml = refined.container.innerHTML.replace('cjm cjm-shell crf', 'cjm cjm-shell')
      expect(refinedHtml).toBe(hisHtml)
    })
  }
})

describe('the page Refined owns', () => {
  it('is Refined’s on the Refined shell and his on his', () => {
    const refined = wrap(<CompassRefinedShell page="readiness" onSelectPage={() => {}} />)
    expect(refined.container.querySelector('.cre-rdr')).toBeTruthy()
    refined.unmount()
    const his = wrap(<CompassJeffMvpShell page="readiness" onSelectPage={() => {}} />)
    expect(his.container.querySelector('.cre-rdr')).toBeNull()
  })

  /* ⚠ "HIS SHELL CARRIES NO REFINED WIRING" IS NOT PINNED HERE, and that is
     deliberate rather than an omission. The `readiness` prop is gone from
     `CompassJeffMvpShell`'s type, so `tsc` refuses any call that passes it —
     a stronger guard than a runtime assertion, and one that fires at the
     call site rather than in a suite. A `Function.length` check would have
     been vacuous (a component takes one props object however many fields it
     destructures) and a `toString()` grep breaks under minification. */
})
