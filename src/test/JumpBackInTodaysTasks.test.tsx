import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { LearnerFocusedBand } from '@/components/membership/v5/LearnerFocusedBand'
import { learningPathsFor } from '@/data/learningFixtures'
import {
  STUDY_CALENDAR_TODAY,
  studyCalendarFor,
  tasksOnDate,
} from '@/data/studyCalendarFixtures'

/**
 * `clp-jump-back-in` — the Jump Back In card's layout inside the Current
 * Learning Path band. "Up Next" lists not-started COURSES; "Today's Tasks"
 * compresses the resume block and lists today's tasks from the STUDY PLAN.
 */

/** A path that HAS a study plan, and one that deliberately does not. */
const PLANNED = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-prelicensing')!
const UNPLANNED = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-ce')!

function seed(variant: string) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({ 'clp-jump-back-in': { enabled: true, variant } }),
  )
}

function renderBand(path = PLANNED) {
  return render(
    <AccountProvider>
      <FeatureFlagProvider>
        <MemoryRouter>
          <LearnerFocusedBand path={path} pathsCount={1} onViewDetails={vi.fn()} />
        </MemoryRouter>
      </FeatureFlagProvider>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
})

describe('Jump Back In — Up Next (the shipped card)', () => {
  it('lists courses under "Up next", and no study-plan tasks', () => {
    seed('up-next')
    renderBand()
    expect(screen.getByText(/up next/i)).toBeInTheDocument()
    expect(screen.queryByText(/today's tasks/i)).toBeNull()
  })
})

describe("Jump Back In — Today's Tasks", () => {
  it('lists today’s tasks from THIS path’s plan', () => {
    seed('todays-tasks')
    renderBand()
    expect(screen.getByText(/today's tasks/i)).toBeInTheDocument()
    expect(screen.queryByText(/up next/i)).toBeNull()

    // The real tasks, read from the same resolver the page uses — asserting
    // the fixture's own titles rather than a copy that can drift.
    const tasks = tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY)
    expect(tasks.length).toBeGreaterThan(0)
    for (const t of tasks) {
      expect(screen.getByText(new RegExp(t.title.slice(0, 24), 'i'))).toBeInTheDocument()
    }
  })

  it('titles the card, in the same eyebrow style as the section below it', () => {
    seed('todays-tasks')
    const { container } = renderBand()
    // Matched on the START of the text: the tasks heading carries a count now
    // ("Today's tasks (2)"), so an exact-match filter silently drops it and the
    // style comparison below would compare one element to itself.
    const eyebrows = [...container.querySelectorAll('p')].filter((p) =>
      /^(jump back in|today's tasks)/i.test(p.textContent?.trim() ?? ''),
    )
    expect(eyebrows).toHaveLength(2)
    expect(eyebrows[0].textContent?.toLowerCase()).toBe('jump back in')
    expect(eyebrows[1].textContent?.toLowerCase()).toMatch(/^today's tasks/)
    // Same style, asserted rather than eyeballed: the point of the title is
    // that the card's two halves read as one level of hierarchy, so a later
    // tweak to one eyebrow that skips the other is the regression.
    const style = (el: Element) => {
      const s = (el as HTMLElement).style
      return { size: s.fontSize, weight: s.fontWeight, tracking: s.letterSpacing, color: s.color }
    }
    expect(style(eyebrows[0])).toEqual(style(eyebrows[1]))
  })

  it("counts the whole day beside the heading, not the rows on screen", () => {
    seed('todays-tasks')
    renderBand()
    const tasks = tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY)
    // The count is a <span> inside the heading, so the text spans two elements
    // — match on the container's normalised textContent rather than on a node.
    expect(
      screen.getByText((_content, el) => {
        if (!el || el.tagName !== 'P') return false
        return new RegExp(`^today's tasks \\(${tasks.length}\\)$`, 'i').test(
          (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
        )
      }),
    ).toBeInTheDocument()
  })

  it('leaves the shipped Up Next layout untitled', () => {
    // The title is part of the VARIANT. Adding it to the default would be a
    // change to what ships, which is not what was asked for.
    seed('up-next')
    renderBand()
    expect(screen.queryByText(/^jump back in$/i)).toBeNull()
  })

  it('always offers View all, even on a day that fits — it is the route in', () => {
    // It used to appear only when the day overflowed, which made the way into
    // the Study Plan come and go with the workload. Today has two tasks and
    // they all show, so this is the non-overflowing case.
    seed('todays-tasks')
    renderBand()
    const tasks = tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY)
    expect(tasks.length).toBeLessThanOrEqual(3)
    const viewAll = screen.getByRole('link', { name: /view all/i })
    expect(viewAll).toHaveAttribute('href', '/dashboard-rebrand?section=study-plan')
    // The link carries no number — the heading beside it does. Two counts
    // inches apart is one too many.
    expect(viewAll.textContent).not.toMatch(/\d/)
  })

  it('shows up to three tasks without overflowing the card', () => {
    // Three is the cap, and the card is sized for it — verified against the
    // plan's densest day (2026-06-11) by moving the clock there and measuring:
    // three rows, 85px still clear below, no overflow. Asserted here as the
    // cap, since the fixture's TODAY has two.
    seed('todays-tasks')
    renderBand()
    const rendered = screen.getAllByText(/·\s*\d+\s*min/)
    expect(rendered.length).toBeLessThanOrEqual(3)
    expect(rendered.length).toBe(
      Math.min(3, tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY).length),
    )
  })

  it('falls back to Up Next on a path with no plan — NOT another brand’s tasks', () => {
    /*
     * The regression this exists for. `studyCalendarFor` falls back to STC's
     * Series 79 plan for any id it does not know, and XCEL's CE path has no
     * plan by design — so the first build of this variant rendered "Complete
     * Greenlight 1", a securities task, under Florida Life & Health CE.
     * Nothing failed; it took looking at the page.
     */
    seed('todays-tasks')
    renderBand(UNPLANNED)
    expect(screen.queryByText(/greenlight/i)).toBeNull()
    expect(screen.queryByText(/today's tasks/i)).toBeNull()
    expect(screen.getByText(/up next/i)).toBeInTheDocument()
  })

})
