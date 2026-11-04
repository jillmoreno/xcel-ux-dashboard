import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompassWorkspace } from '@/components/learning/CompassWorkspace'
import {
  COMPASS_WORKSPACE_MARKS,
  COMPASS_WORKSPACE_SESSIONS,
  WORKSPACE_KIND,
} from '@/data/compassWorkspaceFixtures'
import {
  WORKSPACE_DEVICE_VIEWS,
  WORKSPACE_HOMES,
  WORKSPACE_LAYOUTS,
  WORKSPACE_RUBI_SHAPES,
  WORKSPACE_SESSION_VIEWS,
  WORKSPACE_STORIES,
  savedMarks,
} from '@/components/learning/compassWorkspaceModel'

/**
 * ANJANI'S WORKSPACE, ported 2026-11-04 from `xcel-compass-workspace-v4.html`.
 *
 * What this suite is for: the port carries SIX design axes, and the thing that
 * actually breaks is not any one of them rendering — it is a layout that
 * throws on an axis nobody checked, so a reviewer flipping a switch on stage
 * gets a blank screen instead of a sketch. Every layout is therefore rendered
 * against every axis, which is cheap and is the whole point of shipping the
 * switches.
 *
 * It also pins the two things a later edit is most likely to quietly undo:
 * that her defaults are the committed ones (Stage opens where her file opens),
 * and that her words are hers.
 */
