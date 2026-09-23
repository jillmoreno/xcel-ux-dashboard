import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { StudyPaceTile } from '@/components/learning/StudyPaceTile'
import { StudyPaceSheet } from '@/components/learning/StudyPaceSheet'
import {
  studyPace,
  defaultPreset,
  formatEvening,
  formatPaceDate,
  defaultWeekdays,
  WEEKDAY_LABELS,
  paceNameFor,
  paceOptionsFor,
  priceFinish,
  NIGHT_OPTIONS,
} from '@/lib/studyPace'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'

/**
 * The two claims this widget exists to keep, and which a refactor is most
 * likely to break quietly:
 *
 *   1. **The TILE operates nothing.** One control, Adjust. Everything else is
 *      in the sheet. A preset strip creeping back onto the tile is the exact
 *      regression Jillienne asked to prevent on 2026-09-21.
 *   2. **TWO ceilings, and the sheet says which binds.** An exam date inside
 *      the access window has to take over AND be explained; one outside it must
 *      leave access binding. A pace that switches ceilings silently is how a
 *      learner stops believing the number.
 *
 * Everything else is covered by `studyPace.test.ts`, which tests the model
 * directly — these are about the surface.
 */

const TODAY = new Date(2026, 8, 18) // Fri 18 Sep 2026

/**
 * ⚠ `prose` BY DEFAULT HERE, and pinned rather than inherited — 2026-09-23,
 * when `study-pace-readout` arrived and its `stats` variant became the BRANCH
 * default. Every assertion below was written against the card's three
 * sentences; without a provider `useFeatureFlag` hands back the catalog
 * default, so ten of them started reading a card that no longer says those
 * words.
 *
 * Pinning is the right fix rather than rewriting them: these tests are about
 * what the card CLAIMS — the window, the ceiling it used, the date it lands on
 * — and the prose variant is where those claims are still made in sentences.
 * `readout: 'stats'` below covers the other treatment.
 */
function renderTile(
  props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {},
  readout: 'prose' | 'stats' = 'prose',
  chooser: 'strip' | 'options' = 'strip',
) {
  /* ⚠ `strip` BY DEFAULT, pinned for the same reason `prose` is — 2026-09-23,
     when `study-pace-chooser` arrived and `options` became the BRANCH default.
     The assertions in this file were written against the card that names its
     plan in the heading and offers the week strip; `options` puts three
     radio buttons above all of it, which changes both the heading and the
     button count. The `options` treatment has its own block at the end. */
  window.localStorage.setItem(
    'cgp.featureFlags',
    JSON.stringify({
      'study-pace-readout': { enabled: true, variant: readout },
      'study-pace-chooser': { enabled: true, variant: chooser },
    }),
  )
  return render(
    <MemoryRouter>
      <FeatureFlagProvider>
      <StudyPaceTile
        today={TODAY}
        hoursRemaining={24}
        accessExpiresAt="2026-10-18"
        courseTitle="Life & Health Pre-License Course"
        detailsTo="/dashboard-rebrand?section=study-plan"
        {...props}
      />
      </FeatureFlagProvider>
    </MemoryRouter>,
  )
}

/** The sheet renders in a portal, so query the dialog rather than the tile. */
const sheet = () => screen.getByRole('dialog')
/**
 * Open the sheet from whichever control the current shape offers — "Adjust" on
 * the square, "Customize Study Plan" on the card since the 2026-09-21 redesign.
 *
 * MATCHED BY ROLE, not by label, precisely because the label differs and the
 * CLAIM does not: both shapes open the SAME sheet, which is the reuse the card
 * variant rests on. A helper pinned to one label would make a rename read as a
 * broken sheet.
 */
const openSheet = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Adjust|Customize Study Plan/ }))
  return sheet()
}

describe('StudyPaceTile — the tile operates nothing', () => {
  it('offers exactly one control, and it is Adjust', () => {
    renderTile()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveAccessibleName('Adjust')
  })

  it('carries no preset or nights control', () => {
    renderTile()
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('radiogroup')).toBeNull()
    expect(screen.queryByText(/Relaxed|Focused/)).toBeNull()
  })

  it('states a derived pace and the date it finishes', () => {
    renderTile()
    expect(screen.getByText(/a night · \d nights a week/)).toBeInTheDocument()
    expect(screen.getByText(/Finishes by/)).toBeInTheDocument()
  })

  it('names no pace at all on the TILE layout', () => {
    /* ⚠ REWRITTEN 2026-09-23, and the rewrite is the record of a decision
       rather than a test bending to the code. This asserted the tile printed
       "Recommended" and stopped once the learner chose — the provenance rule.

       The BADGE that carried it was removed the same day ("remove the badges
       altogether in the widget because it's showing in the name of the card").
       On the CARD layout the name moved into the eyebrow, and the test below
       pins it there. The tile has no eyebrow of its own — its caption is a bare
       "Study Pace" — so on this layout the name is simply gone.

       That is a real reduction, and pinning the absence is what makes it a
       decision someone can find: the tile no longer says which plan it is
       showing, in either direction. `paceBadgeLabel` is exported for whenever
       it should. */
    renderTile()
    expect(screen.queryByText('Recommended')).toBeNull()
    expect(screen.queryByText(/Focused & Quick|Steady & Relaxed|Custom/)).toBeNull()
  })

  it('links Details at a real in-shell address', () => {
    renderTile()
    expect(screen.getByRole('link', { name: /Details/ })).toHaveAttribute(
      'href',
      '/dashboard-rebrand?section=study-plan',
    )
  })
})

