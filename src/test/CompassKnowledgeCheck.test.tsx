import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'
import { SESSION_LESSON } from '@/data/compassSessionFixtures'

/**
 * KNOWLEDGE CHECK — ANJANI'S (2026-10-16, Jillienne: "Fix Knowledge Check Next
 * to match anjanis").
 *
 * ⚠ THE ORDER IS THE FEATURE. The port drew radios and revealed the rationale
 * the moment one was chosen. Hers asks a question in between — pick, then
 * "Before you see the answer — how sure are you?" — and only then marks the
 * answer and explains. A port that kept her copy but revealed on pick would
 * look right in a screenshot and be meaningless, because you cannot ask how
 * sure someone is about an answer already on screen. The second case is what
 * holds that.
 *
 * Ported from `compCheck` / `pick` / `conf` / `answer` / `showReadout` in
 * `public/prototypes/xcel-compass-type-scale-preview.html`; copy verbatim.
 */
const Q1 = SESSION_LESSON.beats.find((b) => b.type === 'check')!.block.items![0]

function openCheck(search = '') {
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&section=compass&session=1`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Knowledge check' }))
}
const q1 = () => within(screen.getByRole('group', { name: Q1.stem }))

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('the Knowledge check', () => {
  it('is on in the committed baseline, and can reach Prototypes', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-check-confidence')
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.surface).toBeUndefined()
  })

  it('numbers the questions and letters the options', () => {
    openCheck()
    expect(screen.getByText(/Five quick questions/)).toBeInTheDocument()
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(q1().getByRole('button', { name: `A ${Q1.options[0]}` })).toBeInTheDocument()
  })

  it('asks how sure you are BEFORE it shows the answer', () => {
    openCheck()
    // Nothing is revealed by picking.
    fireEvent.click(q1().getByRole('button', { name: `A ${Q1.options[0]}` }))
    expect(screen.queryByText(Q1.rationale)).toBeNull()
    expect(screen.getByText('Before you see the answer — how sure are you?')).toBeInTheDocument()

    // The rationale arrives only once confidence is given.
    fireEvent.click(screen.getByRole('button', { name: 'Confident' }))
    expect(screen.getByText(Q1.rationale)).toBeInTheDocument()
    expect(screen.queryByText('Before you see the answer — how sure are you?')).toBeNull()
  })

  /* ⚠ TWO OF FOUR, and the two are the MISMATCHES. Showing a nudge on every
     outcome is the easy way to lose the idea: right-and-sure needs nothing
     said, wrong-and-unsure already knows. */
  it('Rubi speaks on a confident miss', () => {
    openCheck()
    fireEvent.click(q1().getByRole('button', { name: `A ${Q1.options[0]}` })) // wrong
    fireEvent.click(screen.getByRole('button', { name: 'Confident' }))
    expect(screen.getByText(/worth a closer look/)).toBeInTheDocument()
  })

  it('…and on a right answer the learner did not trust', () => {
    openCheck()
    fireEvent.click(q1().getByRole('button', { name: `B ${Q1.options[1]}` })) // correct
    fireEvent.click(screen.getByRole('button', { name: 'Not sure' }))
    expect(screen.getByText(/worth locking in/)).toBeInTheDocument()
  })

  it('…and says nothing when confidence and outcome agree', () => {
    openCheck()
    fireEvent.click(q1().getByRole('button', { name: `B ${Q1.options[1]}` })) // correct
    fireEvent.click(screen.getByRole('button', { name: 'Confident' }))
    expect(screen.getByText(Q1.rationale)).toBeInTheDocument()
    expect(screen.queryByText(/worth locking in/)).toBeNull()
    expect(screen.queryByText(/worth a closer look/)).toBeNull()
  })

  it('a locked question cannot be re-answered', () => {
    openCheck()
    fireEvent.click(q1().getByRole('button', { name: `A ${Q1.options[0]}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Confident' }))
    // Readable, not removed from the tab order — the click is refused instead.
    const other = q1().getByRole('button', { name: `B ${Q1.options[1]}` })
    expect(other).toHaveAttribute('aria-disabled', 'true')
    fireEvent.click(other)
    expect(screen.queryByText('Before you see the answer — how sure are you?')).toBeNull()
  })

  it('off: the original radio list is back, revealing on pick', () => {
    openCheck('?ff=compass-check-confidence:off')
    const radio = screen.getAllByRole('radio')[1]
    fireEvent.click(radio)
    expect(screen.getByText(Q1.rationale)).toBeInTheDocument()
    expect(screen.queryByText('Before you see the answer — how sure are you?')).toBeNull()
  })
})
