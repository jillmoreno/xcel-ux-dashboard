import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AtlasReadinessCard } from '@/components/compass/AtlasReadinessCard'
import { paceStandingMessage, type PaceStanding } from '@/components/compass/paceStanding'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { ExamDateScenario } from './ExamDateScenario'
import { AtlasRegionThumb } from './AtlasRegionThumb'
import { AtlasStepsFrame } from './AtlasStepsFrame'
import { pacePreviewProps, PREVIEW_ACCESS_ENDS } from './atlasPacePreview'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
import {
  AffidavitLauncher,
  AtlasProgressPanel,
  AtlasSurface,
  CourseHeadVariant,
  QuickLinksHoverDemo,
} from './AtlasHandoffPreviews'

/**
 * LIVE RENDERS FOR THE ATLAS HOME DEV-HANDOFF VARIANTS, keyed by handoff
 * component id and then by the variant's `name` as authored in
 * `prototypeFeatures.ts`.
 *
 * ⚠ THE KEY IS THE CONTRACT (2026-10-20). These renders used to be galleries
 * carrying their own captions, which made them a third description of a
 * component's variants alongside the two in the data — and they had already
 * drifted apart without anything failing (the Readiness gallery showed the
 * four current bands while the notes still described the five levels they
 * replaced; the pace ring's gallery had an "Exam booked" state the notes did
 * not name at all). Keying by `name` means the live render sits in the SAME
 * row as the prose that describes it, and `DevHandoffVariants.test.ts` fails
 * on a key that matches no variant.
 *
 * Every render is the ACTUAL exported component with real props — nothing
 * here is a redrawn approximation — so a row cannot drift from the
 * implementation the way a screenshot would.
 *
 * NOT EVERY VARIANT HAS ONE, and that is fine: a variant with no entry renders
 * its prose alone and the section says why (see `variantRenderGap`). Two whole
 * components are deliberately absent, because their previews would be
 * approximations rather than the real thing:
 *
 *  - PAGE LAYOUT (`atlas-home-layout`) — WIP-vs-White is a whole-page chrome
 *    swap, not a component prop; the Live Preview tab's real route shows it.
 *  - STUDY JOURNEY (`atlas-home-study-journey`) — its list (`JourneyRow`) is a
 *    private, unexported function fed by page-local state, not a standalone
 *    component with its own props.
 *
 * Thunks, not elements: a map of ~30 constructed elements would be built on
 * import for the one component the reader opened.
 */
type VariantRenders = Record<string, () => ReactNode>

/* `AtlasJourneyLinksCard` reads its active row from `useSearchParams()`, and
 * the handoff page already sits inside the app's own Router. Without an
 * isolating `MemoryRouter` PER ROW, clicking a nav row in any instance would
 * rewrite the handoff page's own address bar, and every instance would share
 * one `?section=`. */
const quickLinks = (props: Record<string, unknown>, entries?: string[]) => () =>
  createElement(
    MemoryRouter,
    entries ? { initialEntries: entries } : null,
    createElement(AtlasJourneyLinksCard, props),
  )

/* The left column's cards are drawn inside the page's tan panel and have no
 * fill of their own, so each render carries it — see `AtlasProgressPanel`. */
/* ⚠ THE HANDLERS THE HOME SUPPLIES, because their absence CHANGES THE COPY
   (2026-10-21, Jillienne on a preview: "'here' should also be a link"). The
   pace card draws "…customize your pace here." with `here` as a button when it
   has `onCustomize` and as PLAIN TEXT when it does not — so a preview that
   passed no handler showed a sentence the page never renders, and the one word
   a reader is meant to click looked like prose. Same class of mismatch as the
   `bare` one: a preview is only true if it is given what the page gives. */
const NOOP = () => {}

const inPanel = (node: ReactNode) => createElement(AtlasProgressPanel, null, node)

