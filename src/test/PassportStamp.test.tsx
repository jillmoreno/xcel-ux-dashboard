import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PassportStamp } from '@/components/ui/PassportStamp'
import type {
  Achievement,
  AchievementCategory,
  AchievementIconKey,
} from '@/data/achievements'

/** Build a minimal Achievement for a given category — only the fields
 *  PassportStamp actually reads. */
function makeAchievement(
  overrides: Partial<Achievement> & {
    id?: string
    category?: AchievementCategory
    iconKey?: AchievementIconKey
  } = {},
): Achievement {
  return {
    id: 'test-id',
    title: 'Test Stamp',
    category: 'streaks',
    iconKey: 'streak30',
    unlockCondition: 'Test unlock condition.',
    status: 'earned',
    rarityPct: 50,
    ...overrides,
  }
}

describe('PassportStamp — shape system', () => {
  // Each category maps to a specific outer SVG shape. We assert the
  // element type of the first geometry node (after rotation transform).
  type Case = {
    category: AchievementCategory
    /** The HTML tag name of the OUTER shape element. */
    outerTag: string
  }
  const cases: Case[] = [
    { category: 'streaks', outerTag: 'rect' },
    { category: 'achievements', outerTag: 'circle' },
    { category: 'mastery', outerTag: 'polygon' },
    { category: 'lifecycle', outerTag: 'rect' }, // banner — pill-rect
    { category: 'community', outerTag: 'path' }, // rosette
    { category: 'hidden', outerTag: 'path' }, // wax-seal
  ]

  for (const c of cases) {
    it(`renders ${c.category} as a <${c.outerTag}>`, () => {
      const a = makeAchievement({ category: c.category, id: c.category })
      const { container } = render(
        <PassportStamp achievement={a} state="earned" />,
      )
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
      // Outer shape is the first child of the SVG; the inner echo is the
      // second. We just check the outer.
      const first = svg!.firstElementChild
      expect(first?.tagName.toLowerCase()).toBe(c.outerTag)
    })
  }

  it('every shape has TWO path elements (outer outline + inner echo)', () => {
    const a = makeAchievement({ category: 'achievements' })
    const { container } = render(
      <PassportStamp achievement={a} state="earned" />,
    )
    const svg = container.querySelector('svg')!
    // Both circles for the achievements shape.
    expect(svg.children).toHaveLength(2)
  })
})

describe('PassportStamp — state treatments', () => {
  it("`state='earned'` renders without stroke-dasharray", () => {
    const a = makeAchievement({ category: 'streaks' })
    const { container } = render(
      <PassportStamp achievement={a} state="earned" />,
    )
    const outer = container.querySelector('svg > *') as SVGElement
    expect(outer.getAttribute('stroke-dasharray')).toBeNull()
  })

  it("`state='within-reach'` adds stroke-dasharray AND drops opacity to 0.85", () => {
    const a = makeAchievement({ category: 'streaks' })
    const { container } = render(
      <PassportStamp achievement={a} state="within-reach" />,
    )
    const outer = container.querySelector('svg > *') as SVGElement
    // The dasharray is inlined as style, since we set it via the style
    // object. Read it from the computed inline style.
    expect(outer.style.strokeDasharray).toBe('3 3')
    // Wrapper has opacity: 0.85.
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.opacity).toBe('0.85')
  })

  it("`state='locked'` adds stroke-dasharray AND overrides color to faded brown", () => {
    const a = makeAchievement({ category: 'streaks' })
    const { container } = render(
      <PassportStamp achievement={a} state="locked" />,
    )
    const outer = container.querySelector('svg > *') as SVGElement
    expect(outer.style.strokeDasharray).toBe('3 3')
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.color).toContain('122, 89, 32')
  })
})

describe('PassportStamp — Hidden-category locked masking', () => {
  it("renders '???' for the name + 'HIDDEN' for the date", () => {
    const a = makeAchievement({
      id: 'polymath',
      title: 'Polymath',
      category: 'hidden',
      iconKey: 'polymath',
      status: 'locked',
    })
    const { getByText, queryByText } = render(
      <PassportStamp achievement={a} state="locked" showLabel />,
    )
    expect(getByText('???')).toBeInTheDocument()
    expect(getByText('HIDDEN')).toBeInTheDocument()
    expect(queryByText('Polymath')).toBeNull()
  })

  it("a hidden achievement in 'earned' state shows its real name", () => {
    const a = makeAchievement({
      id: 'polymath',
      title: 'Polymath',
      category: 'hidden',
      iconKey: 'polymath',
      status: 'earned',
      earnedOn: '2026-04-01',
    })
    const { getByText, queryByText } = render(
      <PassportStamp achievement={a} state="earned" showLabel />,
    )
    expect(getByText('Polymath')).toBeInTheDocument()
    expect(queryByText('???')).toBeNull()
  })
})

describe('PassportStamp — rotation is deterministic per id', () => {
  it('the same id always renders the same rotation', () => {
    const a = makeAchievement({ id: 'streak-30' })
    const r1 = render(<PassportStamp achievement={a} state="earned" rotated />)
    const t1 = (r1.container.firstElementChild as HTMLElement).style.transform
    r1.unmount()
    const r2 = render(<PassportStamp achievement={a} state="earned" rotated />)
    const t2 = (r2.container.firstElementChild as HTMLElement).style.transform
    expect(t1).toBe(t2)
  })

  it('two different ids generally render different rotations', () => {
    const a = makeAchievement({ id: 'streak-30' })
    const b = makeAchievement({ id: 'first-cert' })
    const r1 = render(<PassportStamp achievement={a} state="earned" rotated />)
    const t1 = (r1.container.firstElementChild as HTMLElement).style.transform
    r1.unmount()
    const r2 = render(<PassportStamp achievement={b} state="earned" rotated />)
    const t2 = (r2.container.firstElementChild as HTMLElement).style.transform
    // 8 possible bucket positions in the hash — small chance these
    // collide, but the two demo ids picked above don't.
    expect(t1).not.toBe(t2)
  })

  it("`rotated={false}` always produces rotate(0deg)", () => {
    const a = makeAchievement({ id: 'streak-30' })
    const { container } = render(
      <PassportStamp achievement={a} state="earned" rotated={false} />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.transform).toBe('rotate(0deg)')
  })
})

describe('PassportStamp — color resolution by category', () => {
  it("uses the category's --ink-* token (not faded brown) when not locked", () => {
    const a = makeAchievement({ category: 'achievements' })
    const { container } = render(
      <PassportStamp achievement={a} state="earned" />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.color).toBe('var(--ink-achievements)')
  })

  it("uses --ink-streaks for streaks", () => {
    const a = makeAchievement({ category: 'streaks' })
    const { container } = render(
      <PassportStamp achievement={a} state="within-reach" />,
    )
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.color).toBe('var(--ink-streaks)')
  })
})
