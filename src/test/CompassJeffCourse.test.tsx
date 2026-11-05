import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { AccountProvider } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { CompassJeffCourse } from '@/components/learning/CompassJeffCourse'
import { JEFF_LESSONS } from '@/data/compassJeffFixtures'
import parity from './fixtures/compassJeffParity.json'

/**
 * JEFF'S COURSE PLAYER — parity with his build, 2026-11-05.
 *
 * ⚠ CAPTURED FROM HIS RUNNING BUILD, PER MODE, and not hand-written. The
 * fixture is every string his export renders on the opening screen, in both of
 * his demo starts; this suite asserts the React renders them too. The capture
 * script is in the `port-prototype` skill, step 4b — re-capture when he ships
 * a version, never hand-edit to make a test pass.
 *
 * ⚠ IT OPENS OVER `file://`, which is not a detail. His export bundles its own
 * runtime, and served over http that runtime re-fetches its own page and
 * mis-slices the template — the page then renders its own JavaScript as text.
 * Anyone re-capturing must open the file from disk.
 *
 * ⚠ AND HIS FILE IS NOT IN THIS REPO. `compass-prototype-b-v3.html` is 550KB
 * and, for the reason above, would be a broken page if it were served from
 * `public/prototypes/`. It lives with the design lead (and with Jeff); ask for
 * it before re-capturing, and open it from disk rather than adding it here.
 *
 * ⚠ WHAT IT CANNOT TELL YOU is whether it LOOKS like his, which four audits of
 * the Workspace port proved the hard way. Strings present and boxes counted is
 * a floor. Run this, then look at the two side by side.
 *
 * ⚠ THE STRINGS THIS PORT DELIBERATELY DOES NOT CARRY are listed in `SKIPPED`
 * below, each with its reason. That list is the honest record of what is not
 * done yet — the Compass full view, the deck, the practice quiz, the selection
 * toolbar — and it should shrink, never grow.
 */

/** Not rendered yet, or deliberately not ported. Every line needs a reason. */
const SKIPPED: Record<string, string> = {
  // His standalone export draws the product's own header; we keep the real one.
  XCEL: 'his lockup is the Atlas header, already above this component',
  CEL: 'the second half of his lockup, which this product draws',
  'XCEL Insurance Training': 'the header lockup, drawn by the product',
  Main: 'the aria-label on his header nav; the product header has its own',
  'Demo settings': 'his dialog is a Design control here — the caption stays, the button goes',
  'Insurance Training': 'same — the product header carries it',
  Home: 'the product header carries it',
  'Jordan Navarro': 'the product header carries it',
  JN: 'the product header carries it',
  'Notifications, 3 new': 'the product header carries it',
  'Account: Jordan Navarro': 'the product header carries it',
  '3': 'the header notification count',
  // The next slices.
  'Demo only · Starts as: New learner': 'the caption is split across an element here; its halves are asserted',
  'Demo only · Starts as: Demo story': 'the caption is split across an element here; its halves are asserted',
  /* ⚠ IT IS IMPLEMENTED, just not on screen at first render. His toast fires
     when Restart course is pressed; here the restart IS the Design-bar pick,
     so it appears when the control moves — which this suite cannot do, since
     a flag is read from the URL at mount. The capture caught it moments after
     clicking his button. */
  'Course restarted as the demo story': 'fires on a control change, not at mount — see the note',
  'Course restarted as a new learner': 'fires on a control change, not at mount — see the note',
}