/** One Steps render — the journey column of the real page, pinned to a state. */
const steps = (what: string, ff: string) => () =>
  createElement(AtlasStepsFrame, { title: `Study Journey — ${what}`, ff })

const ATLAS_VARIANT_RENDERS: Record<string, VariantRenders> = {
  /* Four sections, in the order the panel draws them: the dial, the pace, the
     exam row, then readiness. */
  'atlas-home-panel': {
    'Course progress — 0%': () => inPanel(createElement(AtlasPaceRingCard, { percent: 0, progressOnly: true })),
    'Course progress — 36%': () => inPanel(createElement(AtlasPaceRingCard, { percent: 36, progressOnly: true })),
    'Course progress — 100%': () => inPanel(createElement(AtlasPaceRingCard, { percent: 100, progressOnly: true })),

    'Study pace — the default, at 0%': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          ...pacePreviewProps({ accessExpiresAt: PREVIEW_ACCESS_ENDS, percent: 0 }),
          onCustomize: NOOP,
        }),
      ),
    ...Object.fromEntries(
      (
        [
          ['on-track', 'Study pace — on track'],
          ['ahead', 'Study pace — ahead of goal'],
          ['behind', 'Study pace — behind, recoverable'],
          ['off-track', 'Study pace — off track'],
          ['no-data', 'Study pace — no data yet'],
        ] as [PaceStanding, string][]
      ).map(([standing, name]) => [
        name,
        () =>
          inPanel(
            createElement(AtlasPaceRingCard, {
              percent: 42,
              weeks: 3,
              hoursPerWeek: 4,
              expected: { value: 'November 2', note: 'At current pace' },
              standingMessage: paceStandingMessage({
                standing,
                goalHoursPerWeek: 4,
                weeks: 3,
                finishIso: '2026-11-02',
              }),
              onCustomize: NOOP,
            }),
          ),
      ]),
    ),
    'Study pace — no plan fits': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          percent: 10,
          noPace: { binding: 'exam', days: -2, dateIso: '2026-11-01' },
          onCustomize: NOOP,
        }),
      ),
    /* The three exam-date states, computed by the real model against the
       committed access window (10 June) so the pacing difference between them
       is the product's arithmetic and not a claim.

       ⚠ ALL THREE PASS A STANDING, because all three are above 0%. The Home
       shows the starting-point line only while Progress is Not Started, so a
       42% card without one draws copy the page would never pair with that
       dial. `pacePreviewProps` BUILDS the sentence from the same plan the week
       goal comes from — see the `standing` note there for what went wrong when
       the three shared one hand-written message. */
    'With an exam date entered': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          ...pacePreviewProps({
            accessExpiresAt: PREVIEW_ACCESS_ENDS,
            examDate: '2026-05-28',
            percent: 42,
            standing: 'on-track',
          }),
          onCustomize: NOOP,
        }),
      ),
    'Exam before the course expires': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          ...pacePreviewProps({
            accessExpiresAt: PREVIEW_ACCESS_ENDS,
            examDate: '2026-06-02',
            percent: 42,
            standing: 'on-track',
          }),
          onCustomize: NOOP,
        }),
      ),
    'Exam after the course expires': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          ...pacePreviewProps({
            accessExpiresAt: PREVIEW_ACCESS_ENDS,
            examDate: '2026-07-15',
            percent: 42,
            standing: 'on-track',
          }),
          onCustomize: NOOP,
        }),
      ),

    /* ⚠ LAST OF THE PACE STATES, because it is the one that ends them. It sat
       mid-list under the name "Study pace — access has ended", which buried
       the only state where there IS no study pace among the five that have
       one. `expired` is read ahead of everything else on the card, so no
       `weeks` or `hoursPerWeek` are passed here — the old render passed both
       and the card ignored both, which read as though the figures were still
       live and merely hidden. */
    'Access has ended — the course expired': () =>
      inPanel(createElement(AtlasPaceRingCard, { percent: 34, expired: true })),
    /* ⚠ THE ALTERNATIVE, NOT A STATE THE PRODUCT REACHES (2026-10-21). The
       pair above and below is the decision: today the expired card says
       nothing about a booked exam, and `examWhenExpired` is the one prop
       between the product and showing it. Both Homes already pass `expired`
       and `exam` together, so if this wins it is a default to change, not a
       feature to build. The exam here is the same 2 June date the
       "Exam before the course expires" state uses, so the two read against
       each other. */
    'Access has ended — with the exam still booked': () =>
      inPanel(
        createElement(AtlasPaceRingCard, {
          percent: 34,
          expired: true,
          examWhenExpired: true,
          exam: pacePreviewProps({ examDate: '2026-06-02' }).exam,
        }),
      ),

    'Readiness — Not Started': () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, notStarted: true })),
    'Readiness — Beginner': () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 0 })),
    'Readiness — Developing': () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 1 })),
    'Readiness — Proficient': () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 2 })),
    'Readiness — Ready': () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 3 })),
  },

  /* ⚠ THE COLUMN, NOT THE PAGE (2026-10-21, Jillienne: "why are we showing
     the full screen? remove and only show the steps"). These drew `PageFrame`
     — the whole Home — so three journey steps were documented with a picture
     of everything around them. `AtlasStepsFrame` crops the same real page to
     the journey column; see its note for why it is still a frame. */
  'atlas-home-steps': {
    'Nothing started': steps('nothing started', 'atlas-v3-progress:not-started'),
    Default: steps('in progress', 'atlas-v3-progress:on-track'),
    'Part-way through the coursework': steps('part-way', 'atlas-v3-progress:developing'),
    'Education finished, exam next': steps('education done', 'atlas-v3-progress:education-done'),
    'One stop left': steps('one stop left', 'atlas-v3-progress:affidavit-done'),
    'All coursework done': steps('all coursework done', 'atlas-v3-progress:completed'),
    /* ⚠ THE SECOND AXIS OF THE COURSE CONTROL, not the Progress one — a
       regulated course is a property of the LICENCE, so it is pinned with
       `dashboard-course-state:<state>:regulated` and crosses every Progress
       state rather than being one of them. Shown at the same point in the
       course as Default, so the only difference a reader sees is the lock. */
    'Regulated course — stops unlock in order': steps(
      'regulated',
      'dashboard-course-state:fl:regulated,atlas-v3-progress:on-track',
    ),
  },

  'atlas-home-exam-date': {
    Asking: () => createElement(ExamDateScenario, {}),
    'Picking a date': () => createElement(ExamDateScenario, { picking: true }),
    Scheduled: () => createElement(ExamDateScenario, { examDate: '2026-05-28' }),
    'Date inside the access window': () =>
      createElement(ExamDateScenario, { examDate: '2026-06-02' }),
    'Date past the access window': () =>
      createElement(ExamDateScenario, { examDate: '2026-07-15' }),
    'Date too close for any plan': () =>
      createElement(ExamDateScenario, { examDate: '2026-05-14' }),
    /* Editing is the Scheduled date reopened — same stored date, the calendar
       showing, which is exactly what Edit does. */
    Editing: () => createElement(ExamDateScenario, { examDate: '2026-05-28', picking: true }),
  },
  /* THE PANEL ITSELF — its two compositions, which is the one thing neither
     card can show on its own: what the column looks like with Exam readiness
     ON, and what it looks like without it. The default `?demo=1` is the
     WITHOUT, because `atlas-readiness-section` is `defaultEnabled: false`. */
  // ⚠ MAIN'S PROPS, NOT THE CARD'S DEFAULTS (2026-10-21, Jillienne: "I keep
  // seeing things from different versions... everything should be what is
  // shown in the Final Prototype view"). The Home passes `bare` and
  // `matchPaceEyebrow` — the card drops its own tan fill and shares the
  // column's eyebrow, because it sits INSIDE the progress panel. Rendered with
  // the component's own defaults instead, it drew as a standalone tan card:
  // the treatment the other arm uses, and a version the final prototype does
  // not show.

  /* ⚠ EACH SCREEN SHOWS BOTH COMPONENTS (2026-10-21, Jillienne: "these screens
     will need to show not only the date logic, but also what happens in the
     Course Progress component when dates are set"). The dates below are chosen
     against the demo clock (2026-05-11) and the committed access window
     (2026-06-10) so each one lands in a genuinely different arm — and every
     figure on the right is computed by `studyPace`, never typed. */
  'atlas-home-quick-links': {
    Default: quickLinks({}),
    'Active row': quickLinks({}, ['/?section=courses']),
    'Hover / focus': () => createElement(QuickLinksHoverDemo),
  },

  // ⚠ ALL FOUR ARE REAL PROPS (2026-10-21). Three of these states carried a
  // "not reachable through the component's own props" note until Jillienne
  // asked what they looked like — and `WhiteStyleHead` takes `beginLabel`,
  // `meta` and `title`, so every one of them always was reachable. The note
  // was wrong, not the component.
  'atlas-home-course-head': {
    'Not started': () => createElement(CourseHeadVariant, { beginLabel: 'Begin Course' }),
    'In progress': () => createElement(CourseHeadVariant, { beginLabel: 'Resume Course' }),
    'No end date': () => createElement(CourseHeadVariant, { meta: 'none' }),
    'Expires soon': () =>
      createElement(CourseHeadVariant, { beginLabel: 'Resume Course', meta: 'expiring-soon' }),
    'Down to the last days': () =>
      createElement(CourseHeadVariant, { beginLabel: 'Resume Course', meta: 'last-day' }),
    'Long access window': () =>
      createElement(CourseHeadVariant, {
        title: 'New York Life and Health Pre-licensing',
        beginLabel: 'Resume Course',
        meta: 'long-window',
      }),
    'Course complete': () =>
      createElement(CourseHeadVariant, {
        beginLabel: 'Review Course',
        meta: 'complete',
        eyebrow: 'Congrats! You have completed this course.',
        withCertificate: true,
      }),
    /* ⚠ `beginLabel` IS INERT HERE — the expired arm removes Begin/Resume
       entirely, so nothing draws it. It is passed because the prop is required,
       and it says what the button WOULD have read. */
    Expired: () =>
      createElement(CourseHeadVariant, {
        beginLabel: 'Resume Course',
        meta: 'expired',
        eyebrow: 'Expired',
      }),
    'Long title': () =>
      createElement(CourseHeadVariant, {
        title: 'Florida Life and Health Pre-licensing with Comprehensive Exam Simulators',
      }),
  },

  // Step 1 reads the page's shared progress, not its own props, so these load
  // the real route pinned to each stage rather than rebuilding the list.
  'atlas-home-affidavit-modal': {
    'Pre-course Affidavit': () =>
      createElement(AffidavitLauncher, { kind: 'pre', label: 'Pre-course Affidavit' }),
    'Study-manual Notice Affidavit': () =>
      createElement(AffidavitLauncher, { kind: 'post', label: 'Study-manual Notice Affidavit' }),
    // The checkbox axis. Both open the real modal; `agreed` is the only way to
    // land straight on the enabled Continue button without asking the reader
    // to go and tick a box to see what it looks like.
    'Not yet agreed': () =>
      createElement(AffidavitLauncher, { kind: 'pre', label: 'the modal, not yet agreed' }),
    Agreed: () =>
      createElement(AffidavitLauncher, { kind: 'pre', label: 'the modal, agreed', agreed: true }),
  },
}

