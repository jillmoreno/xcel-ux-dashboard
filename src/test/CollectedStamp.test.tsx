import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CollectedStamp } from '@/components/achievements/CollectedStamp'
import type { Achievement } from '@/data/achievements'

function makeAchievement(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: 'streak-30',
    title: '30-day Streak',
    category: 'streaks',
    iconKey: 'streak30',
    unlockCondition: 'Log learning thirty days in a row.',
    status: 'earned',
    earnedOn: '2026-05-08',
    rarityPct: 22,
    ...overrides,
  } as Achievement
}

describe('CollectedStamp — basic structure', () => {
  it('renders the achievement title in the body of the cell', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    expect(screen.getByText('30-day Streak')).toBeInTheDocument()
  })

  it('renders the formatted earned date in the body of the cell', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    // Default fixture: 2026-05-08 → "MAY · 8"
    expect(screen.getByText('MAY · 8')).toBeInTheDocument()
  })

  it("button's aria-label includes the title + 'stamped' + date", () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    const btn = screen.getByRole('button', {
      name: /30-day streak — stamped may · 8/i,
    })
    expect(btn).toBeInTheDocument()
  })
})

describe('CollectedStamp — sizing', () => {
  it('the wrapper button is fixed at 150×150', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    const btn = screen.getByRole('button', { name: /30-day streak/i })
    // Style is inline so we can read it directly.
    const style = (btn as HTMLElement).style
    expect(style.width).toBe('150px')
    expect(style.height).toBe('150px')
    expect(style.flexShrink).toBe('0')
    expect(style.boxSizing).toBe('border-box')
  })
})

describe('CollectedStamp — parchment fill', () => {
  it('uses the parchment surface token as the cell background', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    const btn = screen.getByRole('button', { name: /30-day streak/i })
    expect((btn as HTMLElement).style.background).toBe(
      'var(--color-surface-parchment)',
    )
  })
})

describe('CollectedStamp — wraps PassportStamp inside', () => {
  // Per-category shape correctness is covered exhaustively in
  // `PassportStamp.test.tsx`. Here we just verify the CollectedStamp
  // delegates to PassportStamp at the right size (64) — the presence
  // of the shape SVG is the proof.
  it('renders a PassportStamp at size 64', () => {
    const { container } = render(
      <CollectedStamp achievement={makeAchievement()} />,
    )
    const stampSvg = container.querySelector('svg[viewBox="0 0 64 64"]')
    expect(stampSvg).not.toBeNull()
  })
})

describe('CollectedStamp — labels in black', () => {
  it('title text uses --color-text-primary (black) — uniform across categories', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    const title = screen.getByText('30-day Streak')
    expect((title as HTMLElement).style.color).toBe(
      'var(--color-text-primary)',
    )
  })

  it('date text uses --color-text-primary (black)', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    const date = screen.getByText('MAY · 8')
    expect((date as HTMLElement).style.color).toBe('var(--color-text-primary)')
  })
})

describe('CollectedStamp — faded variant', () => {
  it("earnedOn more than 30 days before 2026-05-20 applies opacity 0.78", () => {
    // 2026-03-02 (first-cert in fixtures) is ~79 days before the anchored
    // demo today.
    render(
      <CollectedStamp
        achievement={makeAchievement({
          id: 'first-cert',
          title: 'First Certificate',
          earnedOn: '2026-03-02',
        })}
      />,
    )
    const btn = screen.getByRole('button', { name: /first certificate/i })
    expect(btn).toHaveStyle({ opacity: '0.78' })
  })

  it("recent earnedOn (within 30 days of anchored today) has full opacity", () => {
    // 2026-05-08 is 12 days before anchored today.
    render(<CollectedStamp achievement={makeAchievement()} />)
    const btn = screen.getByRole('button', { name: /30-day streak/i })
    expect(btn).toHaveStyle({ opacity: '1' })
  })
})

describe('CollectedStamp — tooltip', () => {
  it('opens on focus + carries unlock condition + rarity', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    fireEvent.focus(screen.getByRole('button', { name: /30-day streak/i }))
    const tip = screen.getByRole('tooltip')
    expect(tip.textContent).toMatch(/Log learning thirty days in a row/i)
    expect(tip.textContent).toMatch(/Held by 22% of members/i)
  })

  it('closes on Escape', () => {
    render(<CollectedStamp achievement={makeAchievement()} />)
    fireEvent.focus(screen.getByRole('button', { name: /30-day streak/i }))
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
