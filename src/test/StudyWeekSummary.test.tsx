import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { StudyWeekSummary } from '@/components/learning/study-calendar/StudyWeekSummary'
import {
  studyWeeks,
  studyCalendarFor,
  STUDY_CALENDAR_TODAY,
  XCEL_CE_STUDY_CALENDAR,
  XCEL_LH_STUDY_CALENDAR,
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
    // progress" — it is a week with a problem in it, and the chip has to say so.
    const cal = {
      ...XCEL_LH_STUDY_CALENDAR,
      tasks: [
        { ...XCEL_LH_STUDY_CALENDAR.tasks[0], id: 'a', dueDate: '2026-05-18', status: 'completed' as const },
        { ...XCEL_LH_STUDY_CALENDAR.tasks[0], id: 'b', dueDate: '2026-05-18', status: 'not-started' as const },
      ],
    }
    const [week] = studyWeeks(cal, STUDY_CALENDAR_TODAY)
    expect(week.overdue).toBe(1)
    expect(week.status).toBe('overdue')
  })
})

describe('the band', () => {
  it('opens on the week the learner is IN, not week 1', () => {
    // The CE plan's first three weeks are complete. Leading with them would put
    // three rows of history above the row that matters, and on Home the learner
    // never reaches the fourth.
    renderBand()
    const weeks = studyWeeks(XCEL_CE_STUDY_CALENDAR)
    const current = weeks.find((w) => w.status !== 'complete')!
    const rows = screen.getAllByRole('listitem')
    expect(within(rows[0]).getByText(current.label)).toBeInTheDocument()
  })

  it('states the position in the WHOLE plan, so four rows do not imply four weeks', () => {
    renderBand()
    const weeks = studyWeeks(XCEL_CE_STUDY_CALENDAR)
    const current = weeks.find((w) => w.status !== 'complete')!
    expect(
      screen.getByText(new RegExp(`Week ${current.index} of ${weeks.length}`)),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeLessThan(weeks.length)
  })

  it('is a summary — every row leaves for the plan rather than acting in place', () => {
    // The rule that keeps this from becoming a second Study Plan. If a row ever
    // grows a "mark complete", there are two places to do one thing.
    renderBand()
    for (const row of screen.getAllByRole('listitem')) {
      const links = within(row).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      for (const l of links) {
        expect(l.getAttribute('href')).toBe('/dashboard-rebrand?section=study-plan')
      }
      expect(within(row).queryByRole('button')).toBeNull()
    }
  })

  it('uses the authored week theme, not "Week N"', () => {
    // The fallback exists, but a plan with themes must show them — that is the
    // whole reason the band tells a learner anything they did not already know.
    renderBand()
    expect(screen.queryByText(/^Week \d+$/)).toBeNull()
  })
})
