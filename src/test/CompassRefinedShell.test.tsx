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

  it('leaves the lesson his, and nothing else', () => {
    /* ⚠ ONE SLOT, AND THE REASON IS STRUCTURAL. The 2026-11-10 header change
       reaches every page that draws a header; `CompassJeffCourse` is a
       full-window takeover that draws none and carries no `cjm-` class, so
       it was outside the fork. When the lesson is refined, this list empties
       and the case says so. */
    const his = (Object.keys(REFINED_PAGE_SOURCE) as RefinedSlot[]).filter(
      (s) => refinedSourceFor(s) === 'jeff',
    )
    expect(his).toEqual(['course'])
  })
})

/**
 * THE FORK WAS FAITHFUL — the check that makes a 4,800-line copy reviewable.
 *
 * Refined's page set is a mechanical fork of his: `cjm` → `crf`, nothing
 * else, taken at the moment of the fork. So normalising the prefix back
 * should make the two renders identical, and every difference that survives
 * is one somebody decided. Without this, a wholesale copy is a diff nobody
 * can read, and a typo in it looks exactly like a design decision.
 *
 * ⚠ READINESS IS EXCLUDED, and it is the only one. It was refined on
 * 2026-11-09, before the fork, and is a different page by intent —
 * `CompassReadinessRefined.test.tsx` is what holds it to the research.
 */
describe('Refined’s pages are his, prefix for prefix', () => {
  const DELIBERATELY_DIFFERENT = new Set(['readiness'])

  for (const page of ALL_PAGES) {
    if (DELIBERATELY_DIFFERENT.has(page)) continue
    it(`${page}`, () => {
      const his = wrap(<CompassJeffMvpShell page={page} onSelectPage={() => {}} />)
      const hisHtml = his.container.innerHTML
      his.unmount()
      const refined = wrap(<CompassRefinedShell page={page} onSelectPage={() => {}} />)
      /* `crf` back to `cjm` — the whole of the fork's mechanical difference.
         `crf-shell` is the one class the shell renames rather than copies. */
      const normalised = refined.container.innerHTML
        .replace(/\bcrf-shell\b/g, 'cjm-shell')
        .replace(/\bcrf-/g, 'cjm-')
        .replace(/(class="|\s)crf(\s|")/g, '$1cjm$2')
      expect(normalised).toBe(hisHtml)
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