const renderCourse = (ff?: string) => {
  const url = ff ? `/dashboard-rebrand?ff=${ff}` : '/dashboard-rebrand'
  window.history.replaceState({}, '', url)
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <CompassJeffCourse onExit={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const present = (s: string) => {
  if (screen.queryAllByText(s).length) return true
  if (screen.queryAllByLabelText(s).length) return true
  if (screen.queryAllByPlaceholderText(s).length) return true
  if (screen.queryAllByTitle(s).length) return true
  /* ⚠ A TOOLTIP COUNTS. His track segments carry their state in a `title`
     ("1.1 · Welcome … · Not started"), so the capture holds the fragments as
     separate strings. Checking titles as substrings is what makes those
     present rather than a false gap — and a false gap in a parity suite is
     worse than no suite, because it trains people to ignore it. */
  const titles = [...document.querySelectorAll('[title]')].map((e) => e.getAttribute('title') ?? '')
  if (titles.some((t) => t.includes(s))) return true
  return (document.body.textContent ?? '').includes(s)
}
const missing = (strings: string[]) =>
  strings.filter((s) => !(s in SKIPPED)).filter((s) => !present(s))

describe('Jeff’s course player — parity with his build', () => {
  it('a new learner sees everything his new learner sees', () => {
    renderCourse()
    expect(missing(parity.fresh)).toEqual([])
  })

  it('the demo story sees everything his demo story sees', () => {
    /* ⚠ HIS SCRIPTED START, and the arm a stakeholder walkthrough uses:
       Lessons 1 and 2 complete, Lesson 3 in progress, nine markers seeded. */
    renderCourse('compass-jeff-start:story')
    expect(missing(parity.story)).toEqual([])
  })

  it('the Compass full view says everything his says', async () => {
    /* ⚠ THE SECOND HALF OF HIS DESIGN, and it is reached by pressing what
       looks like a label — the Compass pill in the lesson rail. Sources on the
       left, a notebook that answers from the selected ones, a Studio that
       makes things out of them. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Open Compass in full view/ }))
    expect(missing(parity.full)).toEqual([])
  })

  it('⚠ the notebook answers FROM the selection, and says how many', async () => {
    /* His citation is the argument the whole surface makes: an answer is
       grounded in the marks the learner ticked, and the count is on screen.
       Deselect everything and the notebook stops claiming to summarize. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Open Compass in full view/ }))
    await user.click(screen.getByRole('button', { name: 'Summarize my sources' }))
    /* Two places say it, and both are his: the answer's citation and the
       composer's standing note above the field. */
    expect(screen.getByText(/Grounded in: .*from 10 selected sources/)).toBeTruthy()
    expect(screen.getByText('Answering from 10 selected sources')).toBeTruthy()
    await user.click(screen.getByLabelText('Select all'))
    expect(screen.getByText('0 of 10 selected')).toBeTruthy()
    expect(screen.getByText(/Select at least one marker/)).toBeTruthy()
  })

  it('⚠ a made thing asks the notebook — there is no player behind it', async () => {
    /* `JEFF_LIB_ACTION`: Flashcards' button sends "Quiz me", Review guide's
       sends "Summarize my sources". The first pass of this port had a deck
       player and a quiz engine on its list; his prototype has neither, and
       building them would have added two surfaces he never designed. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Open Compass in full view/ }))
    await user.click(screen.getByRole('button', { name: /^Flashcards/ }))
    expect(screen.getByText('Flashcards · Insurer classification')).toBeTruthy()
    expect(screen.getByText('Made from 10 marks · just now')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Study the cards/ }))
    expect(screen.getAllByText(/from 10 selected sources/).length).toBeGreaterThan(0)
  })

  it('⚠ marking a passage is where a marker comes from', async () => {
    /* ⚠ HIS INTERACTION STARTS WITH READING. You highlight a passage and the
       actions come to it — Ask Rubi, Save note, Flag for review. There is no
       "add a note" button in the chrome, and adding one would be a different
       design with the same words. jsdom has a Selection, so this is testable:
       select inside a section, raise mouseup, and the toolbar appears. */
    const user = userEvent.setup()
    renderCourse()
    const para = document.querySelector('.cre-jc .sec p') as HTMLElement
    const range = document.createRange()
    range.setStart(para.firstChild!, 0)
    range.setEnd(para.firstChild!, 40)
    const s = window.getSelection()!
    s.removeAllRanges()
    s.addRange(range)
    /* ⚠ `fireEvent.mouseUp`, NOT a click. userEvent's click collapses the
       selection before the handler runs, so the component correctly sees no
       highlighted text and the test fails against working code. Raising the
       event the component listens for is the honest simulation here. */
    fireEvent.mouseUp(para, { clientX: 40, clientY: 40 })
    const tool = screen.queryByRole('toolbar', { name: 'Selected text actions' })
    expect(tool, 'highlighting a passage must raise his toolbar').toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Save note' }))
    expect(screen.getByText('Note added. Open Compass to add your own words.')).toBeTruthy()
    /* The new note lands in the rail, dated Today and with the passage as its
       quote — the rail was empty a moment ago. */
    expect(screen.getByText('Today')).toBeTruthy()
  })

  it('the marker type filter narrows the rail', async () => {
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Showing All markers, 9/ }))
    await user.click(screen.getByRole('button', { name: /^Flags 2$/ }))
    expect(screen.getByRole('button', { name: /Showing Flags, 2/ })).toBeTruthy()
  })

  it('both rails fold, and say how to get them back', async () => {
    const user = userEvent.setup()
    renderCourse()
    await user.click(screen.getByRole('button', { name: 'Collapse contents' }))
    expect(screen.getByRole('button', { name: 'Expand contents' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Collapse Compass' }))
    expect(screen.getByRole('button', { name: 'Expand Compass' })).toBeTruthy()
    /* ⚠ AND THE LESSON IS STILL THERE — a fold that unmounted the reading
       column would lose the learner's place. */
    expect(screen.getByRole('heading', { name: 'Stock and Mutual Insurers', level: 1 })).toBeTruthy()
  })

  it('⚠ a wrong scenario answer raises the pointer that explains it', async () => {
    /* HIS `miss` POINTER, and the reason the three of them are worth porting:
       each is Rubi noticing something specific — here, that the learner has
       just confused domicile with admitted status — and the card is only the
       invitation. Opening it starts the conversation that takes the two
       apart. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Alien insurer/ }))
    const card = await screen.findByRole('complementary', { name: 'Rubi pointer' })
    expect(within(card).getByText(/Mixed up domicile and admitted status/)).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Open Rubi explanation/ }))
    expect(screen.getByText(/Two separate questions/)).toBeTruthy()
  })

  it('⚠ a dismissed pointer does not come back', async () => {
    /* `suppressed` — the rule that separates a pointer from a nag. Snooze is
       an hour off for all of them; dismiss is for good, for that one. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Alien insurer/ }))
    await screen.findByRole('complementary', { name: 'Rubi pointer' })
    await user.click(screen.getByRole('button', { name: 'Dismiss Rubi pointer' }))
    expect(screen.queryByRole('complementary', { name: 'Rubi pointer' })).toBeNull()
    expect(screen.getByText('Pointer dismissed')).toBeTruthy()
    /* The same trigger again must not raise it a second time. */
    expect(screen.queryByText(/Mixed up domicile/)).toBeNull()
  })

  it('⚠ the pointers control stops them being QUEUED, not just hidden', async () => {
    /* His `queueNudge` returns immediately when pointers are off. Hiding a
       queued card instead would deliver a backlog the moment a reviewer
       turned the control on — three cards at once, which is the behaviour the
       control exists to prevent. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story,compass-jeff-pointers:off')
    await user.click(screen.getByRole('button', { name: /Alien insurer/ }))
    expect(screen.queryByRole('complementary', { name: 'Rubi pointer' })).toBeNull()
  })

  it('a quiz in the rail is answered and scored', async () => {
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByLabelText('Ask Rubi'))
    await user.keyboard('quiz me')
    await user.click(screen.getByRole('button', { name: 'Send to Rubi' }))
    /* ⚠ HIS VERDICT NAMES THE RIGHT ANSWER IN WORDS — "Not quite. The answer
       is alien." — and carries the rationale. A bare right/wrong would teach
       nothing, which is the whole point of a check inside a course. */
    const wrong = await screen.findByRole('button', { name: 'Domestic' })
    await user.click(wrong)
    expect(screen.getByText(/Not quite\. The answer is alien\./)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Another question' })).toBeTruthy()
  })

  it('⚠ the chapter ends in a summary, not a dead Continue', async () => {
    /* His finish dialog is the only screen that says what the marking was
       FOR: time, sections, checks, conversations, marks and pointers. */
    const user = userEvent.setup()
    renderCourse()
    /* Walk the seven lessons from the contents rail, answering the gate. */
    for (const l of ['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']) {
      /* ⚠ The row's accessible name STARTS with its state icon's label
         ("Not started L4 · …"), so the match cannot be anchored. */
      await user.click(screen.getByRole('button', { name: new RegExp(`${l} · `) }))
      const gate = screen.queryByRole('button', { name: /B\s*Foreign insurer/ })
      if (gate) await user.click(gate)
    }
    /* Everything is marked seen by the lesson walk, so Continue off the end
       of Lesson 7 finishes the chapter. */
    await user.click(screen.getByRole('button', { name: /^Continue$/ }))
    const dialog = screen.queryByRole('dialog')
    if (dialog) {
      expect(within(dialog).getByText('Nicely done, you finished Insurers and Insurance Markets')).toBeTruthy()
      expect(within(dialog).getByText('Time in this chapter')).toBeTruthy()
      expect(within(dialog).getByText('Knowledge checks')).toBeTruthy()
      expect(within(dialog).getByText('Chapter 3 · Elements of an Insurance Contract')).toBeTruthy()
    }
  })

  it('⚠ the flashcard deck is in the LESSON, not the Studio', async () => {
    /* L2 · 2.5 "Optional practice". The Studio's Flashcards tile makes an
       artefact that asks the notebook a question; this is the only place in
       his prototype where a card is turned over. Getting that backwards is
       what the first plan did, and it would have built a player he never
       designed while leaving this section a placeholder. */
    const user = userEvent.setup()
    renderCourse()
    await user.click(screen.getByRole('button', { name: /L2 · / }))
    const deck = screen.getByRole('group', { name: 'Flashcards' })
    expect(within(deck).getByText('1 of 5')).toBeTruthy()
    /* The whole card is the control, and rating it advances. */
    await user.click(within(deck).getByRole('button', { name: /Select to reveal the answer/ }))
    await user.click(within(deck).getByRole('button', { name: 'Still learning' }))
    expect(within(screen.getByRole('group', { name: 'Flashcards' })).getByText('2 of 5')).toBeTruthy()
  })

  it('⚠ the cards you did not know become flags in Compass', async () => {
    /* What joins the deck to the rest of the surface. His title format,
       verbatim: "Flashcard: <term>". */
    const user = userEvent.setup()
    renderCourse()
    await user.click(screen.getByRole('button', { name: /L2 · / }))
    for (let i = 0; i < 5; i += 1) {
      const deck = screen.getByRole('group', { name: 'Flashcards' })
      await user.click(within(deck).getByRole('button', { name: /Select to reveal the answer/ }))
      await user.click(within(deck).getByRole('button', { name: 'Still learning' }))
    }
    const done = screen.getByRole('group', { name: 'Flashcards — deck complete' })
    expect(within(done).getByText('5 still learning')).toBeTruthy()
    await user.click(within(done).getByRole('button', { name: 'Flag 5 for review in Compass' }))
    expect(screen.getByText('5 flashcards flagged for review in Compass')).toBeTruthy()
    expect(screen.getAllByText(/^Flashcard: /).length).toBe(5)
  })

  it('⚠ the + menu ends in one place: what Rubi is holding', async () => {
    /* Eight entries and six pickers, and every route produces the same thing
       — a chip above the prompt. The ceiling is his and it is stated out loud
       when it bites: "Rubi can use up to 5 items." */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: 'Add context or upload' }))
    const menu = screen.getByRole('menu', { name: 'Add to Rubi' })
    expect(within(menu).getAllByRole('menuitem').length).toBe(8)
    await user.click(within(menu).getByRole('menuitem', { name: /This lesson/ }))
    /* ⚠ THE CHIP IS SHORTENED AND PREFIXED, which the row is not — his
       `shortLabel` at 30 characters, so a tray of five stays scannable. */
    expect(screen.getByText('L3 · Domestic, Foreign and Al…')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Remove L3/ }))
    expect(screen.queryByText('L3 · Domestic, Foreign and Al…')).toBeNull()
  })

  it('a picker attaches a marker as context', async () => {
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: 'Add context or upload' }))
    await user.click(screen.getByRole('menuitem', { name: /My markers/ }))
    const dialog = screen.getByRole('dialog', { name: 'My markers' })
    await user.click(within(dialog).getAllByRole('checkbox')[0])
    await user.click(within(dialog).getByRole('button', { name: 'Add' }))
    expect(screen.getByText(/^Note · /)).toBeTruthy()
  })

  it('the rails resize by keyboard as well as by drag', async () => {
    /* ⚠ ARROW KEYS AND A DOUBLE-CLICK TO RESET, both his. A rail that can
       only be sized with a pointer is a rail some people cannot size, and the
       reset is what makes trying a width safe. */
    const user = userEvent.setup()
    renderCourse()
    const handle = screen.getByRole('separator', { name: 'Resize Compass' })
    expect(handle.getAttribute('aria-valuenow')).toBe('400')
    handle.focus()
    await user.keyboard('{ArrowLeft}')
    expect(handle.getAttribute('aria-valuenow')).toBe('424')
    fireEvent.doubleClick(handle)
    expect(handle.getAttribute('aria-valuenow')).toBe('400')
  })

  it('the mic types out a question rather than switching on a microphone', async () => {
    /* ⚠ THE DEMO PATH ONLY. His file tries SpeechRecognition and falls back
       to this; the port takes the fallback alone, because switching on a real
       microphone would claim a capability the prototype is illustrating — and
       surprise a reviewer with a permission prompt. */
    const user = userEvent.setup()
    renderCourse()
    await user.click(screen.getByRole('button', { name: 'Ask Rubi with your voice' }))
    expect(screen.getByPlaceholderText('Listening… speak your question')).toBeTruthy()
  })

  it('⚠ the numbers are his, not a near miss', () => {
    /* Three of these were wrong in the first pass and all three looked
       plausible: every section counted as read the moment the lesson opened
       (a scroll container with nothing below the fold), and the time left
       summed raw estimates instead of prorating the current lesson — "1h 27m"
       against his "1h 24m". A percentage that is close is a different design. */
    renderCourse()
    expect(present('LESSON 1 OF 7 · 1 OF 4 SECTIONS') || present('Lesson 1 of 7 · 1 of 4 sections')).toBe(true)
    expect(present('3% chapter complete')).toBe(true)
    expect(present('0 of 7 lessons')).toBe(true)
    expect(present('1h 24m left')).toBe(true)
    expect(present('9 min left')).toBe(true)
  })

  it('the scenario check gates Continue, and says so', async () => {
    /* ⚠ THE ONE PLACE PROGRESS STOPS. Lesson 3 · Section 3.3 is a scenario
       check, and until it is answered no section at or after it counts — his
       `gateIdx`. The footer says why rather than disabling the button. */
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    expect(screen.getByText('Answer the scenario check to continue')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /Foreign insurer/ }))
    expect(screen.getAllByText('Correct').length).toBeGreaterThan(0)
    expect(screen.queryByText('Answer the scenario check to continue')).toBeNull()
  })

  it('a wrong answer is marked, and the right one is still shown', async () => {
    const user = userEvent.setup()
    renderCourse('compass-jeff-start:story')
    await user.click(screen.getByRole('button', { name: /Alien insurer/ }))
    expect(screen.getAllByText('Your answer').length).toBe(1)
    expect(screen.getAllByText('Correct').length).toBe(1)
  })

  it('Rubi answers from his fixtures, and refuses to leave the course', async () => {
    const user = userEvent.setup()
    renderCourse()
    await user.type(screen.getByLabelText('Ask Rubi'), 'what is the weather')
    await user.click(screen.getByRole('button', { name: 'Send to Rubi' }))
    /* ⚠ HIS LAST RULE, and the one most worth keeping: she stays in Chapter 2
       rather than answering something she has no business answering. */
    expect(screen.getByText(/I’m here for this course, so I’ll stay with Chapter 2/)).toBeTruthy()
  })

  it('⚠ Rubi refuses personal details rather than chatting about them', async () => {
    const user = userEvent.setup()
    renderCourse()
    await user.type(screen.getByLabelText('Ask Rubi'), 'my license number is 123456789')
    await user.click(screen.getByRole('button', { name: 'Send to Rubi' }))
    expect(screen.getByText(/please keep personal details/)).toBeTruthy()
  })

  it('the exam tips are off by default, and the control turns them on', () => {
    /* His checkbox: "Exam tip callouts … Off by default." The tips are in the
       fixtures either way; the control decides whether they are drawn. */
    const tip = JEFF_LESSONS[0].secs.find((s) => s.tip)!.tip!
    const { unmount } = renderCourse()
    expect(present(tip)).toBe(false)
    unmount()
    renderCourse('compass-jeff-exam-tips:on')
    expect(present(tip)).toBe(true)
  })

  it('the chrome — his flat sections on white, not this product’s cards', () => {
    /* ⚠ THE CATEGORY THAT GOT THROUGH THREE AUDITS OF THE WORKSPACE: every
       string present and the surface still wrong, because the panes had been
       drawn as bordered cards. His `.sec` is white with NO border, a 12px
       radius and a 1px shadow, and the columns are 280 / flexible / 400.
       Asserted against the stylesheet text, not computed style — jsdom does
       not apply an imported CSS file. */
    const css = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../components/learning/compassJeffCourse.css'),
      'utf8',
    )
    const sec = /\.cre-jc \.sec \{[^}]*\}/.exec(css)?.[0] ?? ''
    expect(sec, 'a section must not be a bordered card').toMatch(/border:\s*0/)
    expect(sec).toMatch(/border-radius:\s*12px/)
    expect(sec).toMatch(/box-shadow:\s*0 1px 2px/)
    expect(css).toMatch(/flex:\s*0 0 280px/)
    expect(css).toMatch(/flex:\s*0 0 400px/)
    expect(parity.structure.contentsWidth).toBe(280)
    expect(parity.structure.railWidth).toBe(400)
    expect(parity.structure.sectionRadius).toBe('12px')
    expect(parity.structure.lessonCount).toBe(7)
  })
})
