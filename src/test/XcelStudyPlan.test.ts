import { describe, it, expect } from 'vitest'
import {
  STUDY_CALENDAR,
  STUDY_CALENDAR_TODAY,
  XCEL_LH_STUDY_CALENDAR,
  hasStudyCalendarFor,
  studyCalendarFor,
  supportsStudyPlan,
} from '@/data/studyCalendarFixtures'
import { calendarLengthsForPath, SERIES_79_CALENDAR_LENGTHS } from '@/data/createCalendarOptions'
import { learningPathsFor } from '@/data/learningFixtures'
import type { Brand } from '@/context/AccountContext'

/**
 * XCEL is the second brand with a Study Plan. The failure mode this file
 * guards is not "the plan is missing" — it is the plan being SILENTLY WRONG:
 * an XCEL path falling through `studyCalendarFor`'s chain and rendering the
 * Series 79 securities plan under an insurance heading. That looks plausible
 * on a screenshot and is only obvious if you read the task titles.
 */

const ALL_BRANDS: Brand[] = ['cre', 'mckissock', 'elite', 'fitzgerald', 'stc', 'xcel']

describe('XCEL Study Plan', () => {
  it('is offered by exactly STC and XCEL', () => {
    expect(ALL_BRANDS.filter(supportsStudyPlan)).toEqual(['stc', 'xcel'])
  })

  it('qualifies the two pre-licensing paths and NOT the CE path', () => {
    // CE is deliberately excluded: a renewal cycle with a variable,
    // sometimes birthday-based deadline is not a countdown to a booked exam.
    expect(hasStudyCalendarFor('xcel', 'xcel-fl-lh-prelicensing')).toBe(true)
    expect(hasStudyCalendarFor('xcel', 'xcel-fl-pc-prelicensing')).toBe(true)
    expect(hasStudyCalendarFor('xcel', 'xcel-fl-lh-ce')).toBe(false)
    // A brand without the feature never qualifies, even for a real path id.
    expect(hasStudyCalendarFor('elite', 'xcel-fl-lh-prelicensing')).toBe(false)
    // …and STC's own paths are unaffected.
    expect(hasStudyCalendarFor('stc', 'series-79-15day')).toBe(true)
  })

  it('never resolves an XCEL path to the Series 79 plan', () => {
    // The whole point. `studyCalendarFor` ends in a bare `return
    // STUDY_CALENDAR`, so an unhandled id gets securities content.
    for (const pathId of ['xcel-fl-lh-prelicensing', 'xcel-fl-pc-prelicensing']) {
      const cal = studyCalendarFor(pathId)
      expect(cal.id).not.toBe(STUDY_CALENDAR.id)
      expect(cal.examName).toMatch(/Insurance Producer Exam/)
      expect(cal.tasks.some((t) => /series/i.test(t.title))).toBe(false)
    }
  })

  it('shares its exam date with the learning path it belongs to', () => {
    // Two fixtures, one fact. `examDate` here is ISO; the path's is mm/dd/yyyy.
    const path = learningPathsFor('xcel').find((p) => p.id === 'xcel-fl-lh-prelicensing')
    expect(path?.examDate).toBe('06/12/2026')
    expect(XCEL_LH_STUDY_CALENDAR.examDate).toBe('2026-06-12')
  })

  it('lands mid-plan on the demo "today", roughly matching the path\'s progress', () => {
    const { tasks } = XCEL_LH_STUDY_CALENDAR
    const completed = tasks.filter((t) => t.status === 'completed').length
    const inProgress = tasks.filter((t) => t.status === 'in-progress')
    expect(completed).toBeGreaterThan(0)
    expect(inProgress).toHaveLength(1)
    // The one in-progress task is today's, and it carries a progress value —
    // `StudyTask` requires one for that status.
    expect(inProgress[0].dueDate).toBe(STUDY_CALENDAR_TODAY)
    expect(inProgress[0].progress).toBeGreaterThan(0)
    // Nothing is overdue: this is the ON-TRACK demo state.
    expect(tasks.filter((t) => t.status === 'overdue')).toHaveLength(0)
    // ~32% by task count against the path's 30% by credit hour. They are
    // different measures, so this is a loose band, not an equality.
    const pct = (completed / tasks.length) * 100
    expect(pct).toBeGreaterThan(25)
    expect(pct).toBeLessThan(40)
  })

  it('carries the 3-Part Program: review notes self-marked, simulators last and ordered', () => {
    const { tasks } = XCEL_LH_STUDY_CALENDAR
    // Review Notes are read-and-self-mark, unlike the video/quiz tasks the LMS
    // completes for you. That distinction drives the "Mark as complete" CTA.
    const notes = tasks.filter((t) => t.title.startsWith('Read Review Notes'))
    expect(notes.length).toBeGreaterThan(0)
    expect(notes.every((t) => t.isCourseLinked === false)).toBe(true)
    // The Livestream Exam Review is a scheduled live session, so `custom`.
    expect(tasks.find((t) => t.id === 'xcel-lh-livestream')?.kind).toBe('custom')
    // Three simulators, all on the last day, in order. XCEL unlocks each only
    // when the previous is complete and `StudyTask` cannot express that, so the
    // ORDER is the whole dependency — if a refactor reorders the array, the
    // sequence silently breaks.
    const sims = tasks.filter((t) => t.kind === 'exam')
    expect(sims.map((t) => t.id)).toEqual(['xcel-lh-sim-1', 'xcel-lh-sim-2', 'xcel-lh-sim-3'])
    const lastDue = tasks.reduce((m, t) => (t.dueDate > m ? t.dueDate : m), '')
    expect(sims.every((t) => t.dueDate === lastDue)).toBe(true)
    // …and that last day is inside the 24 hours before the exam.
    expect(lastDue < XCEL_LH_STUDY_CALENDAR.examDate).toBe(true)
  })

  it('gives XCEL paths their own plan lengths and leaves everyone else on the fallback', () => {
    const xcelLengths = calendarLengthsForPath('xcel-fl-lh-prelicensing')
    expect(xcelLengths).not.toBe(SERIES_79_CALENDAR_LENGTHS)
    // The assigned demo calendar's id must BE one of the offered lengths, or
    // the Edit Calendar dropdown opens with nothing selected.
    expect(xcelLengths.map((o) => o.id)).toContain(XCEL_LH_STUDY_CALENDAR.id)
    // Unmapped ids — including STC's and the no-path case — keep the old list.
    expect(calendarLengthsForPath('series-79-15day')).toBe(SERIES_79_CALENDAR_LENGTHS)
    expect(calendarLengthsForPath(undefined)).toBe(SERIES_79_CALENDAR_LENGTHS)
  })
})
