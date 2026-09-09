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

function seed(variant: string, ceStudyPlan = true) {
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({
      'clp-jump-back-in': { enabled: true, variant },
      'ce-study-plan': { enabled: ceStudyPlan },
    }),
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

  it('shows at most two tasks — what the real row height allows', () => {
    // TWO, not the three this held before the rows became the Study Plan's own
    // `TaskRow`. That component is ~112px in this column against the ~66px of
    // the bespoke row it replaced, so three no longer fit. Measured at a narrow
    // pane and at 1600px: two either way. See TODAYS_TASKS_VISIBLE.
    seed('todays-tasks')
    renderBand()
    const rendered = screen.getAllByText(/·\s*\d+\s*min/)
    expect(rendered.length).toBeLessThanOrEqual(2)
    expect(rendered.length).toBe(
      Math.min(2, tasksOnDate(studyCalendarFor(PLANNED.id), STUDY_CALENDAR_TODAY).length),
    )
  })

  it('keeps the title readable in a narrow card', () => {
    /*
     * `TaskRow`'s status cluster is `flexShrink: 0` at ~110px, so in this
     * ~255px card the title column collapsed to 48px and `overflow-wrap:
     * anywhere` broke words mid-syllable ("Insura / nce"). It shipped that way
     * for two commits — the pre-licensing titles were long enough to wrap
     * badly but short enough not to look obviously wrong.
     *
     * `compact` wraps now, dropping the status onto its own line. Asserted on
     * the title column's WIDTH, because the rendered text is identical either
     * way — the defect was only ever visible as layout.
     */
    seed('todays-tasks')
    const { container } = renderBand()
    const row = container.querySelector('.cre-task-card') as HTMLElement | null
    expect(row).toBeTruthy()
    const titleCol = row!.children[1] as HTMLElement
    expect(titleCol.style.minWidth).toBe('150px')
    expect(row!.style.flexWrap).toBe('wrap')
  })

  it('uses the Study Plan’s own row, not a lookalike', () => {
    // The row carries things a visual copy did not: a status badge and, on an
    // in-progress task, a progress bar. Asserting one of those is what stops a
    // future "simplify this row" from quietly re-forking the two surfaces.
    seed('todays-tasks')
    const { container } = renderBand()
    expect(screen.getByText(/in progress/i)).toBeInTheDocument()
    expect(container.querySelector('[role="progressbar"]')).toBeTruthy()
  })

  it('shows the CE path its own tasks — never another brand’s', () => {
    /*
     * The regression this exists for. `studyCalendarFor` falls back to STC's
     * Series 79 plan for any id it does not know, so the first build of this
     * variant rendered "Complete Greenlight 1", a securities task, under
     * Florida Life & Health CE. Nothing failed; it took looking at the page.
     *
     * CE has a plan of its own now (`ce-study-plan`, default ON), so the
     * assertion is no longer "falls back to Up Next" — it is that whatever
     * shows belongs to THIS path.
     */
    seed('todays-tasks')
    renderBand(UNPLANNED)
    expect(screen.queryByText(/greenlight/i)).toBeNull()
    expect(screen.getByText(/today's tasks/i)).toBeInTheDocument()
    const ceTasks = tasksOnDate(studyCalendarFor(UNPLANNED.id), STUDY_CALENDAR_TODAY)
    expect(ceTasks.length).toBeGreaterThan(0)
    for (const t of ceTasks.slice(0, 2)) {
      expect(screen.getByText(new RegExp(t.title.slice(0, 24), 'i'))).toBeInTheDocument()
    }
  })

  it('falls back to Up Next for CE when ce-study-plan is off', () => {
    // The prior behaviour, kept as a toggle rather than deleted: only the two
    // pre-licensing paths had a plan, and CE took the empty branch.
    seed('todays-tasks', false)
    renderBand(UNPLANNED)
    expect(screen.queryByText(/today's tasks/i)).toBeNull()
    expect(screen.getByText(/up next/i)).toBeInTheDocument()
  })

})