describe('Anjani’s Compass Workspace', () => {
  const lede = 'Everything you marked in your course, and what you can make from it. Only you can see this.'
  /* ⚠ THE ANCHOR IS THE BAR, NOT THE LEDE. Her lede belongs to `homeHead()`
     and so only appears on a home view — the five layouts that have no home
     state never draw it. The bar's Workspace button is on every layout, which
     is what makes it the honest "this rendered at all" assertion. */
  const rendered = () => screen.getAllByRole('button', { name: 'Workspace' }).length

  it('opens on her defaults — Notebook, Pick up, Mid-journey', () => {
    /* ⚠ THE DEFAULTS ARE THE POINT. A Prototypes row opens at `?demo=1`, which
       forces committed defaults, so these three ARE what Stage shows. They are
       her file's own (`WS.layout='F'`, `WS.homeV='A'`, `WS.stage=5`) and the
       flag catalog repeats them; if a later edit moves one, Stage silently
       stops showing what she designed. */
    expect(WORKSPACE_LAYOUTS[0]).toMatchObject({ value: 'F', label: 'Notebook' })
    expect(WORKSPACE_HOMES[0]).toMatchObject({ value: 'A', label: 'Pick up' })
    expect(WORKSPACE_STORIES[0]).toMatchObject({ value: '5', label: 'Mid-journey' })
    render(<CompassWorkspace />)
    expect(screen.getByText(lede)).toBeTruthy()
    /* Pick up opens on the last CONVERSATION, not the newest marks — her
       `homeA2()`. The whole argument of this home is that a workspace
       remembers a thread. */
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy()
    /* Twice over, and correctly: the hero names the conversation you are
       carrying on, and the make rail lists it among the saved ones. */
    expect(screen.getAllByText(COMPASS_WORKSPACE_SESSIONS[0].title).length).toBeGreaterThan(0)
  })

  it('renders every layout against every axis — no switch opens a blank screen', () => {
    /* The combinatorial case, and the reason it is worth its runtime: six
       layouts times the other five axes is where a port like this breaks, and
       it breaks for a reviewer on stage rather than for whoever wrote it. */
    for (const l of WORKSPACE_LAYOUTS) {
      for (const h of WORKSPACE_HOMES) {
        const { unmount } = render(<CompassWorkspace layout={l.value} home={h.value} />)
        expect(rendered(), `${l.value}/${h.value}`).toBeGreaterThan(0)
        unmount()
      }
      for (const s of WORKSPACE_STORIES) {
        const { unmount } = render(<CompassWorkspace layout={l.value} story={s.value} />)
        expect(rendered(), `${l.value}/story ${s.value}`).toBeGreaterThan(0)
        unmount()
      }
      for (const r of WORKSPACE_RUBI_SHAPES) {
        const { unmount } = render(<CompassWorkspace layout={l.value} rubiShape={r.value} />)
        expect(rendered(), `${l.value}/rubi ${r.value}`).toBeGreaterThan(0)
        unmount()
      }
      for (const v of WORKSPACE_SESSION_VIEWS) {
        const { unmount } = render(<CompassWorkspace layout={l.value} sessionView={v.value} />)
        expect(rendered(), `${l.value}/sessions ${v.value}`).toBeGreaterThan(0)
        unmount()
      }
      for (const d of WORKSPACE_DEVICE_VIEWS) {
        const { unmount } = render(<CompassWorkspace layout={l.value} deviceView={d.value} />)
        expect(rendered(), `${l.value}/view ${d.value}`).toBeGreaterThan(0)
        unmount()
      }
    }
  })

  it('her words are hers — the learner’s notes are not tidied into product copy', () => {
    /* ⚠ THE RULE EVERY ANJANI PORT FOLLOWS: port the structure, never the
       words. Her learner writes in the first person and keeps a note about
       their own confusion; that is a person thinking, not copy that wants
       tightening. A later "fix" to these strings is the failure this guards. */
    /* Layout A, not E: the Course notebook draws ONE chapter at a time, and
       her two notes live in two different chapters. Three pane lists them
       all, which is what this case needs to see. */
    render(<CompassWorkspace layout="A" />)
    expect(
      screen.getByText(
        'Cash value is the bit I keep mixing up with the death benefit. Cash value is mine while alive.',
      ),
    ).toBeTruthy()
    expect(screen.getByText('Say this one out loud before the exam. Everything else hangs off it.')).toBeTruthy()
  })

  it('the story levels thin the marks out, and only on Notebook', () => {
    /* Hers: `saved()` reads `WS.layout==='F' ? (WS.stage||5) : 5`. The
       sketches were never drawn against a partial workspace, so showing them
       one would be inventing an empty state on her behalf. */
    expect(savedMarks('F', '1')).toHaveLength(0)
    expect(savedMarks('F', '2')).toHaveLength(1)
    expect(savedMarks('F', '3')).toHaveLength(4)
    expect(savedMarks('F', '5')).toHaveLength(COMPASS_WORKSPACE_MARKS.length)
    // Every other layout is pinned to the full set whatever the story says.
    for (const l of WORKSPACE_LAYOUTS.filter((x) => x.value !== 'F')) {
      expect(savedMarks(l.value, '1'), l.value).toHaveLength(COMPASS_WORKSPACE_MARKS.length)
    }
  })

  it('pinning a mark turns the filter bar into the make bar', () => {
    /* Her `filterBar()` is two bars in one element: chips with nothing
       pinned, actions with something. The thing you want after pinning is
       never the filter, which is the design decision worth pinning here. */
    const user = userEvent.setup()
    render(<CompassWorkspace layout="A" />)
    expect(screen.queryByText('1 item selected')).toBeNull()
    const checks = screen.getAllByRole('checkbox')
    return user.click(checks[0]).then(() => {
      expect(screen.getByText('1 item selected')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Ask Rubi about these' })).toBeTruthy()
    })
  })

  it('the make actions are dead until something is pinned, and say why', () => {
    render(<CompassWorkspace layout="D" />)
    const make = screen.getAllByRole('button', { name: /Make flashcards/ })[0]
    expect(make.hasAttribute('disabled')).toBe(true)
    expect(make.textContent).toContain('select items first')
  })

  it('six mark types collapse into four groups, and that is deliberate', () => {
    /* `bookmark` and `object` both file under Flag. It looks like a mistake
       and is not: a bookmark and a knowledge check are both "something I
       pointed at and did not write about". She groups by what the learner
       DID, not by what the system stored. */
    expect(new Set(Object.values(WORKSPACE_KIND)).size).toBe(4)
    expect(WORKSPACE_KIND.bookmark).toBe('Flag')
    expect(WORKSPACE_KIND.object).toBe('Flag')
  })

  it('her saved conversations carry their marks and their turns', () => {
    render(<CompassWorkspace layout="F" />)
    const first = COMPASS_WORKSPACE_SESSIONS[0]
    const sess = screen.getByRole('button', { name: new RegExp(first.title) })
    expect(within(sess).getByText(`${first.sel.length} marks pinned`)).toBeTruthy()
  })
})
