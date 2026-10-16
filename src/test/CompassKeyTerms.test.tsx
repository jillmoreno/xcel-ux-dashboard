import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassSessionPage } from '@/components/learning/CompassSessionPage'

/**
 * KEY TERMS — ANJANI'S CARD (2026-10-16, Jillienne with the beat selected:
 * "This is not matching Anjanis").
 *
 * ⚠ WHAT WAS WRONG WAS THE INTERACTION, not the styling, and that is what
 * these cases pin. The port drew a grid of small cards reading "Flip to
 * check", so the flip was the whole gesture. Hers asks "How sure are you
 * before you flip?" and the ANSWER is what flips — a question that is
 * pointless if answering it does nothing. A future change that keeps her copy
 * but restores click-to-flip would look right in a screenshot and fail here.
 *
 * The copy, the three levels, their order and the tag lines come from
 * `compKeyterm` and `rate()` in her
 * `public/prototypes/xcel-compass-type-scale-preview.html`, so they are
 * asserted verbatim rather than paraphrased.
 */
function renderKeyTerms(search = '') {
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  const r = render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand?demo=1&section=compass&session=1${search.replace('?', '&')}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassSessionPage onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Key terms' }))
  return r
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
})

describe('the Key terms beat', () => {
  it('is on in the committed baseline, and can reach Prototypes', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compass-key-terms-rating')
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.surface, 'a design surface would never ship').toBeUndefined()
  })

  it('asks her question and offers her three levels, in her order', () => {
    renderKeyTerms()
    expect(screen.getAllByText('How sure are you before you flip?').length).toBeGreaterThan(0)
    const group = screen.getAllByRole('group', { name: /^Confidence for / })[0]
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'I know this',
      'Not sure',
      'New to me',
    ])
  })

  it('reveals nothing until you rate — the rating IS the flip', () => {
    renderKeyTerms()
    // Her back half: definition, example, and the way to practise it.
    expect(screen.queryByText('Practice this with Rubi')).toBeNull()

    const group = screen.getAllByRole('group', { name: /^Confidence for / })[0]
    fireEvent.click(within(group).getByRole('button', { name: 'Not sure' }))

    expect(screen.getAllByText('Practice this with Rubi').length).toBe(1)
    // Her tag line for that level, verbatim.
    expect(screen.getByText('You weren’t sure — good one to revisit.')).toBeInTheDocument()
    expect(within(group).getByRole('button', { name: 'Not sure' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('each term is its own card, so rating one does not open the rest', () => {
    // The old grid was one card containing all the terms; hers is a card each,
    // and the state is per term.
    renderKeyTerms()
    const groups = screen.getAllByRole('group', { name: /^Confidence for / })
    expect(groups.length).toBeGreaterThan(1)
    fireEvent.click(within(groups[0]).getByRole('button', { name: 'I know this' }))
    expect(screen.getAllByText('Practice this with Rubi').length).toBe(1)
  })

  it('off: the original “Flip to check” grid is back, untouched', () => {
    renderKeyTerms('?ff=compass-key-terms-rating:off')
    expect(screen.getAllByText('Flip to check').length).toBeGreaterThan(0)
    expect(screen.queryByText('How sure are you before you flip?')).toBeNull()
  })
})
