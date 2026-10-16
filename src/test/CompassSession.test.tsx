import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'
import { SESSION_LESSON } from '@/data/compassSessionFixtures'

/**
 * THE SESSION — what "Start session" opens.
 *
 * The content is ported from Anjani's prototype, so what is worth pinning is
 * not the copy (the fixture IS the copy) but the three things this build adds
 * and could silently get wrong: that all seven beats are reachable, that the
 * knowledge check teaches whichever way you answer, and that the bar reports a
 * POSITION rather than a score.
 */

function renderSession() {
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const contents = () => screen.getByRole('complementary', { name: 'Contents' })

describe('the Compass session', () => {
  it('opens on the first beat, with the video and its transcript', () => {
    renderSession()
    expect(screen.getByText(/Video · you set the pace/i)).toBeTruthy()
    expect(screen.getByText('The big picture before any of the details.')).toBeTruthy()
    expect(screen.getByText(/Every life insurance policy is either term or permanent/)).toBeTruthy()
  })

  it('lists all seven beats, and every one of them opens', async () => {
    /* ⚠ THE WHOLE LESSON, NOT JUST THE SHARED SCREEN. The screenshot shows the
       video beat; a Contents list where six of seven rows do nothing is the
       failure this guards. */
    const user = userEvent.setup()
    renderSession()
    for (const beat of SESSION_LESSON.beats) {
      await user.click(within(contents()).getByRole('button', { name: new RegExp(beat.kind) }))
      expect(
        screen.getByText(new RegExp(`${beat.kind} · you set the pace`, 'i')),
        `${beat.kind} did not open`,
      ).toBeTruthy()
    }
  })

  it('reports position, never a score', async () => {
    /* ⚠ 0% ON THE FIRST BEAT IS CORRECT and is what the shared screen shows.
       If this ever starts counting right answers, the bar becomes a grade the
       prototype has no basis to give. */
    const user = userEvent.setup()
    renderSession()
    const bar = () => screen.getByRole('progressbar')
    expect(bar().getAttribute('aria-valuenow')).toBe('0')
    await user.click(within(contents()).getByRole('button', { name: /Recap/ }))
    expect(bar().getAttribute('aria-valuenow')).toBe('86')
  })

  it('OFF `compass-check-confidence`: explains the answer either way round', async () => {
    /* The rationale is the half that teaches, so a correct answer earns it too
       — showing it only on a miss turns the check into a scoreboard.
       ⚠ THIS IS THE OFF ARM NOW (2026-10-16). The default became Anjani's
       check, which asks how sure you are BEFORE revealing anything — so the
       rationale no longer appears on pick. The rule this case names still
       holds there (`CompassKnowledgeCheck.test.tsx` pins it either way); what
       changed is when. The original radio list is kept beside hers and this is
       what still pins it. */
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-check-confidence:off')
    const user = userEvent.setup()
    renderSession()
    await user.click(within(contents()).getByRole('button', { name: /Knowledge check/ }))
    const q1 = screen.getAllByRole('group')[0]
    expect(within(q1).queryByText(/Only permanent policies build cash value/)).toBeNull()
    await user.click(within(q1).getByRole('radio', { name: 'Permanent' }))
    expect(within(q1).getByText(/Only permanent policies build cash value/)).toBeTruthy()
    window.history.replaceState({}, '', '/')
  })

  it('OFF `compass-key-terms-rating`: keeps the key terms hidden until they are flipped', async () => {
    /* ⚠ THIS IS THE OFF ARM NOW (2026-10-16). The default became Anjani's
       card, where the CONFIDENCE RATING is what flips — see
       `CompassKeyTerms.test.tsx`. The original grid is kept beside it
       (`KeyTermsBeat`, untouched), and this case is what still pins it, so
       the sibling cannot rot unnoticed while nobody is looking at the off
       arm. The `?ff=` is read off `window.location` by the provider, not the
       router, which is why it is set here rather than passed to MemoryRouter. */
    window.history.replaceState({}, '', '/dashboard-rebrand?ff=compass-key-terms-rating:off')
    const user = userEvent.setup()
    renderSession()
    await user.click(within(contents()).getByRole('button', { name: /Key terms/ }))
    const card = screen.getByRole('button', { name: /Cash value/ })
    expect(card.getAttribute('aria-expanded')).toBe('false')
    await user.click(card)
    expect(card.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText(/The savings balance that builds inside a permanent policy/)).toBeTruthy()
    window.history.replaceState({}, '', '/')
  })

  it('the Contents arrow COLLAPSES the column — it no longer leaves', async () => {
    /* ⚠ IT WAS THE PAGE'S ONLY EXIT until 2026-10-16, which is why it was
       wired to `onExit`. The exit moved to the X in the bar in the same pass;
       these two cases are one change and fail together if either half is
       reverted alone, which is the point — doing one without the other
       strands a reviewer inside the lesson. */
    const user = userEvent.setup()
    renderSession()
    expect(screen.queryByRole('button', { name: 'Leave the session' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Collapse contents' }))
    // The column is a strip with one way back.
    expect(screen.queryByText('Insurance basics')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Show contents' }))
    expect(screen.getByText('Insurance basics')).toBeTruthy()
  })

  it('the bar carries the exit, after Notes and Rubi', async () => {
    renderSession()
    const exit = screen.getByRole('button', { name: 'Leave the lesson' })
    expect(exit).toBeTruthy()
    // Last of the three, so it reads as leaving rather than a third thing to
    // open.
    const group = exit.parentElement!
    expect([...group.children].indexOf(exit)).toBe(group.children.length - 1)
  })

  it('opens Rubi on the nudge, and lets it be closed', async () => {
    const user = userEvent.setup()
    renderSession()
    expect(screen.getByText(/This section runs long/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Close Rubi' }))
    expect(screen.queryByText(/This section runs long/)).toBeNull()
  })

  it('shows three chapters until asked for all six', async () => {
    const user = userEvent.setup()
    renderSession()
    expect(within(contents()).queryByText('Annuities')).toBeNull()
    await user.click(within(contents()).getByRole('button', { name: /Show all 6 chapters/ }))
    expect(within(contents()).getByText('Annuities')).toBeTruthy()
    /* The locked chapter says WHY it is locked, which is the only thing that
       makes a locked row worth showing. */
    expect(within(contents()).getByText('Unlocks Aug 13')).toBeTruthy()
  })
})