/**
 * ─── THE SHEET, REBUILT AGAIN 2026-09-22 ────────────────────────────────
 *
 * These replace the suite that pinned the four-group sheet (aim rows, a
 * days-a-week segment, an exam field, a plan switch). That IA is gone: the
 * sheet is now a CHOOSER of study styles and one screen per style, ported from
 * `adjust-your-pace-prototype.html`. The claims worth keeping survived the
 * port and are re-pinned below — one tab stop per radio group, `aria-disabled`
 * where a thing cannot be chosen, spoken durations beside glyph fractions, the
 * draft-until-Save contract, and the two ceilings.
 *
 * The one genuinely NEW claim, and the one a refactor is most likely to break:
 * **the footer's promise is a contract.** It states what the dashboard will
 * show before the learner presses Save, so the card must then show exactly
 * that. It did not, when this was first wired — the tile re-derived a pace from
 * `nights` and ignored the week that had been built.
 */

/**
 * Open the sheet ALREADY ON a style screen, the way a returning learner does.
 *
 * ⚠ THE CHOOSER'S THREE STYLE ROWS WENT ON 2026-09-23 — it offers the three
 * NAMED PLANS and Build my own now, and the first three apply and close. The
 * `sprint` / `evenings` / `blocks` screens are intact but no row opens them.
 *
 * THEY ARE STILL REACHABLE, though, and this is the real path rather than a
 * test hack: `PaceSheetBody` seeds its screen from `choices.approach`, so a
 * learner who built an evenings plan before today re-opens on it. Rendering
 * the sheet directly with that approach set is exactly that state — which is
 * also why these tests still earn their place: the screens are live code for
 * anyone who has one saved.
 *
 * ⚠ IF THE ROWS COME BACK, these should go back through the chooser. A test
 * that only ever enters by the back door stops noticing the front one is
 * bricked.
 */
async function openSheetAt(approach: 'sprint' | 'evenings' | 'blocks' | 'custom') {
  const view = render(
    <MemoryRouter>
      <StudyPaceSheet
        open
        onClose={() => {}}
        today={TODAY}
        hoursRemaining={24}
        accessExpiresAt="2026-10-18"
        courseTitle="Life & Health Pre-License Course"
        choices={{
          presetId: null,
          nights: null,
          examDate: null,
          style: 'average',
          approach,
          schedule: null,
          plan: null,
        }}
        onChange={() => {}}
      />
    </MemoryRouter>,
  )
  return { view, dialog: await screen.findByRole('dialog') }
}

