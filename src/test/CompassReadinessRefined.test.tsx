import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { DESIGN_SURFACE_LABELS } from '@/context/designSurface'
import { CompassJeffMvpShell } from '@/components/learning/CompassJeffMvpShell'
import { CompassReadinessRefined } from '@/components/learning/CompassReadinessRefined'
import {
  READY_AT,
  REFINED_READINESS as R,
  bandFor,
  daysToExam,
  paceVerdict,
  pacePerWeek,
  pointsToReady,
  stalestSubTopic,
  topicsWeakestFirst,
  weakestSubTopic,
  weeksToExam,
  weeksToReady,
  type RefinedReadiness,
} from '@/data/compassReadinessRefinedFixtures'

/**
 * THE REFINED READINESS PAGE against the research it was built from —
 * Nina Conrad, "Compass Rapid Insights: Your Exam Prep", Nov 2026.
 *
 * Each `describe` below is one of the report's findings. The point of pinning
 * them is that every one of these is a regression that LOOKS like an
 * improvement: "27 to ready" is shorter than a sentence about weeks, a
 * second ring is more to look at, "blueprint-weighted" is more precise than
 * "weighted by how much of the exam each topic is". The report says the
 * learners did not read them that way.
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

const text = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('Refined Readiness — the data is derived, not typed', () => {
  it('bands every score the way the levels panel says', () => {
    expect(bandFor(0).label).toBe('Beginner')
    expect(bandFor(39).label).toBe('Beginner')
    expect(bandFor(40).label).toBe('Developing')
    expect(bandFor(64).label).toBe('Developing')
    expect(bandFor(65).label).toBe('Proficient')
    expect(bandFor(84).label).toBe('Proficient')
    expect(bandFor(85).label).toBe('Ready')
    expect(bandFor(100).label).toBe('Ready')
  })

  it('reads the pace off the trend and the exam off the dates', () => {
    expect(pointsToReady(R.overall)).toBe(READY_AT - 62)
    expect(pacePerWeek(R)).toBe(2)
    expect(weeksToReady(R)).toBe(12)
    expect(daysToExam(R)).toBe(70)
    expect(weeksToExam(R)).toBe(10)
  })

  it('says the learner is behind, and by how much — the demo state is deliberately that one', () => {
    const v = paceVerdict(R)
    expect(v.kind).toBe('behind')
    if (v.kind === 'behind') {
      expect(v.weeksShort).toBe(2)
      expect(v.neededPerWeek).toBe(2.3)
    }
  })

  it('handles the other three verdicts without printing Infinity', () => {
    const onTrack: RefinedReadiness = { ...R, plannedExamOn: '2027-03-01' }
    expect(paceVerdict(onTrack).kind).toBe('on-track')
    const flat: RefinedReadiness = { ...R, delta: 0 }
    expect(weeksToReady(flat)).toBeNull()
    expect(paceVerdict(flat).kind).toBe('no-pace')
    const ready: RefinedReadiness = { ...R, overall: 86 }
    expect(paceVerdict(ready).kind).toBe('ready')
  })

  it('finds the weakest sub-topic, and the stalest one that is not it', () => {
    const w = weakestSubTopic(R)
    expect(w.sub.name).toBe('Variable annuities')
    expect(w.topic.name).toBe('Annuities')
    const s = stalestSubTopic(R)
    expect(s?.sub.name).toBe('Settlement options')
    expect(s?.sub.lastPracticedDaysAgo).toBe(9)
  })

  it('orders topics weakest first', () => {
    expect(topicsWeakestFirst(R).map((t) => t.name)).toEqual([
      'Annuities',
      'Policy Provisions',
      'Insurance Regulation',
      'Health Insurance',
      'Life Insurance',
    ])
  })
})

describe('Finding 4 — "27 to ready" becomes time against the exam', () => {
  it('never prints "points to Ready"', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    expect(text(container)).not.toMatch(/points to Ready/i)
    expect(text(container)).not.toMatch(/\d+ to ready/i)
  })

  it('states the threshold and the pace in one sentence, with the exam date', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    const t = text(container)
    expect(t).toContain(`Ready starts at ${READY_AT}`)
    expect(t).toContain('about 2 points a week')
    expect(t).toContain('about 12 weeks')
    expect(t).toContain('2 weeks after your exam')
    expect(t).toContain('about 2.3 points a week')
    expect(t).toContain('Exam Jan 18 · 10 weeks away')
  })
})

describe('Finding 1 — the ring pairs a label with the visual', () => {
  it('puts the level inside the ring', () => {
    wrap(<CompassReadinessRefined />)
    const ring = screen.getByRole('img', { name: /Readiness 62 out of 100, Developing/ })
    const center = ring.parentElement?.querySelector('.cre-rdr-ring__center')
    expect(center).toBeTruthy()
    expect(text(center as HTMLElement)).toBe('62Developing')
  })
})

describe('Finding 3 — one ring; questions answered is a count, not a second ring', () => {
  it('draws exactly one arc and names the questions answered in words', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    expect(container.querySelectorAll('.cre-rdr-ring__arc')).toHaveLength(1)
    expect(text(container)).toContain('122 of 265')
    expect(text(container)).not.toMatch(/\bCoverage\b/)
  })
})

describe('Finding 7 — the overall score is not repeated across the page', () => {
  it('shows 62 exactly twice: the ring and the end of the trend line', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    /* Counted per TEXT NODE, not on the joined textContent — adjacent nodes
       concatenate ("62" + "Developing" → "62Developing") and a word boundary
       never falls between a digit and a letter. No sub-topic on this learner
       scores 62. */
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    const hits: string[] = []
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      /* `getAttribute`, not `.className` — on an SVG `<text>` that is an
         SVGAnimatedString and stringifies to "[object SVGAnimatedString]". */
      if (/\b62\b/.test(n.textContent ?? '')) hits.push(n.parentElement?.getAttribute('class') ?? '')
    }
    expect(hits).toHaveLength(2)
    expect(hits.some((c) => c.includes('cre-rdr-ring__num'))).toBe(true)
    expect(hits.some((c) => c.includes('cre-rdr-chart__now'))).toBe(true)
  })
})

