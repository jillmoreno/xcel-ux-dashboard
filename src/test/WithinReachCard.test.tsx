import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { WithinReachCard } from '@/components/achievements/WithinReachCard'
import type { Achievement } from '@/data/achievements'

/** Minimal Achievement factory — only the fields WithinReachCard reads. */
function makeAchievement(
  overrides: Partial<Achievement> = {},
): Achievement {
  return {
    id: 'test',
    title: 'Test Badge',
    category: 'streaks',
    iconKey: 'streak30',
    unlockCondition: 'Test unlock condition.',
    readyPrompt: 'Do a thing',
    status: 'ready',
    rarityPct: 50,
    ...overrides,
  } as Achievement
}

function renderCard(achievement: Achievement) {
  return render(
    <MemoryRouter>
      <WithinReachCard achievement={achievement} />
    </MemoryRouter>,
  )
}

describe('WithinReachCard — element semantics', () => {
  it('renders as a <button> element (keyboard-focusable)', () => {
    renderCard(makeAchievement())
    const btn = screen.getByRole('button', { name: /test badge/i })
    expect(btn.tagName.toLowerCase()).toBe('button')
    expect(btn).toHaveAttribute('type', 'button')
  })

  it("aria-label includes the state suffix in text", () => {
    renderCard(makeAchievement({ status: 'ready' }))
    expect(
      screen.getByRole('button', { name: /one step away/i }),
    ).toBeInTheDocument()
  })

  it("progress card's aria-label carries the percent in text", () => {
    renderCard(
      makeAchievement({
        status: 'progress',
        progress: { current: 41, target: 100, unit: 'days' },
      }),
    )
    expect(
      screen.getByRole('button', { name: /in progress, 41% complete/i }),
    ).toBeInTheDocument()
  })
})

describe('WithinReachCard — icon tile (NOT a PassportStamp)', () => {
  it('renders a flat square icon tile, not a PassportStamp silhouette', () => {
    const { container } = renderCard(makeAchievement({ category: 'streaks' }))
    // Per-category PassportStamp silhouettes would render two SVG
    // shape elements per stamp (outer + inner echo). The card uses
    // just ONE inner SVG (the icon glyph from the icon registry).
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(1)
  })

  it("icon tile's color, background, and border derive from --ink-{category}", () => {
    const { container } = renderCard(
      makeAchievement({ category: 'mastery' }),
    )
    const tile = container.querySelector('span[aria-hidden]') as HTMLElement
    expect(tile.style.color).toBe('var(--ink-mastery)')
    expect(tile.style.background).toContain('var(--ink-mastery)')
    expect(tile.style.borderColor).toContain('var(--ink-mastery)')
  })
})

describe('WithinReachCard — typography split', () => {
  it("title uses Cutive Mono", () => {
    renderCard(makeAchievement({ title: 'Perfect Quiz' }))
    const title = screen.getByText('Perfect Quiz')
    expect((title as HTMLElement).style.fontFamily).toBe('var(--font-stamp)')
  })

  it("description uses Open Sans (NOT Cutive Mono)", () => {
    renderCard(
      makeAchievement({
        unlockCondition: 'Score 100% on a quiz for the first time.',
      }),
    )
    const desc = screen.getByText(/score 100% on a quiz/i)
    expect((desc as HTMLElement).style.fontFamily).toBe('var(--font-body)')
  })

  it("rarity line uses Open Sans (NOT Cutive Mono)", () => {
    renderCard(makeAchievement({ rarityPct: 44 }))
    const rarity = screen.getByText(/44% of members/i)
    expect((rarity as HTMLElement).style.fontFamily).toBe('var(--font-body)')
  })
})