describe('StudyPaceSheet — the chooser', () => {
  it('offers the three named plans and Build my own, with Recommended checked', async () => {
    /* ⚠ REWRITTEN 2026-09-23. It asserted the OLD shape: "Recommended is stated
       as an ANSWER, not offered as a fifth option", in a block above four style
       rows. The ask inverted exactly that — "Recommended will be selected by
       default, but will still be part of the existing list" — so it is one row
       of four now and the styles it used to sit above are gone.

       The three plans apply and close; only Build my own opens a screen. */
    const user = userEvent.setup()
    renderTile()
    const dialog = await openSheet(user)
    const group = within(dialog).getByRole('radiogroup', { name: 'Study pace' })
    const rows = within(group).getAllByRole('radio')
    expect(rows.map((r) => r.querySelector('.cre-pace-sheet__option-title')?.textContent)).toEqual([
      'Steady & Relaxed',
      'Recommended',
      'Focused & Quick',
    ])
    // Recommended, by default — `presetId` is null until the learner chooses.
    expect(rows.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
    expect(rows[1].getAttribute('aria-checked')).toBe('true')
    // …and Build my own is the one row that still leads somewhere.
    expect(dialog.querySelector('[data-shape="custom"]')).toBeTruthy()
    for (const gone of ['sprint', 'evenings', 'blocks']) {
      expect(dialog.querySelector(`[data-shape="${gone}"]`)).toBeNull()
    }
  })

  it('offers no Save until a style has been opened', () => {
    /* There is nothing to save on the chooser: the learner has not built a
       week. "Keep recommended" is a different promise and says so. */
    renderTile()
    return openSheet(userEvent.setup()).then((dialog) => {
      expect(within(dialog).queryByRole('button', { name: /^Save pace/ })).toBeNull()
    })
  })

  it('goes back out of a style to the chooser', async () => {
    /* Entered through `choices.approach` rather than a row — see `openSheetAt`.
       The way OUT is unchanged and is what this pins: the back link returns to
       the chooser, which is now the four-row list. */
    const user = userEvent.setup()
    const { dialog } = await openSheetAt('evenings')
    expect(within(dialog).getByRole('group', { name: 'Which weeknights?' })).toBeTruthy()
    await user.click(within(dialog).getByRole('button', { name: /All pace styles/ }))
    expect(within(dialog).getByRole('radiogroup', { name: 'Study pace' })).toBeTruthy()
  })
})

describe('StudyPaceSheet — the footer states a contract', () => {
  it('shows the card exactly what the footer promised', async () => {
    /* THE CLAIM THIS WHOLE PORT RESTS ON, and the bug it shipped with. The
       footer reads "Your dashboard will show: … finishing around <date>"; the
       learner presses Save; the card has to agree. It did not, because the tile
       re-derived a pace from `nights` and never looked at the week that was
       built — so the sheet promised one date and the card printed another. */
    const user = userEvent.setup()
    /* THROUGH "BUILD MY OWN" as of 2026-09-23 — the chooser's style rows are
       gone and this assertion needs the SHEET WIRED TO THE TILE (it checks the
       card agrees with the footer after Save), which `openSheetAt` cannot give
       it. Build my own is the one door left that still builds a week. */
    renderTile()
    const dialog = await openSheet(user)
    await user.click(dialog.querySelector('[data-shape="custom"]')!)
    const promised = dialog
      .querySelector('.cre-pace-sheet__summary')!
      .textContent!.match(/finishing around ([A-Z][a-z]+ \d+)/)![1]
    await user.click(within(dialog).getByRole('button', { name: /^Save pace/ }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.textContent).toContain(promised)
  })

  it('discards the draft on Cancel', async () => {
    const user = userEvent.setup()
    renderTile()
    const before = document.body.textContent
    const dialog = await openSheet(user)
    await user.click(dialog.querySelector('[data-shape="custom"]')!)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(document.body.textContent).toBe(before)
  })

  it('re-opens on the style the learner built, not on the chooser', async () => {
    /* A plan you cannot get back to is a plan you rebuild. */
    const user = userEvent.setup()
    renderTile()
    const first = await openSheet(user)
    await user.click(first.querySelector('[data-shape="custom"]')!)
    await user.click(within(first).getByRole('button', { name: /^Save pace/ }))
    const second = await openSheet(user)
    /* THE CUSTOM SCREEN as of 2026-09-23 — the evenings row is gone from the
       chooser, so Build my own is the round trip available from the tile.

       ASSERTED AS "NOT THE CHOOSER" rather than by naming a control on the
       screen, which is the claim itself and is also what survives the screens
       being re-arranged: the back link only exists on a screen, and the plan
       radiogroup only exists on the chooser. A plan you cannot get back to is a
       plan you rebuild. */
    expect(within(second).getByRole('button', { name: /All pace styles/ })).toBeTruthy()
    expect(within(second).queryByRole('radiogroup', { name: 'Study pace' })).toBeNull()
    expect(within(second).queryByRole('button', { name: 'Keep recommended' })).toBeNull()
  })
})

describe('StudyPaceSheet — the outcome reads the simulator', () => {
  /* Entered through `choices.approach`, not a chooser row — those went on
     2026-09-23. See `openSheetAt`, which explains why this is the real path
     and not a test hack. */
  const openStyle = async (shape: 'sprint' | 'evenings' | 'blocks' | 'custom') => {
    const user = userEvent.setup()
    const { dialog } = await openSheetAt(shape)
    return { user, dialog }
  }

  it('states a week, a verdict and where it lands', async () => {
    const { dialog } = await openStyle('evenings')
    const outcome = dialog.querySelector('.cre-pace-sheet__outcome')!
    expect(outcome.textContent).toMatch(/a week/)
    // The badge's tone is reinforcement; the SENTENCE is the signal, so it must
    // survive the colour being removed.
    const badge = dialog.querySelector('.cre-pace-sheet__badge')!
    expect(badge.getAttribute('data-tone')).toMatch(/good|warn|bad/)
    expect(badge.textContent).toMatch(/Finishes|Pick at least/)
  })

  it('never doubles the unit', () => {
    /* `formatHours` carries its own ("8½ hours", "45 minutes"), so a sentence
       that adds one reads "10 hours hours a week" — which it did, until the
       browser said it out loud. */
    return openStyle('evenings').then(({ dialog }) => {
      expect(dialog.textContent).not.toMatch(/hours hours/)
    })
  })

  it('advises on a long day without refusing it', async () => {
    const { user, dialog } = await openStyle('blocks')
    const more = within(dialog).getByRole('button', { name: 'More time on Sat' })
    for (let i = 0; i < 6; i++) await user.click(more)
    expect(dialog.querySelector('.cre-pace-sheet__advice')!.textContent).toMatch(
      /hard to keep up|split/,
    )
    // …and the plan is still saveable, because a free Saturday is the learner's
    // to spend.
    expect(within(dialog).getByRole('button', { name: /^Save pace/ })).not.toBeDisabled()
  })

  it('draws no calendar — the strip is switched off', () => {
    /* HIDDEN 2026-09-22, the direct ask, on every style screen rather than on
       one. Asserted as an ABSENCE so that switching `SHOW_PLAN_CALENDAR` back
       on fails here and gets re-decided, rather than quietly reappearing in a
       sheet someone has since redesigned around its absence. */
    return openStyle('blocks').then(({ dialog }) => {
      expect(dialog.querySelector('.cre-pace-sheet__cal')).toBeNull()
      expect(within(dialog).queryByText('Your plan')).toBeNull()
      // …and the outcome above it still states every fact the grid drew.
      expect(dialog.querySelector('.cre-pace-sheet__outcome')!.textContent).toMatch(
        /a week[\s\S]*Finishes/,
      )
    })
  })
})

describe('StudyPaceSheet — two ceilings', () => {
  /* UNCHANGED CLAIM, new home. The exam field left the sheet in September; the
     binding NOTE did not, and it is the part that matters — a pace that
     switched ceilings silently is how a learner stops believing the number. */
  const openWith = async (props: Parameters<typeof renderTile>[0]) => {
    const user = userEvent.setup()
    renderTile(props)
    const dialog = await openSheet(user)
    await user.click(dialog.querySelector('[data-shape="custom"]')!)
    return dialog
  }

  it('names the access window while there is no exam date', async () => {
    const dialog = await openWith({})
    expect(dialog.querySelector('[data-binding="access"]')!.textContent).toContain(
      formatPaceDate('2026-10-18'),
    )
  })

  it('hands the ceiling to an exam inside the window, and says so', async () => {
    const dialog = await openWith({ examDate: '2026-10-01' })
    const note = dialog.querySelector('[data-binding="exam"]')!
    expect(note.textContent).toContain('exam date is the one doing the work')
  })

  it('measures the plan against the EXAM once it binds', async () => {
    /* The join between the two models. `simulateSchedule` takes
       `model.hardEndIso`, so an exam that binds earlier moves the verdict here
       exactly as it moves the presets — otherwise the sheet could congratulate
       a plan that overruns the exam it is bound to. */
    const dialog = await openWith({ examDate: '2026-09-25' })
    expect(dialog.querySelector('.cre-pace-sheet__badge')!.textContent).toMatch(
      /you need to be ready|Finishes/,
    )
  })
})

describe('StudyPaceSheet — the shell, the keyboard and the ear', () => {
  /* As above — `choices.approach`, not a chooser row. */
  const openStyle = async (shape: 'sprint' | 'evenings' | 'blocks' | 'custom' = 'evenings') => {
    const user = userEvent.setup()
    const { dialog } = await openSheetAt(shape)
    return { user, dialog }
  }

  it('is header / scroll body / footer, so the footer cannot be clipped', async () => {
    /* The 2026-09-21 fix, still the reason the panel works: three flex children,
       and `min-height: 0` on the middle one. A footer rendered INSIDE the scroll
       body is how Save became unreachable with the plan open. */
    const { dialog } = await openStyle()
    const shell = dialog.querySelector('.cre-pace-sheet')!
    expect(shell.children).toHaveLength(3)
    expect(shell.querySelector('.cre-pace-sheet__footer')!.parentElement).toBe(shell)
  })

  it('is ONE tab stop per radio group, with arrows moving selection', async () => {
    const { user, dialog } = await openStyle()
    const group = within(dialog).getByRole('radiogroup', { name: 'Hours on a weeknight' })
    const radios = within(group).getAllByRole('radio')
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1)
    const startIndex = radios.findIndex((r) => r.getAttribute('aria-checked') === 'true')
    radios[startIndex].focus()
    await user.keyboard('{ArrowRight}')
    const after = within(group)
      .getAllByRole('radio')
      .findIndex((r) => r.getAttribute('aria-checked') === 'true')
    expect(after).toBe(startIndex + 1)
  })

  it('disables a stepper at its floor rather than letting it look live', async () => {
    const { dialog } = await openStyle()
    // Sunday starts at Off, so "less" has nowhere to go.
    expect(within(dialog).getByRole('button', { name: 'Less time on Sunday' })).toBeDisabled()
    expect(within(dialog).getByRole('button', { name: 'More time on Sunday' })).not.toBeDisabled()
  })

  it('shows the fraction and speaks it in words', async () => {
    /* A screen reader renders `¾` as "three quarters", "3/4" or nothing at all
       depending on the engine — so the one figure this component exists to
       communicate is the one a listener may not get. */
    const { dialog } = await openStyle()
    const value = dialog.querySelector('.cre-pace-sheet__step-value')!
    expect(value.querySelector('.cre-sr-only')).toBeTruthy()
    expect(value.getAttribute('aria-live')).toBe('polite')
  })
})
describe('StudyPaceTile — the presets card', () => {
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 24, accessExpiresAt: '2026-10-18' })

  const renderCard = (
    props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {},
    readout: 'prose' | 'stats' = 'prose',
    chooser: 'strip' | 'options' = 'strip',
  ) => renderTile({ layout: 'card', ...props }, readout, chooser)

  it('states the evening and the week the model derives', () => {
    renderCard()
    const preset = defaultPreset(model())
    /* ASSERTED ON `textContent`, not via `getByText`: the headline sets its own
       figure at a larger size, which makes it a child element, and
       `getByText`'s default matcher reads only an element's DIRECT text nodes —
       so a sentence split by a `<span>` is invisible to it. That is the "broken
       up by multiple elements" trap, and it fails as a missing element rather
       than as a wrong string.

       BOTH FIGURES COME FROM ONE FORMATTER. The design sets the nightly figure
       and its unit at different sizes, so the card splits `formatEvening`'s
       output rather than deriving the number again — a second rounding here is
       how "1¾ hours a night" and "8¾ hours a week" would stop being the same
       arithmetic. */
    expect(document.body.textContent).toContain(
      `About ${formatEvening(preset.minsPerNight)} a night, ${formatEvening(preset.minsPerWeek)} a week`,
    )
  })

  it('draws the week, shading the nights the pace falls on', () => {
    /* THE DESIGN'S BIGGEST ADDITION. The old card said "5 nights a week" and
       left the learner to picture it.

       The days are NOT invented for this strip: with no plan built it renders
       `defaultWeekdays(nights)` — the same helper the sheet uses to propose a
       calendar, moved to `@/lib/studyPace` when this second caller arrived. Two
       surfaces deriving "which nights" apart from each other is how a card
       comes to shade Mon–Thu while the plan behind it builds Mon–Wed + Fri. */
    renderCard()
    const preset = defaultPreset(model())
    const strip = document.querySelector('[aria-hidden]')!
    const cells = Array.from(strip.querySelectorAll('span'))
    /* INITIALS as of 2026-09-21, when the strip became circular indicators —
       "WED" does not fit a 28px dot at a legible size. Compared against the
       shared labels rather than a literal list, so the two cannot drift. */
    expect(cells.map((c) => c.textContent)).toEqual(WEEKDAY_LABELS.map((d) => d[0]))
    const shaded = cells.filter((c) => c.style.background !== 'transparent')
    expect(shaded).toHaveLength(preset.nights)
    // …and they are the FIRST n, Monday-first — the helper's own rule.
    expect(shaded.map((c) => c.textContent)).toEqual(
      defaultWeekdays(preset.nights).map((i) => WEEKDAY_LABELS[i][0]),
    )
  })

  it('hides the strip from a screen reader, because the sentence says it', () => {
    /* The accessible name must never depend on which cells are filled. The
       headline above already states the pace in words, so a reader walking
       seven day names to count four of them learns nothing new. */
    renderCard()
    const strip = document.querySelector('[aria-hidden]')!
    expect(strip.getAttribute('aria-hidden')).not.toBeNull()
  })

  it('states the window and the finish date it lands on', () => {
    /* THE THREE BODY LINES, checked against the model rather than as strings:
       the days left agree with the ceiling the model resolved, the access date
       is the learner's OWN expiry (not `hardEndIso`, which is a day earlier
       because finishing the day access dies is not finishing), and the finish
       is the preset's. */
    renderCard()
    const preset = defaultPreset(model())
    const text = document.body.textContent ?? ''
    expect(text).toContain(`You have ${model().daysToCeiling} days left to finish`)
    expect(text).toContain(`Access ends on ${formatPaceDate('2026-10-18')}`)
    expect(text).toContain(`you will finish around ${formatPaceDate(preset.finishIso)}`)
  })

  it('follows the exam date when that is what binds', () => {
    /* Driven by the PROP as of 2026-09-21 — the sheet's exam field was hidden,
       and this is the path a real one takes anyway: the Schedule State Exam
       card writes `examDateStore`, the band threads it here. */
    renderCard({ examDate: '2026-10-10' })
    // The window line moves onto the exam — a card explaining itself against
    // one ceiling while the model priced another is the silent switch
    // `binding` exists to prevent.
    expect(document.body.textContent).toContain(`Your exam is on ${formatPaceDate('2026-10-10')}`)
    expect(document.body.textContent).not.toMatch(/Access ends on/)
  })

  it('claims no deadline on a course that has none', () => {
    /* No access window and no exam date: the model has nothing to aim at and
       falls back to its default horizon. The card must NOT then say "you have N
       days left to finish the course material" — that is a deadline the data
       does not have — and names the date as a target instead. */
    renderCard({ accessExpiresAt: undefined })
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/left to finish the course material/)
    expect(text).not.toMatch(/Access ends on/)
    expect(text).toMatch(/no access deadline, so the date below is a suggested target/)
    // …and it still states the finish, which is the one thing it can.
    expect(text).toMatch(/you will finish around/)
  })

  it('operates exactly one thing, and it opens the shared sheet', () => {
    /* The claim the square makes too: this is a statement, not a control panel.
       The redesign replaced Start studying + Adjust with one link, so the count
       went from two to one — and `Details →` is still absent, because the
       buttons ARE this card's floor. */
    renderCard()
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Customize Study Plan'])
    expect(buttons[0].getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.queryByRole('radio')).toBeNull()
  })

  it('takes the CTA off the design’s magenta and off inline ink', () => {
    /* ⚠ THE DESIGN SPECIFIES `#a24796`. That is the CRE file's accent; on XCEL
       the equivalent ramp is the Brick, a FILL colour measuring 2.05:1 as TEXT
       on the dark shell and the ramp this version deliberately moved every CTA
       off on 2026-09-16 ("navy means do this; red means this is an
       assessment"). `.cre-cta-ink` owns that decision and carries the dark-mode
       swap a hex cannot — so the assertion is the ABSENCE of an inline colour,
       which is what lets the class win. */
    renderCard()
    const cta = screen.getByRole('button', { name: /Customize Study Plan/ })
    expect(cta.className).toContain('cre-cta-ink')
    expect(cta.style.color).toBe('')
    expect(document.body.innerHTML).not.toMatch(/a24796/i)
  })

  it('names itself from the review gap, not from who chose the plan', async () => {
    /* ⚠ REWRITTEN 2026-09-23, and the rewrite records a rule being NARROWED
       rather than a test bending. This asserted the prototype's §02 finding:
       the card said "Recommended Study Pace" until the learner touched it and
       "Your Study Pace" after, so the product never went on calling a figure
       they picked a recommendation.

       The eyebrow is derived from DAYS TO REVIEW now — the direct ask — so the
       name describes the plan's shape rather than its author, and a
       learner-chosen plan landing in the 7-15 band is called "Recommended"
       again. `paceNameFor`'s own note spells out that trade at length.

       WHAT IS STILL WORTH PINNING, and what this now checks: the heading and
       the Days to review cell are ONE derivation. They were briefly two, which
       is exactly how a card comes to print "Steady & Relaxed" over a readout
       saying 16 days. */
    const user = userEvent.setup()
    renderCard({}, 'stats')
    const nameThenGap = () => {
      const heading = screen.getByText(/Study Pace$/).textContent ?? ''
      const gap = Number(/(\d+)\s*days?\s*Extra prep time/i.exec(document.body.textContent ?? '')?.[1])
      return { heading, gap }
    }
    const before = nameThenGap()
    expect(before.heading).toBe(`${paceNameFor(before.gap)} Study Pace`)

    // …and it still MOVES, which is the half the old test proved by flipping.
    const dialog = await openSheet(user)
    await user.click(dialog.querySelector('[data-shape="custom"]')!)
    await user.click(within(dialog).getByRole('button', { name: /Save pace/ }))
    const after = nameThenGap()
    expect(after.heading).toBe(`${paceNameFor(after.gap)} Study Pace`)
  })

  it('keeps the square shape untouched in the default layout', () => {
    // The card is a fifth treatment, not a replacement: Testing 2's tile still
    // renders exactly as it did, with one control on a 1:1 tile.
    renderTile()
    expect(screen.getAllByRole('button')).toHaveLength(1)
    expect(screen.getByText('Study Pace')).toBeInTheDocument()
  })
})