describe('Recommendation 3 — plain language', () => {
  it('uses none of the phrases the report named, nor Jeff’s', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    const t = text(container).toLowerCase()
    for (const phrase of [
      'blueprint',
      'thinnest margin',
      'closest to the line',
      'keep warm',
      'lives in atlas',
      'biggest lift',
      'lift',
      'evidence',
      'retested',
      'spaced',
      'coverage',
    ]) {
      expect(t, `found "${phrase}"`).not.toContain(phrase)
    }
  })
})

describe('Recommendation 4 — one comparable scale', () => {
  it('gives every topic and every sub-topic the same bar with the Ready tick', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    const bars = container.querySelectorAll('.cre-rdr-bar')
    /* Five topics + the first (expanded) topic's three sub-topics. */
    expect(bars).toHaveLength(5 + 3)
    for (const bar of bars) {
      expect(bar.querySelector('.cre-rdr-bar__tick[data-ready]')).toBeTruthy()
    }
  })

  it('names the thresholds on the trend chart in the same words as the levels', () => {
    wrap(<CompassReadinessRefined />)
    const chart = screen.getByRole('img', { name: /Readiness rose from 56/ })
    const t = text(chart)
    expect(t).toContain('Developing 40')
    expect(t).toContain('Proficient 65')
    expect(t).toContain('Ready 85')
  })
})

describe('Finding 8 and the one-offs — one primary, somewhere to read', () => {
  it('has one full-size primary on the page, on the weakest sub-topic', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    const primaries = container.querySelectorAll('.cre-rdr-primary:not(.cre-rdr-primary--sm)')
    expect(primaries).toHaveLength(1)
    expect(text(primaries[0] as HTMLElement)).toContain('Start practice · 12 questions, about 12 min')
    expect(text(container)).toContain('Practice Variable annuities')
  })

  it('offers the lesson beside practice', () => {
    wrap(<CompassReadinessRefined />)
    expect(screen.getByRole('button', { name: /Read the lesson first/ })).toBeTruthy()
  })

  it('keeps Ask Rubi', () => {
    wrap(<CompassReadinessRefined />)
    expect(screen.getByRole('button', { name: /Ask Rubi/ })).toBeTruthy()
  })

  it('routes the primary to Practice and the lesson link to Learn', async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    wrap(<CompassReadinessRefined onSelectPage={(p) => seen.push(p)} />)
    await user.click(screen.getByRole('button', { name: /Start practice/ }))
    await user.click(screen.getByRole('button', { name: /Read the lesson first/ }))
    expect(seen).toEqual(['practice', 'learn'])
  })
})