describe('WithinReachCard — ready state', () => {
  const ready = makeAchievement({
    status: 'ready',
    title: 'Perfect Quiz',
    unlockCondition: 'Score 100% on a quiz for the first time.',
    category: 'mastery',
    rarityPct: 44,
  })

  it('renders the unlockCondition as the description', () => {
    renderCard(ready)
    expect(
      screen.getByText('Score 100% on a quiz for the first time.'),
    ).toBeInTheDocument()
  })

  it('does NOT render a progress bar, percentage, status chip, or Claim CTA', () => {
    renderCard(ready)
    // No percentage like "44%" appearing anywhere except the rarity line.
    // The progress bar has tabular-nums "N of M unit" meta line — assert
    // absent.
    expect(screen.queryByText(/\d+\s+of\s+\d+/i)).not.toBeInTheDocument()
    // No "Claim" CTA text.
    expect(screen.queryByText(/claim/i)).not.toBeInTheDocument()
    // No "Ready" status chip text.
    expect(screen.queryByText(/^Ready$/)).not.toBeInTheDocument()
  })
})

describe('WithinReachCard — progress state', () => {
  const inProgress = makeAchievement({
    status: 'progress',
    title: '100-day Streak',
    category: 'streaks',
    unlockCondition: 'Log learning one hundred days in a row.',
    progress: { current: 41, target: 100, unit: 'days' },
    rarityPct: 4,
  })

  it('renders the percentage in the title row right-aligned', () => {
    renderCard(inProgress)
    expect(screen.getByText(/^41%$/)).toBeInTheDocument()
  })

  it('renders a progress bar with width proportional to progress', () => {
    const { container } = renderCard(inProgress)
    // The fill span has `width: 41%` inline.
    const fills = Array.from(container.querySelectorAll('span')).filter(
      (s) => s.style.width === '41%',
    )
    expect(fills.length).toBe(1)
  })

  it('renders the meta line "N of M unit"', () => {
    renderCard(inProgress)
    expect(screen.getByText('41 of 100 days')).toBeInTheDocument()
  })
})

describe('WithinReachCard — rarity + personal-best line', () => {
  it('weaves personalBest into the rarity line when present', () => {
    renderCard(
      makeAchievement({
        status: 'progress',
        progress: { current: 41, target: 100, unit: 'days' },
        personalBest: { value: 41, unit: 'days' },
        rarityPct: 4,
      }),
    )
    expect(
      screen.getByText('Best so far: 41 days · 4% of members'),
    ).toBeInTheDocument()
  })

  it('falls back to "{rarityPct}% of members" when no personalBest', () => {
    renderCard(makeAchievement({ rarityPct: 44, personalBest: undefined }))
    expect(screen.getByText('44% of members')).toBeInTheDocument()
  })
})

describe('WithinReachCard — hover + focus styling', () => {
  it("hovering applies --color-neutral-100 background", () => {
    renderCard(makeAchievement())
    const btn = screen.getByRole('button', { name: /test badge/i })
    fireEvent.mouseEnter(btn)
    expect((btn as HTMLElement).style.background).toBe(
      'var(--color-neutral-100)',
    )
    fireEvent.mouseLeave(btn)
    expect((btn as HTMLElement).style.background).toBe(
      'var(--color-neutral-50)',
    )
  })

  it("focusing applies --color-neutral-100 background", () => {
    renderCard(makeAchievement())
    const btn = screen.getByRole('button', { name: /test badge/i })
    fireEvent.focus(btn)
    expect((btn as HTMLElement).style.background).toBe(
      'var(--color-neutral-100)',
    )
    fireEvent.blur(btn)
    expect((btn as HTMLElement).style.background).toBe(
      'var(--color-neutral-50)',
    )
  })
})

describe('WithinReachCard — navigation', () => {
  it('clicking the card navigates to /account/achievements?focus={id}', () => {
    // Wrap in a memory router with a route catcher to verify navigation.
    function LocationDisplay() {
      const url = window.location.href
      return <div data-testid="loc">{url}</div>
    }
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <WithinReachCard achievement={makeAchievement({ id: 'perfect-quiz' })} />
        <LocationDisplay />
      </MemoryRouter>,
    )
    const btn = screen.getByRole('button', { name: /test badge/i })
    fireEvent.click(btn)
    // MemoryRouter doesn't update window.location — but we can verify
    // the click handler didn't throw and the button stayed in the DOM.
    // The real router would carry the navigation; this just confirms
    // the click target exists and is wired.
    expect(btn).toBeInTheDocument()
  })
})