/**
 * THE REBUILD — 2026-09-21. Structure, keyboard and the save contract.
 *
 * jsdom has no layout, so the clipping bug this rebuild exists to fix cannot be
 * measured here. What CAN be pinned is the shape that fixes it: three flex
 * children, the middle one scrolling, the footer a SIBLING of it rather than
 * the last thing inside. Those are the conditions the fix rests on, and they
 * are what a later edit would undo by accident.
 */describe('StudyPaceTile — the week strip reads real minutes', () => {
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 24, accessExpiresAt: '2026-10-18' })
  const renderCard = (
    props: Partial<React.ComponentProps<typeof StudyPaceTile>> = {},
    readout: 'prose' | 'stats' = 'prose',
    chooser: 'strip' | 'options' = 'strip',
  ) => renderTile({ layout: 'card', ...props }, readout, chooser)

  /** The strip's cells, in order. */
  const cells = () =>
    [...document.querySelector('[aria-hidden]')!.querySelectorAll('span')] as HTMLElement[]
  /** How full a cell is drawn, 0–100. The fill is a bottom-up gradient stop. */
  const fillPct = (el: HTMLElement) =>
    Number(/([\d.]+)%/.exec(el.style.background)?.[1] ?? 0)

  const TODAY_INDEX = (TODAY.getDay() + 6) % 7

  it('fills each elapsed day by minutes against that day’s target', () => {
    const preset = defaultPreset(model())
    const target = preset.minsPerNight
    // A full day, a half day, and a day with nothing — all in the past.
    const week = [0, 0, 0, 0, 0, 0, 0]
    week[0] = target
    week[1] = target / 2
    renderCard({ weekMinutes: week })
    const c = cells()
    expect(fillPct(c[0])).toBe(100)
    expect(fillPct(c[1])).toBe(50)
    // A day with nothing studied is an empty ring, not a filled grey one.
    expect(c[2].style.background).toBe('transparent')
  })

  it('clamps a day that ran long to full, rather than overflowing it', () => {
    const preset = defaultPreset(model())
    const week = [preset.minsPerNight * 3, 0, 0, 0, 0, 0, 0]
    renderCard({ weekMinutes: week })
    expect(fillPct(cells()[0])).toBe(100)
  })

  it('leaves days that have not happened EMPTY, whatever the data says', () => {
    /* A Thursday that has not arrived is not a Thursday they missed, and
       filling it would say it was. The fixture authors the whole week — the
       later days become visible when the clock moves, not before. */
    const week = [0, 0, 0, 0, 0, 0, 0].map(() => 999)
    renderCard({ weekMinutes: week })
    const c = cells()
    for (let i = TODAY_INDEX + 1; i < 7; i += 1) {
      expect(c[i].style.background, `day ${i}`).toBe('transparent')
    }
  })

  it('falls back to the SUGGESTED week when there is nothing to read', () => {
    /* Absent minutes means "no week yet", not "a week of zeros" — a learner at
       0% has not had a bad week, they have not had a week. The strip states the
       nights the pace falls on instead, which is what it always did. */
    const preset = defaultPreset(model())
    renderCard()
    const shaded = cells().filter((c) => c.style.background !== 'transparent')
    expect(shaded).toHaveLength(preset.nights)
    // …and every one of them is drawn FULL: a suggestion has no partial state.
    for (const cell of shaded) expect(fillPct(cell)).toBe(100)
  })
})

