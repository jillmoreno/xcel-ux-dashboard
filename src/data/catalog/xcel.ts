// TODO(data): replace with real catalog API integration.
// Content modeled on https://www.xcelsolutions.com — XCEL's real product
// taxonomy (five lines of authority, the Standard / Premier packages, and the
// study-tool set) with representative price points. See
// `.claude/skills/brands/xcel.md` for the source facts.
//
// XCEL sells NO memberships — `memberships: []` is deliberate, not an
// oversight. It is a transactional brand (course packages plus a B2B Partner
// Code programme); the whole membership surface is suppressed for it.

import { createImagePicker } from '@/utils/topicImage'
import type { CatalogBundle, IndividualCourse, Membership, Package } from './types'

// One picker per module evaluation so every XCEL course gets a
// brand-unique Unsplash image. HMR-safe.
const pickImage = createImagePicker()

/**
 * Insurance is state-regulated, so unlike STC's mostly-federal catalog XCEL's
 * state rail is real and long. Only the states this fixture's products name
 * need an abbreviation; the rail renders full names.
 */
const STATE_ABBR: Record<string, string> = {
  Florida: 'FL',
  Texas: 'TX',
  California: 'CA',
  Georgia: 'GA',
  'New York': 'NY',
  Ohio: 'OH',
  Pennsylvania: 'PA',
  'North Carolina': 'NC',
  'District of Columbia': 'DC',
  'U.S. Virgin Islands': 'VI',
}

/**
 * XCEL has no memberships. Kept as an explicitly empty typed array rather than
 * omitted so the shape still reads as "this brand sells none" at a glance.
 */
const MEMBERSHIPS: Membership[] = []

/**
 * The two real XCEL packages. Premier carries the Prepare2Pass Guarantee
 * ("everything you need to pass the first time or your money back"); Standard
 * is "a solid foundation… without all the extras". Prices are representative —
 * TODO(data): confirm against the live storefront before this is quoted.
 */
const PACKAGES: Package[] = [
  {
    id: 'p-xcel-lh-premier',
    title: 'Life & Health Premier Package',
    hours: 40,
    states: ['Florida'],
    price: 279,
    blurb:
      'The full 3-Part Training Program plus every study tool, backed by the Prepare2Pass Guarantee.',
    tags: ['Exam Prep Package', 'Life & Health'],
  },
  {
    id: 'p-xcel-lh-standard',
    title: 'Life & Health Standard Package',
    hours: 40,
    states: ['Florida'],
    price: 169,
    blurb: 'Pre-license education and the prep review course — a solid foundation without the extras.',
    tags: ['Exam Prep Package', 'Life & Health'],
  },
  {
    id: 'p-xcel-pc-premier',
    title: 'Property & Casualty Premier Package',
    hours: 40,
    states: ['Florida'],
    price: 279,
    blurb: 'Everything in the P&C track, including the two-day livestream review and all three simulators.',
    tags: ['Exam Prep Package', 'Property & Casualty'],
  },
  {
    id: 'p-xcel-pc-standard',
    title: 'Property & Casualty Standard Package',
    hours: 40,
    states: ['Florida'],
    price: 169,
    blurb: 'Pre-license education and the prep review course for the Property & Casualty exam.',
    tags: ['Exam Prep Package', 'Property & Casualty'],
  },
  {
    id: 'p-xcel-personal-lines',
    title: 'Personal Lines Premier Package',
    hours: 20,
    states: ['Florida'],
    price: 199,
    blurb: 'The Personal Lines track end to end, with the one-day livestream review included.',
    tags: ['Exam Prep Package', 'Personal Lines'],
  },
  {
    id: 'p-xcel-ce-lh',
    title: 'Life & Health CE Bundle',
    hours: 24,
    states: ['Florida'],
    price: 49,
    blurb: 'Your state CE requirement in one bundle, reported to the state within one business day.',
    tags: ['Renewal Package', 'Continuing Education'],
  },
]

/**
 * Individual courses — the pre-license courses per line of authority, the
 * named study tools (Livestream Exam Review, 800+ Flashcards, On-Demand
 * Lectures, Exam Cram), and the CE topics.
 */
