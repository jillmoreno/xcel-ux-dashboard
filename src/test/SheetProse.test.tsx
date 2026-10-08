import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { GetLicensedStepPanel } from '@/components/learning/GetLicensedStepPanel'
import { splitLead } from '@/components/learning/sheetProseStyles'
import { GET_LICENSED_STEPS } from '@/data/nyProducerRequirements'

/**
 * THE SHARED SHEET TREATMENT — 2026-10-07, the direct ask ("the layout for this
 * sheet is bland… organize the chaos in a more appealing way", then "do the
 * same for How to apply and what to expect").
 *
 * ⚠ THE SPLIT IS TESTED AS A FUNCTION, not only through the DOM. Its guards are
 * arithmetic over strings — a length ceiling and a capital-letter check — and
 * the cases that matter are the ones NEXT TO the boundary, which are tedious to
 * reach through a rendered sheet and trivial to state here.
 */

afterEach(cleanup)

describe('splitLead', () => {
  it('takes a short em-dash label', () => {
    expect(splitLead('State exam — 150 scored questions')).toEqual({
      lead: 'State exam',
      rest: '150 scored questions',
    })
  })

  it('⚠ leaves a long prefix alone, dash or not', () => {
    /* THE FALSE POSITIVE THE GUARD EXISTS FOR. Without it this bolds a URL,
       which reads as a rendering fault rather than as emphasis. */
    const psi = 'Register online with PSI at test-takers.psiexams.com/nyins — exam fee $40'
    expect(splitLead(psi)).toBeNull()
  })

  it('takes a colon label only when a sentence follows it', () => {
    /* ⚠ A COLON IS ALSO ORDINARY PUNCTUATION, so it carries the extra guard. */
    expect(splitLead('Prep Review Course: This part of the training')?.lead).toBe(
      'Prep Review Course',
    )
    expect(splitLead('Registration must be completed online on the PSI website:')).toBeNull()
    expect(splitLead('Hours: forty of them')).toBeNull()
  })

  it('⚠ takes the FIRST delimiter, not the best one', () => {
    /* The Exam Simulator entry carries a second colon ("…retention levels.
       Important: Only take…"). Emphasising both would turn one bullet into two
       labels, and emphasising the later one would bold the middle of a
       sentence. */
    const both = 'Exam Simulator: These gauge retention. Important: Only take them after.'
    expect(splitLead(both)?.lead).toBe('Exam Simulator')
  })
})

describe('the Get Licensed step sheet', () => {
  const APPLY = GET_LICENSED_STEPS.find((s) => s.id === 'apply-license')!

  function renderStep() {
    return render(<GetLicensedStepPanel step={APPLY} state="NY" onClose={() => {}} />)
  }

  it('states who handles it, where, and what it costs as a fact row', () => {
    /* ⚠ THE OWNER IS FIRST, which is the point the sheet's own note makes:
       nothing on these three steps happens inside the LMS, and the first cell
       is what says so. */
    renderStep()
    const labels = [...document.querySelectorAll('dt')].map((d) => d.textContent)
    expect(labels).toEqual(['Handled by', 'Jurisdiction', 'Fee'])
  })

  it('⚠ gives every bullet a marker', () => {
    /* THE BUG THIS PASS FOUND. The list set `display: flex`, which blockifies
       its `<li>`s and drops `::marker` — so `paddingLeft: 18` had been
       indenting against nothing. It looked deliberate, because the sheet it
       opens beside suppresses markers on purpose. */
    renderStep()
    const items = [...document.querySelectorAll('li')]
    expect(items.length).toBeGreaterThan(0)
    for (const li of items) {
      expect(getComputedStyle(li).display).toBe('flex')
      expect(li.firstElementChild?.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('labels an external link by its host, keeping the full address', () => {
    /* ⚠ THE RAW `href` WAS THE LOUDEST THING ON STEP 3 — a 64-character DFS
       URL, bold, wrapped over two lines. The host is what a reader checks
       before leaving the product; the destination is unchanged. */
    renderStep()
    const link = screen.getByRole('link', { name: 'dfs.ny.gov' })
    expect(link.getAttribute('href')).toBe(
      'https://www.dfs.ny.gov/apps_and_licensing/agents_and_brokers/home',
    )
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('sizes the whole fact row together, never cell by cell', () => {
    /* ⚠ THE REGRESSION THIS PINS IS VISUAL AND SPECIFIC: deciding per value put
       "PSI" at 16px beside "New York licence" at 13px in one row, which reads
       as a rendering fault. One measurement over all of them cannot do that. */
    renderStep()
    const sizes = new Set(
      [...document.querySelectorAll('dd')].map((d) => getComputedStyle(d).fontSize),
    )
    expect(sizes.size).toBe(1)
  })
})
