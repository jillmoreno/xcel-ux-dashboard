import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudyWeekSummary } from '@/components/learning/study-calendar/StudyWeekSummary'
import { DEMO_PERSONAS } from '@/components/prototype/demoControlsUtil'
import { dayStatusOf } from '@/components/learning/study-calendar/studyStatusColors'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import {
  studyWeeks,
  studyCalendarFor,
  STUDY_CALENDAR_TODAY,
  XCEL_CE_STUDY_CALENDAR,
  XCEL_LH_STUDY_CALENDAR,
  type StudyCalendar,
} from '@/data/studyCalendarFixtures'

/**
 * The Home week-summary band, and the grouping behind it.
 */

const renderBand = (calendar = XCEL_CE_STUDY_CALENDAR) =>
  render(
    <MemoryRouter>
      <StudyWeekSummary calendar={calendar} />
    </MemoryRouter>,
  )

describe('studyWeeks', () => {
  it('accounts for every task exactly once', () => {
    // Grouping by date is where a task quietly falls between two buckets. The
    // week rows are a summary of the whole plan, so a lost task means the
    // learner is told they have less to do than they do.
    for (const cal of [XCEL_LH_STUDY_CALENDAR, XCEL_CE_STUDY_CALENDAR]) {
      const weeks = studyWeeks(cal)
      expect(weeks.reduce((n, w) => n + w.total, 0)).toBe(cal.tasks.length)
      const ids = weeks.flatMap((w) => w.tasks.map((t) => t.id))
      expect(new Set(ids).size).toBe(cal.tasks.length)
    }
  })

  it('groups into SUN–SAT calendar weeks, matching the plan’s own grid', () => {
    for (const week of studyWeeks(XCEL_LH_STUDY_CALENDAR)) {
      expect(new Date(`${week.start}T00:00:00Z`).getUTCDay(), week.start).toBe(0)
      expect(new Date(`${week.end}T00:00:00Z`).getUTCDay(), week.end).toBe(6)
      for (const t of week.tasks) {
        expect(t.dueDate >= week.start && t.dueDate <= week.end).toBe(true)
      }
    }
  })

  it('drops empty weeks rather than rendering "0 of 0 done"', () => {
    // XCEL's CE plan is paced at two days a week over six months, so it has
    // real gaps. A row per empty week is noise a learner scrolls past.
    for (const w of studyWeeks(XCEL_CE_STUDY_CALENDAR)) expect(w.total).toBeGreaterThan(0)
  })

  it('lets OVERDUE outrank in-progress', () => {
    // A week that is 4-of-5 done with one task past its date is not "in
    // progress" — it is a week with a problem in it.
    const cal: StudyCalendar = {
      ...XCEL_LH_STUDY_CALENDAR,
      tasks: [
        { ...XCEL_LH_STUDY_CALENDAR.tasks[0], id: 'a', dueDate: '2026-05-18', status: 'completed' },
        { ...XCEL_LH_STUDY_CALENDAR.tasks[0], id: 'b', dueDate: '2026-05-18', status: 'upcoming' },
      ],
    }
    const [week] = studyWeeks(cal, STUDY_CALENDAR_TODAY)
    expect(week.overdue).toBe(1)
    expect(week.status).toBe('overdue')
  })
})