const _INDIVIDUAL_COURSES_BASE: Omit<IndividualCourse, 'imageUrl'>[] = [
  {
    id: 'c-xcel-lh-prelicense',
    title: 'Life & Health Pre-License Course',
    hours: 40,
    states: ['Florida'],
    delivery: 'online',
    price: 129,
    rating: 4.8,
    ratingCount: 2140,
    badge: 'mandatory',
    blurb: 'Part 1 of the 3-Part Training Program — expert-led video, review notes, and practice questions.',
    imageQuery: 'insurance study',
    tags: ['Life', 'Health', 'State Law'],
    isNew: false,
  },
  {
    id: 'c-xcel-pc-prelicense',
    title: 'Property & Casualty Pre-License Course',
    hours: 40,
    states: ['Florida'],
    delivery: 'online',
    price: 129,
    rating: 4.7,
    ratingCount: 1685,
    badge: 'mandatory',
    blurb: 'The P&C pre-license requirement, meeting your state hour requirement before you sit.',
    imageQuery: 'property insurance',
    tags: ['Property & Casualty', 'Auto', 'Homeowners'],
  },
  {
    id: 'c-xcel-personal-lines-prelicense',
    title: 'Personal Lines Pre-License Course',
    hours: 20,
    states: ['Florida'],
    delivery: 'online',
    price: 99,
    rating: 4.6,
    ratingCount: 742,
    badge: 'mandatory',
    blurb: 'The shorter Personal Lines route into the industry — auto, home, and umbrella coverage.',
    imageQuery: 'home insurance',
    tags: ['Personal Lines', 'Auto', 'Homeowners'],
  },
  {
    id: 'c-xcel-prep-review',
    title: 'Prep Review Course',
    hours: 8,
    states: ['Florida'],
    delivery: 'online',
    price: 59,
    rating: 4.9,
    ratingCount: 1310,
    badge: 'mandatory',
    blurb: 'Part 2 — exam-focused review, unlocked once your pre-license education is complete.',
    imageQuery: 'exam preparation',
    tags: ['Exam Prep'],
  },
  {
    id: 'c-xcel-exam-simulators',
    title: 'Exam Simulators (3)',
    hours: 6,
    states: ['Florida'],
    delivery: 'online',
    price: 49,
    rating: 4.9,
    ratingCount: 1980,
    badge: 'mandatory',
    blurb: 'Three simulators weighted by topic to match your state exam, with unlimited retakes.',
    imageQuery: 'test taking',
    tags: ['Exam Prep'],
    isNew: true,
  },
  {
    id: 'c-xcel-livestream-lh',
    title: 'Livestream Exam Review — Life & Health',
    hours: 6,
    states: ['Florida'],
    delivery: 'webinar',
    price: 89,
    rating: 4.7,
    ratingCount: 604,
    badge: 'elective',
    blurb: 'A weekly one-day instructor-led review of everything the Life & Health exam tests.',
    livestream: true,
    imageQuery: 'online class',
    schedule: 'Weekly · Tuesdays, 9:00 AM ET',
    tags: ['Life', 'Health', 'Exam Prep'],
  },
  {
    id: 'c-xcel-livestream-pc',
    title: 'Livestream Exam Review — Property & Casualty',
    hours: 12,
    states: ['Florida'],
    delivery: 'webinar',
    price: 129,
    rating: 4.7,
    ratingCount: 431,
    badge: 'elective',
    blurb: 'The two-day P&C livestream review — the longer format the broader syllabus needs.',
    livestream: true,
    imageQuery: 'training seminar',
    schedule: 'Weekly · Wed–Thu, 9:00 AM ET',
    tags: ['Property & Casualty', 'Exam Prep'],
  },
  {
    id: 'c-xcel-flashcards',
    title: '800+ Flashcards',
    hours: 4,
    states: ['Florida'],
    delivery: 'online',
    price: 29,
    rating: 4.8,
    ratingCount: 1522,
    badge: 'elective',
    blurb: 'The full deck, sorted by topic — the fastest way to find the terms that are not sticking.',
    imageQuery: 'flashcards study',
    tags: ['Exam Prep'],
  },
  {
    id: 'c-xcel-on-demand-lectures',
    title: 'On-Demand Lecture Videos',
    hours: 10,
    states: ['Florida'],
    delivery: 'online',
    price: 69,
    rating: 4.6,
    ratingCount: 883,
    badge: 'elective',
    blurb: 'Recorded instructor lectures you can work through at your own pace, chapter by chapter.',
    imageQuery: 'video lecture',
    tags: ['Exam Prep'],
  },
  {
    id: 'c-xcel-exam-cram',
    title: 'Exam Cram',
    hours: 2,
    states: ['Florida'],
    delivery: 'online',
    price: 39,
    rating: 4.6,
    ratingCount: 976,
    badge: 'elective',
    blurb: 'The condensed final pass — everything most likely to appear, in the last hours before you sit.',
    imageQuery: 'last minute study',
    tags: ['Exam Prep'],
  },
  {
    id: 'c-xcel-ethics',
    title: 'Insurance Ethics',
    hours: 5,
    states: ['Florida'],
    delivery: 'online',
    price: 25,
    rating: 4.6,
    ratingCount: 1204,
    badge: 'mandatory',
    blurb: 'The ethics hours nearly every state requires as part of a producer CE cycle.',
    imageQuery: 'business ethics',
    tags: ['Ethics', 'Continuing Education'],
  },
  {
    id: 'c-xcel-annuity-training',
    title: 'Annuity Initial Training',
    hours: 4,
    states: ['Florida'],
    delivery: 'online',
    price: 22,
    rating: 4.5,
    ratingCount: 688,
    badge: 'mandatory',
    blurb: 'The initial annuity training a Life & Health producer must complete before selling annuities.',
    imageQuery: 'retirement planning',
    tags: ['Annuities', 'Retirement', 'Continuing Education'],
  },
  {
    id: 'c-xcel-ltc-training',
    title: 'Long-Term Care Initial Training',
    hours: 8,
    states: ['Florida'],
    delivery: 'online',
    price: 32,
    rating: 4.4,
    ratingCount: 512,
    badge: 'mandatory',
    blurb: 'Initial long-term care training — one of the two topics XCEL adds to L&H Initial Training.',
    imageQuery: 'senior care',
    tags: ['Long-Term Care', 'Continuing Education'],
  },
  {
    id: 'c-xcel-flood-training',
    title: 'Flood Insurance (NFIP) Training',
    hours: 3,
    states: ['Florida'],
    delivery: 'online',
    price: 19,
    rating: 4.3,
    ratingCount: 344,
    badge: 'elective',
    blurb: 'The flood topic XCEL adds to Property & Casualty Initial Training.',
    imageQuery: 'flood water',
    tags: ['Flood', 'Property & Casualty', 'Continuing Education'],
  },
  {
    id: 'c-xcel-state-law-update',
    title: 'State Law & Regulations Update',
    hours: 2,
    states: ['Florida'],
    delivery: 'online',
    price: 15,
    rating: 4.4,
    ratingCount: 421,
    badge: 'elective',
    blurb: 'What changed in your state this cycle, and what it means for how you sell.',
    imageQuery: 'law regulation',
    tags: ['State Law', 'Continuing Education'],
  },
]

