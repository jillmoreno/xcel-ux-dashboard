import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CompassWorkspace } from '@/components/learning/CompassWorkspace'
import {
  COMPASS_WORKSPACE_MARKS,
  COMPASS_WORKSPACE_SESSIONS,
  WORKSPACE_KIND,
  WORKSPACE_SUGGESTED,
  WORKSPACE_DECK,
  WORKSPACE_MAKE_RESULT,
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
       remembers a thread.

       ⚠ "Pick up where you left off" is her EYEBROW, not the heading — the
       heading is the conversation's own title, which is what you are
       rejoining. The first port had it as an h2 and the session title as
       plain text; corrected against her live build. */
    /* ⚠ HER SEMANTICS, and they are the opposite way round from the obvious
       one: the HEADING is the eyebrow ("Pick up where you left off") and the
       conversation's title is plain text inside the card. The section is
       about picking up; the card is which thing you are picking up. */
    expect(screen.getByRole('heading', { name: 'Pick up where you left off' })).toBeTruthy()
    expect(screen.getByText(COMPASS_WORKSPACE_SESSIONS[0].title)).toBeTruthy()
    // Her hero names the speaker, and says what the session produced.
    expect(screen.getByText('Rubi, last time:')).toBeTruthy()
    expect(screen.getByText(/2 marks pinned · made flashcards/)).toBeTruthy()
    /* Twice over, and correctly: the hero names the conversation you are
       carrying on, and the make rail lists it among the saved ones. */
    expect(screen.getAllByText(COMPASS_WORKSPACE_SESSIONS[0].title).length).toBeGreaterThan(0)
  })

  it('carries the Studio, the Rubi strip and her session cards', () => {
    /* ⚠ THE SECOND-PASS CASE. The first port built this surface from her
       SOURCE and shipped a thin version: a right rail called "Make something"
       with four buttons, no readiness block, no Coming-soon pair, no artefacts,
       no Rubi strip, and the earlier sessions as a list. Opening her branch
       build showed what she actually renders. These assertions are the parts
       that were missing, so a third pass cannot quietly lose them again. */
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    /* ⚠ THE STUDIO IS NOT ON THE HOME. Hers hides both side panes there — see
       the note at the home branch — so this opens a mark first. A test that
       expected the Studio on arrival would be pinning the first port's
       mistake, not her design. */
    expect(screen.queryByRole('region', { name: 'Studio' })).toBeNull()
    return user.click(screen.getByRole('button', { name: 'Continue' })).then(() => {
    expect(screen.getByRole('region', { name: 'Studio' })).toBeTruthy()
    expect(screen.getByText('Exam in 33 days')).toBeTruthy()
    expect(screen.getByText('Make from all marks')).toBeTruthy()
    expect(screen.getByText('Created by me')).toBeTruthy()
    // Six make actions, the last two promises rather than buttons.
    expect(screen.getAllByText('Coming soon')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Podcast/ }).hasAttribute('disabled')).toBe(true)
    })
  })

  it('her Rubi strip and her session cards are on the home', () => {
    render(<CompassWorkspace />)
    expect(screen.getByText('You have marked cash value three times.')).toBeTruthy()
    expect(screen.getByText('My sessions')).toBeTruthy()
    /* ⚠ TWO BUTTONS PER CARD — hers is an open button plus a separate star,
       and the star is a real toggle (`aria-pressed`, "Unstar <title>"). The
       open button's name begins with the chapter, which is how they are told
       apart here. ⚠ The computed name concatenates the card's spans with NO
       separator, which is why these patterns have no space in them. */
    const card = screen.getByRole('button', { name: /^Life insurance policy typesTerm or permanent/ })
    // What the session made is an ICON with its name read aloud, not a tag.
    expect(within(card).getByText('Practice quiz')).toBeTruthy()
    expect(within(card).getByText(/Yesterday · 7:15 pm · 2 marks/)).toBeTruthy()
    const star = screen.getByRole('button', { name: 'Star Term or permanent — the fork' })
    expect(star.getAttribute('aria-pressed')).toBe('false')
  })

  it('“+ New workspace” opens a session — the Notebook with Rubi', async () => {
    /* ⚠ THE THIRD-PASS CASE, and the one that says most about how this port
       went. "+ New workspace" opens a MODE: the centre becomes a scoped
       conversation with Rubi's read of your marks, three suggested questions
       and a composer, and the bar becomes a breadcrumb you can rename and
       star. Two passes of reading her source and one of reading her home
       missed it completely, because nothing renders until the button is
       pressed. A test exists so a fourth pass cannot lose it. */
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    expect(screen.queryByRole('region', { name: 'Notebook with Rubi' })).toBeNull()

    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    const pane = screen.getByRole('region', { name: 'Notebook with Rubi' })
    /* Rubi's read of the marks. ⚠ Matched on a fragment her emphasis does
       NOT split: "cash value" and "term versus permanent" are wrapped in
       <b>, so a regex spanning them finds nothing. That the text IS split is
       the point — the bolding is data, applied at render. */
    expect(within(pane).getByText(/that is where a check would help most/)).toBeTruthy()
    expect(within(pane).getByText('term versus permanent').tagName).toBe('B')
    expect(within(pane).getByText('Memory hook:').tagName).toBe('B')
    // The three she offers.
    for (const q of WORKSPACE_SUGGESTED) expect(within(pane).getByRole('button', { name: q })).toBeTruthy()
    // The composer, and the scope promise under it.
    expect(within(pane).getByPlaceholderText('Ask a question or create something')).toBeTruthy()
    expect(within(pane).getByText('Rubi answers from your course and what you have marked.')).toBeTruthy()
    // The bar becomes a breadcrumb for the untitled session.
    expect(screen.getByText('New session')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Rename this session' })).toBeTruthy()
  })

  it('opening a deck replaces the centre, and asks before it shows', async () => {
    /* ⚠ THE FOURTH-PASS CASE. A deck is a MODE, found only by pressing the
       CTA on an artefact. Her pedagogy is in the ORDER and is the one thing
       not to rearrange: the confidence question comes BEFORE the flip,
       because an answer you have already seen teaches nothing. */
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    await user.click(screen.getByRole('button', { name: /Study the 8 cards/ }))

    /* ⚠ RE-QUERIED after every interaction, never held. The pane re-renders
       on each click and a captured element is a detached node by the time the
       next assertion runs — which is what made this case fail first time. */
    const deck = () => screen.getByRole('region', { name: 'Flashcards' })
    expect(within(deck()).getByText('1 of 8')).toBeTruthy()
    expect(within(deck()).getByText(WORKSPACE_DECK[0].term)).toBeTruthy()
    // Asked before shown: the definition is not on the page yet.
    expect(within(deck()).getByText('How sure are you before you flip?')).toBeTruthy()
    expect(within(deck()).queryByText(WORKSPACE_DECK[0].def)).toBeNull()

    await user.click(within(deck()).getByRole('button', { name: 'Flip card' }))
    expect(within(deck()).getByText(WORKSPACE_DECK[0].def)).toBeTruthy()
    expect(within(deck()).getByText(WORKSPACE_DECK[0].ex)).toBeTruthy()

    // Next re-hides the back — every card asks before it shows.
    await user.click(within(deck()).getByRole('button', { name: 'Next card' }))
    expect(within(deck()).getByText('2 of 8')).toBeTruthy()
    expect(within(deck()).queryByText(WORKSPACE_DECK[1].def)).toBeNull()
  })

  it('each Make produces HER artefact, with its own name and payload', async () => {
    /* ⚠ Four actions, four names, three payload shapes — a CTA, a body, an
       audio player. Three passes stored the button's label and an "Open →",
       which made four different outcomes look like one. */
    const user = userEvent.setup()
    render(<CompassWorkspace layout="A" />)
    await user.click(screen.getAllByRole('checkbox')[0])

    await user.click(screen.getAllByRole('button', { name: /^Review guide/ })[0])
    expect(screen.getByText(WORKSPACE_MAKE_RESULT.guide.title)).toBeTruthy()
    expect(screen.getByText(WORKSPACE_MAKE_RESULT.guide.body!)).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: /^Audio recap/ })[0])
    expect(screen.getByText(WORKSPACE_MAKE_RESULT.audio.title)).toBeTruthy()
    // the audio payload is a player, not a link
    expect(screen.getByText('0:41 / 3:12')).toBeTruthy()
  })

  it('a suggested question scopes the session to the mark it is about', async () => {
    /* Her "Talking about · Note" header — what keeps a conversation about a
       mark from drifting into the whole course. */
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))
    const pane = () => screen.getByRole('region', { name: 'Notebook with Rubi' })
    expect(within(pane()).getByText('Whole course')).toBeTruthy()

    await user.click(within(pane()).getByRole('button', { name: WORKSPACE_SUGGESTED[0] }))
    expect(screen.getByText(/that is where a check would help most/)).toBeTruthy()
    expect(screen.getByText(WORKSPACE_SUGGESTED[0], { selector: 'p' })).toBeTruthy()
  })

  it('a folded pane is a 56px rail, not a missing column', async () => {
    /* ⚠ MEASURED ON HER BUILD: `56px 1fr 320px` with the left folded,
       `56px 1fr 56px` with both. The first four passes dropped the column
       entirely, so the centre jumped and the way back vanished with it. Hers
       keeps the toggle where it was. */
    const user = userEvent.setup()
    render(<CompassWorkspace />)
    await user.click(screen.getByRole('button', { name: /New workspace/ }))

    await user.click(screen.getByRole('button', { name: 'Hide your marks' }))
    expect(screen.getByRole('navigation', { name: 'Your marks, collapsed' })).toBeTruthy()
    const reopen = screen.getByRole('button', { name: 'Show Your marks' })
    expect(reopen.getAttribute('aria-expanded')).toBe('false')

    await user.click(screen.getByRole('button', { name: 'Hide Studio' }))
    expect(screen.getByRole('navigation', { name: 'Studio, collapsed' })).toBeTruthy()

    // And back again, from the rail the fold left behind.
    await user.click(screen.getByRole('button', { name: 'Show Your marks' }))
    expect(screen.queryByRole('navigation', { name: 'Your marks, collapsed' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Hide your marks' })).toBeTruthy()
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
    /* Her labels — Flashcards, Practice quiz, Review guide, Audio recap —
       not the invented "Make flashcards" of the first pass. */
    const make = screen.getAllByRole('button', { name: /^Flashcards/ })[0]
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

  it('the newest conversation is the hero; the rest are cards', () => {
    /* Her split, and it is the home's argument: one thread you are rejoining,
       and the others kept where you can see them. The first port listed all
       three the same way, in the rail. */
    render(<CompassWorkspace layout="F" />)
    const [hero, ...rest] = COMPASS_WORKSPACE_SESSIONS
    // The newest is the hero card — named, with a Continue, and not a card
    // in the shelf below.
    expect(screen.getByText(hero.title)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: new RegExp(hero.title) })).toBeNull()
    // The others are cards, each saying what it made — the open button, told
    // apart from its star by beginning with the chapter.
    for (const sn of rest) {
      const card = screen.getByRole('button', { name: new RegExp(`^${sn.ch}${sn.title}`) })
      expect(within(card).getByText(sn.made)).toBeTruthy()
    }
  })
})
