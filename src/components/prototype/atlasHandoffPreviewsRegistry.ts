import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AtlasReadinessCard } from '@/components/compass/AtlasReadinessCard'
import { AtlasCourseProgressStates } from '@/components/compass/AtlasCourseProgressStates'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { AtlasExamDateCard } from '@/components/compass/AtlasExamDateCard'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
import {
  AffidavitLauncher,
  AtlasProgressPanel,
  AtlasSurface,
  CourseHeadVariant,
  PageFrame,
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

const PROGRESS_EXPECTED = { value: 'June 3', note: 'At current pace' }
const PROGRESS_ACCESS = { value: '28 Days', note: 'Ends June 10' }

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
const inPanel = (node: ReactNode) => createElement(AtlasProgressPanel, null, node)

const ATLAS_VARIANT_RENDERS: Record<string, VariantRenders> = {
  // ⚠ MAIN'S PROPS, NOT THE CARD'S DEFAULTS (2026-10-21, Jillienne: "I keep
  // seeing things from different versions... everything should be what is
  // shown in the Final Prototype view"). The Home passes `bare` and
  // `matchPaceEyebrow` — the card drops its own tan fill and shares the
  // column's eyebrow, because it sits INSIDE the progress panel. Rendered with
  // the component's own defaults instead, it drew as a standalone tan card:
  // the treatment the other arm uses, and a version the final prototype does
  // not show.
  'atlas-home-readiness-panel': {
    'Not Started': () =>
      inPanel(
        createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, notStarted: true }),
      ),
    Beginner: () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 0 })),
    Developing: () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 1 })),
    Proficient: () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 2 })),
    Ready: () =>
      inPanel(createElement(AtlasReadinessCard, { bare: true, matchPaceEyebrow: true, initialLevel: 3 })),
  },

  'atlas-home-progress-states': {
    'Not started': () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        percent: 0,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'zero',
      })),
    'In progress': () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'current',
      })),
    Milestone: () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'milestone',
      })),
    Complete: () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'complete',
      })),
    Expired: () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'expired',
      })),
    'Combined panel': () =>
      inPanel(createElement(AtlasCourseProgressStates, {
        bare: true,
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'current',
      })),
  },

  'atlas-home-pace-ring': {
    Default: () =>
      inPanel(createElement(AtlasPaceRingCard, {
        percent: 42,
        weeks: 3,
        hoursPerWeek: 4,
        expected: { value: 'November 2', note: 'At current pace' },
        standingMessage: 'You’re ahead of pace — keep it up.',
      })),
    'Exam booked': () =>
      inPanel(createElement(AtlasPaceRingCard, {
        percent: 60,
        weeks: 2,
        hoursPerWeek: 5,
        expected: { value: 'November 2' },
        exam: { label: 'Florida state exam', value: 'November 16', note: '18 days' },
      })),
    'No plan fits': () =>
      inPanel(createElement(AtlasPaceRingCard, {
        percent: 10,
        noPace: { binding: 'exam', days: -2, dateIso: '2026-11-01' },
      })),
  },

  'atlas-home-exam-date-card': {
    Default: () => createElement(AtlasExamDateCard, { initialStage: 'default' }),
    'No date yet': () => createElement(AtlasExamDateCard, { initialStage: 'no' }),
    'Picking a date': () => createElement(AtlasExamDateCard, { initialStage: 'yes' }),
    'Date set': () =>
      createElement(AtlasExamDateCard, {
        initialStage: 'set',
        initialDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      }),
  },

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
    'Last day': () =>
      createElement(CourseHeadVariant, { beginLabel: 'Begin Course', meta: 'last-day' }),
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
    Expired: () =>
      createElement(CourseHeadVariant, {
        beginLabel: 'Purchase Extension',
        meta: 'expired',
        eyebrow: 'Expired',
      }),
    'Long title': () =>
      createElement(CourseHeadVariant, {
        title: 'Florida Life and Health Pre-licensing with Comprehensive Exam Simulators',
      }),
  },

  // The page IS the component, so the only honest render is the page.
  'atlas-home-layout': {
    Default: () => createElement(PageFrame, { title: 'Atlas Home — page layout' }),
  },

  // Step 1 reads the page's shared progress, not its own props, so these load
  // the real route pinned to each stage rather than rebuilding the list.
  'atlas-home-study-journey': {
    Default: () =>
      createElement(PageFrame, {
        title: 'Study Journey — in progress',
        ff: 'atlas-v3-progress:on-track',
      }),
    'All coursework done': () =>
      createElement(PageFrame, {
        title: 'Study Journey — all coursework done',
        ff: 'atlas-v3-progress:completed',
      }),
  },

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
const FULL_WIDTH = new Set(['atlas-home-layout', 'atlas-home-study-journey'])

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
 * The FIRST registered render for a component — what the row-list thumbnail
 * draws.
 *
 * ⚠ One variant, not the set. `ecc6deb` pointed the thumbnail at the whole
 * gallery, so a 1280px grid of captioned cards was being scaled into a 104px
 * plate: grey mush with find-in-page-able text in it. A thumbnail answers "am
 * I on the right component", which one variant answers and a grid does not.
 */
export function atlasHandoffThumbRender(componentId: string): ReactNode | undefined {
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
