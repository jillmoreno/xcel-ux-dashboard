import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'

/**
 * THE INFOGRAPHIC BEAT — Anjani's chart (2026-10-16).
 *
 * ⚠ THE PLACEHOLDER IT REPLACED RESTED ON A WRONG PREMISE, which is why this
 * file leads with it. Its note said the source had "no chart data behind it,
 * so there is nothing to plot" — true of the DATA and false of the beat: her
 * `compInfographic` draws a hand-authored SVG. Nothing had to be invented
 * because the drawing already existed; it was just not where a search for
 * data would look. If this beat ever regresses to a placeholder, that is the
 * reasoning to re-check rather than repeat.
 *
 * jsdom has no layout, so what is pinned is that the chart is THERE, is
 * described, and names both series — not where the curve sits.
 */
function openInfographic(search = '') {
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&section=compass&session=1']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Infographic' }))
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('the Infographic beat', () => {
  it('is on in the committed baseline, and can reach Prototypes', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-infographic-chart')
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.surface).toBeUndefined()
  })

  it('draws the chart instead of apologising for it', () => {
    openInfographic()
    expect(screen.queryByText(/Chart to come/)).toBeNull()
    const chart = screen.getByRole('img', { name: /Line chart/ })
    expect(chart).toBeInTheDocument()
    // Both series are LABELLED ON THE LINES — her call, one less lookup than a
    // legend, and the thing that makes the picture readable at a glance.
    expect(chart.textContent).toContain('Permanent')
    expect(chart.textContent).toContain('Term ($0)')
    // The axis is scaled, not decorative.
    for (const tick of ['$0', '$10k', '$20k', '$30k', 'Yr 1', 'Yr 15', 'Yr 30']) {
      expect(chart.textContent).toContain(tick)
    }
  })

  it('carries the takeaway, which is the half that teaches', () => {
    openInfographic()
    expect(screen.getByText('The takeaway')).toBeInTheDocument()
    expect(screen.getByText(/nothing accrues/)).toBeInTheDocument()
  })

  it('is described for anyone who cannot see it', () => {
    // A chart with no alternative is a chart half the audience does not get.
    openInfographic()
    expect(
      screen.getByRole('img', { name: /permanent cash value rises over policy age while term stays at zero/i }),
    ).toBeInTheDocument()
  })

  it('off: the placeholder is back, untouched', () => {
    openInfographic('?ff=compass-infographic-chart:off')
    expect(screen.getByText(/Chart to come/)).toBeInTheDocument()
    expect(screen.queryByRole('img', { name: /Line chart/ })).toBeNull()
  })
})
