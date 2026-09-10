import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  AT_RISK_FRACTION,
  bandFor,
  defaultBands,
  ReadinessScoreGauge,
} from '@/components/readiness'

/**
 * The gauge's acceptance matrix. This repo has no Storybook, so the showcase
 * the brief asked for is here — every state and size rendered and asserted,
 * rather than eyeballed in an isolated harness.
 */

const meter = () => screen.getByRole('meter')
/** The gauge's own SVG. Scoped, because the status chip's icon is an <svg>
 *  too and `container.querySelector('svg')` finds that one first. */
const gaugeSvg = () => meter().querySelector('svg')!

describe('status is derived, never passed', () => {
  it('flips band at the pass mark and at the at-risk window', () => {
    const bands = defaultBands(75)
    const edge = 75 - 100 * AT_RISK_FRACTION
    expect(bandFor(80, bands).status).toBe('onTrack')
    expect(bandFor(75, bands).status).toBe('onTrack')
    expect(bandFor(74, bands).status).toBe('atRisk')
    expect(bandFor(edge, bands).status).toBe('atRisk')
    expect(bandFor(edge - 1, bands).status).toBe('offTrack')
  })

  it('scales the at-risk window with a custom range', () => {
    // The half of the brief's open question that an absolute window gets
    // wrong: on 0-40 an absolute 20-point window would make half the scale
    // "at risk". A fraction says the same thing at both sizes.
    const wide = defaultBands(30, 0, 40)
    expect(wide.find((b) => b.status === 'atRisk')!.min).toBe(30 - 40 * AT_RISK_FRACTION)
  })

  it('renders the chip the score earns — 62/75 is AT RISK', () => {
    // The brief's reference case.
    render(<ReadinessScoreGauge score={62} passingScore={75} animate={false} />)
    expect(screen.getByText('AT RISK')).toBeInTheDocument()
    expect(screen.getByText('62')).toBeInTheDocument()
    expect(screen.getByText('75 to pass')).toBeInTheDocument()
  })

  it('flips to ON TRACK and OFF TRACK on either side', () => {
    const { unmount } = render(<ReadinessScoreGauge score={80} passingScore={75} animate={false} />)
    expect(screen.getByText('ON TRACK')).toBeInTheDocument()
    unmount()
    render(<ReadinessScoreGauge score={40} passingScore={75} animate={false} />)
    expect(screen.getByText('OFF TRACK')).toBeInTheDocument()
  })
})

describe('the no-score state', () => {
  it('shows an em dash and NO chip', () => {
    // The rule with teeth: an "AT RISK" chip on a learner who has sat nothing
    // is an assessment we have not earned. A score of 0 would produce one, so
    // null must not be treated as 0 anywhere in the chain.
    render(<ReadinessScoreGauge score={null} passingScore={75} animate={false} />)
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('No score yet')).toBeInTheDocument()
    expect(screen.queryByText(/AT RISK|ON TRACK|OFF TRACK/)).toBeNull()
  })

  it('omits aria-valuenow rather than reporting zero', () => {
    render(<ReadinessScoreGauge score={null} passingScore={75} animate={false} />)
    expect(meter()).not.toHaveAttribute('aria-valuenow')
    expect(meter().getAttribute('aria-valuetext')).toBe('No score yet. 75 required to pass.')
  })
})

describe('the loading state', () => {
  it('is busy and carries no numeric content', () => {
    render(<ReadinessScoreGauge score={62} passingScore={75} loading />)
    expect(meter()).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('62')).toBeNull()
    expect(screen.queryByText('75 to pass')).toBeNull()
    expect(screen.queryByText('AT RISK')).toBeNull()
  })
})

describe('geometry', () => {
  it('positions the tick by the SCALE, not by assuming 0-100', () => {
    // A custom range is where a percentage-shaped assumption shows up. On
    // 0-40 with a pass at 30, the tick sits at 75% of the sweep — the same
    // place 75/100 would put it — so the two cases can be compared directly.
    //
    // Scoped to the meter: the status chip renders a Font Awesome glyph, which
    // is also an <svg> with its own <line>s, and an unscoped query reads that.
    const { unmount } = render(
      <ReadinessScoreGauge score={25} passingScore={30} min={0} max={40} animate={false} />,
    )
    const tickWide = gaugeSvg().querySelector('line')!.getAttribute('x1')
    unmount()
    render(<ReadinessScoreGauge score={62} passingScore={75} animate={false} />)
    expect(tickWide).toBe(gaugeSvg().querySelector('line')!.getAttribute('x1'))
  })

  it('paints BOTH bands full length — the arc is a track, not a fill', () => {
    // The load-bearing geometric claim. If a future edit makes the arc a
    // progress fill, the two dash arrays stop summing to the arc length and
    // the scale stops being visible behind the score.
    render(<ReadinessScoreGauge score={62} passingScore={75} animate={false} />)
    const [risk, pass] = [...gaugeSvg().querySelectorAll('path')]
    const lenOf = (el: Element) => Number(el.getAttribute('stroke-dasharray')!.split(' ')[0])
    const total = Number(risk.getAttribute('stroke-dasharray')!.split(' ')[1])
    expect(lenOf(risk) + lenOf(pass)).toBeCloseTo(total, 5)
  })

  it('renders every size with both arc ends inside the viewBox', () => {
    // The clipping claim, asserted directly rather than via an aspect ratio:
    // the arc's own endpoints must sit inside the box at every size. A wrong
    // `cy` or a stroke wider than the padding shows up here and nowhere else,
    // because SVG clips silently.
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(
        <ReadinessScoreGauge score={62} passingScore={75} size={size} animate={false} />,
      )
      const svg = gaugeSvg()
      const [, , w, h] = svg.getAttribute('viewBox')!.split(' ').map(Number)
      const d = svg.querySelector('path')!.getAttribute('d')!
      const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number)
      const start = { x: nums[0], y: nums[1] }
      const end = { x: nums[nums.length - 2], y: nums[nums.length - 1] }
      for (const p of [start, end]) {
        expect(p.x, `${size} x`).toBeGreaterThanOrEqual(0)
        expect(p.x, `${size} x`).toBeLessThanOrEqual(w)
        expect(p.y, `${size} y`).toBeGreaterThanOrEqual(0)
        expect(p.y, `${size} y`).toBeLessThanOrEqual(h)
      }
      // Half-circle plus stroke — never a full square, never a thin strip.
      expect(w / h).toBeGreaterThan(1.6)
      expect(w / h).toBeLessThan(2)
      unmount()
    }
  })
})

describe('out-of-range input', () => {
  it('clamps rather than throwing, and warns in dev', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(<ReadinessScoreGauge score={140} passingScore={75} animate={false} />)
    expect(meter()).toHaveAttribute('aria-valuenow', '100')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('outside [0, 100]'))
    warn.mockRestore()
  })
})