/**
 * Components whose render needs the WHOLE row, with the prose above it rather
 * than beside it.
 *
 * Two kinds qualify, for one reason — the thing being shown is wider than half
 * a row, and squeezing it misrepresents it:
 *
 *  - The page frames. At half a row the real page reflows to a single narrow
 *    column and the reader sees the demo bar instead of the subject.

 * The COURSE HEAD was briefly in here for the same reason — an 800px component
 * in a 370px column wrapped its title to four lines — but it came back out
 * when the render moved to the wide left column, which gives it the room
 * without taking the notes off the side.
 *
 * Listed explicitly rather than sniffed from the output, because "is this wide"
 * is not a question the DOM can be asked before it is laid out.
 * `DevHandoffVariants.test.ts` checks every id here is a real component.
 */
/* ⚠ `atlas-home-exam-prompt` IS FULL WIDTH BY DESIGN, not by accident. Its
   render is TWO components at once — Step 2 and the pace column — which is the
   whole point of those screens, and the side-by-side slot's 840px basis would
   wrap the notes anyway. Declaring it here gets the stacked treatment
   deliberately, with the state's name leading its own picture. */
const FULL_WIDTH = new Set([
  /* `atlas-home-layout` was here until 2026-10-21, when the Overview row it
     belonged to was archived ("remove these"). Its render — the only
     `PageFrame` left on this surface — went with it. */
  'atlas-home-steps',
  'atlas-home-exam-date',
])

