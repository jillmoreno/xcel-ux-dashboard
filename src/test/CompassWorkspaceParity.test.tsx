import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompassWorkspace } from '@/components/learning/CompassWorkspace'
import parity from './fixtures/compassWorkspaceParity.json'

/**
 * PARITY — does the port still say everything her prototype says?
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The Compass Workspace was ported on 2026-11-04 and took SIX passes. Five
 * things were missed, and the design lead found every one of them by opening
 * Anjani's build beside the port and noticing. That is a person doing a
 * diff, and a person is the slowest and least reliable way to do a diff.
 *
 * So the diff is mechanical now. `fixtures/compassWorkspaceParity.json` is
 * every string her build renders, captured per mode straight off her DOM, and
 * this suite asserts the React surface still renders each one. Scored against
 * the six passes it would have caught the Studio, the entire session mode,
 * the deck player, "Continue" vs "Carry on", "Rubi, last time:" and the four
 * Make names — before anybody looked.
 *
 * It also catches the three things TEXT CANNOT: the rail's order, the
 * takeover, and the width a folded pane collapses to. Those are in
 * `structure`, because they were three of the five misses.
 *
 * ── HOW TO USE IT WHEN SHE SHIPS A NEW VERSION ────────────────────────────
 *
 * Re-capture from her new build and overwrite the fixture; whatever this
 * suite then reports is exactly the delta to port. The capture script is in
 * the `port-prototype` skill, step 2. ⚠ RE-CAPTURE, never hand-edit: a
 * fixture edited to make a test pass is a diff against the port's own
 * opinion, which is worth nothing.
 *
 * ── WHAT IT DOES NOT DO ───────────────────────────────────────────────────
 *
 * It cannot tell you her design is good, that the port FEELS like hers, or
 * that a thing sits where she wants it. It is a floor, not a ceiling, and the
 * designer's own review is still the step that matters. What it buys is that
 * her review is spent on judgement instead of on finding a missing rail.
 */

/** Her strings for a mode, minus the ones this port deliberately differs on. */
const expected = (mode: keyof typeof parity, except: string[] = []) =>
  (parity[mode] as string[]).filter((s) => !except.includes(s))

/** Is the string anywhere on the page — as text, or as a label? */
const present = (s: string) => {
  if (screen.queryAllByText(s).length) return true
  if (screen.queryAllByLabelText(s).length) return true
  if (screen.queryAllByPlaceholderText(s).length) return true
  if (screen.queryAllByTitle(s).length) return true
  // a string her markup splits across <b> is still present to a reader
  return document.body.textContent?.includes(s) ?? false
}

const missing = (strings: string[]) => strings.filter((s) => !present(s))

describe('Compass Workspace — parity with Anjani’s build', () => {
  it('the home says everything her home says', async () => {
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    /* Her star labels read "Star <title>" before a session is starred and
       "Unstar <title>" after; the capture caught one of each state. Only the
       unstarred form is asserted — the starred form is covered by the
       behaviour test, where it is a toggle rather than a string. */
    expect(missing(expected('home'))).toEqual([])
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
  })

  it('the marks rail says everything hers says', async () => {
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    expect(missing(expected('marks'))).toEqual([])
  })

  it('the Studio says everything hers says', async () => {
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    expect(missing(expected('studio'))).toEqual([])
  })

  it('a session says everything hers says', async () => {
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    expect(missing(expected('session'))).toEqual([])
  })

  it('the deck says everything hers says, front and back', async () => {
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    await user.click(screen.getByRole('button', { name: /Study the 8 cards/ }))
    expect(missing(expected('deck'))).toEqual([])

    await user.click(within(screen.getByRole('region', { name: 'Flashcards' })).getByRole('button', { name: 'Flip card' }))
    expect(missing(expected('deckFlipped'))).toEqual([])
  })

  it('the structure her text cannot carry — the rail, the takeover, the fold', () => {
    /* ⚠ THREE OF THE FIVE MISSES WERE STRUCTURAL and no amount of string
       checking would have found them. They are asserted from the same capture
       so they travel with it:
         - the rail's ORDER (Workspace third, after Learn)
         - the takeover (her Compass sidebar goes to width 0, shell to x=0)
         - the FOLD (a collapsed pane is 56px, not a missing column)
       The rail and the takeover are pinned in `AtlasTopNav.test.tsx`, where
       the Compass page is rendered; the fold is in `CompassWorkspace.test.tsx`.
       This case asserts the CAPTURE still says what those tests assume, so a
       re-capture that changes her mind fails here first and loudly. */
    const s = parity.structure
    expect(s.railOrder).toEqual(['Overview', 'Learn', 'Workspace', 'Study planner', 'Ask Rubi', 'Progress'])
    expect(s.railOrder.indexOf('Workspace')).toBe(2)
    expect(s.compassSidebarWidth).toBe(0)
    expect(s.shellLeft).toBe(0)
    expect(s.shellColsLeftFolded).toBe('56px 1fr 320px')
    expect(s.shellColsBothFolded).toBe('56px 1fr 56px')
  })
})
