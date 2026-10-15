import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassStudyPlanner } from '@/components/learning/CompassStudyPlanner'
import { CompassLearningPage } from '@/components/learning/CompassLearningPage'
import { CompassPlanProvider } from '@/components/learning/CompassPlanContext'
import {
  finishReadback,
  initialPlan,
  periodLabel,
  returnInfo,
  schedule,
  tonight,
  withAbsence,
} from '@/components/learning/compassPlanStore'
import { fmtHM, monthCells, paceName } from '@/components/learning/compassStudyPlannerModel'
import { PLANNER_PACES, PLANNER_PLAN } from '@/data/compassStudyPlannerFixtures'

/**
 * THE STUDY PLANNER — Anjani's `screen-planner`, ported 2026-10-15 from her
 * OCT2 master and rebuilt the same day from her second master. The port is a
 * transcription of a prototype that runs, so what is worth pinning is the
 * part her file can enforce and a screenshot cannot: that the dates the page
 * STATES come out of the same arithmetic hers does, and that the flows — the
 * pace editor, taking days off three ways, Rubi's rebuilds, the return note,
 * and the Overview's Tonight card reading the same plan — move them the way
 * hers do.
 *
 * The figures are hers, worked by hand once so the assertions are not copied
 * off the component: 3300 minutes at 90 a weekday from Tuesday 22 Sep 2026 is
 * 37 sessions, the last on Wed 11 Nov, nine days before the 20 Nov exam.
 */

afterEach(() => window.history.replaceState({}, '', '/'))
const arm = (ff: string) => window.history.replaceState({}, '', `/dashboard-rebrand?ff=${ff}`)