/** Whether this component's renders take the full row — see `FULL_WIDTH`. */
export function atlasHandoffIsFullWidth(componentId: string): boolean {
  return FULL_WIDTH.has(componentId)
}

/** Test seam for `FULL_WIDTH`. */
export function atlasFullWidthIds(): string[] {
  return [...FULL_WIDTH]
}

/** Every variant render registered for a handoff component, or `undefined`
 *  when none is — which is how a component falls back to the iframe of its
 *  real page. */
export function atlasHandoffVariantRenders(componentId: string): VariantRenders | undefined {
  return ATLAS_VARIANT_RENDERS[componentId]
}

/**
 * One variant's live render, or `undefined`.
 *
 * ⚠ THE `AtlasSurface` WRAP HAPPENS HERE, not in the entries. Every render in
 * the map needs the Atlas token environment, and an entry that forgot it would
 * look *almost* right — the failure mode that produced the wrong title size
 * and fills in the first place. Wrapping centrally means it cannot be
 * forgotten, and the page frames pass through it harmlessly: they are iframes,
 * and the real document inside sets its own attributes.
 */
export function atlasHandoffVariantRender(
  componentId: string,
  variantName: string,
): ReactNode | undefined {
  const node = ATLAS_VARIANT_RENDERS[componentId]?.[variantName]?.()
  return node === undefined ? undefined : createElement(AtlasSurface, null, node)
}