const INDIVIDUAL_COURSES: IndividualCourse[] = _INDIVIDUAL_COURSES_BASE.map((c) => ({
  ...c,
  imageUrl: pickImage(c.imageQuery),
}))

/**
 * ⚠ THE STATE LISTS GENUINELY DIFFER AND THIS FIELD CAN ONLY HOLD ONE.
 *
 * XCEL's PRE-LICENSING coverage is 50 states + the District of Columbia + the
 * U.S. Virgin Islands. Its CONTINUING EDUCATION coverage omits the U.S. Virgin
 * Islands. `CatalogBundle.licensedStates` is a single per-brand list, so one of
 * the two has to be the catalog's answer.
 *
 * DECIDED 2026-09-04: use the PRE-LICENSING list, USVI included. Pre-licensing
 * is XCEL's flagship journey and its `defaultEducationType`, so the state rail
 * should reflect the widest real coverage; dropping a territory the brand
 * genuinely serves is the more visible error. The cost is that USVI reads as
 * CE-available when it is not.
 *
 * TODO(data): the proper fix is a state list keyed by education type, which
 * means widening `CatalogBundle` (a shared type all six brands use) and
 * threading it through CatalogPage's state rail. Out of scope for the
 * brand-add; do it when CE filtering matters.
 */
const LICENSED_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana',
  'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah',
  'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  // Pre-licensing only — NOT part of XCEL's CE coverage. See the note above.
  'U.S. Virgin Islands',
]

export const xcelBundle: CatalogBundle = {
  heroTitle: 'Insurance Training Catalog',
  heroSubtitle: 'Pre-licensing, exam prep & continuing education',
  // The five lines of authority (the brand file's profession axis).
  professionOptions: [
    { value: 'life-health', label: 'Life & Health' },
    { value: 'life', label: 'Life' },
    { value: 'health', label: 'Health' },
    { value: 'property-casualty', label: 'Property & Casualty' },
    { value: 'personal-lines', label: 'Personal Lines' },
  ],
  licensedStates: LICENSED_STATES,
  // Every state XCEL licenses in is already in `licensedStates`, so there is no
  // "additional" tier for this brand.
  additionalStates: [],
  // TODO(data): XCEL publishes no instructor roster — left empty rather than
  // inventing names. The instructor filter self-hides on an empty list.
  instructors: [],
  memberships: MEMBERSHIPS,
  packages: PACKAGES,
  individualCourses: INDIVIDUAL_COURSES,
  // `series` omitted — XCEL sells no curated series, so the dashboard's
  // Featured Series shelf hides itself for this brand.
  totalResults: MEMBERSHIPS.length + PACKAGES.length + INDIVIDUAL_COURSES.length,
  // No membership ⇒ no member-access states. Everything is priced.
  memberStates: new Set<string>(),
  stateAbbr: STATE_ABBR,
  filterLabels: {
    professionFilter: 'Line of Authority',
    hoursFilter: 'Course Hours',
    creditTypeFilter: 'Format',
    creditTypeOptions: [
      { value: 'self-study', label: 'Self-Study' },
      { value: 'livestream', label: 'Livestream Review' },
    ],
    // Insurance is state-regulated, so the state rail does real work here —
    // unlike STC, where most exams are federal.
    showStateRail: true,
  },
}