describe('the band', () => {
  it('shows all SEVEN days of the week, including the empty ones', () => {
    // The point of a calendar row: a day with nothing on it says "nothing due",
    // which a list of only-the-busy-days cannot. The first build of this band
    // was a list of WEEKS and could not answer "which days have work".
    renderBand()
    const cells = screen.getAllByRole('listitem')
    expect(cells.length).toBe(7)
    for (const dow of ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']) {
      expect(screen.getByText(dow)).toBeInTheDocument()
    }
  })

  it('runs Sunday → Saturday, matching the plan’s own month grid', () => {
    renderBand()
    expect(
      screen.getAllByRole('listitem').map((li) => li.textContent?.slice(0, 3)),
    ).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'])
  })

  it('counts each day’s tasks, and shows a dash rather than "0 tasks"', () => {
    // A zero invites the reading that something failed to load.
    //
    // Read from the ACCESSIBLE LABEL, not the cell's text: the day number and
    // the count run together in `textContent` ("SUN172 tasks"), so a regex over
    // it happily reports 172 tasks. That the label is the reliable source here
    // is also the point of it existing.
    const week = studyWeeks(XCEL_CE_STUDY_CALENDAR).find((w) => w.end >= STUDY_CALENDAR_TODAY)!
    renderBand()
    const shown = screen
      .getAllByRole('link')
      .map((a) => Number(a.getAttribute('aria-label')?.match(/: (\d+) tasks?/)?.[1] ?? 0))
      .reduce((a, b) => a + b, 0)
    expect(shown).toBe(week.tasks.length)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('states the position in the WHOLE plan, so seven days do not imply one week', () => {
    renderBand()
    const weeks = studyWeeks(XCEL_CE_STUDY_CALENDAR)
    const current = weeks.find((w) => w.end >= STUDY_CALENDAR_TODAY)!
    expect(screen.getByText(`Week ${current.index} of ${weeks.length}`)).toBeInTheDocument()
  })

  it('always marks today, but yields the visible flag to a state worth reporting', () => {
    // Precedence on the flag is OVERDUE → state → TODAY. Today's cell is
    // already the only filled one, so on a day that is in progress the more
    // useful word is IN PROGRESS. What must NOT be lost is today itself, which
    // is why the accessible label carries it unconditionally.
    renderBand()
    const todayLabel = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('aria-label') ?? '')
      .find((l) => l.includes(', today'))
    expect(todayLabel).toBeTruthy()
  })

  it('is a summary — every cell leaves for the plan rather than acting in place', () => {
    // The rule that keeps this from becoming a second Study Plan. If a cell
    // ever grows a "mark complete", there are two places to do one thing.
    renderBand()
    for (const cell of screen.getAllByRole('listitem')) {
      expect(within(cell).getAllByRole('link').length).toBeGreaterThan(0)
      expect(within(cell).queryByRole('button')).toBeNull()
    }
  })
})

describe('the "Busy study plan" persona', () => {
  it('points at a plan with 30+ tasks, which is the whole reason it exists', () => {
    // The persona is a named COMBINATION of controls that already exist —
    // Education picks the path, the path owns the calendar — so what can break
    // it is the plan behind it thinning out, not the flags. Asserted against
    // the plan the persona's education variant resolves to, and on the COUNT,
    // because "dense" is the entire product of this demo affordance.
    const persona = DEMO_PERSONAS.find((p) => p.id === 'heavy-plan')!
    const edu = persona.flags.find((f) => f.key === 'dashboard-education-type')!.variant!
    const path = dashboardProgressPersonaFor('xcel', 'progress-on-track', edu as never)!.path
    const calendar = studyCalendarFor(path.id)
    expect(calendar.tasks.length).toBeGreaterThan(30)
    // …and spread, not dumped in one week. A 37-task plan that is 37 tasks on
    // one Tuesday demonstrates nothing about a week strip.
    const weeks = studyWeeks(calendar)
    expect(weeks.length).toBeGreaterThanOrEqual(4)
    expect(Math.max(...weeks.map((w) => w.total))).toBeLessThan(calendar.tasks.length / 2)
  })
})

describe('per-day state', () => {
  it('colours and labels each day by the SAME rule the Study Plan uses', () => {
    // The ask: the plan shows the 18th complete and the 19th in progress, so
    // Home should say so too. Asserted against `dayStatusOf` — the function
    // BOTH surfaces call — rather than against "MON 18 is green", which would
    // pass while the two drifted.
    const week = studyWeeks(XCEL_LH_STUDY_CALENDAR).find((w) => w.end >= STUDY_CALENDAR_TODAY)!
    render(
      <MemoryRouter>
        <StudyWeekSummary calendar={XCEL_LH_STUDY_CALENDAR} />
      </MemoryRouter>,
    )
    const labels = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('aria-label') ?? '')
      .filter((l) => /^[A-Z]{3} \d+:/.test(l))
    expect(labels).toHaveLength(7)

    for (const label of labels) {
      const dom = Number(label.match(/^[A-Z]{3} (\d+):/)![1])
      const tasks = week.tasks.filter((t) => Number(t.dueDate.slice(8, 10)) === dom)
      if (tasks.length === 0) continue
      const expected = dayStatusOf(tasks, tasks[0].dueDate, STUDY_CALENDAR_TODAY)
      if (expected && expected !== 'upcoming') {
        expect(label, `${dom} should report ${expected}`).toContain(STATUS_WORDS[expected])
      }
    }
  })

  it('never carries a day’s state on colour alone', () => {
    // A coloured dot and nothing else fails for anyone who cannot see the hue.
    // Every state the dot distinguishes also appears as a word — in the visible
    // flag AND in the accessible label.
    render(
      <MemoryRouter>
        <StudyWeekSummary calendar={XCEL_LH_STUDY_CALENDAR} />
      </MemoryRouter>,
    )
    expect(screen.getByText('DONE')).toBeInTheDocument()
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument()
    const labels = screen
      .getAllByRole('link')
      .map((a) => a.getAttribute('aria-label') ?? '')
      .filter((l) => /^[A-Z]{3} \d+:/.test(l))
    expect(labels.some((l) => l.includes('complete'))).toBe(true)
    expect(labels.some((l) => l.includes('in progress'))).toBe(true)
  })
})

const STATUS_WORDS: Record<string, string> = {
  overdue: 'overdue',
  'in-progress': 'in progress',
  completed: 'complete',
}