describe('Finding 5 — the topic view turns a score into a next action', () => {
  it('opens the weakest topic by default and expands the others on demand', async () => {
    const user = userEvent.setup()
    wrap(<CompassReadinessRefined />)
    expect(screen.getByRole('button', { name: 'Hide Annuities sub-topics' })).toBeTruthy()
    const show = screen.getByRole('button', { name: 'Show Policy Provisions sub-topics' })
    await user.click(show)
    expect(screen.getByText('Riders')).toBeTruthy()
    expect(screen.getByText('Practiced 9 days ago')).toBeTruthy()
  })

  it('marks the weakest sub-topic in each row and gives it the small primary', () => {
    const { container } = wrap(<CompassReadinessRefined />)
    const weak = container.querySelector('.cre-rdr-sub[data-weakest]') as HTMLElement
    expect(within(weak).getByText('Variable annuities')).toBeTruthy()
    expect(within(weak).getByRole('button', { name: 'Practice · 12 min' })).toBeTruthy()
  })
})

describe('The Readiness to Pass flag — the tested rings, with a key that matches', () => {
  it('is a design control scoped to the Refined surface, defaulting to the single ring', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-refined-readiness-hero')
    expect(flag?.surface).toBe('design')
    expect(flag?.surfaces).toEqual(['compass:refined'])
    expect(flag?.defaultVariant).toBe('single')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['single', 'rings'])
  })

  it('draws three rings and a three-item key — one line per ring, no more', () => {
    const { container } = wrap(<CompassReadinessRefined hero="rings" />)
    const arcs = container.querySelectorAll(
      '.cre-rdr-ring__arc, .cre-rdr-ring__arc--practice, .cre-rdr-ring__arc--simulators',
    )
    const keyRows = container.querySelectorAll('.cre-rdr-key li')
    expect(arcs).toHaveLength(3)
    expect(keyRows).toHaveLength(arcs.length)
    const t = text(container)
    expect(t).toContain('122 of 265 answered')
    expect(t).toContain('1 of 3 taken')
    /* "Book your exam" was the item that broke the tested key — a one-time
       task cannot fill a ring — so it is not in this one. */
    expect(t).not.toMatch(/book your exam/i)
  })

  it('keeps the level inside the ring on the rings arm too', () => {
    wrap(<CompassReadinessRefined hero="rings" />)
    const ring = screen.getByRole('img', { name: /Readiness 62 out of 100, Developing/ })
    const center = ring.parentElement?.querySelector('.cre-rdr-ring__center')
    expect(text(center as HTMLElement)).toBe('62Developing')
  })

  it('reaches the page through the shell', () => {
    const { container } = wrap(
      <CompassJeffMvpShell page="readiness" onSelectPage={() => {}} readiness="refined" readinessHero="rings" />,
    )
    expect(container.querySelector('.cre-rdr-ring--three')).toBeTruthy()
  })
})

describe('The third Compass version', () => {
  it('is the third arm of the Compass version control', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-mvp-version')
    expect(flag?.variants?.map((v) => v.value)).toEqual(['current', 'jeff', 'refined'])
    expect(flag?.surfaces).toContain('compass:refined')
  })

  it('is named on the Design bar', () => {
    expect(DESIGN_SURFACE_LABELS['compass:refined']).toBe('Compass · Refined')
  })

  it('renders inside Jeff’s shell when the shell is told to, and his page otherwise', () => {
    const refined = wrap(
      <CompassJeffMvpShell page="readiness" onSelectPage={() => {}} readiness="refined" />,
    )
    expect(refined.container.querySelector('.cre-rdr')).toBeTruthy()
    expect(refined.container.querySelector('.cjm-next')).toBeNull()
    refined.unmount()
    const his = wrap(<CompassJeffMvpShell page="readiness" onSelectPage={() => {}} />)
    expect(his.container.querySelector('.cre-rdr')).toBeNull()
    expect(his.container.querySelector('.cjm-next')).toBeTruthy()
  })
})
