import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassStudyPlanner } from '@/components/learning/CompassStudyPlanner'
import { CompassLearningPage } from '@/components/learning/CompassLearningPage'
import {
  finishReadback,
  fmtHM,
  monthCells,
  paceName,
  periodLabel,
  schedule,
} from '@/components/learning/compassStudyPlannerModel'
import { PLANNER_PACES, PLANNER_PLAN } from '@/data/compassStudyPlannerFixtures'

/**
 * THE STUDY PLANNER — Anjani's `screen-planner` from the OCT2 master, ported
 * 2026-10-15. The port is a transcription of a prototype that runs, so what is
 * worth pinning is the part her file can enforce and a screenshot cannot: that
 * the dates the page STATES come out of the same arithmetic hers does, and
 * that the two flows — the learner's pace editor and Rubi's rebuilds — move
 * them the way hers do.
 *
 * The figures below are hers, worked by hand once so the assertions are not
 * copied off the component: 3300 minutes at 90 a weekday from Tuesday 22 Sep
 * 2026 is 37 sessions, the last on Wed 11 Nov, nine days before the 20 Nov
 * exam.
 */

afterEach(() => window.history.replaceState({}, '', '/'))

function renderPlanner() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&section=compass']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassStudyPlanner />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}
const planBar = () => screen.getByRole('region', { name: 'Your plan' })
const finishes = () => within(planBar()).getByText('Course finishes').parentElement!.textContent

