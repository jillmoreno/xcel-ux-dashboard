import { ALL_US_STATES } from '@/data/licensedStatesFixtures'
export { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'

/**
 * THE PUBLIC SITE'S COURSE FINDER — 2026-10-22, Jillienne: "Guest Checkout.
 * Needs to start sooner", with screen 1 of the guest journey.
 *
 * ⚠ WHERE THIS DATA CAME FROM, because it is not invented and the difference
 * matters. The Figma node for screen 1 (`273:1927`) is a flattened 2498×1386
 * SCREENSHOT of xcelsolutions.com with no layers behind it — there was nothing
 * to extract. Jillienne pointed at the live site instead, and every list below
 * was read off the real finder: the states from its own select, the education
 * types from what it offers once a state is picked, and the lines of authority
 * from what it offers after that. So these are the product's real options, not
 * a plausible set.
 *
 * ⚠ THE FINDER CASCADES, and that is real behaviour rather than a nicety: on
 * the live site Education is empty until a State is chosen, and Line of
 * authority is empty until Education is. A reviewer who can pick a line of
 * authority before naming a state is looking at a control the product does not
 * have.
 */

/**
 * ⚠ FIFTY-ONE, NOT FIFTY — the District of Columbia sells insurance licences
 * and the live site's own select lists it. `ALL_US_STATES` is the fifty, and is
 * left alone because the dashboard's licence fixtures read it.
 */
export const FINDER_STATES: readonly string[] = [...ALL_US_STATES, 'District of Columbia'].sort(
  (a, b) => a.localeCompare(b),
)

export const FINDER_EDUCATION = [
  'Get License',
  'Continuing Education',
  'Study Tools and Reviews',
] as const

export type FinderEducation = (typeof FINDER_EDUCATION)[number]

/**
 * XCEL'S FIVE LINES OF AUTHORITY, in the site's own order and the site's own
 * spelling.
 *
 * ⚠ "Life and Health", NOT "Life & Health". The ampersand is what
 * `licensedStatesFixtures` uses for the DASHBOARD's held-licence filters, and
 * the two are allowed to differ — that file describes licences a learner
 * already holds, this one is the public catalogue a stranger is choosing from.
 * What is NOT allowed is this file inventing a spelling: a guest who picks
 * "Life and Health" here and lands on a product page headed "Life & Health"
 * has been handed two names for one thing by the same company in one journey.
 *
 * ⚠ FIVE, NOT THREE. The options modal offered three (the dashboard's), which
 * silently told a guest that XCEL does not sell standalone Life or standalone
 * Health. It does.
 */
export const FINDER_LINES_OF_AUTHORITY = [
  'Life and Health',
  'Life',
  'Health',
  'Property and Casualty',
  'Personal Lines',
] as const

export type FinderLineOfAuthority = (typeof FINDER_LINES_OF_AUTHORITY)[number]

/**
 * Which lines of authority an education type offers.
 *
 * ⚠ ONE ARM IS REAL, TWO ARE ASSUMED, and that is marked rather than hidden.
 * `Get License` was read off the live site. Continuing Education and Study
 * Tools were not walked — the guest journey under design goes through Get
 * License — so they are given the same five rather than an invented subset. If
 * either becomes part of a flow, read its real list off the site first.
 */
export function linesOfAuthorityFor(education: FinderEducation): readonly string[] {
  /* The parameter is deliberately unused TODAY — see the note above. It is in
     the signature because the real answer depends on it, so the day a second
     arm is walked this becomes a `switch` rather than a change at every call
     site. */
  void education
  return FINDER_LINES_OF_AUTHORITY
}

/* ── The packages a (state, line of authority) pair resolves to ─────────── */

export type CoursePackage = {
  id: 'premier' | 'standard'
  /** Named from the pick — see `packagesFor`. */
  name: string
  /** What is charged — the figure every total in the journey has to match. */
  price: string
  /** ⚠ INVENTED, AND THE ONLY INVENTED FIGURE IN THIS FILE. The list price the
   *  checkout strikes through. See `packagesFor` for why it exists and what to
   *  replace it with. */
  listPrice: string
  blurb: string
  /** The Premier card's ribbon. */
  ribbon?: string
  /** What is in the box — listed in the cart confirmation and in the cart.
   *  One item for the standard package; three for Premier. */
  includes: string[]
}

/**
 * WHAT A PREMIER BUNDLE CONTAINS — the three lines the cart confirmation and
 * the cart both list.
 *
 * ⚠ THE LIFE AND HEALTH NAMES ARE THE CATALOGUE'S OWN; the rest are composed.
 * "Flashcards - Life, Health, and Accident Insurance" is a SKU name and does
 * not fall out of "Life and Health" by any rule — so that line of authority
 * keeps its real strings (it is the demo's course and the one in every
 * screenshot) and the others get a composed equivalent. A real catalogue would
 * return all of them; this is the seam where that lookup goes, marked rather
 * than left looking derived.
 */
const PREMIER_EXTRAS: Record<string, string[]> = {
  'Life and Health': [
    'Recorded Livestream Exam Review - Life and Health English',
    'Flashcards - Life, Health, and Accident Insurance',
  ],
}

function premierExtrasFor(lineOfAuthority: string): string[] {
  return (
    PREMIER_EXTRAS[lineOfAuthority] ?? [
      `Recorded Livestream Exam Review - ${lineOfAuthority} English`,
      `Flashcards - ${lineOfAuthority} Insurance`,
    ]
  )
}

/**
 * The two packages the live site shows for a Get License line of authority,
 * with its own copy and its own prices.
 *
 * ⚠ COMPOSED FROM THE PICK, like `inviteProductTitle` — the real catalogue
 * would resolve a (state, line of authority) pair to real SKUs. The charged
 * prices are the live site's: $299 Premier, $199 standard.
 *
 * ⚠ `listPrice` IS INVENTED — 2026-10-22, Jillienne: "i want the price strike
 * included in the demo, so keep the strike, but make the other price points
 * consistent." The checkout draws a struck-through original beside what it
 * charges, and it was striking the SAME figure it charged, which is a discount
 * of nothing. A strike needs a number above the one being paid, and the live
 * site's own list prices are not in this file — so these are placeholders, in
 * the one place a real figure would land. ⚠ CONFIRM BEFORE ANYTHING GOES IN
 * FRONT OF A CUSTOMER.
 */
export function packagesFor(state: string, lineOfAuthority: string): CoursePackage[] {
  const base = `${state} ${lineOfAuthority} Pre-licensing`
  return [
    {
      id: 'premier',
      name: `${base} Premier`,
      price: '$299.00',
      listPrice: '$399.00',
      ribbon: 'Pass Guarantee',
      includes: [base, ...premierExtrasFor(lineOfAuthority)],
      blurb:
        'Our Premier package adds flashcards, a recorded review class, and our Pass Guarantee to the standard package and is ideal for those looking to maximize their studying with various learning formats.',
    },
    {
      id: 'standard',
      name: base,
      price: '$199.00',
      /* Deliberately NOT $299 — Premier's charged price as the standard
         package's struck one would read as the two cards quoting each other. */
      listPrice: '$249.00',
      /* One line — the course itself. The cart confirmation draws no contents
         list for it, because a single chip restating the title directly above
         it is a label, not information. */
      includes: [base],
      /* ⚠ THE LINE OF AUTHORITY, NOT A HARD-CODED "Life & Health". The live
         page's copy names its own course, and lifting it verbatim meant a
         learner who picked Property and Casualty read a paragraph about Life
         & Health — with the ampersand this file's own note forbids, three
         lines under the heading that spells it "and". */
      blurb:
        `Our standard ${lineOfAuthority} Pre-licensing course combines XCEL’s proven 3-part training program with an AI-powered study partner that helps you learn, practice, and prepare for your exam with confidence in as little as 2 weeks.`,
    },
  ]
}

/**
 * THE "Get License" NAV MENU, which is the route a guest actually takes
 * (2026-10-22: "user goes to get license > life and health, to get to the next
 * page").
 *
 * ⚠ SIX ENTRIES, NOT FIVE. Securities sits under Get License on the real nav
 * alongside the five lines of authority — it is a different kind of product,
 * which is why it is NOT in `FINDER_LINES_OF_AUTHORITY`. Listing it here and
 * not there keeps the nav honest without claiming Securities is a line of
 * authority; a guest who picks it lands on a package page named for it, which
 * is as far as this prototype goes.
 */
export const GET_LICENSE_NAV = [
  ...FINDER_LINES_OF_AUTHORITY,
  'Securities',
] as const

/**
 * The course page's own selling copy — the live page's, verbatim.
 *
 * ⚠ IT NAMES THE LINE OF AUTHORITY rather than hard-coding "Life & Health",
 * for the reason the package blurb does: the same page serves all six nav
 * entries, and copy about Life & Health over a Property and Casualty heading is
 * the flow contradicting itself a second time.
 */
export function coursePitchFor(lineOfAuthority: string): {
  heading: string
  body: string
  bullets: string[]
} {
  return {
    heading: `${lineOfAuthority} Insurance License Classes for Exam Readiness`,
    body: 'XCEL combines a proven 3-Part Training Program with AI-powered study support to help you get unstuck faster, understand more, and walk into exam day fully prepared.',
    bullets: [
      'Up-to-date, exam-aligned content taught by experts',
      'Highly effective resources designed to meet every learner’s needs',
      'AI-powered study support to get unstuck and stay on track',
      'Pass Guarantee*',
    ],
  }
}

/** Which package is in the cart, in the address. */
export const CART_PACKAGE_PARAM = 'pkg'

/**
 * The package a cart URL names, or null when the cart is empty.
 *
 * ⚠ THE CART IS THE ADDRESS, not a store. Everything else in this flow carries
 * its state in the query string — the flow, the state, the line of authority —
 * and a cart held in React state would be the one thing a reviewer could not
 * link to or reload into. It also means "empty cart" is a real, reachable
 * state rather than something you can only get to by never clicking.
 */
export function cartPackage(
  state: string,
  lineOfAuthority: string,
  id: string | null,
): CoursePackage | null {
  if (!state || !lineOfAuthority || !id) return null
  return packagesFor(state, lineOfAuthority).find((p) => p.id === id) ?? null
}
