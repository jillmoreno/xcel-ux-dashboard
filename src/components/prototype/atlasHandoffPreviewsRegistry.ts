import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AtlasReadinessCard } from '@/components/compass/AtlasReadinessCard'
import { AtlasCourseProgressStates } from '@/components/compass/AtlasCourseProgressStates'
import { AtlasPaceRingCard } from '@/components/compass/AtlasPaceRingCard'
import { AtlasExamDateCard } from '@/components/compass/AtlasExamDateCard'
import { AtlasJourneyLinksCard } from '@/components/compass/AtlasJourneyLinksCard'
import { AffidavitLauncher, CourseHeadWhiteVariant } from './AtlasHandoffPreviews'

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

const ATLAS_VARIANT_RENDERS: Record<string, VariantRenders> = {
  'atlas-home-readiness-panel': {
    'Not Started': () => createElement(AtlasReadinessCard, { notStarted: true }),
    Beginner: () => createElement(AtlasReadinessCard, { initialLevel: 0 }),
    Developing: () => createElement(AtlasReadinessCard, { initialLevel: 1 }),
    Proficient: () => createElement(AtlasReadinessCard, { initialLevel: 2 }),
    Ready: () => createElement(AtlasReadinessCard, { initialLevel: 3 }),
    'Combined panel': () => createElement(AtlasReadinessCard, { bare: true, initialLevel: 3 }),
  },

  'atlas-home-progress-states': {
    'Not started': () =>
      createElement(AtlasCourseProgressStates, {
        percent: 0,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'zero',
      }),
    'In progress': () =>
      createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'current',
      }),
    Milestone: () =>
      createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'milestone',
      }),
    Complete: () =>
      createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'complete',
      }),
    Expired: () =>
      createElement(AtlasCourseProgressStates, {
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'expired',
      }),
    'Combined panel': () =>
      createElement(AtlasCourseProgressStates, {
        bare: true,
        percent: 42,
        expected: PROGRESS_EXPECTED,
        access: PROGRESS_ACCESS,
        initialStage: 'current',
      }),
  },

  'atlas-home-pace-ring': {
    Default: () =>
      createElement(AtlasPaceRingCard, {
        percent: 42,
        weeks: 3,
        hoursPerWeek: 4,
        expected: { value: 'November 2', note: 'At current pace' },
        standingMessage: 'You’re ahead of pace — keep it up.',
      }),
    'Exam booked': () =>
      createElement(AtlasPaceRingCard, {
        percent: 60,
        weeks: 2,
        hoursPerWeek: 5,
        expected: { value: 'November 2' },
        exam: { label: 'Florida state exam', value: 'November 16', note: '18 days' },
      }),
    'No plan fits': () =>
      createElement(AtlasPaceRingCard, {
        percent: 10,
        noPace: { binding: 'exam', days: -2, dateIso: '2026-11-01' },
      }),
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
  },

  'atlas-home-course-head': {
    // Main draws the course head one way, so this is simply what it looks
    // like — it stopped being one of two chrome arms when the handoff was
    // narrowed to main's walkthrough (2026-10-20).
    'Not started': () => createElement(CourseHeadWhiteVariant),
  },

  'atlas-home-affidavit-modal': {
    'Pre-course Affidavit': () =>
      createElement(AffidavitLauncher, { kind: 'pre', label: 'Pre-course Affidavit' }),
    'Study-manual Notice Affidavit': () =>
      createElement(AffidavitLauncher, { kind: 'post', label: 'Study-manual Notice Affidavit' }),
  },
}

/** Every variant render registered for a handoff component, or `undefined`
 *  when none is — which is how a component falls back to the iframe of its
 *  real page. */
export function atlasHandoffVariantRenders(componentId: string): VariantRenders | undefined {
  return ATLAS_VARIANT_RENDERS[componentId]
}

/** One variant's live render, or `undefined`. */
export function atlasHandoffVariantRender(
  componentId: string,
  variantName: string,
): ReactNode | undefined {
  return ATLAS_VARIANT_RENDERS[componentId]?.[variantName]?.()
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
  return first ? first() : undefined
}

/** Test seam: the registered ids and their variant keys, so
 *  `DevHandoffVariants.test.ts` can check them against the authored data
 *  without reaching into the map. */
export function atlasRegisteredVariantKeys(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(ATLAS_VARIANT_RENDERS).map(([id, renders]) => [id, Object.keys(renders)]),
  )
}