describe('the model — her arithmetic, without a DOM', () => {
  const { today, exam, minsLeft, dayMins } = PLANNER_PLAN
  it('walks 37 sessions of 90 minutes to Wed 11 Nov', () => {
    const s = schedule({ today, exam, minsLeft, dayMins, off: new Set() })
    expect(Object.keys(s.map)).toHaveLength(37)
    expect(s.finish?.getMonth()).toBe(10)
    expect(s.finish?.getDate()).toBe(11)
    expect(s.leftover).toBeLessThanOrEqual(0)
    expect(finishReadback(s, dayMins, exam)).toEqual({
      finish: 'Nov 11',
      status: '9 days before your exam',
      tone: 'ok',
    })
  })
  it('says "Won\'t fit" when the hours run out before the exam', () => {
    const noFridays = [0, 90, 90, 90, 90, 0, 0]
    const s = schedule({ today, exam, minsLeft, dayMins: noFridays, off: new Set() })
    expect(s.leftover).toBe(150)
    expect(finishReadback(s, noFridays, exam).finish).toBe("Won't fit")
  })
  it('calls a tight finish tight', () => {
    const off = new Set(['2026-10-9', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13'])
    const s = schedule({ today, exam, minsLeft, dayMins, off })
    expect(finishReadback(s, dayMins, exam)).toEqual({
      finish: 'Nov 18',
      status: '2 days before your exam — that is tight',
      tone: 'warn',
    })
  })
  it('names a preset only when all seven numbers match', () => {
    expect(paceName(PLANNER_PACES[0].mins)).toBe('Crammer')
    expect(paceName([0, 90, 90, 90, 90, 90, 0])).toBe('Average')
    expect(paceName([0, 90, 90, 90, 90, 75, 0])).toBe('Custom')
  })
  it('formats minutes the way her bar reads them', () => {
    expect(fmtHM(450)).toBe('7h 30m')
    expect(fmtHM(60)).toBe('1h')
    expect(fmtHM(45)).toBe('45m')
    expect(fmtHM(0)).toBe('0m')
  })
  it('lays September 2026 out in five rows and labels the week around today', () => {
    expect(monthCells(PLANNER_PLAN.cursor)).toHaveLength(35)
    expect(periodLabel('month', PLANNER_PLAN.cursor)).toBe('September 2026')
    expect(periodLabel('week', today)).toBe('Sep 20 – Sep 26, 2026')
  })
})

describe('the plan bar reads the setup back', () => {
  it('states the exam, the pace and the finish as her file does', () => {
    renderPlanner()
    expect(screen.getByRole('heading', { level: 1, name: 'Study planner' })).toBeTruthy()
    const bar = planBar()
    expect(bar.textContent).toContain('Nov 20')
    expect(bar.textContent).toContain('59 days away')
    expect(bar.textContent).toContain('Average')
    expect(bar.textContent).toContain('7h 30m a week')
    expect(finishes()).toContain('Nov 11')
    expect(within(bar).getByRole('status').textContent).toBe('9 days before your exam')
  })

  it('opens the editor, moves the finish with a preset, and only then offers Save and Undo', () => {
    renderPlanner()
    expect(screen.queryByText('Save plan')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    /* Open and untouched: the same button says Done and just closes. */
    expect(screen.getByRole('button', { name: 'Done' })).toBeTruthy()
    expect(screen.getAllByRole('slider')).toHaveLength(7)
    fireEvent.click(within(screen.getByRole('group', { name: 'Pick a pace' })).getByRole('button', { name: /Crammer/ }))
    expect(finishes()).toContain('Oct 21')
    expect(within(planBar()).getByRole('status').textContent).toBe('30 days before your exam')
    /* ⚠ THE THIRD CONTROL GOES. Save plan and Undo changes are the two honest
       ways out of a dirty editor; a Done beside them would muddy which one
       saves — her rule, kept. */
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    expect(screen.getByText("You've changed your pace.")).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Undo changes' }))
    expect(finishes()).toContain('Nov 11')
    expect(screen.getByRole('button', { name: 'Change pace' })).toBeTruthy()
  })

  it('a slider takes the pace to Custom, and Save plan closes with a word', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Fri study time' }), { target: { value: '75' } })
    expect(planBar().textContent).toContain('Custom')
    expect(planBar().textContent).toContain('7h 15m a week')
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }))
    expect(screen.getByText('Plan saved.')).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
    /* Saved is not reverted: Custom stays. Nothing is written anywhere — see
       the component's note. */
    expect(planBar().textContent).toContain('Custom')
  })

  it('shows the norm note only under 7 hours, in whichever voice the concept has', () => {
    renderPlanner()
    expect(screen.queryByText(/settle around 7 hours/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    fireEvent.click(screen.getByRole('button', { name: /Thorough/ }))
    const note = screen.getByText(/settle around 7 hours/).parentElement!
    expect(note.textContent).toContain("you're at 5h a week")
    expect(note.textContent).toContain('Yours still works if that is what your week allows.')
  })
})

describe('the calendar', () => {
  it('draws today, the sessions, the exam day, and the days off between', () => {
    renderPlanner()
    expect(screen.getByRole('heading', { level: 2, name: 'September 2026' })).toBeTruthy()
    const todayCell = screen.getByRole('button', { name: /^Tue Sep 22, Policy provisions, 1h 30m/ })
    expect(todayCell.className).toContain('cre-planner__day--today')
    /* The weekend between is a day off, and says so. */
    const sat = screen.getByRole('button', { name: 'Sat Sep 26, day off' })
    expect(sat.getAttribute('aria-pressed')).toBe('true')
    expect(sat.textContent).toContain('Off')
    /* Every fourth session carries a spaced review — the 4th is Fri Sep 25. */
    expect(screen.getByRole('button', { name: /Fri Sep 25, Taxation, 1h 30m, plus spaced review/ })).toBeTruthy()
    /* Yesterday is past: not a button at all. */
    expect(screen.queryByRole('button', { name: /Mon Sep 21/ })).toBeNull()
  })

  it('a click takes a day off and the finish slides one session later', () => {
    renderPlanner()
    const wed = screen.getByRole('button', { name: /^Wed Sep 23/ })
    fireEvent.click(wed)
    expect(screen.getByRole('button', { name: 'Wed Sep 23, day off' }).getAttribute('aria-pressed')).toBe('true')
    expect(finishes()).toContain('Nov 12')
    expect(within(planBar()).getByRole('status').textContent).toBe('8 days before your exam')
    fireEvent.click(screen.getByRole('button', { name: 'Wed Sep 23, day off' }))
    expect(finishes()).toContain('Nov 11')
  })

  it('shift-click takes off everything back to the last click', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: /^Wed Sep 23/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Fri Sep 25/ }), { shiftKey: true })
    expect(screen.getByRole('button', { name: 'Thu Sep 24, day off' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Fri Sep 25, day off' })).toBeTruthy()
    expect(finishes()).toContain('Nov 16')
  })

  it('steps months, and Week re-anchors on today', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('heading', { level: 2, name: 'October 2026' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }))
    fireEvent.click(screen.getByRole('button', { name: 'Week' }))
    expect(screen.getByRole('heading', { level: 2, name: 'Sep 20 – Sep 26, 2026' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Month' }))
    expect(screen.getByRole('heading', { level: 2, name: 'September 2026' })).toBeTruthy()
  })

  it('the exam day is not a control', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByRole('button', { name: /Nov 20/ })).toBeNull()
    /* The legend says "Exam day" too; the cell's chip is the one that counts. */
    expect(screen.getByText('Exam day', { selector: '.cre-planner__chip--exam' })).toBeTruthy()
  })
})