function renderPlanner() {
  return render(
    <MemoryRouter initialEntries={['/dashboard-rebrand?demo=1&section=compass']}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassPlanProvider>
            <CompassStudyPlanner />
          </CompassPlanProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}
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
const planBar = () => screen.getByRole('region', { name: 'Your plan' })
const finishes = () => within(planBar()).getByText('Course finishes').parentElement!.textContent
const status = () => within(planBar()).getByRole('status').textContent
const period = () => screen.getByRole('heading', { level: 2 }).textContent

describe('the model — her arithmetic, without a DOM', () => {
  const s = initialPlan()
  it('walks 37 sessions of 90 minutes to Wed 11 Nov', () => {
    const r = schedule(s)
    expect(Object.keys(r.map)).toHaveLength(37)
    expect(r.finish?.getMonth()).toBe(10)
    expect(r.finish?.getDate()).toBe(11)
    expect(finishReadback(s)).toEqual({ finish: 'Nov 11', status: '9 days before your exam', tone: 'ok' })
  })
  it('says "Won\'t fit" when the hours run out before the exam', () => {
    const r = finishReadback({ ...s, dayMins: [0, 90, 90, 90, 90, 0, 0] })
    expect(r.finish).toBe("Won't fit")
  })
  it('numbers sessions from the ones already done, so a topic does not restart', () => {
    const away = withAbsence(s, 'away-week')
    expect(away.today.getMonth()).toBe(9)
    expect(away.today.getDate()).toBe(1)
    expect(away.doneTopics).toEqual(['Policy provisions', 'Annuities'])
    expect(schedule(away).map[`2026-9-1`].topic).toBe('Health & disability')
    expect(finishReadback(away)).toEqual({ finish: 'Nov 18', status: '2 days before your exam — that is tight', tone: 'warn' })
  })
  it('sizes the return note to the absence', () => {
    const missed = withAbsence(s, 'missed-day')
    expect(returnInfo(missed, 'A')?.line).toBe("Tuesday's session moved forward. You'll finish Nov 12, still 8 days before your exam.")
    const away = withAbsence(s, 'away-week')
    const a = returnInfo(away, 'A')!
    expect(a.head).toBe("Welcome back — you're closer than you think.")
    expect(a.body).toBe("You were away 7 days, so your plan moved forward. You'll finish Nov 18, only 2 days before your exam. A little more time this week gives you room.")
    expect(a.catchup).toBe(false)
    expect(returnInfo(away, 'B')?.catchup).toBe(true)
    expect(returnInfo(s, 'A')).toBeNull()
  })
  it('reads tonight off the plan', () => {
    expect(tonight(s)).toMatchObject({ dayNumber: 22, dayName: 'Tue', title: 'Policy provisions · 1h 30m', subline: 'Session 1 of 4 this week.', canSkip: true })
  })
  it('labels the week and the full plan her way', () => {
    expect(periodLabel(s)).toBe('This week · Sep 20 – 26')
    expect(periodLabel({ ...s, view: 'month' })).toBe('Sep 22 to exam day')
  })
  it('keeps the older helpers honest', () => {
    expect(paceName(PLANNER_PACES[0].mins)).toBe('Crammer')
    expect(fmtHM(450)).toBe('7h 30m')
    expect(monthCells(PLANNER_PLAN.cursor)).toHaveLength(35)
  })
})

describe('the plan bar and the pace editor', () => {
  it('states the exam, the pace and the finish, and opens on the week', () => {
    renderPlanner()
    expect(screen.getByRole('heading', { level: 1, name: 'Study planner' })).toBeTruthy()
    const bar = planBar()
    expect(bar.textContent).toContain('59 days away')
    expect(bar.textContent).toContain('7h 30m a week')
    expect(finishes()).toContain('Nov 11')
    expect(status()).toBe('9 days before your exam')
    expect(period()).toBe('This week · Sep 20 – 26')
    expect(screen.getByRole('button', { name: 'This week' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('the preset cards say where each pace finishes, and Average is suggested', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    const cards = screen.getByRole('group', { name: 'Pick a pace' })
    expect(within(cards).getByRole('button', { name: /Crammer/ }).textContent).toContain('Finishes Oct 21')
    expect(within(cards).getByRole('button', { name: /Average/ }).textContent).toContain('Suggested')
    expect(within(cards).getByRole('button', { name: /Thorough/ }).textContent).toContain("Won't finish before your exam")
    fireEvent.click(within(cards).getByRole('button', { name: /Crammer/ }))
    expect(finishes()).toContain('Oct 21')
    /* Open with unsaved changes: Done hides, Save plan and Undo changes are the only ways out. */
    expect(screen.queryByRole('button', { name: 'Done' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Undo changes' }))
    expect(finishes()).toContain('Nov 11')
  })

  it('a slider takes the pace to Custom, and Save plan closes with a word', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Fri study time' }), { target: { value: '75' } })
    expect(planBar().textContent).toContain('Custom')
    fireEvent.click(screen.getByRole('button', { name: 'Save plan' }))
    expect(screen.getByText('Plan saved.')).toBeTruthy()
    expect(screen.queryByRole('slider')).toBeNull()
  })
})

describe('the week, and the full plan', () => {
  it('lists this week with today tagged, the sessions, a spaced review and the weekend off', () => {
    renderPlanner()
    expect(screen.getByRole('button', { name: /^Today, Tue Sep 22, Policy provisions, 1h 30m/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Fri Sep 25, Taxation, 1h 30m, plus spaced review/ })).toBeTruthy()
    const sat = screen.getByRole('button', { name: 'Sat Sep 26, day off' })
    expect(sat.textContent).toContain('Off')
    /* Yesterday is past: not a control. */
    expect(screen.queryByRole('button', { name: /Mon Sep 21/ })).toBeNull()
    /* The legend lists only what is on screen — no exam day this week. */
    expect(screen.getByLabelText('Legend').textContent).not.toContain('Exam day')
  })

  it('steps weeks, and Full plan shows today to exam day with no arrows', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(period()).toBe('Week of Sep 27 · Sep 27 – Oct 3')
    fireEvent.click(screen.getByRole('button', { name: 'Full plan' }))
    expect(period()).toBe('Sep 22 to exam day')
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull()
    expect(screen.getByLabelText('Legend').textContent).toContain('Exam day')
    fireEvent.click(screen.getByRole('button', { name: 'This week' }))
    expect(period()).toBe('This week · Sep 20 – 26')
  })
})

describe('taking a day off', () => {
  it('Skip takes the day off in one click, says what moved, and Undo puts it back', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Skip Wed Sep 23, Annuities, 1h 30m' }))
    const note = screen.getAllByRole('status').find((el) => el.textContent?.includes('is off'))!
    expect(note.textContent).toContain('Wed, Sep 23 is off. Annuities moved to Thu, Sep 24.')
    expect(finishes()).toContain('Nov 12')
    expect(screen.getByRole('button', { name: 'Wed Sep 23, day off' })).toBeTruthy()
    fireEvent.click(within(note).getByRole('button', { name: 'Undo' }))
    expect(finishes()).toContain('Nov 11')
    expect(screen.getAllByRole('status').some((el) => el.textContent?.includes('Undone. Finish is back to Nov 11.'))).toBe(true)
  })

  it('the menu says where the session would land before you commit', () => {
    arm('compass-planner-day-off:menu')
    renderPlanner()
    expect(screen.queryByRole('button', { name: /^Skip / })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Wed Sep 23/ }))
    const menu = screen.getByRole('dialog', { name: 'Change this day' })
    expect(menu.textContent).toContain('Annuities · 1h 30m')
    const off = within(menu).getByRole('button', { name: /I can't study this day/ })
    expect(off.textContent).toContain('Annuities moves to Thu, Sep 24.')
    fireEvent.click(off)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(finishes()).toContain('Nov 12')
    /* A day marked off offers the way back. */
    fireEvent.click(screen.getByRole('button', { name: 'Wed Sep 23, day off' }))
    fireEvent.click(screen.getByRole('button', { name: /I can study this day after all/ }))
    expect(finishes()).toContain('Nov 11')
  })

  it('"Pick several days" is a loud selection mode with its own finish preview', () => {
    arm('compass-planner-day-off:menu')
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: /^Wed Sep 23/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Pick several days…' }))
    const bar = screen.getByRole('region', { name: 'Marking days off' })
    expect(bar.textContent).toContain('1 day picked')
    fireEvent.click(screen.getByRole('button', { name: /^Thu Sep 24/ }))
    expect(bar.textContent).toContain('2 days picked')
    expect(bar.textContent).toContain('Finish Nov 11 → Nov 13')
    fireEvent.click(within(bar).getByRole('button', { name: 'Take 2 days off' }))
    expect(screen.queryByRole('region', { name: 'Marking days off' })).toBeNull()
    expect(finishes()).toContain('Nov 13')
    expect(screen.getAllByRole('status').some((el) => el.textContent?.includes('2 days are off. Your sessions moved back.'))).toBe(true)
  })
})

describe('below the week', () => {
  it('next week is a quieter row of the same grid', () => {
    arm('compass-planner-under:next')
    renderPlanner()
    const next = screen.getByRole('list', { name: 'Next week' })
    expect(next.querySelectorAll('li')).toHaveLength(7)
    expect(next.textContent).toContain('Federal rules')
    fireEvent.click(screen.getByRole('button', { name: 'Go to next week' }))
    expect(period()).toBe('Week of Sep 27 · Sep 27 – Oct 3')
  })
  it('coming up lists the next four sessions', () => {
    arm('compass-planner-under:coming')
    renderPlanner()
    const items = [...document.querySelectorAll('.cre-planner__cu li')].map((li) => li.textContent)
    expect(items).toHaveLength(4)
    expect(items[0]).toContain('Mon, Sep 28')
    expect(items[0]).toContain('Federal rules')
    expect(items[3]).toContain('Spaced review')
  })
})

describe('after time away', () => {
  it('one missed day gets one line and a way back in, in Rubi’s voice', () => {
    arm('compass-planner-absence:missed-day')
    renderPlanner()
    expect(period()).toBe('This week · Sep 20 – 26')
    const note = screen.getAllByRole('status').find((el) => el.textContent?.includes('moved forward'))!
    expect(note.textContent).toContain("Tuesday's session moved forward. You'll finish Nov 12, still 8 days before your exam.")
    expect(note.textContent).toContain('Rubi')
    expect(within(note).getByRole('button', { name: 'Start today: Policy provisions' })).toBeTruthy()
    fireEvent.click(within(note).getByRole('button', { name: 'Dismiss' }))
    expect(screen.queryByText(/moved forward/)).toBeNull()
  })
  it('a week away gets the welcome back, and B leads with the catch-up review', () => {
    arm('compass-planner-absence:away-week,compass-planner-return:B')
    renderPlanner()
    expect(screen.getByText("Welcome back — you're closer than you think.")).toBeTruthy()
    expect(screen.getByText(/Before your break you studied Policy provisions and Annuities/)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Start with a quick review' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Skip to Health & disability' })).toBeTruthy()
    /* The two done sessions sit in last week; today's cell carries the catch-up chip. */
    const cell = screen.getByRole('button', { name: /^Today, Thu Oct 1, Health & disability/ }).closest('.cre-planner__day')!
    expect(cell.textContent).toContain('Catch-up review')
  })
})

describe('Rubi rebuilds the plan', () => {
  const log = () => screen.getByRole('log', { name: 'Conversation' })
  it('a starter moves the week, tags the pace as changed by Rubi, and Undo clears both', async () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: "I'm away the week of Nov 9" }))
    expect(period()).toBe('Week of Nov 8 · Nov 8 – 14')
    expect(finishes()).toContain('Nov 18')
    expect(screen.getByText('Changed by Rubi')).toBeTruthy()
    expect(await screen.findByText('That whole week is blocked. Your sessions shift past it, so the finish moves from Nov 11 to Nov 18.')).toBeTruthy()
    expect(log().textContent).toContain('Nov 9 to 13 blocked')
    fireEvent.click(screen.getByRole('button', { name: 'Undo: Nov 9 to 13 blocked' }))
    expect(finishes()).toContain('Nov 11')
    expect(screen.queryByText('Changed by Rubi')).toBeNull()
    expect(log().textContent).toContain('Put it back the way it was.')
  })
  it('clearing Fridays no longer fits, and Rubi says so', async () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: "I can't study Fridays anymore" }))
    expect(finishes()).toContain("Won't fit")
    expect(await screen.findByText(/Fridays are clear\. That takes you to six hours a week/)).toBeTruthy()
  })
  it('the panel closes and reopens, and Rubi off removes it', () => {
    renderPlanner()
    fireEvent.click(screen.getByRole('button', { name: 'Close Rubi' }))
    expect(screen.queryByRole('complementary', { name: 'Rubi' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Rubi' }))
    expect(screen.getByRole('complementary', { name: 'Rubi' })).toBeTruthy()
  })
  it('Rubi off: no panel, no reopen pill, and the norm note in the product’s voice', () => {
    arm('compass-planner-rubi:off')
    renderPlanner()
    expect(screen.queryByRole('complementary', { name: 'Rubi' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Rubi' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Change pace' }))
    fireEvent.click(screen.getByRole('button', { name: /Thorough/ }))
    expect(screen.getByText(/study about 7 hours a week/).parentElement!.textContent).toContain('Good to know')
  })
})

describe('the Overview reads the same plan', () => {
  it('Tonight is the plan’s first session, and the rail opens the planner', () => {
    renderCompass()
    expect(screen.getByText('Policy provisions · 1h 30m')).toBeTruthy()
    expect(screen.getByText('Session 1 of 4 this week.')).toBeTruthy()
    expect(screen.getByText('4 sessions · 6h left')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'View your plan' }))
    expect(screen.getByRole('region', { name: 'Study planner' })).toBeTruthy()
  })
  it('"Can’t study tonight" takes tonight off in the plan, says what moved, and undoes', () => {
    renderCompass()
    fireEvent.click(screen.getByRole('button', { name: "Can't study tonight" }))
    expect(screen.getByText(/No problem\. Tonight moved forward — you'll finish Nov 12 instead of Nov 11\./)).toBeTruthy()
    expect(screen.getByText('Tonight is off')).toBeTruthy()
    /* …and the planner agrees. */
    fireEvent.click(screen.getByRole('button', { name: 'Study planner' }))
    expect(finishes()).toContain('Nov 12')
    expect(screen.getByRole('button', { name: 'Today, Tue Sep 22, day off' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }))
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByText('Tonight is back on.')).toBeTruthy()
    expect(screen.getByText('Policy provisions · 1h 30m')).toBeTruthy()
  })
  it('Show my week reveals the strip, hidden by default', () => {
    renderCompass()
    expect(screen.queryByRole('list', { name: 'Your study week' })).toBeNull()
    fireEvent.click(screen.getByRole('switch', { name: 'Show my week' }))
    const strip = screen.getByRole('list', { name: 'Your study week' })
    expect(strip.querySelectorAll('li')).toHaveLength(7)
    expect(strip.querySelector('[aria-current="date"]')?.textContent).toContain('Tue 22')
  })
  it('after a week away the Overview carries the same return note', () => {
    arm('compass-planner-absence:away-week')
    renderCompass()
    expect(screen.getByText(/You were away 7 days, so your plan moved forward/)).toBeTruthy()
    expect(screen.getByText('Tonight: Health & disability')).toBeTruthy()
  })
})