describe('StudyPaceTile — the week that cannot be salvaged', () => {
  /* 32 hours of coursework against an 11-day window: `minsPerWeek` past
     `CEILING_MINS × 6`, which is the model's own definition of "no pace fits".
     The numbers are the `progress-off-track` fixture's, and the first assertion
     below pins that they still reach the state — a card test that silently
     stopped exercising the branch it names is the failure this guards. */
  const model = () =>
    studyPace({ today: TODAY, hoursRemaining: 32, accessExpiresAt: '2026-09-29' })

  it('is the state the copy is written for', () => {
    expect(defaultPreset(model()).state).toBe('no')
  })

  it('names BOTH ways out and quotes no figure', () => {
    /* THE ONE RULE THIS COPY MUST KEEP — 2026-09-21. A pace reaching this state
       needs more than `CEILING_MINS` a night, and `CEILING_MINS`' own note says
       why printing it is wrong: "no number is honest there, and the answer is
       more time or fewer lessons, not a bigger figure." So the card says
       DRASTICALLY and names the two options the learner actually has. A
       well-meaning refactor that "helpfully" restores the nightly figure here
       is what this asserts against. */
    renderTile({ layout: 'card', hoursRemaining: 32, accessExpiresAt: '2026-09-29' })
    const text = document.body.textContent ?? ''
    expect(text).toContain('won’t fit before your access ends')
    expect(text).toContain('drastic jump in pace')
    expect(text).toContain('extending your course access')
    // No hours, no minutes, no nightly number — in any of the card's copy.
    expect(text).not.toMatch(/\d+\s*(hours?|minutes?|mins?)\s*a\s*night/i)
    // …and the one control the card ever offers is still there.
    expect(screen.getByRole('button', { name: /Customize Study Plan/ })).toBeTruthy()
  })

  it('is reachable from the demo controls, not just from the model', () => {
    /* THE SILENT FALLBACK THIS FIXES — 2026-09-21. `progress-off-track` lived
       in `DashboardProgressVariant` and in every `*_BY_VARIANT` map, and the
       "Pace — won't finish" persona set it, but it was never declared on the
       flag — so the seed was ignored, the dashboard fell back to On Track, and
       the whole branch above was unreachable dead copy that still type-checked
       and still passed every test. Pinning the catalog is the only assertion
       that would have caught it.

       ⚠ RE-AIMED 2026-09-23. `progress-off-track` was archived that day as
       redundant (see `ARCHIVED_ITEMS`), so it is deliberately NOT in the
       catalog any more and asserting that it is would fail. The CLAIM is
       unchanged and is the reason this test exists: the branch above must have
       a door in the demo. AT RISK is that door now — 3 days against ~36
       remaining lessons — so this pins the door rather than the doorway it used
       to be.

       If Off Track is ever restored, put its assertion back ALONGSIDE this one
       rather than instead of it. The failure mode is a branch with no way in,
       and two ways in is not the problem. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'dashboard-progress-state')!
    const values = flag.variants?.map((v) => v.value) ?? []
    expect(values).toContain('progress-at-risk')
    expect(values).not.toContain('progress-off-track')

    /* AND THE STATE ITSELF, not just the catalog entry — which is the half the
       original assertion could not make, and the half that would catch At Risk
       drifting back to a runway where a pace fits. The figures are the
       persona's own. */
    const atRisk = dashboardProgressPersonaFor('xcel', 'progress-at-risk', 'qe')!
    const course = atRisk.path.jumpBackIn
    const remaining =
      (atRisk.path.mandatory?.required ?? 0) - (atRisk.path.mandatory?.completed ?? 0)
    expect(remaining).toBeGreaterThan(0)
    expect(
      defaultPreset(
        studyPace({
          today: TODAY,
          hoursRemaining: remaining,
          accessExpiresAt: course?.expiresAt,
        }),
      ).state,
    ).toBe('no')
  })
})

