import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from '@/components/ui/Avatar'

/**
 * Avatar tier system — Figma "Colors for Membership Tiers" (node 1444:30869).
 * Each non-default tier paints its badge fill from a token ramp's `-600` step
 * (primary / tertiary / warning) and carries one glyph (Mountain / Bolt /
 * Crown), with concentric tier rings (single / double / triple). Default
 * renders a plain avatar.
 */
describe('Avatar — tier profile pics', () => {
  const tiers = [
    { tier: 'plus', ramp: 'primary', ringCount: 1 },
    { tier: 'pro', ramp: 'tertiary', ringCount: 2 },
    { tier: 'premier', ramp: 'warning', ringCount: 3 },
  ] as const

  it.each(tiers)('$tier paints a $ramp-600 badge + $ringCount ring(s)', ({ tier, ramp, ringCount }) => {
    const { container } = render(<Avatar initials="DP" imageUrl="/x.jpg" size={70} tier={tier} />)
    // Exactly one badge glyph renders (the Mountain / Bolt / Crown svg).
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    // The badge fill references the tier ramp's -600 token.
    const badge = [...container.querySelectorAll('span')].find((s) =>
      (s.getAttribute('style') ?? '').includes(`background: var(--color-${ramp}-600)`),
    )
    expect(badge, `badge for ${tier}`).toBeTruthy()
    // One bordered ring span per ring color (single / double / triple),
    // contiguous (no padding gap between the color bands).
    const rings = [...container.querySelectorAll('span')].filter((s) =>
      /border: \d+px solid var\(--color-/.test(s.getAttribute('style') ?? ''),
    )
    expect(rings, `rings for ${tier}`).toHaveLength(ringCount)
  })

  it('default tier renders a plain avatar — no badge glyph, no ring', () => {
    const { container } = render(<Avatar initials="DP" imageUrl="/x.jpg" size={70} tier="default" />)
    expect(container.querySelectorAll('svg')).toHaveLength(0)
    const hasRamp = [...container.querySelectorAll('span')].some((s) =>
      /var\(--color-(primary|tertiary|warning)-(500|600)\)/.test(s.getAttribute('style') ?? ''),
    )
    expect(hasRamp).toBe(false)
  })

  it('omitting tier keeps the legacy accent behavior (secondary ring + gem)', () => {
    const { container } = render(
      <Avatar initials="DP" imageUrl="/x.jpg" size={48} ring pro accent="secondary" />,
    )
    expect(container.querySelectorAll('svg')).toHaveLength(1) // gem
    const badge = [...container.querySelectorAll('span')].find((s) =>
      (s.getAttribute('style') ?? '').includes('var(--color-secondary-600)'),
    )
    expect(badge).toBeTruthy()
  })
})