describe('Rubi rebuilds the plan', () => {
  const log = () => screen.getByRole('log', { name: 'Conversation' })

  it('opens seeded, with the three starters', () => {
    renderPlanner()
    expect(log().textContent).toContain('the Average pace, 7h 30m a week')
    expect(log().textContent).toContain('Your weekends are already off.')
    expect(screen.getByRole('button', { name: "I can't study Fridays anymore" })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'I want to finish two weeks earlier' })).toBeTruthy()
    expect(screen.getByRole('button', { name: "I'm away the week of Nov 9" })).toBeTruthy()
  })

  it('a starter moves the calendar, says what moved, and leaves an Undo on the line', async () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: "I'm away the week of Nov 9" }))
    /* The starters are for the first turn only. */
    expect(screen.queryByRole('button', { name: 'I want to finish two weeks earlier' })).toBeNull()
    /* The calendar jumps to the blocked week and the plan moves at once… */
    expect(screen.getByRole('heading', { level: 2, name: 'November 2026' })).toBeTruthy()
    expect(finishes()).toContain('Nov 18')
    expect(screen.getByRole('button', { name: 'Wed Nov 11, day off' })).toBeTruthy()
    /* …and Rubi's reply follows a beat later. */
    expect(
      await screen.findByText(
        'That whole week is blocked. Your sessions shift past it, so the finish moves from Nov 11 to Nov 18.',
      ),
    ).toBeTruthy()
    expect(log().textContent).toContain('Nov 9 to 13 blocked')
    expect(log().textContent).toContain('Finish Nov 11 → Nov 18')
    const undo = screen.getByRole('button', { name: 'Undo: Nov 9 to 13 blocked' })
    fireEvent.click(undo)
    expect(finishes()).toContain('Nov 11')
    expect(log().textContent).toContain('Put it back the way it was.')
    expect(log().textContent).toContain('Undid: Nov 9 to 13 blocked')
    expect(screen.queryByRole('button', { name: /^Undo:/ })).toBeNull()
  })

  it("clearing Fridays no longer fits, and Rubi says so rather than inventing a date", async () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: "I can't study Fridays anymore" }))
    expect(finishes()).toContain("Won't fit")
    expect(await screen.findByText(/Fridays are clear\. That takes you to six hours a week/)).toBeTruthy()
    expect(log().textContent).toContain("Finish Nov 11 → won't fit")
  })

  it('typed "undo" with nothing to undo, and anything else, get her prototype\'s own replies', async () => {
    renderPlanner()
    const input = screen.getByRole('textbox', { name: 'Ask Rubi' })
    fireEvent.change(input, { target: { value: 'undo' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(await screen.findByText("I haven't changed anything that's left to undo.")).toBeTruthy()
    fireEvent.change(input, { target: { value: 'Move my exam' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await screen.findByText(/in the real thing I’d act on this/)).toBeTruthy()
  })
})

describe('Rubi off — the second concept', () => {
  it('drops the panel, widens the plan, and the norm note loses her voice', () => {
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-planner-rubi:off')
    renderPlanner()
    expect(screen.queryByRole('complementary', { name: 'Rubi' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Study planner' }).className).toContain('cre-planner--wide')
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    fireEvent.click(screen.getByRole('button', { name: /Thorough/ }))
    const note = screen.getByText(/study about 7 hours a/).parentElement!
    expect(note.textContent).toContain('Good to know')
    expect(note.textContent).toContain("You're at 5h.")
    expect(note.textContent).not.toContain('Rubi')
  })
})

describe('the rail opens it', () => {
  function renderCompass() {
    render(
      <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&section=compass']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <CompassLearningPage
              courseTitle="New York Life and Health Pre-licensing"
              percentComplete={62}
              completedLessons={26}
              totalLessons={42}
              onLeave={() => {}}
            />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }
  it("Study planner on Anjani's rail opens the planner, on the default arm and the default version", () => {
    renderCompass()
    fireEvent.click(screen.getByRole('button', { name: 'Study planner' }))
    expect(screen.getByRole('region', { name: 'Study planner' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: 'Study planner' })).toBeTruthy()
  })
  it('⚠ and the atlas arm has no such row', () => {
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-surface:atlas')
    renderCompass()
    expect(screen.queryByRole('button', { name: 'Study planner' })).toBeNull()
  })
})
