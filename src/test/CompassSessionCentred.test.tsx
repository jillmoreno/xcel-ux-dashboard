import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'

/**
 * THE LESSON IS A CENTRED COLUMN (2026-10-16, Jillienne with the session's
 * `<main>` selected: "the course content should be centered in the screen").
 *
 * ⚠ WHAT WAS ACTUALLY WRONG was not that nothing had a width — the card and
 * the footer were already capped at 680. It was that the segment LABEL was
 * not, so on a wide screen the label stretched the full column while the card
 * beneath it stopped short, and the pair sat against the left edge. So the
 * assertion is that the three share ONE container, not merely that a cap
 * exists somewhere.
 *
 * jsdom has no layout, so this pins the STRUCTURE and the flag rather than
 * pixel positions; the centring itself was measured in the browser (680 in
 * 1187, 254 each side, with Rubi open and closed and across beat kinds).
 */
function renderSession() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&section=compass&session=1']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const column = () => document.querySelector('main')?.firstElementChild as HTMLElement | null

afterEach(cleanup)

describe('the Compass session’s lesson column', () => {
  it('is on in the committed baseline, and is not a design-bar control', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-session-centred')
    expect(flag?.defaultEnabled).toBe(true)
    /* `promote-to-prototype` lists `surface: 'design'` controls separately
       BECAUSE THEY NEVER REACH PROTOTYPES. This is meant to ship. */
    expect(flag?.surface, 'a design surface would stop it ever shipping').toBeUndefined()
  })

  it('wraps the label, the body and the footer in one centred container', () => {
    renderSession()
    const col = column()
    expect(col).not.toBeNull()
    expect(col!.style.marginInline, 'centred, not just capped').toBe('auto')
    expect(col!.style.maxWidth).toBe('680px')
    // The label is INSIDE it — that is the half that was missing, and the
    // reason the old layout read as broken rather than narrow.
    expect(col!.textContent).toMatch(/you set the pace/i)
    // …and so is the footer's paging.
    expect(col!.querySelector('button')).not.toBeNull()
  })

  it('off: the column style is simply not applied — the old layout, exactly', () => {
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-session-centred:off')
    renderSession()
    const col = column()
    expect(col?.style.maxWidth).toBe('')
    expect(col?.style.marginInline).toBe('')
    window.history.replaceState({}, '', '/')
  })
})

/**
 * THE PROGRESS BAR IS THE CONTENT'S WIDTH (2026-10-16, Jillienne: "i want the
 * course progress to be the same width as the content container below it").
 *
 * ⚠ THREE THINGS HAD TO MATCH, not one, and each failed separately on the way
 * — measured in the browser at every step:
 *   1. the MEASURE (900 → 680),
 *   2. the GRID — the bar centred across the whole width while the content is
 *      centred between the rails, so the bar takes the body's template,
 *   3. the INSETS — the bar's own padding and its 24px grid gap each shifted
 *      the middle column, so the padding moved onto the centre cell (where
 *      `main`'s lives) and the gap went to 0.
 * Any one of them reverted puts the two out of step again, which is why the
 * structure is pinned here rather than only the number.
 *
 * jsdom has no layout, so the alignment itself was verified in the browser:
 * 680/680 with Rubi closed, 481/481 with it open, zero offset on both edges.
 */
describe('the session bar and the lesson column', () => {
  it('share the measure', () => {
    renderSession()
    const col = column()
    const bar = document.querySelector('[role="progressbar"]')?.parentElement as HTMLElement
    expect(bar.style.maxWidth, 'the centre carries 680 plus its own 64 of padding').toBe('744px')
    expect(bar.style.padding).toBe('0px 32px')
    expect(bar.style.boxSizing).toBe('border-box')
    // …which resolves to the same content box as the column below.
    expect(col!.style.maxWidth).toBe('680px')
  })

  it('the bar grid mirrors the body grid rather than approximating it', () => {
    renderSession()
    const header = document.querySelector('header') as HTMLElement
    // No padding and no gap: both would inset the middle column away from the
    // content column under it.
    expect(header.style.padding).toBe('10px 0px')
    expect(header.style.gap).toBe('0px')
    // The Contents column's width is the first track, so the centre starts
    // where the content does.
    expect(header.style.gridTemplateColumns).toMatch(/^220px minmax\(0,\s*1fr\)/)
  })
})