/**
 * Thumbnail renders that differ from the gallery's first entry.
 *
 * ⚠ ONLY QUICK LINKS, AND FOR ONE REASON: its gallery entries are wrapped in a
 * `MemoryRouter` so a click in one cannot rewrite the handoff page's own
 * address bar. React Router throws on a Router inside a Router, and the
 * thumbnail is now drawn on the landing page's project rows — inside the app's
 * own Router — so the wrapper that protects the gallery breaks the thumbnail.
 *
 * A thumbnail needs no isolation: it is `pointer-events: none`, nothing in it
 * can be clicked, and reading the real URL for its active row is harmless.
 */
const ATLAS_THUMB_RENDERS: Record<string, () => ReactNode> = {
  'atlas-home-quick-links': () =>
    createElement(AtlasJourneyLinksCard, { withoutCoursePages: true }),
  /* ⚠ THE WHOLE REGION, NOT THE FIRST CARD IN IT (2026-10-21). The default
     picks a component's first render, which for "Below the Course Card" is the
     296px progress column alone — a ticket about progress, the coursework
     steps AND the exam date, advertising itself with one third of that. The
     steps cannot be composed from exported pieces, so the thumbnail shows the
     page with its bars off, slid to the region. */
  'atlas-home-panel': () =>
    createElement(AtlasRegionThumb, { src: '/dashboard-rebrand?demo=1&section=dashboard&brand=xcel' }),
}