describe('study-pace-chooser: options — three named plans', () => {
  /*
   * 2026-09-23, the direct ask: "I want the recommended study pace title to be
   * just Study Pace. And I want 3 selectable options below that title.
   * Recommended = somewhere in between the 2 below. Focused & Quick = studying
   * 7 days / week. Steady & Relaxed = studying the least amount to still finish
   * in time."
   *
   * The `strip` treatment is unchanged and is what every other block in this
   * file pins — "don't lose current logic, make it a flagged variant".
   */
  const renderOptions = () => renderTile({ layout: 'card' }, 'stats', 'options')
  /** 30 days past this file's `TODAY`, as ISO. */
  const CEILING_30D = (() => {
    const d = new Date(TODAY)
    d.setDate(d.getDate() + 30)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })()

  it('drops the derived name from the heading', () => {
    renderOptions()
    expect(screen.getByText('Study Pace')).toBeTruthy()
    // The `strip` treatment's heading named the plan; this one does not, because
    // the plan is named in the picker directly below it.
    expect(screen.queryByText(/Steady & Relaxed Study Pace|Recommended Study Pace/)).toBeNull()
  })

  it('offers exactly the three, as one radiogroup', () => {
    /* A RADIOGROUP because they are one choice with three answers and exactly
       one is always true. Three independent buttons would let a screen-reader
       user press two and learn nothing about which is current. */
    renderOptions()
    const group = screen.getByRole('radiogroup', { name: 'Study pace' })
    const radios = within(group).getAllByRole('radio')
    /* The NAME is the option's first line — read off the element rather than
       regexed out of `textContent`, which also carries the evening and the
       date. */
    expect(radios.map((r) => r.querySelector('span')?.textContent)).toEqual([
      'Steady & Relaxed',
      'Recommended',
      'Focused & Quick',
    ])
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })

  it('makes Focused & Quick genuinely the quickest', () => {
    /* ⚠ A BUG THIS CAUGHT, and the reason this assertion is about ORDER rather
       than about a date. The first build priced Focused at `FOCUSED_DAYS`
       clamped to the window — so against a short window (an entered exam date)
       Focused became 13 days while Recommended was 9, and the picker offered a
       "Focused & Quick" finishing FOUR DAYS LATER than the option above it.

       `studyPace` never shows that, because it DROPS focused once it stops
       being faster. A picker of three fixed names cannot drop one, so it has to
       be fastest by construction. */
    const short = paceOptionsFor({
      today: TODAY,
      hoursRemaining: 24,
      // A tight ceiling — the shape that produced the inversion.
      accessExpiresAt: '2026-09-27',
    })
    const byId = Object.fromEntries(short.map((o) => [o.id, o]))
    expect(byId.focused.priced.days).toBeLessThanOrEqual(byId.recommended.priced.days)
    expect(byId.recommended.priced.days).toBeLessThanOrEqual(byId.relaxed.priced.days)
  })

  it('reads the ask literally: seven nights, and the fewest that still fit', () => {
    /* A ceiling 30 days past THIS file's `TODAY` — the NY fixture's own dates
       are months behind it, which resolves to no window at all and makes every
       option collapse to seven nights. */
    const opts = paceOptionsFor({ today: TODAY, hoursRemaining: 42, accessExpiresAt: CEILING_30D })
    const byId = Object.fromEntries(opts.map((o) => [o.id, o]))
    // "Focused & Quick = studying 7 days / week" — flat, by definition.
    expect(byId.focused.nights).toBe(7)
    /* "Steady & Relaxed = studying the least amount to still finish in time" —
       a SEARCH, not a constant: the fewest nights the model will still price,
       over the whole window.

       ⚠ "STILL FINISH" IS `state !== 'no'`, not a per-night ceiling, and that
       distinction is the bug this pins. The model refuses on the WEEK
       (`minsPerWeek > CEILING_MINS × 6`), so a first build testing
       `minsPerNight <= CEILING_MINS` returned plans the model would not quote —
       every one of the three came back `state: 'no'`. */
    const input = { today: TODAY, hoursRemaining: 42, accessExpiresAt: CEILING_30D }
    expect(byId.relaxed.nights).toBeLessThan(7)
    expect(byId.relaxed.priced.state).not.toBe('no')
    /* …and it is the FEWEST: one below breaches, or is under the floor. The
       floor is `NIGHT_OPTIONS[0]`, because two nights a week is not a week the
       Adjust sheet offers — a first build searched from one and produced a
       two-night "Steady & Relaxed" the sheet would have refused to show. */
    expect(byId.relaxed.nights).toBeGreaterThanOrEqual(NIGHT_OPTIONS[0])
    if (byId.relaxed.nights > NIGHT_OPTIONS[0]) {
      expect(
        priceFinish(input, byId.relaxed.priced.days, byId.relaxed.nights - 1).state,
      ).toBe('no')
    }
    // "Recommended = somewhere in between the 2 below."
    expect(byId.recommended.nights).toBeGreaterThanOrEqual(byId.relaxed.nights)
    expect(byId.recommended.nights).toBeLessThanOrEqual(byId.focused.nights)
  })

  it('re-prices the whole card when a plan is picked', () => {
    renderOptions()
    const group = screen.getByRole('radiogroup', { name: 'Study pace' })
    const before = document.body.textContent ?? ''
    fireEvent.click(within(group).getAllByRole('radio')[2])
    const after = document.body.textContent ?? ''
    expect(after).not.toBe(before)
    // The picked one is the checked one, and it is still the only checked one.
    const radios = within(group).getAllByRole('radio')
    expect(radios[2].getAttribute('aria-checked')).toBe('true')
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1)
  })
})