/**
 * The FIRST registered render for a component — what the row-list thumbnail
 * draws.
 *
 * ⚠ One variant, not the set. `ecc6deb` pointed the thumbnail at the whole
 * gallery, so a 1280px grid of captioned cards was being scaled into a 104px
 * plate: grey mush with find-in-page-able text in it. A thumbnail answers "am
 * I on the right component", which one variant answers and a grid does not.
 */
export function atlasHandoffThumbRender(componentId: string): ReactNode | undefined {
  const override = ATLAS_THUMB_RENDERS[componentId]
  /* ⚠ THE PAGE FRAME BRINGS ITS OWN CONTEXT. `AtlasSurface` exists to give a
     loose component the Atlas token scope; an iframe of the real page already
     has it, and wrapping one in a flex row squashes it. */
  if (override) {
    const node = override()
    return componentId === 'atlas-home-panel' ? node : createElement(AtlasSurface, null, node)
  }
  const renders = ATLAS_VARIANT_RENDERS[componentId]
  if (!renders) return undefined
  const first = Object.values(renders)[0]
  return first ? createElement(AtlasSurface, null, first()) : undefined
}

/** Test seam: the registered ids and their variant keys, so
 *  `DevHandoffVariants.test.ts` can check them against the authored data
 *  without reaching into the map. */
export function atlasRegisteredVariantKeys(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(ATLAS_VARIANT_RENDERS).map(([id, renders]) => [id, Object.keys(renders)]),
  )
}

/**
 * THE SAME COMPONENT AT SEVERAL WIDTHS — the Design Spec's "Layout" claim,
 * shown instead of asserted.
 *
 * ⚠ 2026-10-21, Jillienne: "show the responsiveness". The Layout note said the
 * course head reflows and the title column absorbs the width; a developer had
 * to take that on trust, and the one time it was checked the figure in it was
 * wrong by 126px. A render at two widths is the same claim a reader can verify
 * in a glance — and it is the REAL component, so it cannot drift from the note
 * beside it the way a screenshot would.
 *
 * ⚠ OPT-IN, AND THAT IS THE WHOLE POINT OF THE MAP. The first version returned
 * a render for ANY registered component, which put a 296px FIXED column — the
 * pace ring, readiness, the journey — inside 800px and 640px frames and
 * implied a reflow none of them has. Eight components grew a Layout heading
 * they had authored nothing for. A component appears here only when width is
 * genuinely a thing it does, and `responsive` notes alone no longer summon a
 * demo.
 */
export function atlasHandoffResponsiveRender(componentId: string): ReactNode | undefined {
  const demo = ATLAS_RESPONSIVE_DEMO[componentId]
  if (!demo) return undefined
  const renders = ATLAS_VARIANT_RENDERS[componentId]
  if (!renders) return undefined
  /* The MOST CROWDED state, not the first one. The default course head has two
     buttons and never wraps at any width the demo shows, so defaulting to it
     drew identical frames and demonstrated nothing. Width only matters in the
     state that asks the most of it. */
  const render = renders[demo.variant] ?? Object.values(renders)[0]
  return render ? createElement(AtlasSurface, null, render()) : undefined
}

/**
 * Which components demonstrate their width behaviour, and in which state.
 *
 * ⚠ A FIXED-WIDTH CARD DOES NOT BELONG HERE. The left column's cards are
 * `width: 296, flex: 'none'` — they do not reflow at all, and framing them at
 * three widths would document behaviour the product does not have. Their Layout
 * note says "fixed column" in words, which is the honest form of the same fact.
 */
const ATLAS_RESPONSIVE_DEMO: Record<string, { variant: string }> = {
  'atlas-home-course-head': { variant: 'Expires soon' },
}
