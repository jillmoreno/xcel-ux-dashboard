import type { Brand, Membership } from '@/context/AccountContext'
import type { DevStatus } from '@/components/prototype/devHandoffStatusUtil'

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  PROTOTYPE GATEWAY CATALOG
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  This file is the single source of truth for the prototype landing page
 *  (`/`). Each entry below renders as a tile. There are two kinds of tile:
 *
 *   • kind: 'explore'  → a single CTA that drops the reviewer into the live
 *                        platform to navigate freely (the "Explore Dashboard"
 *                        tile). `to` is the entry route.
 *
 *   • kind: 'guided'   → opens a focused gateway (`/prototype/:id`) that lists
 *                        ONLY the specific pages that make up that feature.
 *                        Edit the `pages` array to decide which pages a feature
 *                        shows — that's the part you control per feature.
 *
 *  To add a feature: copy a block, give it a unique `id`, set `kind`, fill in
 *  `pages` (label + `to` route, optional `note`), and flip `status` to 'ready'.
 *  No other file needs to change — the landing + gateway pages are data-driven.
 *
 *  ── REQUIRED CHECKLIST WHEN ADDING A FEATURE TILE (per Jillienne) ──────────
 *   1. XCEL is single-brand, so `brands` is `['xcel']` where the LMS asked
 *      which of five to populate. The field is kept so the seam survives a
 *      second skin.
 *   2. ALWAYS include BOTH `member` and `non-member` views among the pages —
 *      both must be reachable from the feature gateway, not just one.
 *   3. ALWAYS surface any applicable FEATURE FLAGS for the feature via the
 *      Admin tools menu (AdminToolsMenu → Feature Flag panel) and list them in
 *      `featureFlags` so the gateway can point reviewers at the right toggles.
 *  ───────────────────────────────────────────────────────────────────────────
 */

export type FeaturePageLink = {
  /** Short label shown in the curated list (e.g. "Series 79 — Study Calendar"). */
  label: string
  /** Optional one-line description of what the reviewer will see. */
  note?: string
  /** Route to open in the live platform (may include query params). */
  to: string
  /** Opens in a new browser tab (used for the chrome-less print views). */
  newTab?: boolean
  /** Per-page brand override. Defaults to the feature's `account.brand`.
   *  Use to demo the same page across the feature's supported brands. */
  brand?: Brand
  /** Per-page membership override. Defaults to the feature's
   *  `account.membership`. Use to expose BOTH member and non-member views
   *  of the feature (required per the checklist above). */
  membership?: Membership
}

export type FeatureAccent = 'teal' | 'gold' | 'blue' | 'neutral'

/**
 * Which landing-page filter tab a tile lives under.
 *   • 'demo'        → the presentation-ready "pure" experiences that always
 *                     render the Default configuration, untouched by any
 *                     sandbox tinkering (e.g. the Dashboard Discoverability
 *                     Demo, which opens /dashboard-rebrand?demo=1). This is
 *                     the FIRST tab and the landing default.
 *   • 'dashboard'   → the full dashboard experiences / sandboxes (Explore
 *                     Dashboard, Dashboard Discoverability).
 *   • 'dev-handoff' → feature specs with a developer-handoff write-up.
 * "Done" is NOT a category — it's a per-tile status, authored via the `done`
 * flag below and overridable per browser from the tile kebab. A done tile moves
 * to the Done tab regardless of its category. Same for In Design (`inProgress`).
 * See src/components/prototype/prototypeDoneUtil.ts.
 */
export type FeatureCategory =
  | 'demo'
  | 'dashboard'
  /** A live product build on the ungated Prototypes section (2026-09-18). Not
   *  in the LMS type block; added here when Demo became the authored-on-the-
   *  page review inbox and the product app needed a section of its own.
   *  `demo` / `dashboard` still route to Prototypes too, so LMS rows ported
   *  with those categories land in the right place.
   *
   *  ⚠ ONE ROW PER `prototypeScope`, and every row carries one (2026-10-14).
   *  Until then the section held exactly one row; see `PROTOTYPE_SCOPES` for
   *  what changed and what did not. */
  | 'prototype'
  | 'dev-handoff'
  | 'testing'
  | 'exploration'
  /** Standalone full HTML files being actively worked on — the ones that live
   *  in `public/prototypes/` or `explorations/` and get manipulated directly
   *  rather than built as React.
   *
   *  ⚠ THE SANDBOX SECTION WAS ARCHIVED 2026-09-29 and this category now routes
   *  to DESIGN. It is kept in the union because this type block is verbatim from
   *  the LMS, so a row ported carrying it has to compile — but setting it here
   *  no longer sends a row anywhere of its own. `sectionOf` in
   *  `UxDashboardPage.tsx` states the redirect explicitly rather than letting it
   *  fall through; see the `sandbox-section` row in `archivedItems.ts`. */
  | 'sandbox'

/* ─────────────────────────────────────────────────────────────────────────
 *  PROTOTYPE SCOPES — one row per product surface (2026-10-14)
 *
 *  Prototypes held ONE row from 2026-09-28 to 2026-10-14, and the reason was
 *  sound: it answers "what is the product right now?", and two rows pointing
 *  at two BUILDS of the same thing make everyone ask which one is real.
 *
 *  What changed is the shape of the product, not the rule. A learner's journey
 *  now has three doors — how they get IN (invite and purchase), what they land
 *  in (the dashboard, end to end), and where they study (Compass) — and each
 *  one is its own source of truth for a different question. So the section
 *  holds ONE ROW PER SCOPE, and what the old rule actually guaranteed is kept
 *  by a stricter mechanical form, pinned in `UxDashboard.smoke.test.tsx`:
 *
 *    • every row that opens is `main`'s build, entered at `?demo=1` through
 *      one of the product app's doors (`/dashboard-rebrand`,
 *      `/end-to-end-demo`) — never a branch URL, never an `?ff=` pin, never
 *      an HTML document (the public build 404s `/prototypes/*`, so a document
 *      row would open to not-found for exactly its audience).
 *    • a `status: 'coming-soon'` row is drawn DISABLED — a name, a blurb, its
 *      tags and a "Coming soon" tag, nothing to click. Two reasons a row is
 *      one: the surface is not built yet (the Admin row, no `to`), or the
 *      surface exists but is HELD BACK while its owner decides what it will
 *      carry (the end-to-end row, 2026-10-14 — it keeps its `to` on record,
 *      so releasing it is `status: 'ready'` and nothing else).
 *    • no scope has two rows. "I want two of the same thing visible" is still
 *      a REFINEMENT job, exactly as before.
 *
 *  The order here is the order the section reads in: THE PRODUCT FIRST
 *  (2026-10-14, Jillienne: "always have this be the first option"), then the
 *  doors around it in journey order — in, study, admin. A scope with NO row is a surface that has not been built yet — it is
 *  listed so the plan is in the type, but a Prototypes row is `ready` by
 *  definition, so nothing is added until the build exists on `main`.
 *
 *  `label` is what the tile's kind tag shows in place of "Full platform", so
 *  three rows in one section each say which door they are. `question` is the
 *  one the row answers, and it is the test of whether a candidate row is a
 *  new scope or a second copy of an existing one.
 *
 *  `owner` IS DESIGN AUTHORITY, NOT MERGE AUTHORITY — 2026-10-14, Jillienne's
 *  decision, and the two halves of it are deliberately different people for
 *  Compass:
 *
 *    • The owner decides what the surface SHOULD be, and RUNS
 *      `promote-to-prototype` for it on their own branch. Anjani owns Compass:
 *      her Refinement rows (tagged `product: 'compass'`) are the stream of
 *      work this row absorbs, and which of her defaults become the baseline is
 *      her call, committed by her. A promotion is a commit on a branch; it
 *      reaches no stakeholder on its own.
 *    • Only Jillienne MERGES — `ship-to-main` — and only she sets the default
 *      dashboard version. That is the lock, for every scope. (For a few hours
 *      on 2026-10-14 the whole promotion was hers too; she drew the line at
 *      the merge instead, where it belongs.)
 *    • Anyone promotes to REFINEMENT; nothing about that changed.
 *
 *  A display name rather than a `DesignerId`, on purpose: Anjani has no flags
 *  or versions yet, so a designer tab for her would be an empty tab in two
 *  panels. When she does, add her to `FLAG_DESIGNERS` and make this the id.
 * ───────────────────────────────────────────────────────────────────────── */
export type PrototypeScope = 'end-to-end' | 'invite' | 'atlas' | 'compass' | 'admin'

export const PROTOTYPE_SCOPES: ReadonlyArray<{
  id: PrototypeScope
  label: string
  question: string
  /** Who decides what this surface should be and promotes it on their branch.
   *  See the note above: not who may MERGE it — that is Jillienne, for every
   *  scope. */
  owner: string
}> = [
  {
    id: 'end-to-end',
    // "End to end" → "Atlas & Compass" → none → "End-to-End", all on
    // 2026-10-14 on the preview. The last move came with the owner and Updated
    // tags: once every row stacks three tags, the product row wants its scope
    // on top like the others. (An EMPTY label still means "draw no scope tag"
    // in `ProjectRow`, not "fall back to Full platform"; it is just not used.)
    label: 'End-to-End',
    question: 'What is the XCEL product right now?',
    owner: 'Jillienne',
  },
  {
    id: 'invite',
    label: 'Invite & purchase',
    // Row `xcel-invite` (2026-10-14, the same evening the flow landed on
    // `main` in Eric's End-to-End Demo). The lo-fi argument for it is still the
    // walk-through and wireframes rows in Exploration.
    question: 'How does a learner get into the product?',
    // Afsana & Eric — 2026-10-14, Jillienne on the preview. Two names in one
    // owner: the invite flow is theirs together, and the tag says so.
    owner: 'Afsana & Eric',
  },
  {
    id: 'atlas',
    label: 'Atlas Learning',
    /* 2026-10-14, Jillienne: a row that "stems from the current end-to-end"
       and excludes the invite flow and the Compass work. It is the END-TO-END
       ROW'S MIDDLE: the learner's Home and the learning pages around it — My
       Courses, Certificates, the Quick Links — as they stand, in progress. The
       same build and the same baseline as the end-to-end row, entered at Home;
       the door before it (invite) and the pages inside a course (Compass) are
       the rows on either side of it. Eric's, because the Atlas home is his
       exploration, exactly as Compass is Anjani's. */
    question: 'What do the learner’s Home and learning pages look like right now?',
    owner: 'Eric',
  },
  {
    id: 'compass',
    label: 'Compass',
    question: 'What is the study experience inside a course?',
    owner: 'Anjani',
  },
  {
    id: 'admin',
    label: 'Admin',
    // The other persona. Row `xcel-admin-coming-soon`, a disabled placeholder
    // until the admin surface is built in React — see the note above. The
    // PartnerHub-fork exploration (`xcel-admin-tool`) was the argument for the
    // surface, not the surface; its row is archived (2026-10-15,
    // `admin-tool-row` in archivedItems.ts) and the document is kept.
    question: 'What does an agency admin see?',
    // Cody's — 2026-10-14, Jillienne on the preview. The admin surface is his
    // to shape when it is built; the row is a placeholder until then.
    owner: 'Cody',
  },
]

export function prototypeScopeLabel(scope: PrototypeScope | undefined): string | undefined {
  return PROTOTYPE_SCOPES.find((s) => s.id === scope)?.label
}

/** Who decides what the scope's surface should be — the row's "Owner" tag. */
export function prototypeScopeOwner(scope: PrototypeScope | undefined): string | undefined {
  return PROTOTYPE_SCOPES.find((s) => s.id === scope)?.owner
}

/** A feature flag (from the Admin tools → Feature Flag panel) that drives one
 *  of this feature's variants. Listed on the gateway so reviewers know which
 *  toggles to flip while demoing. */
export type FeatureFlagRef = {
  /** Flag id as registered in FeatureFlagContext. */
  id: string
  /** Human label shown on the gateway. */
  label: string
  /** Optional note on what the flag changes / which variants to try. */
  note?: string
}

/* ─────────────────────────────────────────────────────────────────────────
 *  DEV HANDOFF NOTES
 *  Replaces the on-gateway "Feature flags" callout. Where the flags section
 *  just told reviewers which toggles to flip, the handoff notes give a
 *  developer what they need to turn the prototype into the real thing:
 *  every variant of a component, the UX logic that decides which variant
 *  renders, the data each one depends on, and the stubs still to be wired.
 * ───────────────────────────────────────────────────────────────────────── */

/** One enumerated state of a component — THE single list of what it can
 *  render.
 *
 *  `when` is the condition that produces it; `detail` is an optional note on
 *  copy / behavior; `why` and `action` carry the rationale and the CTA that
 *  used to live in a SECOND list (`uiUxLogic.variants`, now `transitions`).
 *
 *  ⚠ THE TWO LISTS WERE MERGED ON 2026-10-20, because having both was losing
 *  data on screen: `DevHandoffNotesBody` suppressed this list whenever the
 *  other one existed, so for `atlas-home-progress-states` the "bare (combined
 *  panel)" variant and every `when` trigger in it rendered NOWHERE — while the
 *  Markdown export emitted both and disagreed with the page. One list cannot
 *  shadow itself.
 *
 *  `name` is also the KEY the live preview registry matches on
 *  (`atlasHandoffVariantRenders`), so a rename here without a rename there is
 *  a test failure, not a silent drift. */
export type DevHandoffVariant = {
  name: string
  /**
   * WHEN THE LEARNER SEES THIS, in product language — "the learner's access
   * ended before they finished", not `percent <= 0` or `initialLevel={1}`.
   *
   * ⚠ REWRITTEN 2026-10-20 (Jillienne: "imagine this is like a Figma file
   * handoff, strip out the version terms"). These were prop expressions and
   * flag ids, which answered "how do I reproduce this in our prototype" —
   * a question a developer implementing the component does not have. The
   * reproduction steps did not vanish; they moved to `howToSee`.
   */
  when: string
  detail?: string
  /** Why this variant needs to exist — the problem it solves for the learner. */
  why?: string
  /** The action the component exposes in this variant (CTA + behavior). */
  action?: string
  /**
   * How to reach this state in the RUNNING prototype — "Demo bar → Progress →
   * Expired", or the flag to pin. Rendered small and grey under the state, so
   * it is there when someone wants to go and look and invisible when they are
   * reading the spec.
   *
   * This is the only place a flag id or a dashboard-version name belongs on a
   * state. Leave it unset when the state is simply the default.
   */
  howToSee?: string
}

/**
 * A DISPLAY OPTION — a toggle that changes how the component is drawn without
 * being a state the learner moves through.
 *
 * Split out from `variants` on 2026-10-20, because mixing the two is most of
 * what made the handoff hard to read: "Expired" and "Left-aligned column" sat
 * in one list as though a reader had to choose between them. A state answers
 * *where is the learner*; an option answers *how is this drawn*, and the two
 * compose — every state can be shown with any option.
 */
export type DevHandoffOption = {
  /** The option, named for what it does — "Combined panel", not "bare". */
  name: string
  /** What changes when it is on. */
  what: string
  /** Who turns it on, and where. Same role as a state's `howToSee`. */
  howToSee?: string
}

/** One user-facing action a feature exposes. */
export type DevHandoffAction = {
  /** Action / control label (e.g. "Start Task", "Edit Study Plan"). */
  name: string
  /** What it does + any condition on when it appears. */
  detail: string
}

/** One EDGE of a component's state machine — how the learner moves from one
 *  variant to the next, why that move needs to exist, and the control that
 *  makes it.
 *
 *  ⚠ WAS `DevHandoffLogicVariant`, renamed 2026-10-20. Calling these
 *  "variants" is what let two different axes share one word: the Exam Date
 *  card's four entries here are "Default → No", "No → Yes", "Yes → Set",
 *  "Set → Yes (Edit)" — TRANSITIONS, not states — while Course Progress's
 *  were the same five states its `variants` list already named, with the
 *  rationale attached. The states now live in `DevHandoffVariant` (which
 *  gained `why` / `action` for exactly that content); this type keeps only
 *  what is genuinely about movement between them. */
export type DevHandoffTransition = {
  /** The move, written as "<from> → <to>" (e.g. "Default → No"). */
  name: string
  /** What triggers it. Optional. */
  when?: string
  /** Why the learner needs this move to be available. */
  why: string
  /** The control that performs it (CTA + behavior). */
  action: string
}

/** One token reference — a role mapped to the CSS variable that drives it.
 *  We reference the NAMED token, never the raw hex/px value, so there's a
 *  single source of truth (tokens.css) and the spec can't drift. */
export type DevHandoffTokenRef = {
  /** What it styles, e.g. "Surface", "Title font", "Radius". */
  role: string
  /** The token name(s), e.g. "--color-primary-700". */
  token: string
}

/** The design spec for a component — token references + states + layout notes
 *  + the source of truth. Deliberately holds NO raw hex or font values; those
 *  live in tokens.css and are resolved live at the render site, so the spec
 *  cannot disagree with the component drawn above it. */
export type DevHandoffDesignSpec = {
  /** Named-token references (role → CSS variable). */
  tokens: DevHandoffTokenRef[]
  /** Interaction / render states to build. */
  states?: string[]
  /**
   * Layout notes — rendered under "Layout".
   *
   * ⚠ KEEP IT TO TWO THINGS (2026-10-21, Jillienne: "we don't need to talk too
   * much about the layout except that it should be responsive and that the
   * padding/margins are what px"): how the thing behaves as the width changes,
   * and the padding and margin figures. It was three paragraphs of archaeology
   * about a measurement that had been wrong — which belonged in a commit
   * message, not in the thing a developer builds from.
   */
  responsive?: string[]
  /**
   * The source of truth.
   *
   * ⚠ IT IS ALWAYS THE FINAL PROTOTYPE (2026-10-21, Jillienne: "sources of
   * truth should always be the final prototype"). Figma node ids used to be
   * listed here beside it, hedged with "not re-verified" — which left a
   * developer holding two sources and a disclaimer instead of an answer. The
   * prototype is what `main` renders; where anything disagrees with it, the
   * prototype is right. The file path goes here too, as where it is
   * implemented, which is not the same claim.
   */
  sources?: string[]
}

/**
 * ONE EDGE CASE, ASKED AND ANSWERED.
 *
 * ⚠ 2026-10-21, Jillienne: "frame this section as the following: Q: What if
 * there is no Image? A: Shift the other parts of the component to the left."
 *
 * It was `{ state, behavior }` — a two-column matrix of nouns ("No cover
 * image" / "Image slot omitted"). The Q/A shape does one thing that matrix
 * could not: it makes the list answerable. A reader arrives at an edge-case
 * section holding a question, and a row that is already phrased as that
 * question either matches or does not, which is faster than translating a noun
 * into the situation it stands for. It also makes a missing answer obvious — a
 * question with a shrug under it reads as unfinished, where "No cover image /
 * undefined" reads as documented.
 */
export type DevHandoffState = {
  /** The situation, as a question — "What if there is no image?" */
  question: string
  /** What the component does about it, as the answer. */
  answer: string
}

/** A component documented in depth for the implementing developer. */
export type DevHandoffComponent = {
  /** Stable id — routes to the detail screen
   *  (`/prototype/:featureId/handoff/:id`) and selects the live preview. */
  id: string
  /**
   * ADDED FOR THE PORTED DASHBOARDS — the URL this component's live preview
   * embeds.
   *
   * In the Common LMS original there was no such field: `ComponentLivePreview`
   * was a hardcoded registry mapping each `id` to a real React component, so a
   * new preview meant editing that page. XCEL's prototypes are standalone HTML,
   * so the preview is data — set this and the preview appears with no code
   * change.
   *
   * A path under `public/` (e.g. `/prototypes/all-learners.html`) or an absolute
   * URL. Omit it and the preview falls back to the parent feature's first
   * `pages` entry, so a component in a feature that already has a walkthrough
   * usually needs nothing here. Point it at a `#fragment` or query param to open
   * the prototype on the specific state the notes describe.
   */
  previewUrl?: string
  /** Explicit 1-based tile order within the feature's handoff list (lower =
   *  earlier). Components without it keep their array position (sorted after any
   *  ordered ones). Drives the numbered tile badge. */
  order?: number
  /** Component / surface name. */
  name: string
  /**
   * Short label for the UI Components tab strip, where the full `name` would
   * blow the row's width. Same budget idea as `tileBlurb` vs `blurb`: an
   * authored short form, not a truncation heuristic. Budget: **≤24
   * characters**. Falls back to `name` when omitted (fine for names already
   * short enough to sit in a tab).
   */
  tabLabel?: string
  /** Optional short status badge shown on the component row + detail header
   *  (e.g. "UPDATED", "NEW"). Used to flag a revised spec without dropping the
   *  historical tile it supersedes. */
  badge?: string
  /**
   * When that badge's change landed — ISO `YYYY-MM-DD`.
   *
   * Rendered beside the label ("UPDATED · 8/31/26") so "updated" answers *when*,
   * which is the only thing that makes it useful a month later. Optional: a
   * badge with no date renders as the bare label rather than a guess, so leave
   * it unset rather than approximating.
   *
   * ISO here and formatted at the render site — one source date, the same rule
   * the LMS renewal fixtures follow. It is parsed by hand there, never through
   * `new Date(iso)`, which is UTC and shifts the day in western timezones.
   */
  badgeDate?: string
  /**
   * A static thumbnail for the component's row, e.g.
   * `/prototype-thumbs/components/<prototype>-<state>.png`.
   *
   * PREFERRED over the live miniature when set. Three reasons to reach for it:
   * a preview whose top-left is mostly white reads as a blank plate; a live
   * render costs a real iframe boot per visible row; and — the one that is easy
   * to miss — a live render puts its text in the DOM, so find-in-page matches
   * inside a 104x68 picture. A flat image has none of those problems.
   *
   * Optional, and a missing or broken file is not an error: the row falls back
   * to the live render, so adding one is safe before the image exists and
   * deleting one is a safe way to retire it.
   */
  thumbnail?: string
  /** Where it lives in the codebase (file path, optionally a node). */
  location: string
  /** One- or two-sentence summary of what it is and where it appears. */
  summary: string
  /** Every STATE the component can render — what it looks like, and when the
   *  learner sees it. Display toggles go in `options`, not here. */
  variants: DevHandoffVariant[]
  /** Display toggles that compose with any state (alignment, combined panel,
   *  which rows are shown). Rendered as their own section. */
  options?: DevHandoffOption[]
  /**
   * EVERY CTA ON THE COMPONENT, and what it does.
   *
   * ⚠ ONE LINE PER CONTROL (2026-10-21, Jillienne: "for every CTA there should
   * be a line item explaining what it does, so Course Overview: Opens the
   * Course Overview page of the Compass application"). A state's `action` says
   * what the learner does IN that state; this says what each button is, once,
   * in the reader's own terms — where it goes, or that it goes nowhere yet.
   *
   * Replaced `uxLogic` (the Rules section), which was removed the same day:
   * what decides which state renders is the Flows diagram's job, the states
   * carry their own behavior, and what was left was a bucket.
   */
  ctas?: { name: string; does: string }[]
  /** Token-referencing design spec (font / color / radius via named tokens,
   *  states, responsive + motion, sources). Rendered as its own section. */
  designSpec?: DevHandoffDesignSpec
  /** Non-happy-path states the build must handle (loading / empty / error / …). */
  statesMatrix?: DevHandoffState[]
  /**
   * Edge cases the design handles — the ones that are not a state with a
   * behavior, but a condition worth knowing before you build.
   *
   * ⚠ MOVED OUT OF `uiUxLogic` ON 2026-10-21, with the rest of that field
   * redistributed and the type retired. These are the highest-value lines in a
   * handoff — "the registration link is bold text, not a link, so a learner
   * clicking it gets nothing" — and they were rendering inside a UX Logic
   * section while a SEPARATE "Edge cases" section sat below it holding
   * `statesMatrix`. Two lists with one name, neither complete. They render
   * together now, under the heading that was already there.
   */
  edgeCases?: string[]
  /** Related Jira ticket URLs for THIS component (shared baseline, in code).
   *  Reviewers can also paste more on the component's handoff detail page
   *  (per-browser localStorage). Both surface here AND, read-only, on the
   *  feature gateway's aggregated "Related Jira Tickets" row. */
  jiraTickets?: string[]
}

/** A lighter pointer to a related surface the dev should also document /
 *  account for, without a full deep-dive. */
export type DevHandoffPointer = {
  name: string
  location: string
  note: string
}

/** One row of the "Design & product decisions" log — a resolved (or still
 *  open) product/design question, its working answer, and where it stands. */
export type DevHandoffDecision = {
  /** The question under discussion. */
  question: string
  /** The decision / working answer. */
  decision: string
  /** Where it stands. */
  status: 'Decided' | 'Needs weigh-in' | 'Blocked'
  /** Who owns the open decision (a person, "Business", etc.). Omit when Decided. */
  owner?: string
}

/** The decisions log for a feature — the recurring "Design & Product Decisions"
 *  table (questions + working answers + status), plus the open-items summary. */
export type DevHandoffDecisions = {
  /** Optional lead-in line. */
  intro?: string
  items: DevHandoffDecision[]
  /** The open / blocked items called out below the table. */
  openItems?: string[]
}

export type DevHandoffNotes = {
  /** Intro line shown under the section heading. */
  intro: string
  /** Components documented in depth. */
  components: DevHandoffComponent[]
  /** UI Components + UX Rules — the feature broken down into per-component
   *  handoffs (Header, Card Styles, Carousel, …), each linking to its own
   *  detail screen + live preview. Rendered in its OWN gateway tab ("UI
   *  Components & UX Logic") rather than the Design & Product Decisions tab, so the
   *  decisions log and the component breakdown live on separate tabs. */
  uiComponents?: DevHandoffComponent[]
  /** Design & product decisions log (the recurring decisions table). */
  decisions?: DevHandoffDecisions
  /** "Also worth documenting" — related surfaces, lighter touch. */
  alsoConsider?: DevHandoffPointer[]
  /** Closing note — e.g. how the demo feature flags map to these. */
  flagsNote?: string
}

export type PrototypeFeature = {
  id: string
  title: string
  /** The full summary — shown on the feature gateway header, where there's room
   *  to describe the whole feature. */
  blurb: string
  /**
   * Short summary for the landing-page tile + table row, where a long `blurb`
   * pushed some tiles past ten lines and made the grid impossible to scan.
   * Budget: **≤160 characters** — the tile paragraph renders ~34 chars/line at
   * its narrowest (a 281px paragraph in a 320px-min grid cell), so 160 keeps
   * every tile inside 5 lines. Falls back to `blurb` when omitted (fine for
   * blurbs already under the budget). The tile also hard-clamps at 5 lines, so
   * a future over-budget blurb degrades to an ellipsis instead of a tall tile.
   */
  tileBlurb?: string
  kind: 'explore' | 'guided'
  status: 'ready' | 'coming-soon'
  /**
   * Which landing-page filter tab this tile lives under (Dashboard · Dev
   * Handoff). New dev-handoff features should set `category: 'dev-handoff'` so
   * they land in the right tab. A tile the reviewer marks "Done" moves to the
   * Done tab regardless of this value.
   */
  category: FeatureCategory
  /**
   * Which product surface a PROTOTYPES row is the source of truth for. Required
   * on every `category: 'prototype'` row and meaningless on any other — see
   * `PROTOTYPE_SCOPES` above for the rule (one row per scope, every row on
   * `main`'s build at `?demo=1`) and `UxDashboard.smoke.test.tsx` for the pin.
   */
  prototypeScope?: PrototypeScope
  /**
   * When this row's surface last changed on `main` — an ISO timestamp, shown
   * on the row as its "Updated" tag (2026-10-14, Jillienne's ask). Prototypes
   * rows only; required on every one that opens, and `UxDashboard.smoke.test`
   * checks the shape.
   *
   * ⚠ AUTHORED, AND MAINTAINED AT THE MERGE. A row renders `main`'s build, so
   * the honest stamp is the time of the last commit on `main` that changed
   * the surface — which a client cannot know at run time, and a Netlify build
   * cannot compute from its shallow clone. So `ship-to-main` stamps it: for
   * each Prototypes row whose surface the branch changed, set this to the
   * merge time. Seeded 2026-10-14 from `git log -1` on each surface's paths.
   */
  lastUpdated?: string
  /**
   * When true, the tile is password-gated: it shows a "Locked" badge and the
   * first click per session opens the prototype password modal before
   * navigating. Unlocked (non-`locked`) tiles open straight through with no
   * prompt. Independent of `status` — a `ready` feature can still be locked.
   */
  locked?: boolean
  /**
   * When true, the tile shows an "In Progress" status badge and moves to the
   * "In Progress" filter tab — leaving its `category` tab (mirrors how a
   * "Done" tile moves to the Done tab). A tile marked Done wins over
   * `inProgress` (it goes to the Done tab). Set this in the config to flag a
   * feature that's still being built.
   */
  inProgress?: boolean
  /**
   * When true, the tile ships as **Done** — it carries the Done badge and lives
   * in the Done filter tab for every reviewer, not just the browser that
   * clicked "Mark done". Wins over `inProgress`. The tile kebab's
   * "Mark done" / "Reopen" still overrides this per browser (the override is
   * tri-state — see prototypeDoneUtil.ts), so a reviewer can pull a shipped
   * feature back out without a code change.
   */
  done?: boolean
  /**
   * Authored dev-cycle status — the banner across the top of the tile and the
   * status on the feature's handoff cards ('In Design' / 'Needs Discussion' /
   * 'Blocked' / 'Ready for Dev' / 'In Development').
   *
   * This is the COMMITTED default, so a status set here shows for every reviewer
   * and survives a cleared browser; the per-card kebab still overrides it
   * locally (localStorage `cgp.devHandoffStatus`, keyed `featureId:componentId`),
   * and a tile shows 'Mixed' when a reviewer's overrides make its cards
   * disagree. Only meaningful on `dev-handoff` features — that's the only
   * category whose tiles render the banner.
   */
  devStatus?: DevStatus
  /**
   * Related Jira ticket URLs — the shared baseline surfaced on the feature
   * gateway header as links. Reviewers can also paste additional tickets at
   * runtime (persisted per browser in localStorage); those merge with these.
   */
  jiraTickets?: string[]
  /** Tile accent color (pulls from brand tokens). */
  accent: FeatureAccent
  /** Icon key — resolved to an icon component on the landing page (`ICONS`
   *  there must cover every value in this union). */
  icon: 'grid' | 'calendar' | 'flag' | 'monitor'
  /**
   * Optional real screenshot for the home page's row thumbnail, as a path under
   * `public/` (convention: `/prototype-thumbs/<id>.png`). Without it the row
   * generates a thumbnail from `accent` + `icon`, which is what most features
   * should keep — an abstract mark cannot go stale, and 27 hand-maintained
   * screenshots would.
   *
   * Worth it only for the few features whose whole point IS the visual, and
   * only if you will re-shoot when the screen changes. The row falls back to
   * the generated mark if the file is missing or fails to load, so a deleted
   * or not-yet-added image degrades quietly rather than leaving a broken
   * image in the list.
   */
  thumbnail?: string
  /**
   * Pins the feature to the TOP of its home-page section, ahead of whatever
   * the current order would put there. Declared rather than achieved by
   * reordering `PROTOTYPE_FEATURES`, because array position is invisible as
   * an intent — the next person adding a tile above it would undo it without
   * knowing — and because a pin survives sorting if a section ever gets a sort
   * control back. Applies within the section only, and never overrides search
   * or a status filter: it reorders what already matched, it does not smuggle
   * a row past a filter.
   */
  pinned?: boolean
  /**
   * Overrides the home row's kind tag. The tag is normally derived — an
   * `explore` tile reads "Full platform", a `guided` one "Feature", and an
   * external one "Standalone HTML" — but `explore` covers two different
   * things: tiles that open the whole platform to navigate freely, and tiles
   * that drop you on ONE page. Set `'Feature'` for the second kind, or the
   * row claims a scope it does not have.
   */
  kindLabel?: string
  /** explore-only: the single entry route the tile's CTA opens. */
  to?: string
  /** explore-only: an external URL (e.g. a standalone hosted test build). When
   *  set, the tile opens it in a NEW TAB via a real anchor instead of an in-app
   *  react-router route — used by the Testing tab's hosted prototype links. */
  externalUrl?: string
  /** When true, suppress the tile's type badge ("Full platform" / "N pages" /
   *  "Test flow") — leaving only status pills (In Design / Locked / Done).
   *  Read ONLY by the archived tile landing; the home page's row ignores it and
   *  uses `kindLabel` to correct a wrong label rather than hide it. */
  hideTypeBadge?: boolean
  /**
   * guided-only: when set, opening this feature switches the demo account so
   * its pages render in the right brand / membership context. The STC study
   * calendar, for example, only appears when the active brand is 'stc'.
   */
  account?: { brand: Brand; membership: Membership }
  /**
   * guided-only: which brands this feature can be demoed in. REQUIRED per the
   * add-a-feature checklist above — ask before assuming. Reviewers should be
   * able to demo the feature in each listed brand.
   */
  brands?: Brand[]
  /**
   * guided-only: feature flags (Admin tools → Feature Flag panel) that drive
   * this feature's variants. Surfaced on the gateway so reviewers know which
   * toggles to flip. Include any that apply.
   */
  featureFlags?: FeatureFlagRef[]
  /**
   * guided-only: developer handoff notes shown at the bottom of the gateway
   * (in place of the old feature-flag callout). Documents the feature's key
   * components in depth — variants, UX logic, data deps, and remaining stubs —
   * so a developer can pick up the next step from the prototype.
   */
  devHandoff?: DevHandoffNotes
  /** guided-only: the specific pages that make up this feature. EDIT THESE.
   *  Always include BOTH member and non-member views (see checklist above). */
  pages?: FeaturePageLink[]
  /**
   * guided-only: optional fallback route for the "Live Preview" tab's
   * fullscreen embed. The tab normally embeds the selected walkthrough page
   * (defaulting to the first). Set this to give a feature that has no
   * walkthrough `pages` something to embed anyway.
   */
  livePreviewUrl?: string
}

/* ─────────────────────────────────────────────────────────────────────────
 *  XCEL PROJECT — the rows
 *
 *  The XCEL LMS work is the FinServ (Insurance / Mortgage / Banking)
 *  next-generation platform, answering the FinServ *Learner and Admin Wireframe
 *  Brief*. Four artifacts, and they are four DIFFERENT things a reviewer picks
 *  between — a product, a journey, an analysis, a spec — which is why they are
 *  four rows rather than one row with four pages. Burying three inside a
 *  fourth page's prototype bar was tried in the Common LMS dashboard and nobody
 *  found them.
 *
 *  Ported verbatim (titles, blurbs, kindLabel, devStatus) from the Common LMS
 *  dashboard's `PROTOTYPE_FEATURES`, so the two cannot disagree about what this
 *  work is while both exist. THEY BOTH EXIST ON PURPOSE, for now: the four rows
 *  were deliberately left in the LMS dashboard rather than moved, so this is a
 *  second front door to the same work until that call is made. Any edit to a
 *  row's title, blurb or status has to be made in BOTH files until then.
 *
 *  ── WHERE THE PROTOTYPES COME FROM ───────────────────────────────────────
 *  Served from THIS repo's `public/prototypes/`. It used to point at the Common
 *  LMS project's live Netlify deploy, on the reasoning that a pointer always
 *  shows the current build while a snapshot can go stale. That was the better
 *  argument right up until it met the deployment: BOTH sites are behind Netlify
 *  password protection, and both return HTTP 401 to an unauthenticated request.
 *
 *  An iframe here loading the other origin therefore needs a valid Netlify
 *  session cookie ON THAT ORIGIN — which, inside an iframe, is a third-party
 *  cookie. Safari blocks those outright and Chrome restricts them. So a
 *  reviewer who has not separately signed in to the Common LMS site in the same
 *  browser gets a password prompt inside every thumbnail, or a blank frame.
 *  The old comment anticipated a silent break from `X-Frame-Options` / CSP; the
 *  cause turned out to be auth, which no header check would have caught.
 *
 *  Worth stating plainly, because it is easy to assume otherwise: a password on
 *  THIS site never protected the prototypes. They were being served from a
 *  different origin under its own separate password.
 *
 *  ── THE COST OF THE SNAPSHOT, WHICH IS REAL ──────────────────────────────
 *  The files now exist in two repos and CAN DRIFT. Their real home is still
 *  `jill-dashboard-ux-designs/explorations/finserv-learner-brief/`, published by
 *  `./deploy-xcel-prototypes.sh` there — that script now copies into this repo
 *  too, so the two stay in step as long as it is the thing that does the
 *  copying. Copy a file by hand and you have started the drift it exists to
 *  prevent.
 *
 *  TODO(2026-09-04): still the right endgame — relocate the prototype files,
 *  their smoke tests and `deploy-xcel-prototypes.sh` INTO this repo, making it
 *  their real home and removing the two-repo problem rather than managing it.
 *  This change buys working previews in the meantime; it does not settle that.
 * ───────────────────────────────────────────────────────────────────────── */

/** Served from this repo's own `public/prototypes/`. Same-origin, so it is
 *  covered by this site's password rather than depending on another site's. */
const PROTOTYPE_BASE = '/prototypes'

/* ── WHY EXPLORATION, NOT DESIGN ─────────────────────────────────────────
 *  These same rows sit in DESIGN in the Common LMS dashboard and in
 *  EXPLORATION here, and that is deliberate rather than drift. There they are
 *  five artifacts among many competing for one designer's attention, so their
 *  dev-cycle status is the useful axis. Here they ARE the project — an outside
 *  product's brief rebuilt on our tokens and conventions, which is exactly
 *  what this section's blurb describes.
 *
 *  Mechanically that means NO `devStatus` on any of them. `sectionOf` checks it
 *  BEFORE `category`, so a status added to one of these rows silently pulls it
 *  out of Exploration and into Design — no error, and it reads as the row
 *  simply vanishing from the section. `UxDashboard.smoke.test.tsx` asserts the
 *  inverse so that fails a test instead.
 * ───────────────────────────────────────────────────────────────────────── */

export const PROTOTYPE_FEATURES: PrototypeFeature[] = [
  {
    /*
     * THE IN-APP ROW THAT WAS THE ONLY ONE until 2026-10-14 — the invite row
     * above and the Compass row below are routes too now; the admin row is the
     * document. Everything else here opens a standalone HTML
     * document under `public/prototypes/`; this one is a react-router route
     * into the product app that lives in this repo (`/dashboard-rebrand`),
     * which is why it carries `to` rather than `externalUrl`.
     *
     * ⚠ DO NOT CONFUSE IT WITH `xcel-lms`, which sits in Exploration and is
     * titled "XCEL LMS — Desktop Platform". That row is a hand-authored HTML
     * mock-up of these same surfaces; this one is the surfaces themselves. The
     * two look alike on purpose — the mock-up was the argument for building
     * it — so each blurb says which it is, and the titles are kept apart.
     *
     * It is in PROTOTYPES (2026-09-18; DEMO before that), the ungated section
     * that holds the product as it stands — what the promote-to-prototype
     * skill promotes INTO. Demo is the review inbox now, authored on the page,
     * so nothing in this file routes there. `UxDashboard.smoke.test.tsx`
     * asserts this row is the one thing in Prototypes.
     *
     * NO `devStatus` — same trap as the Exploration rows. `sectionOf` checks
     * devStatus BEFORE category, so authoring one here silently moves this row
     * to Design or Development and it vanishes from the front door.
     */
    id: 'xcel-dashboard',
    // Renamed 2026-10-14 from "XCEL Dashboard — Live Product Build", Jillienne's
    // ask, when the Compass row arrived beside it: the row is the whole learner
    // journey, Atlas (the dashboard) and Compass (the study experience) in one
    // build, and the old name said only the first half.
    // …and again the same evening, "(Atlas & Compass)" → "(Invite, Atlas,
    // Compass)", once the three doors around this row each had a row of
    // their own: the parenthesis names what this one contains, in order.
    title: 'End-to-End User Experience (Invite, Atlas, Compass)',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The real React application, running on XCEL alone — the left-rail shell, the Current Learning Path band, the Study Plan, My Courses, Certificates, Recommended for You and the Insurance Training Catalog, all rendering XCEL’s own content on the San Juan / Brick palette. Ported from the Common LMS on 2026-09-08 and stripped to one brand: the other five and every fixture, token block and tier table behind them are gone. XCEL sells no membership, so every membership surface is suppressed rather than shown in a non-member state — no tier badge, no upsell bands, no Membership item in the rail or the top nav. The prototype bar’s Persona / Progress / Education switches drive the whole page.',
    tileBlurb:
      'The actual React product on XCEL brand colour — shell, learning path, study plan, courses, certificates, catalog. One brand, no membership.',
    kind: 'explore',
    /* RELEASED — 2026-10-16, Jillienne: "I want to turn on the end-to-end
       flow and work through it." Held back since 2026-10-14 ("change this
       whole option to Coming soon like the Admin tool, as I need to pick
       things from all the others — don't remove the work, just hide users
       from clicking on it for now"), which kept the `to` on record precisely
       so that releasing it would be one word. This is that word; the row
       draws live again, with its own live preview frame in place of the
       disabled mark. */
    status: 'ready',
    category: 'prototype',
    // The middle door of the three — see `PROTOTYPE_SCOPES`. This row is the
    // whole product; the Compass row below is one surface INSIDE it, reached
    // from here by clicking into a course, and the two render the same build.
    prototypeScope: 'end-to-end',
    // All four opening rows re-stamped at the 2026-10-15 ship that retired the
    // demo site: the shared chrome every row renders — the demo bar, the
    // version picker, the prototype bar — changed under all of them.
    lastUpdated: '2026-10-21T17:00:54Z',
    pinned: true,
    // An in-app route, not a document. `to` is what makes the tile navigate
    // rather than open a new tab, and it is also what the row's live preview
    // frame renders — see the note in FeaturePreviewThumb about the cost.
    // `?demo=1`, not the bare route. Demo mode swaps the working flag map for
    // the COMMITTED baseline before first paint and suspends persistence, so
    // the Demo row always opens the configuration this repo ships — not
    // whatever the last person to open `/dashboard-rebrand` in that browser
    // toggled. Without it a returning reviewer's own tinkering IS the demo,
    // silently, and the nav is where that shows up first.
    //
    // It does NOT hide the Demo Controls bar (that gate is pathname-only), so
    // a stakeholder can still switch persona / progress / readiness — those
    // edits are just ephemeral, which is the point of a demo.
    //
    // ⚠ IT OPENS AT THE INVITE DOOR NOW, not the dashboard (2026-10-16,
    // Jillienne, releasing the row: "should include the invite flow"). The
    // row's claim is the WHOLE journey, and until today it entered at the
    // middle of it — a stakeholder clicking "End-to-End User Experience"
    // landed on the dashboard and never saw the two doors named in its own
    // title. The flow's first page is the first page of the flow, and with
    // `e2e-loading-opens-home` on, the loading page at the end of the
    // password step hands off to Atlas Learning Home on its own. So the row
    // now walks what it says: invite, purchase, password, dashboard.
    //
    // ⚠ THE INVITE ROW OPENS THE SAME DOOR, and `?journey=full` is what makes
    // the two rows different walks of it (2026-10-16, Jillienne: "the 3
    // designers do not merge those 2 together, I do, that is the purpose of
    // the separate tile"). Invite & Purchase asks the narrower question — how
    // a learner gets in — and ENDS at the spinner, which is Afsana and Eric's
    // surface and is unchanged. THIS row is the assembled product, so its
    // spinner hands off to Atlas Learning after three seconds and the walk
    // continues. Same build, same door, two questions — exactly as the Atlas
    // and Compass rows are one build entered at two `?section=`s.
    //
    // The param pins no flag and no version, so the smoke test's "every row
    // is main's build at ?demo=1" guarantee is untouched; `InvitedConfirmationPage`
    // reads it and `endToEndDemo.ts` says why it is a param rather than a flag.
    //
    // ⚠ AND IT STARTS AT THE EMAIL (2026-10-19, Jillienne: "clicking on end
    // to end should start with the email first, on default"). The invitation
    // email is where a learner's journey actually begins — the Product Detail
    // page is already the second step, reached by clicking a link in a mail
    // client. A row whose title is the WHOLE experience should not open one
    // page into it.
    //
    // ⚠ THE INVITE ROW IS DELIBERATELY NOT MOVED. It asks the narrower
    // question — how a learner gets in — and Afsana and Eric own that scope
    // (`PROTOTYPE_SCOPES`); whether their walk starts at the mail client is
    // theirs to decide, not something this change should carry along with it.
    //
    // ⚠ STILL ONE OF THE PRODUCT APP'S DOORS. `/end-to-end-demo/email` is a
    // page UNDER `/end-to-end-demo`, not a third entrance — the smoke test
    // checks the door, not an exact pathname, for exactly this reason.
    // ⚠ BACK TO THE DASHBOARD — 2026-10-20, Jillienne: "lets set the Atlas to
    // be the default view the user comes in on", taken WITH the Start control
    // collapsing Email / Invite / Checkout / Confirmation into one
    // "Invite & Checkout" entry the same day. The two go together: the flow
    // stopped being four doors on the bar, so it no longer has to be the
    // front door of the row to be findable — it is one pick away, and a
    // stakeholder lands on the product rather than on an inbox.
    //
    // ⚠ THIS REVERSES THE 2026-10-16 CALL ABOVE, which is why that note is
    // kept verbatim rather than edited: "a stakeholder clicking 'End-to-End
    // User Experience' landed on the dashboard and never saw the two doors
    // named in its own title." That objection is still true and is the cost
    // being paid — what changed is that the doors are now named on the Start
    // control instead of only in the row's title.
    //
    // ⚠ `journey=full` STAYS, and dropping it would have been the quiet
    // mistake here. It is what makes this row the FULL walk rather than the
    // Invite & Purchase row's narrower one — the spinner at the end of the
    // password step hands off to Atlas Learning instead of stopping. The
    // Start control carries the address forward when it jumps, so keeping the
    // param on the landing URL is what makes picking "Invite & Checkout" give
    // the full walk; without it the one-click-away flow would quietly be the
    // other row's.
    //
    // ⚠ THE TITLE STILL NAMES THE JOURNEY — "End-to-End User Experience
    // (Invite, Atlas, Compass)" — and the row no longer opens at Invite.
    // Flagged at the time and deliberately not renamed here; renaming the
    // first row of Prototypes is its own decision.
    to: '/dashboard-rebrand?demo=1&journey=full',
    brands: ['xcel'],
  },
  {
    /*
     * THE INVITE ROW — 2026-10-14, Jillienne's ask, the evening Eric's
     * End-to-End Demo merged. The first door of the journey — how a learner
     * gets INTO the product — listed SECOND, because the product itself is
     * always the first row (see `PROTOTYPE_SCOPES`). It opens the Invited Product Detail page, whose
     * Purchase Now opens the checkout, which lands on the dashboard.
     *
     * `/end-to-end-demo`, not `/dashboard-rebrand` — the second product door
     * the smoke test admits. `?demo=1` for the usual reason. ⚠ THE PAGE PINS
     * ITS OWN VERSION: `useEndToEndDemoParams` writes `version=eric-atlas-e2e`
     * onto the address, because the page IS that version's way in. So this is
     * the one row whose dashboard does not follow `defaultDiscoverabilityVersionFor`
     * — the page's rule, not the row's, and the row carries no `version=` of
     * its own so the test's pin still holds. Today the two agree anyway: that
     * version is the baseline.
     *
     * No `thumbnail`; the preview boots the page in a scaled frame, the third
     * live frame in this section. Add captures if that starts to cost.
     */
    id: 'xcel-invite',
    // "— Work in Progress", like the Atlas and Compass rows (2026-10-14,
    // Jillienne on the preview): every door around the end-to-end row is
    // still being shaped, and the titles say so.
    title: 'Invite & Purchase — Work in Progress',
    accent: 'gold',
    icon: 'flag',
    blurb:
      'How a learner gets into the product: the Invited Product Detail page under the partner header — the personal welcome, the course header with its price card — whose Purchase Now opens the checkout, and the order confirmation where they create their password. Eric’s End-to-End Demo, in the same React build as the other rows, entered at its first page rather than its dashboard.',
    tileBlurb:
      'The way in: invited product detail, Purchase Now, checkout, then creating a password. The same build as the other rows, entered at its first page.',
    kind: 'explore',
    status: 'ready',
    category: 'prototype',
    prototypeScope: 'invite',
    lastUpdated: '2026-10-20T20:50:10Z',
    pinned: true,
    to: '/end-to-end-demo?demo=1',
    brands: ['xcel'],
  },
  {
    /*
     * THE ATLAS LEARNING ROW — 2026-10-14, Jillienne's ask on the preview:
     * "another section that is just Atlas Learning — Work in Progress, after
     * the Invite & Purchase flow: the home screen and everything else from
     * the end to end, but not the Course Details items", and then "it needs to
     * stem from the current end-to-end, and exclude the invite flow and the
     * Compass work."
     *
     * So it is the SAME build at the SAME baseline as the end-to-end row,
     * entered at Home — `section=dashboard`, written out so the address says
     * what the row is for rather than reading identical to the row above. What
     * makes it a row of its own is scope and ownership, not a different
     * build: this is the learner's Home and the learning pages around it, in
     * progress, and that is Eric's exploration. The invite door before it and
     * the Compass pages inside a course are the rows on either side.
     *
     * "Work in Progress" is in the title because that is what the row says
     * about itself; its `status` is `ready` because it opens.
     *
     * No `thumbnail`; the fourth live frame on the landing page. Add captures
     * to `public/prototype-thumbs/` if the page slows.
     */
    id: 'xcel-atlas-learning',
    title: 'Atlas Learning — Work in Progress',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The learner’s Home and the learning pages around it — My Courses, Certificates, the Quick Links — as they stand today, in progress. The middle of the end-to-end row: the same build at the same baseline, entered at Home, without the invite flow before it or the Compass course pages inside it, which have rows of their own.',
    tileBlurb:
      'Home and the learning pages around it, in progress. The middle of the end-to-end: same build, entered at Home, without the invite flow or the Compass pages.',
    kind: 'explore',
    status: 'ready',
    category: 'prototype',
    prototypeScope: 'atlas',
    lastUpdated: '2026-10-21T17:00:54Z',
    pinned: true,
    to: '/dashboard-rebrand?demo=1&section=dashboard',
    brands: ['xcel'],
  },
  {
    /*
     * THE COMPASS ROW — 2026-10-14, the first second row on Prototypes, and
     * the one that restated the rule as one-row-per-scope (`PROTOTYPE_SCOPES`).
     *
     * It is the SAME BUILD as the row above, entered at Compass Learning
     * (`?section=compass`, the top nav's second destination) rather than the
     * dashboard. That is deliberate and it is what keeps "which one is real?"
     * unaskable: a stakeholder who clicks into a course from the end-to-end
     * row lands on exactly what this row opens. The row exists because the
     * study experience is a surface with its own owner and its own stream of
     * Refinement work — Anjani's, tagged `product: 'compass'` there — and
     * "what is Compass right now?" deserves a door that does not route through
     * the dashboard to answer it.
     *
     * `?demo=1` for the same reason as the row above: the committed baseline,
     * not the last reviewer's toggles. Under that baseline the version is the
     * one `defaultDiscoverabilityVersionFor` returns, which is what draws the
     * Compass rail — this row never pins a `version=`, because pinning one
     * would make it stop tracking the product the moment the baseline moved.
     *
     * NO `thumbnail`, so the row preview boots the app in a scaled frame —
     * the cost `FeaturePreviewThumb` documents. Two frames was judged fine;
     * add captures if the section grows past three.
     */
    id: 'xcel-compass',
    // "— Live Product Build" until the evening of 2026-10-14; "— Work in
    // Progress" since, Jillienne's ask on the preview, matching the Atlas row:
    // both are surfaces still being shaped, and the title should say so.
    title: 'Compass Learning — Work in Progress',
    accent: 'teal',
    icon: 'monitor',
    blurb:
      'The study experience inside a course, in the same React build as the dashboard: Compass Learning as the top nav’s second destination, the course player with its own rail and player bar, and the lesson session. The content and the rail are ported from Anjani’s standalone prototype, and this is where the work she puts up in Refinement lands once it is promoted. Entered directly rather than through the dashboard, so “what is Compass right now?” has an answer that does not route through “what is the dashboard right now?”.',
    tileBlurb:
      'The study experience inside a course — Compass Learning, the course player and the lesson session — in the same build as the dashboard, entered directly.',
    kind: 'explore',
    status: 'ready',
    category: 'prototype',
    prototypeScope: 'compass',
    lastUpdated: '2026-10-20T20:50:10Z',
    pinned: true,
    // Same-origin product route at the committed baseline — the smoke test
    // asserts every Prototypes row has this shape. `section=compass` is the
    // deep link `PlatformShell` honours under either navigation.
    to: '/dashboard-rebrand?demo=1&section=compass',
    brands: ['xcel'],
  },
  {
    /*
     * THE ADMIN PLACEHOLDER — 2026-10-14, Jillienne: the Admin door exists on
     * the section before the surface does. `status: 'coming-soon'` with no
     * `to` and no `externalUrl` is what `ProjectRow` draws DISABLED: the
     * generated thumbnail, the title, the blurb, the scope tag and a "Coming
     * soon" tag, no link, no chevron, no kebab. It is the one Prototypes row
     * a stakeholder cannot open, and it says so instead of opening something
     * that is not the product (the PartnerHub-fork exploration was briefly
     * wired here and un-wired the same evening; its row is archived now —
     * `admin-tool-row` in archivedItems.ts).
     *
     * Replacing it is the usual promotion: build the admin surface as a React
     * route behind a flag, then give THIS row a `to` and `status: 'ready'`
     * — the id and scope stay, so nothing that points here moves.
     */
    id: 'xcel-admin-coming-soon',
    title: 'Admin Tool',
    accent: 'neutral',
    icon: 'grid',
    // Jillienne's words, on the preview (2026-10-14). The longer story — the
    // agency admin's door, and the PartnerHub-fork exploration that argues
    // for it — is in the comment above, not on the tile.
    blurb: 'Working prototype to be added here soon.',
    tileBlurb: 'Working prototype to be added here soon.',
    kind: 'explore',
    status: 'coming-soon',
    category: 'prototype',
    prototypeScope: 'admin',
    pinned: true,
    brands: ['xcel'],
  },
  // ARCHIVED 2026-10-15 — `xcel-lms` (XCEL LMS — Desktop Platform, the
  // pinned row) stood here. Kept verbatim in `archivedFeatureRows.ts`; see
  // the `desktop-platform-row` row in `archivedItems.ts`.
  {
    id: 'xcel-walkthrough',
    title: 'XCEL LMS — Learner Walk-through',
    accent: 'blue',
    icon: 'flag',
    blurb:
      'One learner, one unbroken arc from invite to licence, with state carried throughout — the target date you pick builds the plan, the chapters you finish move the progress, a failed attempt re-anchors the schedule. A "what the product knows" inspector makes the carried state visible.',
    tileBlurb:
      'Invite → account → study → Compass hand-off → exam sim → book → fail → retake → pass → records. One arc, state carried, on a phone.',
    kind: 'explore',
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-walkthrough.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-walkthrough.html`,
    brands: ['xcel'],
  },
  {
    id: 'xcel-wireframes',
    title: 'XCEL LMS — Wireframes & Overlap',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'Lo-fi wireframes for four learner flows the brief names — invited arrival, the Compass hand-off, the interruption state, and the exam as a task type — over an inventory mapping every ask in the brief to what this project and PartnerHub already ship. Each flow leads with a working interactive stage.',
    tileBlurb:
      '21 frames across four flows, each with a clickable stage, over the inventory of what already exists. Unresolved items drawn as explicit holes.',
    kind: 'explore',
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-wireframes.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-wireframes.html`,
    brands: ['xcel'],
  },
  {
    id: 'xcel-admin',
    title: 'XCEL LMS — Admin Wireframes & Overlap',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The six admin flows the brief names, drawn against PartnerHub\u2019s All Learners architecture. Built on one claim: flows 03, 04 and 06 are not three screens but one roster asked three different questions, because who paid for a seat is a column rather than a mode. A working roster stage proves it \u2014 three view presets re-filter and re-sort the same rows \u2014 over a breadcrumb-drill answer to the hierarchy.',
    tileBlurb:
      'One roster, three filtered views, plus a breadcrumb-drill answer to the hierarchy. The case that PartnerHub already is most of the admin surface.',
    kind: 'explore',
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-admin.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-admin.html`,
    brands: ['xcel'],
  },
  // ARCHIVED 2026-10-15 — `xcel-admin-tool` (XCEL Admin Tool — Forked
  // Roster) stood here. Kept verbatim in `archivedFeatureRows.ts`; see the
  // `admin-tool-row` row in `archivedItems.ts`. The document is untouched.
  {
    id: 'xcel-exam-spec',
    title: 'XCEL LMS — Exam Task-Type Spec',
    accent: 'neutral',
    icon: 'calendar',
    blurb:
      'The licensing exam as a Study Calendar task kind: the data shape, the six-state machine, the three panels, the retake re-anchor, and the extension points in the existing calendar code — including the naming collision with the practice exam that `kind: "exam"` already occupies.',
    tileBlurb:
      'The licensing exam as a calendar task kind — data shape, six states, three panels, and where it plugs into the existing code.',
    kind: 'explore',
    // A rendered view of licensing-exam-task-type-spec.md, fetched at runtime so
    // there is exactly ONE copy of the spec. Pointing the tile at the raw .md
    // was rejected: an unknown extension is served as a download by most static
    // hosts, so the row's live thumbnail would have triggered a file download.
    kindLabel: 'Spec',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-exam-spec.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-exam-spec.html`,
    brands: ['xcel'],
  },
  {
    /*
     * PACE PRESETS — a row, as of 2026-09-22, and this REVERSES a decision.
     *
     * `docs/prototypes.md` records this page as "the sixth page with no row",
     * masthead-linked from its siblings rather than tiled, on the rule that a
     * second row into one body of work is what got `recommended-card-ab-demo`
     * and the four testing tiles archived.
     *
     * What changed: the pacing work is no longer a companion to the Study Plan
     * exploration — it is the thing two dashboard versions (Testing, Testing 2)
     * are now built around, and the argument for those versions lives on this
     * page. A reviewer sent to compare them needs it, and "open a sibling
     * prototype and find the masthead link" is not a route anyone takes.
     *
     * The rule it bends is still right for the pages that remain row-less
     * (`xcel-lms-brief-vs-existing`, `xcel-finserv-build-plan`,
     * `xcel-study-plan`, `xcel-nav-collapse`, `xcel-study-pace-readiness`) —
     * they elaborate a row that exists. This one no longer does.
     *
     * NO `devStatus`, like every other Exploration row: `sectionOf` checks it
     * BEFORE `category`, so adding one silently moves this out of Exploration
     * and into Design. `UxDashboard.smoke.test.tsx` asserts the inverse.
     */
    id: 'xcel-pace-presets',
    title: 'XCEL LMS — Pace presets from the access window',
    accent: 'blue',
    icon: 'calendar',
    blurb:
      'Three finish dates the learner already owns — Relaxed (the whole access window), Recommended (that minus a buffer) and Focused (the storefront’s own “less than two weeks”) — with the pace derived from whichever they pick rather than asked for. Four UI treatments of the same model, a card whose only control is Adjust, and a 3×3 grid across 12-, 20- and 42-lesson courses showing that “Relaxed” only earns the word on the short ones.',
    tileBlurb:
      'Relaxed / Recommended / Focused as three dates inside the 30-day access window — four UI treatments, three course sizes.',
    kind: 'explore',
    kindLabel: 'Exploration',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-pace-presets.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-pace-presets.html`,
    brands: ['xcel'],
  },
  // ARCHIVED 2026-10-15 — `xcel-course-entry` (Course Header & Jump Back In,
  // the first authored handoff) stood here, with the two component specs it
  // referenced declared above the array. All kept verbatim in
  // `archivedFeatureRows.ts`; see `course-entry-handoff` in `archivedItems.ts`.
  // ARCHIVED 2026-10-15 — `atlas-home-course-card` (Atlas/Compass — Home
  // Course Card, Eric's handoff) stood here. Kept verbatim in
  // `archivedFeatureRows.ts`; see `home-course-card-handoff` in
  // `archivedItems.ts`.
  {
    /*
     * ATLAS HOME — OVERVIEW. 2026-10-19, Jillienne's ask: a full dev handoff
     * for the Home page, split one feature per component rather than one
     * feature covering all of it. This row is the PAGE-LEVEL one — layout,
     * composition and the questions that belong to the whole page, not to any
     * one card. Each card gets its own sibling feature (see `alsoConsider`
     * below and the `xcel-atlas-home-*` ids).
     *
     * SCOPE: the CURRENT COMMITTED Home only — `AtlasHomeEricE2E.tsx`, the
     * default behind `xcel-atlas-learning`'s `?demo=1` route (End-to-End Demo).
     * Eric's other Home forks (V1/V2/V3, White, Hybrid, Hybrid — Pacing
     * Exploration, the Atlas/Compass Global Navigation parent) are NOT spec'd
     * here — they are exploration, and documenting all seven in depth would
     * have made this a comparison deck, not a handoff. They are named below so
     * a developer who stumbles on one of them in code understands why it
     * isn't covered, not because it was missed.
     *
     * devStatus: 'in-design' — Jillienne's call for all eight of these rows;
     * none of this is agreed yet.
     *
     * No `quickSummary` yet — ask her before writing one.
     */
    id: 'xcel-atlas-home-overview',
    title: 'Atlas Home — Overview',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The page-level layout of the current XCEL Atlas Home (End-to-End Demo): how the course card, the course-progress / study-pace panel, the exam-date prompt, the study journey and Quick Links are arranged, and the decisions that apply to the whole page rather than one card.',
    tileBlurb:
      'How the Atlas Home page is laid out — column widths, ordering, the White-vs-WIP chrome differences — with each card’s own detail living in its own handoff.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'The committed default — no `?version=` needed. Use the UI/UX Demo Tools → Progress dropdown to move the course card, progress panel and readiness card together.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-home-long-title', label: 'Long title', note: 'Swaps the demo course title for a long one, on Home, Invited Product Detail and Checkout at once (`useEndToEndCourseTitle`). Off by default.' },
      { id: 'atlas-wip-quick-links-side', label: 'Quick Links side', note: 'Left (default) or right. On the Design bar for WIP/White only — see the decision below on why E2E still reads it.' },
      { id: 'atlas-v3-progress', label: 'Progress', note: 'Which of the five Course Progress states the page opens on; Readiness and the journey’s current stop follow it.' },
      { id: 'atlas-v3-link-tiles', label: 'Link tiles', note: 'Stacked vs inline — currently has no visible effect on this page; see the decision below.' },
      { id: 'atlas-pace-card', label: 'Study pace card', note: '⚠ DECIDES WHAT THE LEFT COLUMN IS, and `ring` is the answer — the committed default, renders `AtlasPaceRingCard` (Course progress over Study pace in one panel). The `states` variant still renders the tan five-state card, but that concept is retired and is documented nowhere; see `atlas-home-progress-states-handoff` in the Archive. ⚠ NOT A BAR CONTROL since 2026-10-20 ("ring has been decided") — it is reachable through the Feature Flag panel or `?ff=` only.' },
      { id: 'atlas-readiness-section', label: 'Readiness section', note: '⚠ OFF BY DEFAULT (`defaultEnabled: false`, 2026-10-19). The Readiness panel does not render on a bare `?demo=1`; reach it with `?ff=atlas-readiness-section`.' },
    ],
    devHandoff: {
      intro:
        'The page composing six cards into one Home: a course card/head leading the page, a left column (one outlined panel: the Course progress ring over Study pace — Readiness joins it only when its flag is on), the Exam Date card, the Study Journey + two Get Licensed steps, and a Quick Links rail. Each card is documented in its own handoff; this one is the shell around them.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-layout',
          name: 'Atlas Home — Page Layout',
          tabLabel: 'Page Layout',
          location: 'src/components/compass/AtlasHomeEricE2E.tsx',
          summary:
            'The composition of the Home page: the course card/head on top, a left column (one outlined panel — the Course progress ring over Study pace) and a right column (study journey + Get Licensed steps) inside it, and a Quick Links rail beside the whole card. Everything on the page reads from one shared state (the Demo Controls’ Progress) so the cards cannot disagree with each other.',
          variants: [
            { name: 'Default', when: 'Every learner, on arrival.', detail: 'The course card across the top. Beneath it, a left column holding one outlined panel — Course progress over Study pace, with Readiness under them when it is on — and a right column holding the Quick Links rail, the Exam Date card and the Study Journey. ⚠ The page has no states of its own — everything that changes here is a state of one of the components inside it, each of which has its own handoff.', why: 'A map of the whole page, so a developer meets the shape before they open the individual component handoffs.', action: 'None — the page is a container.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Page gap (card ↔ Quick Links rail)', token: '32px' },
              { role: 'Course card', token: '--color-fixed-light · no shadow · no padding of its own · `flex: 0 1 800px`' },
              { role: 'Quick Links rail', token: 'fixed 234px wide, 24px between its cards' },
              { role: 'Column rule', token: '--color-primary-100' },
            ],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/compass/AtlasHomeEricE2E.tsx.',
            ],
          },
          edgeCases: [
            'Completed view (Progress = Completed, 100%): the Course Progress card is hidden entirely (the dropdown still reaches it) and the right column’s Step 1 swaps the journey list for a "Congratulations!" block.',
            '⚠ TWO TITLE MECHANISMS, ONE OF THEM DEAD. An older long-title path survives in the component but only ever feeds the course-tab strip, which never renders here — so it has no visible effect at all. The title on screen comes from a separate shared hook. Don’t "fix" one assuming it drives the other.',
          ],
          ctas: [
            { name: 'None', does: 'The page itself has no controls — every CTA on it belongs to one of the cards inside, each of which has its own handoff.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Why does `atlas-wip-quick-links-side` still move Quick Links on End-to-End Demo when the flag isn’t on E2E’s own Design bar?',
            decision:
              'The flag isn’t version-scoped in the code that reads it — it was only removed from WIP/White’s Design bar (2026-10-14, "hide it on WIP and White, its only versions" — a comment that predates E2E existing). E2E inherits whatever value was last set from WIP or White’s bar, with no way to change it from its own. Needs a decision: give E2E its own control, or leave Quick Links side fixed left on this version.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Do the Certificates/Courses link tiles ship?',
            decision:
              'Built (stacked and inline variants both exist, `StackedTile`/`LinkTile`) but currently OFF everywhere on this page — `SHOW_LINK_TILES = false`, a file-level constant, not a flag. The `atlas-v3-link-tiles` flag still exists and is readable but has nothing to show while that constant is false.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Is the "click the cover image to swap header layouts" interaction a real feature?',
            decision:
              'No — it’s a live A/B toggle for design review (like the Study Pace and Readiness cards’ own click-to-advance), not a documented learner-facing control. See the Course Head handoff for the two layouts it swaps between. A real build should pick one layout and drop the toggle.',
            status: 'Decided',
          },
        ],
        openItems: [
          'Quick Links side control for End-to-End Demo specifically.',
          'Whether the link tiles ship, and if so stacked or inline by default.',
        ],
      },
      alsoConsider: [
        { name: 'Course Head / Card', location: 'See the "Atlas Home — Course Head / Card" dev-handoff feature.', note: 'The top of the card: cover, title, course tabs, Expires meta, Course Overview + Begin/Resume buttons, and the WIP-vs-White header layout toggle.' },
        { name: 'Course Progress panel', location: 'See its own dev-handoff feature.', note: 'AtlasCourseProgressStates — the five progress stages.' },
        { name: 'Readiness panel', location: 'See its own dev-handoff feature.', note: 'AtlasReadinessCard — the half-dial readiness levels, which follow the Progress stage.' },
        { name: 'Exam Date card', location: 'See its own dev-handoff feature.', note: 'AtlasExamDateCard.' },
        { name: 'Study Journey + Get Licensed steps', location: 'See its own dev-handoff feature.', note: 'The stop list, Step 2 (Pass State Exam), Step 3 (Get Licensed), the State Requirements button, and the Completed-view swap.' },
        { name: 'Quick Links card', location: 'See its own dev-handoff feature.', note: 'AtlasJourneyLinksCard.' },
        { name: 'Affidavit modal', location: 'See its own dev-handoff feature.', note: 'Shared with the Invite flow — opens over Home on arrival via `?affidavit=1`.' },
      ],
      flagsNote:
        'Page-level: `atlas-home-long-title` (off by default; swaps the demo course title everywhere it appears), `atlas-wip-quick-links-side` (left by default; see the open decision above), `atlas-v3-progress` (drives Progress + Readiness + the journey’s current stop together), `atlas-v3-link-tiles` (currently has no visible effect — the tiles are hidden by a hardcoded constant, not this flag).',
    },
  },
  {
    /*
     * ATLAS HOME — COURSE HEAD / CARD. 2026-10-19. The course card’s own
     * header: cover, title, course tabs, the Expires/Days-to-complete meta
     * row, the Course Overview + Begin/Resume buttons, and the two header
     * layouts a reviewer can flip between by clicking the cover.
     *
     * NOT the same component as `atlas-home-course-card` (CompassHomeCourseCard)
     * — that handoff documents a different, older fork rendered on the
     * separate "Atlas/Compass Global Navigation" parent version. This one is
     * the inline course-head markup inside `AtlasHomeEricE2E`, which is what
     * the current committed Home actually ships.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-course-head',
    title: 'Atlas Home — Course Head / Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The course card’s header on the current Atlas Home: cover, title, course tabs, the Expires/Days-to-complete meta row, the Course Overview + Begin/Resume buttons, and the two header layouts a reviewer can flip between.',
    tileBlurb:
      'Cover, title, tabs, the Expires meta row and the two action buttons at the top of the Atlas Home course card — plus the click-the-cover layout toggle.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'The course head leads the card. Click the cover image to flip between the two header layouts.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-home-long-title', label: 'Long title', note: 'Swaps the title for E2E’s long course name, here and on Invited Product Detail/Checkout. Off by default.' },
    ],
    devHandoff: {
      intro:
        'The part of the course card above the rule: which course is current, its cover, its title, the Expires row, and the two actions that start or resume it.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-course-head',
          name: 'Atlas Home — Course Head',
          tabLabel: 'Course Head',
          location: 'src/components/compass/AtlasHomeEricE2E.tsx — the course-head block inside `AtlasHomeEricE2E` (not exported separately), plus `WhiteStyleHead`',
          summary:
            'Cover image, a "Current course" eyebrow, the title, an access-expiry meta row and the action row — Course Overview and Begin/Resume Course, joined by View Certificate once the course is complete and by Purchase Extension from a week out. The cover sits beside a vertically centred title, meta row and actions.',
          variants: [
            { name: 'Not started', when: 'The learner has not opened the course.', detail: 'The button reads "Begin Course".', why: 'The first click into a course is a different promise from returning to one.', action: '"Begin Course" opens the first lesson.', howToSee: 'Demo bar → Progress → Not Started' },
            { name: 'In progress', when: 'The learner has started but not finished.', detail: 'The button reads "Resume Course".', why: '"Resume" only makes sense once there is somewhere to resume to.', action: '"Resume Course" returns them where they stopped.', howToSee: 'Demo bar → Progress → On Track' },
            { name: 'Course complete', when: 'The learner has finished the course and still has access.', detail: 'The EYEBROW becomes "Congrats! You have completed this course." in place of "Current course", and the meta row drops its countdown and shows the access date alone. ⚠ The days figure is time the learner still NEEDS; at the end it is time they no longer have, so counting it down reads as a deadline against work already done. The access date stays — access really does end then, certificate or no certificate.', why: 'The eyebrow is the card’s status line, and a finished course still labelled "Current course" is the status being wrong. Moving the celebration there also leaves the meta row doing one job — saying when access ends — instead of carrying a countdown and a congratulation at once.', action: 'The primary button becomes "Review Course" and opens the coursework, the same place Resume does. "View Certificate" appears beside Course Overview — reviewing the material and collecting the certificate are different things a finished learner wants, so both are offered rather than one standing in for the other.', howToSee: 'Demo bar → Progress → Ready 100%' },
            { name: 'Expires soon', when: 'Seven or fewer usable days of access are left — but more than two.', detail: 'The meta row turns AMBER: the label, the date and the count all step to Warning 700, the count to bold, "to complete" becomes "left to complete", and a TRIANGLE-EXCLAMATION leads the line. ⚠ THE ICON IS PART OF THE STATE, not decoration — it is the cue that survives a greyscale screen, where the tone alone says nothing at all. A "Purchase Extension" button also appears first in the action row, outlined in the same amber. The title is untouched.', why: 'A countdown the learner is meant to notice has to read differently from one they are meant to ignore — and the offer has to be on screen while they can still act on it, which is the only reason to warn them at all. Amber first, red only in the last two days: a warning that looks like a failure stops being a warning.', action: 'Purchase Extension joins Course Overview and Begin/Resume; none of the three is taken away.', howToSee: 'Demo bar → Expires → 7 days' },
            { name: 'Down to the last days', when: 'Two or fewer USABLE days of access are left.', detail: 'RED. The row steps to Error 600 and the mark becomes a CALENDAR-EXCLAMATION; Purchase Extension re-outlines in the same red. ⚠ ON THE LAST USABLE DAY THE COUNT STOPS BEING A FIGURE: the row reads "Course Access Ends: 05/12/2026, Today is the last day!" rather than "0 days", because a literal zero reads as a bug rather than as urgency. ⚠ ALL THREE BUTTONS STAY — the learner can still work today, so nothing is taken away; what was added is the way to buy more time.', why: 'A quantity and a deadline are different things and have to read differently. "2 days" is still something to plan against; today is not, so the sentence replaces the sum. Red rather than amber because this is the last point at which acting still helps.', action: 'Purchase Extension, Course Overview and Begin/Resume — all three.', howToSee: 'Demo bar → Expires → 1 day' },
            { name: 'Expired', when: 'Access ended before the learner finished.', detail: 'The card reshapes, and the parts are ONE decision. The eyebrow reads "Expired". The meta row goes past tense — calendar-exclamation, then "Course Access Ended: 05/08/2026" — in Neutral 800, with no count at all, because there is nothing left to count. ⚠ COURSE OVERVIEW AND BEGIN/RESUME BOTH COME OFF: Overview opens Compass, which IS the course, and there is nothing to resume. A single primary "Purchase Extension" stands where the two of them were. The panel also drops Primary 100 for the Course Progress card’s own tan, so the two read as one material in two states.', why: 'Access ending is not another point on the progress scale — the course stops being something to resume and becomes something to buy. Eyebrow, tense, panel and call to action all change together because they are all saying the same thing, and the purchase takes the PRIMARY treatment because nothing else is left for it to compete with.', action: '"Purchase Extension", alone and primary — drawn, not wired. See the Purchase Extension handoff.', howToSee: 'Demo bar → Expires → Expired' },
            { name: 'Long access window', when: 'More than sixty days of access are left.', detail: 'The count switches unit: "57 weeks to complete" rather than "399 days". The remainder is dropped when the weeks divide evenly, so it reads "57 weeks" and not "57 weeks, 0 days"; otherwise it is "12 weeks, 6 days". Sixty itself still counts in days — the threshold is "more than".', why: 'A three-figure day count stops being a quantity anyone can feel. "399 days" reads as "a lot"; "57 weeks" says the same thing in a form the learner can picture against a calendar. Under the threshold days stay days, because that is the unit someone with a fortnight left is already thinking in.', action: 'Unchanged.', howToSee: 'Demo bar → Expires → 90, 120 or 400 days' },
            { name: 'No end date', when: 'The course has no access-expiry date.', detail: 'The Expires / days-to-complete row is omitted entirely — never a blank row and never a zero.', why: 'A row reading "Expires: —" tells the learner less than no row at all.', action: 'Unchanged; only the meta row goes.' },
            { name: 'Long title', when: 'The course name is too long for one line.', detail: 'The title wraps rather than truncating, and the meta row and buttons move down with it. ⚠ Worth building against the longest real course name, not the demo one.', why: 'Course names are supplied data, so the layout has to survive the long ones.', action: 'Unchanged.', howToSee: 'Demo bar → Long title' },
          ],
          designSpec: {
            tokens: [
              { role: 'Eyebrow ("Current course:")', token: '--color-compass-page-eyebrow' },
              { role: 'Title', token: '--color-compass-page-heading · --font-heading-serif · --type-atlas-h4-base-size/line' },
              { role: 'Meta label / value', token: '--color-neutral-700 (label) · --color-text-primary (value)' },
              { role: 'Meta row rules', token: '--color-primary-200 top and bottom — the card’s own Primary 100 would not show against the panel behind it' },
              { role: 'Buttons', token: '.cre-compass-primary / .cre-compass-secondary · --font-body' },
            ],
            responsive: [
              'RESPONSIVE, and the rendered proof is below. The cover holds its 256px; the title column carries a 436px basis — what its three buttons measure — so it keeps the width its own content needs instead of being the first thing squeezed. ⚠ FOUR PIXELS OF HEADROOM at the design width: the buttons measure 436 in a 440 column, so a longer label on any of the three puts the action row over onto a second line. Below about 796px the cover and the column stack rather than the column collapsing.',
              'Padding and margins, measured off the Final Prototype — 40px inset all round on the panel, 24px between the cover and the title column, 15px between the title block and the action row, 8px between buttons, 32px below the panel before the progress row. Corners: 20px on the panel, 12px on the cover. ⚠ THE 24 AND THE 8 WERE 32 AND 10 until 2026-10-21: the eight pixels between them are what the third button needed, and the card had no other slack — its 800 is whatever is left beside the left column.',
            ],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/compass/AtlasHomeEricE2E.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What if there is no image?', answer: 'Shift the other parts of the component to the left — the title and meta row take the full width. The slot is omitted, not left blank.' },
            { question: 'What if the course title is too long for one line?', answer: 'It wraps inside the title column, and the meta row and buttons move down with it. The cover keeps its width and aspect either way. Build against the longest real course name, not the demo one.' },
            { question: 'What if an action has nowhere to go?', answer: 'The button is omitted entirely, not rendered disabled. A dead-looking control is worse than no control.' },
          ],
          ctas: [
            { name: 'Course Overview', does: 'Opens the Course Overview page of the Compass application for the active course. Omitted entirely when no handler is supplied, rather than rendering disabled.' },
            { name: 'Begin Course', does: 'Opens the first lesson of the course, in Compass. Shown while the learner has no progress.' },
            { name: 'Resume Course', does: 'Reopens the course in Compass at the chapter the learner stopped on. The same button as Begin Course, relabelled once there is progress.' },
            { name: 'View Certificate', does: 'Opens the actual certificate in a NEW TAB — most likely through a PDF viewer plugin, not an in-app page. Appears beside Course Overview once the course is complete; it does not replace Review Course, because the two offer different things. ⚠ Today it routes to the My Certificates list instead, which is a placeholder for the real document.' },
            { name: 'Review Course', does: 'Reopens the coursework in Compass — the same destination as Resume Course. Shown once the course is complete and access is still available, because reviewing the material is what a learner does between finishing the coursework and sitting the state exam.' },
            { name: 'Purchase Extension', does: '⚠ DRAWN, NOT WIRED — it does nothing today. Intended to sell more access time; the flow behind it is specified on its own Development row. Appears beside the other two on the last day, and alone once access has gone.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'What is the Purchase Extension flow?',
            decision:
              'Not understood yet, and the button is already drawn in three states — outlined in amber from seven usable days out, in red inside the last two, and alone and primary once access has gone. Nothing happens when it is pressed. What is being sold (more days, a new window, the course again), where the button goes (a checkout, a sheet over Home, the existing Invite & Purchase checkout), and whether the offer changes with how much of the course was finished are all open; they are written up on the Purchase Extension row, which exists for exactly this. Until it is answered a build should treat the button as a placeholder, not a route.',
            status: 'Needs weigh-in',
            owner: 'Jillienne',
          },
          {
            question: 'What number of days left should turn the course access amber?',
            decision:
              'SEVEN USABLE DAYS for amber, two for red — `courseExpiryTier` in `src/data/courseExpiry.ts`, and it is the one place the question is answered. Counted in days the learner can actually STUDY in (expiry minus one), because "under seven days" has to mean seven days of work or the warning fires a day before the figure beside it justifies. ⚠ IT IS NOT `courseExpiryState`, and the two are not rivals: that one answers a CATALOGUE question — should this card in a grid of thirteen wear a badge? — over a per-course window defaulting to 60 days and clamped to half the enrolment period. This answers a HERO question: the learner is looking at ONE course, and how close is the end? Same module, two spans, on purpose. ⚠ This handoff briefly carried 15 days instead, which was never a decision — it was borrowed from the Expires control’s own arms because nothing else had been settled. It has been removed rather than left as a second answer.',
            status: 'Decided',
          },
        ],
      },
      flagsNote:
        '`atlas-home-long-title` is the only flag this component reads directly, via `useEndToEndCourseTitle()` — the same hook Invited Product Detail and Checkout use, so the three pages cannot disagree about which title is current.',
    },
  },
  {
    /*
     * ATLAS HOME — COURSE PROGRESS PANEL. 2026-10-19. AtlasCourseProgressStates
     * — the five-state module in the left column: Study Pace (0%), Course
     * Progress (the real dial), Milestone, Complete, Expired.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-progress-panel',
    title: 'Atlas Home — Progress Panel',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The Atlas Home\'s left column — ONE outlined panel holding four parts in order: Course progress (the dial), Study pace (the plan), Estimated completion (the date), and Exam readiness (the half-dial). ⚠ A reviewer sees only the first three on a bare `?demo=1`: readiness is `defaultEnabled: false`, so half of what this documents is behind `?ff=atlas-readiness-section`.',
    tileBlurb:
      'One panel, four parts: Course progress, Study pace, Estimated completion and Exam readiness — the last off by default.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'Leads the left column — the ring arm, which is what a bare `?demo=1` renders. Use UI/UX Demo Tools → Progress to move the figures; the Design bar’s Study pace card control switches to the `states` arm.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-v3-progress', label: 'Progress', note: 'Which of the five states the module opens on (`not-started`, `on-track`, `milestone`, `completed`, `expired`). Readiness and the Study Journey’s current stop follow the same pick.' },
      { id: 'atlas-pace-card', label: 'Study pace card', note: '⚠ LEAVE IT ON `ring` — that is the committed default and the only arm this handoff describes. The flag still has a `states` variant that renders the tan five-state card, but the concept is retired and is no longer documented anywhere; see `atlas-home-progress-states-handoff` in the Archive. Setting it to `states` shows a card nothing here describes.' },
      { id: 'atlas-readiness-section', label: 'Readiness section', note: '⚠ THE GATE ON THIS WHOLE PANEL, and it is OFF on main (`defaultEnabled: false`). `src/components/compass/AtlasHomeEricE2E.tsx` renders the card under `{!showReadiness ? null : …}`. A design-bar control, but the default is what ships.' },
    ],
    devHandoff: {
      intro:
        'One card, five states, advanced by clicking anywhere on it (or Enter/Space) — a review device standing in for whatever will eventually read the learner’s real progress record.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-progress-panel',
          name: 'Atlas Home — The Panel',
          tabLabel: 'The Panel',
          location: 'The panel itself is the Home\'s, not a component: `WHITE_PROGRESS_PANEL` in src/components/compass/AtlasHomeJillMain.tsx. The parts inside it are the two components below.',
          summary:
            'ONE outlined panel in the Home\'s left column, holding four parts in order: Course progress, Study pace, Estimated completion and Exam readiness. The parts below are two components — the ring card draws the first three, the readiness card the fourth — but a learner sees one object, which is why they are one feature.',
          variants: [
            { name: 'Progress and pace', when: 'The default — what a bare `?demo=1` draws.', detail: 'Course progress, Study pace and Estimated completion. Exam readiness is NOT here, because its flag is off.', why: 'It is the composition every reviewer sees unless they change something, so it is the one a build has to get right first.', action: 'None — the panel is a container; its parts carry their own controls.', howToSee: 'A bare ?demo=1.' },
            { name: 'With Exam readiness', when: '`atlas-readiness-section` is switched on.', detail: 'The readiness half-dial joins as a fourth part, sharing the panel and the column\'s eyebrow rather than bringing a card of its own. The pace card drops its bottom padding to 0 so the two sit flush.', why: 'Progress and readiness are two different axes — how much is done, and how ready that makes you — and the panel is where a learner reads them against each other.', action: 'None at the panel level.', howToSee: 'Demo bar → Readiness section → On, or `?ff=atlas-readiness-section`.' },
            { name: 'Expired', when: 'Access ended before the learner finished.', detail: 'The panel keeps the dial and loses everything that describes a PLAN. Readiness is hidden too, even when its flag is on.', why: 'A plan is advice about a future the learner no longer has, and a readiness score for an exam they cannot currently study for is a number with nothing behind it. What stays is how far they got, which is the argument for buying more time.', action: 'The purchase offer lives on the course head above, not here.', howToSee: 'Demo bar → Expires → Expired.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Panel fill', token: '--color-atlas-tan-100' },
              { role: 'Rules between the parts', token: '--color-atlas-nav-rule' },
              { role: 'Section eyebrows', token: '--color-neutral-800' },
            ],
            responsive: [
              '⚠ NOT RESPONSIVE, AND THAT IS THE SPEC. The column is a FIXED 296px (`flex: 0 0 auto`) — it does not reflow, there is no narrow arm, and nothing in the product renders it at another width. Build to the column, not to a range.',
              'Padding and margins, measured off the Final Prototype — the panel carries 8px top and bottom, 24px each side, 20px corners, and 16px between the cards stacked inside it. That leaves a 248px content column; each card adds 24px above its own first section.',
            ],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. ⚠ Append `?ff=atlas-readiness-section` to see the fourth part; the default page is the three-part composition.',
              'The panel is `WHITE_PROGRESS_PANEL` in src/components/compass/AtlasHomeJillMain.tsx; the parts are src/components/compass/AtlasPaceRingCard.tsx and src/components/compass/AtlasReadinessCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What are ALL the Progress possibilities?', answer: 'TEN rungs, not five — `ATLAS_PROGRESS_LADDER` is the list, and the Progress control draws straight from it: Not Started 0% · Beginner 14% · Developing 36% · Proficient 75% · Education Completed 80% · Certification Exam Passed 86% · Prep Review Completed 92% · Exam Simulators Completed 95% · Affidavit Signed 98% · Ready 100%. The default is Not Started. ⚠ EVERY RUNG CARRIES ITS OWN PERCENT AND ITS OWN READINESS BAND, so the dial and the half-dial can never be stepped out of sync — the mapping is the `readiness` field on the rung, not a second table. ⚠ AND 80 IS A FINISH LINE, not just a number: `lessonsDoneFor` reads it off that rung, so it is where "36 of 36" is reached.' },
            { question: 'What are ALL the pacing possibilities?', answer: 'THREE AXES, and they compose. (1) INTENSITY — `dashboard-pace-style`, a multiplier on the hours the course claims: Crammer ×0.75, Average ×1 (default), Thorough ×1.3. It moves the week goal, the hours a week, the completion date, the pace name and the pace icon together. (2) STANDING — `atlas-pace-standing`, the sentence under the goal: On track (default) · Ahead of goal · Behind — recoverable · Off track — adjust the goal · No data yet. (3) WHETHER A PLAN FITS AT ALL — fits, or does not, and when it does not the card names which deadline bound it: access-bound ("Not enough access left", offers an extension) or exam-bound ("Not enough time before your exam", offers nothing, because a booked exam cannot be extended). ⚠ THE EXAM IS CHECKED FIRST. ⚠ Intensity is on the DESIGN bar and standing is on the DEMO bar, so the two are reached from different places.' },
            { question: 'What changes when an exam date IS entered, versus not?', answer: 'NOT ENTERED (and this is the default): Estimated completion is the only figure row, and the plan is bound by the access window alone. ENTERED: the state exam becomes a SECOND figure row beneath it, with its own days count, and the pace model starts planning against it — coursework has to finish seven days before the exam (`EXAM_BUFFER_DAYS`), which can make a plan stop fitting that fitted a moment earlier. ⚠ NEITHER ARM IS REACHABLE FROM THIS PAGE. The Home passes NO exam date to `studyPace` and both of its exam prompts are decoration; `cgp.examDate` is per-browser and authored by the Compass surfaces. So a reviewer here only ever sees the not-entered column. Wiring Add Date is what opens the other one.' },
            { question: 'What changes when Readiness IS shown, versus not?', answer: 'NOT SHOWN, and that is the default (`atlas-readiness-section` is `defaultEnabled: false`): the panel is three parts and NOTHING marks the absence — no placeholder, no gap. SHOWN: the half-dial joins as a fourth part, sharing the panel and the column\'s eyebrow rather than bringing a card of its own, and the pace card drops its bottom padding to 0 so the two sit flush. Its own five states are Not Started (track drawn, no arc — an absence of measurement, not a band) and then Beginner · Developing · Proficient · Ready. It OPENS on the band the Progress rung names and can then be clicked forward independently.' },
            { question: 'What does the whole panel do once access has ended?', answer: 'It keeps the dial and drops everything that describes a plan — the pace name, the goal, the standing sentence, Estimated completion and the exam row all go, and so does the hairline under Course progress. Readiness is hidden too, even with its flag on. The eyebrow reads "Progress paused", the arc steps to neutral, and one sentence names the percent reached. ⚠ This outranks every axis above it: no intensity, standing or exam date changes it.' },
          ],
          edgeCases: [
            '⚠ THE PANEL IS THE HOME\'S, NOT A COMPONENT. There is no `<ProgressPanel>` to build against — `WHITE_PROGRESS_PANEL` is a style object in the Home, and each card renders `bare` inside it. A developer wiring these into a different page has to bring the panel with them, or both cards will draw without a surface.',
          ],
          ctas: [
            { name: 'None of its own', does: 'The panel is a container. Every control on it belongs to one of the parts below — "Customize Your Pace" and "Extend your access" to the ring, "Help me get ready" and the click-to-step to readiness.' },
          ],
        },
        {
          id: 'atlas-home-pace-ring',
          name: 'Atlas Home — Course Progress + Study Pace (ring)',
          tabLabel: 'Pace Ring',
          location: 'src/components/compass/AtlasPaceRingCard.tsx',
          summary:
            '⚠ THE DEFAULT ARM — what a bare `?demo=1` renders, and therefore what every reviewer sees unless they change it. One panel holding two labelled sections: Course progress (an eyebrow over a `ProgressDial`) and, under a hairline, Study pace (the pace’s name read off Compass’s planner, the weekly goal, and an Estimated completion date). Readiness, when its flag is on, renders beneath as a third section sharing the same eyebrow.',
          variants: [
            { name: 'Default', when: 'A plan fits, and the learner is ON TRACK — the default standing.', detail: 'The standing sentence reads "You’re averaging N a week. Based on your study goal, you are right on track." Everything else is the plan arm: the pace name, the week goal, the hours a week, and Estimated completion beneath.', why: 'It is the composition every reviewer meets first, so it is the one a build has to get right before any of the others.', action: '"Customize Your Pace" opens Compass\'s study planner.', howToSee: 'A bare ?demo=1 (Pacing → Average, Standing → On track).' },
            { name: 'Plan fits — ahead of goal', when: 'The learner is averaging MORE than the goal asks.', detail: 'Only the sentence changes: "…That is ahead of your 3-week goal — keep this up and you will finish early." The dial, the goal row and the figure row are untouched.', why: 'The standing is the one line on the card that is about the learner rather than the plan, so it is the only thing that moves.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → Ahead of goal.' },
            { name: 'Plan fits — behind, recoverable', when: 'The learner is a little under the goal, with time to recover.', detail: '"…That is a little under your 3-week goal. One extra session this week puts you back on it." ⚠ RECOVERABLE IS THE WHOLE POINT — it names the fix rather than the failure, which is what separates it from Off track.', why: 'Being slightly behind is the most common state and the most actionable; a warning there would spend urgency the card needs later.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → Behind — recoverable.' },
            { name: 'Plan fits — off track', when: 'At the current rate the learner will NOT finish by the estimated date.', detail: '"…At this rate you will not finish by <date>. Open your Study Plan to adjust your goal." ⚠ It names the DATE it is measured against, and sends the learner to the goal rather than telling them to work harder — the plan is the thing that is wrong.', why: 'This is the only standing where the plan itself has stopped being true, so it is the only one that asks for the plan to change.', action: 'Unchanged — the Study Plan link is the pace CTA already on the card.', howToSee: 'Demo bar → Pacing standing → Off track — adjust the goal.' },
            { name: 'Plan fits — no data yet', when: 'Nothing has been logged this week.', detail: '"No study time logged yet this week. Your 3-week goal asks for about N a week." ⚠ NO "averaging" CLAUSE — it is the one standing that cannot open with a figure, because there is nothing to average.', why: 'Zero is not a standing. Reporting "averaging 0 hours" against a goal reads as failure on a week that may be one day old.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → No data yet.' },
            { name: 'Exam booked', when: 'The learner has booked a state exam date.', detail: 'The exam gets its own figure row beneath Estimated completion, with its own days count. ⚠ Nothing on this screen can set that date today — the two exam prompts here are decoration, and the date is owned by another surface. Wiring "Add date" is what brings this state back.', why: 'Once a date is booked it outranks the estimate: the plan has to be read against the deadline, not the pace.', action: 'None — the row is a figure, not a control.', howToSee: '⚠ NOT REACHABLE ON THIS HOME. It passes no exam date to `studyPace` and both of its exam prompts are decoration, so the row cannot be produced from either bar — the arm is live wherever a surface owns the date. Wiring Add Date is what brings it back.' },
            { name: 'No plan fits', when: 'There is not enough time left for any honest study plan. ⚠ THE EXAM IS CHECKED FIRST: if coursework cannot finish seven days before a booked exam it is exam-bound, and only if that passes is the access window tested. The two produce different copy, so the order decides which the learner reads.', detail: 'The card names which deadline bound it. Access-bound: "Not enough access left" / "No study pace fits in the time remaining." / "Extend your access to get a plan." Exam-bound: "Not enough time before your exam" / "No study pace fits: coursework has to finish by <date>, 7 days before your exam, to leave time to review." — and no advice line, because a booked exam is not something the learner can extend. ⚠ The goal row, the hours line and the completion date all fall silent together; never one figure left standing alone.', why: 'Printing a plan the learner cannot keep is worse than saying there isn’t one.', action: 'Access-bound only: extend access. Exam-bound offers nothing, deliberately.', howToSee: 'Demo bar → Expires → a short window' },
            { name: 'Expired', when: 'The learner’s access ended before they finished.', detail: 'The card stops at the dial. Everything under the ring describes a PLAN and there is none once access has ended — the pace name, the weekly goal, the standing sentence, Estimated completion and the booked exam all go, and so does the hairline under Course progress, because there is nothing left to divide. What stays is the dial, its eyebrow reading "Progress paused" and its arc in neutral rather than the brand blue, over one sentence: "You completed N% of this course before your access ended. Purchase an extension within the next 30 days to pick up where you left off." ⚠ N IS READ FROM THE PROGRESS FIGURE, not typed, so the sentence and the ring cannot disagree. ⚠ THE 30 IS A BUSINESS RULE (`EXTENSION_GRACE_DAYS`), not arithmetic — if it ever becomes a deadline measured from the access date it has to COUNT DOWN.', why: 'How far the learner got is the argument for buying more time, so the one thing worth keeping is the figure that makes it. A plan, by contrast, is advice about a future they no longer have.', action: 'Purchase an extension. The Readiness section is hidden alongside it — a readiness score for an exam the learner cannot currently study for is a number with nothing behind it.', howToSee: 'Demo bar → Expires → Expired.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Panel', token: 'transparent — the outlined panel comes from the Home (`WHITE_PROGRESS_PANEL`), not from this card' },
              { role: 'Eyebrow', token: '--color-neutral-800 (shared via `atlasSectionEyebrow`)' },
              { role: 'Divider under Course progress', token: '--color-atlas-nav-rule' },
              { role: 'Dial figure', token: '--font-heading-serif' },
              { role: 'Goal note', token: '--font-body' },
            ],
            responsive: [
              '⚠ NOT RESPONSIVE, AND THAT IS THE SPEC. It sits in the Home\'s left column, which is a FIXED 296px (`flex: 0 0 auto`) — it does not reflow, there is no narrow arm, and nothing in the product renders it at another width. Build it to the column, not to a range.',
              'Padding and margins, measured off the Final Prototype — the card brings no padding of its own; the Home\'s panel carries 8px top and bottom, 24px each side and 20px corners, so the content column is 248px. Inside it: 24px above the first section and 24px between Course progress and Study pace. The dial is 149px square.',
            ],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/compass/AtlasPaceRingCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What does a bare ?demo=1 actually open on?', answer: 'The PLAN arm. The committed default is 0% progress on the Automatic access window — thirty days — which still fits a study plan, so the section opens on "Average · 4 Week Goal" with an Estimated completion beneath it. A reviewer who changes nothing never sees the no-plan arm.' },
            { question: 'What if the learner has booked an exam AND access is running out?', answer: 'The EXAM is checked first. If the coursework cannot finish seven days before a booked exam the card is exam-bound, whatever the access window says — a date the learner has committed to outranks one they can still extend.' },
            { question: 'Is this card safe to restyle?', answer: 'The LAYOUT yes, the DATA no. Its panel markup was duplicated from the tan card rather than shared, so editing what it draws touches nothing else. The pace model underneath is shared — change `studyPace` and every surface that reads it moves with you.' },
          ],
          ctas: [
            { name: 'Customize Your Pace', does: 'Opens Compass\'s study planner, where the learner picks a pace. ⚠ Nothing persists the chosen pace back to this card yet.' },
            { name: 'Extend your access', does: 'Shown only in the access-bound no-plan arm. Drawn, not wired — it is the same offer the course head\'s Purchase Extension makes.' },
          ],
        },
        {
          id: 'atlas-home-readiness-panel',
          name: 'Atlas Home — Readiness Panel',
          tabLabel: 'Readiness',
          location: 'src/components/compass/AtlasReadinessCard.tsx',
          summary:
            'A card asking "How Ready are you for your State Exam?" over a half-dial (the top half of a ring) naming one of FOUR bands — Beginner, Developing, Proficient, Ready — instead of showing a percent, plus a fifth "Not Started" state that draws no arc at all. Its OPENING band follows the Course Progress card’s stage (a fixed lookup table), and from there a click or Enter/Space on the card steps it forward on its own — the same click-to-cycle review-device pattern Course Progress uses, built independently of it. ⚠ THE FOUR BANDS REPLACED FIVE LEVELS ON 2026-10-16 (Novice · Advanced Beginner · Competent · Proficient · Exam Ready), so the card, the demo bar and Jillienne’s bands image use one set of words. ⚠ IT HAS NO CARD OF ITS OWN HERE: it sits inside the progress panel with Course progress and Study pace, sharing their eyebrow and drawing no fill or border — the standalone treatment with its own tan card belongs to the other progress arm, not to this page.',
          variants: [
            { name: 'Not Started', when: 'Nothing has been scored yet, so there is no band to show.', detail: 'The empty dial — the track is drawn and no arc is. ⚠ It is NOT a sixth band: "nothing measured yet" is not a point on the scale, so it sits outside the band list. Pressing the card moves into the bands proper.', why: 'An earlier pass hid the whole card at 0%, which removed the fact that readiness exists along with the number. Naming the empty state says both.', action: 'Press the card to show the first band.', howToSee: 'The default on a course with no readiness score.' },
            { name: 'Beginner', when: 'The learner is early in the course — or their access ended before they finished.', detail: 'Dial at 14%. Caption: "Early in development, with substantial knowledge gaps remaining."', howToSee: 'Demo bar → Progress → Not Started (or Expired)' },
            { name: 'Developing', when: 'The learner is on track.', detail: 'Dial at 36%. Caption: "Building competency, but still has meaningful gaps."', howToSee: 'Demo bar → Progress → On Track' },
            { name: 'Proficient', when: 'The learner has reached the milestone.', detail: 'Dial at 75%. Caption: "Strong understanding; has not yet reached the ready threshold."', howToSee: 'Demo bar → Progress → Milestone' },
            { name: 'Ready', when: 'The learner has completed the course.', detail: 'Dial at 100%. Caption: "Considered ready for the target outcome or exam." ⚠ Readiness is not completion — a learner can finish a course and not be ready. Showing Ready at 100% is a stand-in until real scoring lands.', howToSee: 'Demo bar → Progress → Completed' },
          ],
          designSpec: {
            tokens: [
              { role: 'Card surface', token: '--color-atlas-tan-200 — dropped entirely under the Combined panel option' },
              { role: 'Eyebrow + caption ("Overall readiness")', token: '--color-primary-500' },
              { role: 'Dial track', token: '--color-atlas-tan-500' },
              { role: 'Dial fill', token: '--color-atlas-dial-fill, falls back to --color-primary-500 — same fallback Course Progress’s dial uses' },
              { role: 'Level name', token: '--font-heading-serif, --color-primary-800' },
              { role: 'Rules above/below the question', token: '--color-atlas-tan-300' },
              { role: '"Help me get ready" link', token: '--color-compass-page-button' },
            ],
            states: ['No hover styling — `cursor: pointer` is the only affordance beyond the aria-label, same as Course Progress.'],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              '⚠ AND IT SETTLES THE BAND NAMES. Any Figma frame still drawn against the five levels (Novice · Advanced Beginner · Competent · Proficient · Exam Ready) predates the four bands that replaced them on 2026-10-16 — the prototype shows the four.',
              'Implemented in src/components/compass/AtlasReadinessCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What if a progress stage has no readiness band mapped to it?', answer: 'It falls back to Beginner, the first band.' },
            { question: 'What if the learner clicks past Ready somewhere other than Home?', answer: 'It wraps back to Beginner. The reset-the-whole-page behavior is Home\'s own wiring, not the card\'s.' },
          ],
          edgeCases: [
            '⚠ EVERY BAND IS NOW REACHABLE FROM THE PROGRESS CONTROL (2026-10-20). Under the retired five-level scale the sync map topped out at Proficient and Exam Ready could only be reached by clicking the card; with four bands, `completed` maps to Ready — the top — so nothing is undemoable through the Progress control any more. The empty Not Started state is the one thing the map does not produce: it needs the `notStarted` prop.',
          ],
          ctas: [
            { name: 'Help me get ready', does: '⚠ Drawn text, not a link — it fires nothing.' },
            { name: 'The card itself', does: 'A click, Enter or Space anywhere on it steps to the next band. Pressing past Ready resets the page\'s shared progress on Home, which is a reviewing convenience rather than a learner behavior.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'What should "Help me get ready" actually do?',
            decision: 'Not yet decided — it is drawn in the Course Progress "Edit My Study Pace" link style but has no destination today.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Is the Progress → Readiness opening-level map the real correlation, or a placeholder?',
            decision:
              'Placeholder. Per Eric’s own code comment, the two will be correlated "at some level" later — today’s fixed lookup (and the fact that the sync only sets the OPENING level, with no live link afterward) is a stand-in for that future rule.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Why does clicking past Ready reset the whole page to Not Started instead of wrapping to Beginner?',
            decision:
              'Deliberate on Home: `onPastLast` resets the shared Progress control, so reaching the top band is treated as "done with this cycle" and the whole page loops back to its start — a reviewing convenience, not a learner-facing behavior. A learner cannot predict it from anything on screen, which is why it is unclear whether it should survive into a real build.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
        ],
        openItems: [
          'What "Help me get ready" should link to.',
          'What the real Progress ↔ Readiness correlation rule will be, once it exists.',
          'Whether resetting the whole page from Readiness’s past-Exam-Ready click is intended end-user behavior or just a demo convenience.',
          'Whether the Readiness section ships ON — it is `defaultEnabled: false`, so the panel a reviewer sees by default is only half of what this handoff documents.',
        ],
      },
      flagsNote:
        '`atlas-v3-progress` picks the opening state; clicking the card (or Enter/Space) also advances it when the card is wired to the page via `onAdvance`, as it is on Home.',
    },
  },
  {
    /*
     * ATLAS HOME — EXAM DATE CARD. 2026-10-19. AtlasExamDateCard — the
     * four-stage "Set Exam Date" card.
     *
     * ⚠ IMPORTANT: this card is WIRED INTO the Home component but is
     * explicitly SUPPRESSED on White/End-to-End Demo chrome (`onWhite ? null
     * : <AtlasExamDateCard …>`, 2026-10-14, Eric: "remove") — meaning it does
     * NOT render on the committed baseline this handoff set otherwise covers.
     * It only shows on the separate WIP version, which is out of this
     * handoff's scope. Documented here anyway because it is part of the same
     * component family and is one click (a flag/version change) from coming
     * back — see the decisions log for the discrepancy this surfaced.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-exam-date-card',
    title: 'Atlas Home — Exam Date Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The four-stage "Set Exam Date" card that normally sits between Course Progress and Readiness on Eric/Atlas WIP — but is explicitly hidden on White and End-to-End Demo, so it does NOT appear on the committed Home baseline this handoff set otherwise documents.',
    tileBlurb:
      'Do you know your exam date? → a functional calendar → your date + days left. Wired into Home, but hidden on this baseline.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'This card will NOT appear here — it is explicitly suppressed on White/End-to-End Demo chrome. Shown for reference; see the decisions log for why it is still documented against this route.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [],
    devHandoff: {
      intro:
        'A functional four-stage exam-date picker, built and wired into the Home layout between Course Progress and Readiness — then explicitly turned off for White/End-to-End Demo the same day it moved there, leaving it live only on the separate, out-of-scope WIP version.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-exam-date-card',
          name: 'Atlas Home — Exam Date Card',
          tabLabel: 'Exam Date Card',
          location: 'src/components/compass/AtlasExamDateCard.tsx',
          summary:
            'A single card that collects and then shows the learner’s state exam date, in four stages: Default ("Do you know your state exam date?"), No date yet ("No state exam date yet? That’s okay."), Picking a date (a working month calendar), and Date set (the chosen date and days remaining, with Edit back to the calendar). ⚠ IT DOES NOT RENDER ON HOME TODAY. The slot it was designed for is between Course progress and Readiness; the card is built and complete, and nothing currently mounts it.',
          variants: [
            { name: 'Default', when: 'The learner has not told us anything about an exam date yet.', detail: '"Do you know your state exam date?" over Not Yet / Yes.', why: 'The card has to ask before it can help, and both answers lead somewhere useful.', action: '"Not Yet" → No date yet. "Yes" → Picking a date.' },
            { name: 'No date yet', when: 'The learner said they do not have a date.', detail: '"No state exam date yet? That’s okay." then a registration blurb, then "I have my exam date".', why: 'A learner without a date still needs a path forward — registering — rather than a dead end.', action: '"I have my exam date" → Picking a date. The way back in once the learner has registered.' },
            { name: 'Picking a date', when: 'The learner said they have a date, or is editing one they set.', detail: 'A real month calendar. "Set Exam Date" stays disabled until a day is picked.', why: 'Confirms the pick before committing it.', action: 'Pick a day, then "Set Exam Date" → Date set. The button stays disabled until a day is picked.' },
            { name: 'Date set', when: 'The learner has saved their exam date.', detail: 'The saved date and a days-remaining tile, with Edit.', why: 'The date is the thing the rest of the page reads against; it has to be visible and changeable.', action: '"Edit" → Picking a date, opened on the saved date. A date is not a one-time entry.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Card border', token: '--color-atlas-nav-rule' },
              { role: 'Title', token: '--font-heading-serif, --color-text-primary' },
              { role: 'Body copy', token: '--color-text-secondary' },
              { role: 'Calendar ink (days, weekday letters, step buttons)', token: '--color-atlas-cal-ink, falls back to --color-compass-page-button' },
              { role: 'Picked day', token: '--color-atlas-cal-ink background, white text' },
              { role: 'Today ring', token: 'inset box-shadow in --color-atlas-cal-ink' },
              { role: 'Date tile surface', token: '--color-atlas-outlined-card, falls back to --color-compass-page-card' },
              { role: 'Days-remaining tile surface', token: '--color-primary-100' },
              { role: 'Links + primary button', token: 'the BRAND’s own button colour (`--color-compass-page-button` / `COMPASS_BUTTON`) — the one exception to the Compass-palette rule above.' },
            ],
            states: ['Disabled "Set Exam Date" at 0.45 opacity + `cursor: not-allowed` until a day is picked.', 'Disabled "Previous month" step button when the calendar is already on today’s month.'],
            sources: [
              '⚠ THE ONE COMPONENT THE FINAL PROTOTYPE CANNOT SETTLE — the card does not render on Home today (see the devStatus note above), so there is nothing in the prototype to read. Everything below was read from the component instead, and the prototype becomes the source of truth the moment the card is wired back in.',
              'Implemented in src/components/compass/AtlasExamDateCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What does this look like on Home today?', answer: '⚠ Nothing — the card is not rendered at all. It is built and complete; nothing on the current Home mounts it. Everything else here describes what it does once it is placed.' },
            { question: 'Where is it meant to sit?', answer: 'Between Course progress and Readiness in the left column — the slot it was designed against.' },
          ],
          edgeCases: [
            'The card is wired into the Home layout at a fixed position (between Course Progress and Readiness) regardless of which stage it is in, so the column’s height changes as the card cycles through its four stages — nothing reserves a fixed height for it.',
            'The "here" registration link in the No stage reads as bold text rather than a real link, so a learner clicking it today gets nothing — it is drawn exactly as a link would be, which risks reading as a bug rather than an unfinished feature.',
          ],
          ctas: [
            { name: 'Not Yet', does: 'Moves the card to the No-date-yet state, which offers a registration route instead of a dead end.' },
            { name: 'Yes', does: 'Opens the month calendar so the learner can pick their exam date.' },
            { name: 'I have my exam date', does: 'The way back into the calendar from the No-date-yet state, once the learner has registered.' },
            { name: 'here', does: '⚠ Reads as a link in the registration blurb and is bold TEXT — clicking it does nothing today.' },
            { name: 'Set Exam Date', does: 'Saves the picked date and moves the card to its Date-set state. Disabled until a day is chosen.' },
            { name: 'Edit', does: 'Reopens the calendar on the saved date. A date is not a one-time entry.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Should the Exam Date card come back on White/End-to-End Demo, or stay WIP-only?',
            decision:
              'Currently hidden on both (2026-10-14, Eric: "remove") — but the End-to-End Demo dashboard version’s OWN description text still lists "the exam-date card" as part of what End-to-End Demo’s Home includes, which no longer matches what the code renders. One of the two needs to change: either restore the card to this baseline, or correct the version’s description so it stops claiming a component that isn’t there.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Should the collected exam date actually drive anything (pace model, Study Journey)?',
            decision: 'Not today — it is local-state-only. Undecided whether this is a future wiring step or whether the card is headed for removal before that matters.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Where does the No stage’s "here" registration link go?',
            decision: 'Undecided — no destination has been chosen yet.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
        ],
        openItems: [
          'Whether the card is restored to the committed baseline or the End-to-End Demo version’s description is corrected to drop the claim.',
          'Whether/how the collected exam date should wire into the pace model and Study Journey.',
          'The "here" registration link’s real destination.',
        ],
      },
      alsoConsider: [
        { name: 'Course Progress panel', location: 'See its own dev-handoff feature.', note: 'The Exam Date card sits directly below it on WIP chrome (out of scope here).' },
        { name: 'Readiness panel', location: 'See its own dev-handoff feature.', note: 'The Exam Date card sits directly above it on WIP chrome (out of scope here).' },
      ],
      flagsNote: 'No feature flag controls this card — its visibility is a hardcoded `onWhite` chrome check, not a flag.',
    },
  },
  {
    /*
     * ATLAS HOME — STUDY JOURNEY & GET LICENSED STEPS. 2026-10-19. The right
     * column's Step 1 (Study Journey list / Congratulations), Step 2 (Pass
     * State Exam) and Step 3 (Get Licensed in {state}), plus the
     * "{state} State Requirements" button.
     *
     * ⚠ IMPORTANT: on this baseline (White/End-to-End Demo), Step 1's list is
     * NOT the real computed journey (`journeyStopsFor`) — it is a hardcoded
     * 7-line array that never changes with the learner's actual progress.
     * See the decisions log.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-study-journey',
    title: 'Atlas Home — Study Journey & Get Licensed Steps',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The right column’s three steps — Study Journey (Step 1), Pass State Exam (Step 2), Get Licensed in {state} (Step 3) — where Step 1’s list is fixed 7-line copy rather than the real, per-learner computed journey.',
    tileBlurb:
      'Step 1 Study Journey (a fixed list on this baseline) → Step 2 Pass State Exam → Step 3 Get Licensed — plus a State Requirements button.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'The right column, below the course card. Step 1’s list does not change with the Progress control on this chrome — only the Completed stage visibly changes it (swaps to a Congratulations block).',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-v3-progress', label: 'Progress', note: 'At Completed, Step 1 swaps from the journey list to a Congratulations block. At every other value, Step 1’s list is unchanged on this chrome — see the decisions log.' },
    ],
    devHandoff: {
      intro:
        'Three steps naming the rest of the licensing path — study, sit the exam, apply — built on top of a shared, real journey-derivation utility that this particular chrome deliberately does not use for display.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-study-journey',
          name: 'Atlas Home — Study Journey & Get Licensed Steps',
          tabLabel: 'Study Journey',
          location: 'src/components/compass/AtlasHomeEricE2E.tsx (JourneyRow, Step) + src/components/learning/studyJourneyUtil.ts (journeyStopsFor) + src/data/nyProducerRequirements.ts (GET_LICENSED_STEPS, jurisdictionName)',
          summary:
            'Step 1 is headed "Complete Coursework" and lists the course sequence; Step 2 is "Pass State Exam" and Step 3 is "Get Licensed in {state}", retitled from the published licensing data with the learner’s own state. ⚠ ONLY ONE ROW IS LIVE — Pre-Licensing Education carries a real "N of 36 completed" count; every other row is fixed copy, and no row is ever marked done. The per-stop statuses are rebuilt as "not started" rather than read from the learner’s actual progress, which is the decision flagged in the log below.',
          variants: [
            { name: 'Default', when: 'The learner is working through the coursework.', detail: 'Step 1 is headed "Complete Coursework" and lists the course sequence: Pre-Licensing Education (N of 36 completed) · Certification Exam · Prep Review (23) · State Exam Simulators (3) · Affidavit · Survey & Certificate. ⚠ A "Pre-course Affidavit" row sits ABOVE those six and is dropped whenever the pre-course affidavit is off, which is the default — so six rows is what a reviewer normally sees, and seven is the affidavit arm. ⚠ ONLY THE EDUCATION ROW IS LIVE, and it is the most important thing on this page for a developer: it reads a real "N of 36 completed". Prep Review (23) and State Exam Simulators (3) are constants, and NO row is ever marked done — the ticks and the current-row highlight are rebuilt as "not started" whatever the learner has finished. Step 2 carries the exam-date prompt ("When is your exam?", with Add Date and Exam Information beneath) and Step 3 the learner’s own state over an "Applying for a License" line; neither ever changes.', why: 'The journey is three steps long and only the first one moves — showing all three keeps the state exam and the licence in view from day one.', action: 'The rows are a checklist. Nothing in Step 1 is clickable here.' },
            { name: 'All coursework done', when: 'The learner has finished every lesson.', detail: 'The SAME list, with the education row reading "36 of 36 completed". ⚠ STEP 1 DOES NOT BECOME A CONGRATULATIONS BLOCK. One exists in the component, but it is drawn only by the other progress-card arm — on this page the list stays and the congratulation appears in the COURSE HEAD instead, where the days-remaining line is replaced by "Congrats! You have completed this course."', why: 'The learner still has two steps to go; replacing the list with a celebration would hide the sequence at the moment they need to see what is next.', action: 'None.', howToSee: 'Demo bar → Progress → Ready 100%' },
          ],
          designSpec: {
            tokens: [
              { role: 'Step eyebrow ("Step 1" / "Step 2" / "Step 3")', token: 'bold weight, shares STEP_EYEBROW style' },
              { role: 'Step / stop title', token: '--font-heading-serif via STEP_TITLE for step titles; --font-body for journey row text' },
              { role: 'Current journey row', token: '--color-atlas-home-current-stop, falls back to --color-compass-page-button' },
              { role: 'Muted journey rows + step detail copy', token: '--color-text-secondary' },
              { role: 'Chevron (built, never shown — see UX Logic)', token: '--color-atlas-home-icon, falls back to --color-compass-page-button' },
            ],
            states: ['No hover styling on the journey rows — nothing in Step 1 is interactive here. The chevron and the step links are built but switched off.'],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.' + ' What it shows is the fixed 7-line list, not a computed journey.',
              'Implemented in src/components/compass/AtlasHomeEricE2E.tsx, src/components/learning/studyJourneyUtil.ts and src/data/nyProducerRequirements.ts.',
            ],
          },
          statesMatrix: [
            { question: 'What if the learner has finished the coursework?', answer: 'The education row reads 36 of 36. ⚠ Step 1 does NOT become a Congratulations block on this page — that panel belongs to the other progress arm.' },
            { question: 'What if the learner is part-way through?', answer: 'Step 1 looks the same at every stage except the count on the education row — no row is ever ticked, and none is current beyond the first.' },
          ],
          edgeCases: [
            '⚠ Dead code worth knowing about: a filter that drops the Attestation & Affidavit stop still runs inside this component, on the computed list Home never displays. It has no visible effect — but it will the moment anyone switches Step 1 over to the real sequence, which is the obvious next change here.',
            'The Completed-stage Congratulations copy ("passed your course exams") is stated unconditionally, with no dependency on whether the Step 1 list (fixed or real) actually shows every stop as complete.',
          ],
          ctas: [
            { name: 'State Requirements', does: 'Opens the state-requirements sheet over the page. ⚠ The only live control in this whole section.' },
            { name: 'Exam Information', does: 'Opens the exam-information sheet. Shown under Step 2.' },
            { name: 'Applying for a License', does: 'Opens the licence-application sheet. Shown under Step 3.' },
            { name: 'Add Date', does: 'Step 2\'s exam-date prompt. Drawn, not wired on this screen — the exam-date card is the surface that collects it.' },
            { name: 'The Step 1 rows', does: 'Not controls. The coursework list is a checklist here; no row navigates and none shows a chevron.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Should Step 1’s Study Journey list reflect the learner’s real progress on this baseline, the way it does on WIP?',
            decision:
              'Not today. The list is a fixed 7-line array sourced from a different Figma frame (265:8144, "text only, the rows keep their styling") and does not change as the Progress control is moved, except that Completed replaces it entirely with a Congratulations block. A stakeholder stepping Course Progress and Readiness through their visible states will notice the Study Journey does not follow.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Should Steps 2 and 3 get their links back on this chrome?',
            decision:
              '"What to expect" and "How to apply" are deliberately hidden here (2026-10-14, Eric’s request) — WIP keeps them. Whether the committed baseline should have them too is open.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Why does Home skip "Schedule State Exam," the published first step after coursework?',
            decision: 'Undetermined — it may be considered covered elsewhere (the Quick Links card’s Exam Information sheet) or simply not yet added to Home. Worth confirming before treating the omission as final.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
        ],
        openItems: [
          'Whether Step 1 should read the real computed journey instead of the fixed list.',
          'Whether Steps 2 and 3 should regain their links on this chrome.',
          'Whether "Schedule State Exam" belongs on Home at all, and if so where.',
        ],
      },
      alsoConsider: [
        { name: 'Course Progress panel', location: 'See its own dev-handoff feature.', note: 'Visibly advances with the Progress control; Step 1’s list on this baseline does not follow it the same way.' },
        { name: 'Quick Links card', location: 'See its own dev-handoff feature.', note: 'Carries the Exam Information / Applying for a License / State Requirements sheets that may cover ground this section’s missing links would otherwise.' },
      ],
      flagsNote: '`atlas-v3-progress` swaps Step 1 to the Congratulations block at Completed; no other value changes anything in this section on this chrome.',
    },
  },
  {
    /*
     * ATLAS HOME — QUICK LINKS CARD. 2026-10-19. AtlasJourneyLinksCard — the
     * "Quick Links" nav card in its own rail beside the course card.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-quick-links',
    title: 'Atlas Home — Quick Links Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The "Quick Links" nav card sitting in its own rail beside the course card — My Courses, My Certificates, and the Exam Information / Applying for a License / State Requirements sheets, several of which are the ONLY working route to functionality the Study Journey section’s own links drop on this chrome.',
    tileBlurb:
      'My Courses, My Certificates, Exam Information, Applying for a License, State Requirements — in a 234px rail, left of the course card by default.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: 'Sits in its own 234px-wide rail beside the course card, left by default. Its side is controlled by a flag with no control surface on this version’s own Design bar — see the Overview handoff’s logged decision on `atlas-wip-quick-links-side`.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-wip-quick-links-side', label: 'Quick Links side', note: 'Left (default) or Right — already logged as an open decision on the Overview handoff: this version reads the flag but cannot set it from its own bar.' },
    ],
    devHandoff: {
      intro:
        'A compact nav card of section links and sheet links sitting beside the course card — on Home, several of its sheet links are the only way to reach destinations the Study Journey section’s own inline links drop for this chrome.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-quick-links',
          name: 'Atlas Home — Quick Links Card',
          tabLabel: 'Quick Links',
          location: 'src/components/compass/AtlasJourneyLinksCard.tsx',
          summary:
            'A bordered 234px-wide card titled "Quick Links" listing section links (My Courses, My Certificates) that switch the shell’s section in place, and SHEET links (Exam Information, Applying for a License, State Requirements) that open in-place sheets when the host supplies handlers — which Home does. On Home, two course-page links (Flashcards, Exam Simulator) are hidden via `withoutCoursePages`, and a built but currently-off "Home" row sits above all of them behind a hardcoded constant.',
          variants: [
            { name: 'Default', when: 'The learner arrives on Home.', detail: 'A bordered 234px card titled "Quick Links": My Courses · My Certificates · Exam Information · Applying for a License · State Requirements. ⚠ TWO THINGS ARE TRUE OF THIS RAIL ON HOME AND BOTH ARE EASY TO MISS. Flashcards and Exam Simulator are not in the list — the rail is a navigation card here, not a course-tools card, and the remaining icons step up a size to fill the room. And the navigating rows are INERT: a click changes nothing and the address bar never moves. The three information rows still open their sheet, because a sheet is an overlay rather than navigation — so the card is not uniformly dead, and neither behavior can be inferred from the other.', why: 'One compact place to reach the things that are not on the Home screen itself.', action: 'The three information rows open their sheet — that always works. The two navigating rows short-circuit before changing the section, so a click does nothing at all. The split is by ROW TYPE, not by state.' },
            { name: 'Active row', when: 'The learner is on the section a row points to.', detail: 'A full-width white rounded capsule behind the row, and the label steps to SemiBold. ⚠ It never fires on Home — Home’s own row is built but switched off, and the navigating rows cannot change the section from here anyway. It is live on the surfaces where this rail does navigate.', why: 'The rail doubles as a position indicator, so the learner can see where they are without reading the page behind it.', action: 'None — it marks, it does not act.' },
            { name: 'Hover / focus', when: 'The pointer is over a row, or the row has keyboard focus.', detail: 'A trailing chevron fades in and the label steps to Medium. ⚠ Both reserve their space, so the row never shifts as it changes — the chevron’s width and the heavier label are held by a hidden duplicate. This still happens on the inert rows.', why: 'A row has to read as clickable before it is clicked, without the list jumping as the pointer crosses it.', action: 'Activates the row, where the row does anything.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Card border', token: '--color-atlas-nav-rule default, overridden on Home to a 95%-darkened --color-atlas-slate-100' },
              { role: 'Title', token: '--font-heading-serif, --color-text-primary' },
              { role: 'Row icon + hover chevron', token: '--color-atlas-home-icon, falls back to --color-compass-page-button' },
              { role: 'Active row capsule', token: '--color-surface-card background, SemiBold text' },
              { role: 'Title rule (optional)', token: '--color-atlas-tan-300' },
            ],
            states: ['Active: white capsule + SemiBold.', 'Hover/focus: chevron fades in, label steps to Medium (space reserved so nothing shifts).', 'No handler supplied: row renders `disabled`.'],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/compass/AtlasJourneyLinksCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What if the host supplies no handler for the sheets?', answer: 'They still work — the links fall back to setting `?open=` on the current URL instead of calling the host.' },
            { question: 'What if the rail is shown without the course pages?', answer: 'Flashcards and Exam Simulator are omitted entirely, and the remaining icons step up a size to fill the room.' },
          ],
          edgeCases: [
            'The "Home" row is fully built (icon, active-state logic, everything) and simply switched off by one `const SHOW_HOME_LINK = false` — turning it on costs nothing but might read oddly on Home itself, where it would always show as the active row (since Home never sets a `section`).',
            'All three sheet links share the same fallback shape (`handler ?? homeAndOpen(...)`), so a host supplying neither `onOpenStep` nor `onOpenRequirements` still gets working rows — they just navigate to Home with an `?open=` param instead of calling a handler directly.',
          ],
          ctas: [
            { name: 'My Courses', does: 'Switches the shell to the courses section in place. ⚠ Inert on Home — see Links off.' },
            { name: 'My Certificates', does: 'Switches the shell to the certificates section in place. Inert on Home for the same reason.' },
            { name: 'Exam Information', does: 'Opens the exam-information sheet over the page. Works everywhere, including on Home.' },
            { name: 'Applying for a License', does: 'Opens the licence-application sheet. Works everywhere.' },
            { name: 'State Requirements', does: 'Opens the state-requirements sheet. Works everywhere.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Should the "Home" row come back?',
            decision: 'Off since 2026-10-07 ("for now") — the component is otherwise unchanged and ready to show it; nobody has revisited the decision since.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Why do Quick Links’ sheet links work on Home while the Study Journey section’s own equivalent links do not?',
            decision:
              'Home passes real `onOpenStep`/`onOpenRequirements` handlers to BOTH components, but only enables the Study Journey section’s inline links for non-White chrome (`!onWhite`) — Quick Links has no such gate, so its rows stay live everywhere Home supplies the handlers. Worth confirming this asymmetry is intended rather than an oversight in the Study Journey gate.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
        ],
        openItems: [
          'Whether the Home row returns.',
          'Whether the Study Journey section’s link suppression should match Quick Links’ (i.e., also stay live) rather than the reverse.',
        ],
      },
      alsoConsider: [
        { name: 'Atlas Home — Overview', location: 'See its own dev-handoff feature.', note: 'Already logs the `atlas-wip-quick-links-side` flag as an open decision — this card is what that flag positions.' },
        { name: 'Study Journey & Get Licensed Steps', location: 'See its own dev-handoff feature.', note: 'Shares the same `onOpenStep`/`onOpenRequirements` callbacks, but its own inline links to the same destinations are disabled on this chrome while this card’s are not.' },
      ],
      flagsNote: '`atlas-wip-quick-links-side` picks which side of the course card this rail sits on — see the Overview handoff for why End-to-End Demo cannot change it from its own bar.',
    },
  },
  {
    /* ⚠ NOT BUILT (2026-10-21, Jillienne: "we need to add a Purchase Extension
       Feature Card on the Development Page — To Do status"). The Expired course
       head now draws a "Purchase Extension" button and that button goes
       nowhere; this row is where the flow behind it gets specified.

       `not-ready` is the status that keeps a row ON the Development board while
       saying do not start it — see `isDevelopmentStatus`. There is no `to-do`
       status; this is the nearest, and it is the one that means what "To Do"
       means here. It renders as "Not Ready". */
    id: 'xcel-purchase-extension',
    title: 'Purchase Extension',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'What happens after the Expired course head’s "Purchase Extension" button — buying more time on a course whose access has run out. Nothing behind the button is designed or built yet; the button is drawn so the expired state has an honest call to action.',
    tileBlurb:
      'The flow behind the Expired course head’s "Purchase Extension" button. Not designed yet — the button is drawn, nothing is behind it.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'not-ready',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home, expired',
        note: 'Demo bar → Progress → Expired. The course head is the only place the button appears today.',
        to: '/dashboard-rebrand?demo=1&section=dashboard&ff=atlas-v3-progress:expired',
      },
    ],
    featureFlags: [],
    devHandoff: {
      intro:
        'A placeholder handoff for work that has not started. The Expired course head needs somewhere for its one remaining action to go, and this is the row that will carry it once the flow is designed.',
      components: [],
      uiComponents: [
        {
          id: 'purchase-extension-cta',
          name: 'Purchase Extension — the button, and nothing behind it',
          tabLabel: 'Purchase Extension',
          location: 'src/components/compass/AtlasHomeEricE2E.tsx — the Expired arm of `AtlasCourseHeadRow` (`beginLabel`)',
          summary:
            'The call to action on an expired course head. It is drawn, sized and placed; pressing it does nothing, because what it should open has not been decided.',
          variants: [
            { name: 'Drawn, not wired', when: 'The learner’s access has ended.', detail: 'A single primary button where Course Overview and Begin/Resume normally sit. Pressing it does nothing at all — no navigation, no sheet, no toast.', why: 'An expired course with no action reads as a fault. One honest button is better than two that cannot help.', action: 'None yet — that is what this row is for.', howToSee: 'Demo bar → Progress → Expired' },
          ],
          edgeCases: [
            'A learner who never started the course and one who nearly finished it see the identical expired head today. Whether the offer should differ by how much work is left is one of the open questions below.',
          ],
        },
      ],
      decisions: {
        intro:
          'Nothing here is decided. The row exists so the questions are written down somewhere a developer will find them, rather than living in the gap behind a drawn button.',
        items: [
          {
            question: 'What is actually being sold — more days, a new access window, or the course again?',
            decision: 'Undecided.',
            status: 'Needs weigh-in',
            owner: 'Business',
          },
          {
            question: 'Where does the button go — a checkout, a sheet over Home, or the existing purchase flow?',
            decision: 'Undecided. Invite & Purchase already has a checkout that could take it.',
            status: 'Needs weigh-in',
            owner: 'Jillienne',
          },
          {
            question: 'Does the offer change with how much of the course was completed?',
            decision: 'Undecided — see the edge case on the component.',
            status: 'Needs weigh-in',
            owner: 'Business',
          },
        ],
        openItems: [
          'Every question above. This row is a placeholder for work that has not started.',
          '⚠ HOW A REVIEWER REACHES THE EXPIRED STATE AT ALL. Nothing on either bar produces an expired course: the Progress ladder has no Expired rung, the Expires dropdown stops at "1 day", and the day count is clamped at zero. The course head’s Expired arm is built and correct but cannot be selected — an "Expired" option on the Expires control is the obvious fix, and it is Jillienne’s to make because the demo bar is hers.',
        ],
      },
    },
  },
  {
    /*
     * ATLAS HOME — AFFIDAVIT MODAL. 2026-10-19. AffidavitModal
     * (src/components/e2e/AffidavitModal.tsx) — a one-time arrival overlay,
     * shared infrastructure with the Invite & Purchase flow (out of this
     * handoff set's scope) that triggers it via a URL param.
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-affidavit-modal',
    title: 'Atlas Home — Affidavit Modal',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'A one-time affidavit overlay that opens over Home when the learner arrives via `?affidavit=1` from the Invite flow’s Confirmation & Password page — its Cancel and Continue buttons currently do the exact same thing.',
    tileBlurb:
      'An arrival overlay over Home — tick the checkbox, Continue to course. Cancel does the identical thing Continue does.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo), via the Affidavit URL param',
        note: 'Append `&affidavit=1` to the Home URL to open it directly, or walk the Invite flow’s Confirmation & Password page, which navigates here with the param already set.',
        to: '/dashboard-rebrand?demo=1&affidavit=1&section=dashboard',
      },
    ],
    featureFlags: [],
    devHandoff: {
      intro:
        'A small, portalled confirmation dialog that gates nothing today — ticking its one checkbox and pressing either of its two buttons produces the identical outcome.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-affidavit-modal',
          name: 'Atlas Home — Affidavit Modal',
          tabLabel: 'Affidavit Modal',
          location: 'src/components/e2e/AffidavitModal.tsx',
          summary:
            'A centered dialog, portalled to `<body>` over a darkened page, titled by its `kind` — "Pre-course Affidavit" or "Study-manual Notice Affidavit", the journey rows’ own wording, so the modal and the row that opens it cannot say different things — with a hardcoded course line ("Florida Life & Health Pre-licensing") and a placeholder grey panel standing in for the real affidavit text. A single checkbox ("I have read and understand this Affidavit") must be ticked before "Continue to course" is enabled — but Continue and Cancel both call the SAME close handler, so there is no behavioral difference between agreeing and cancelling today.',
          variants: [
            { name: 'Pre-course Affidavit', when: 'The learner arrives, before any coursework.', detail: 'Heading "Pre-course Affidavit", sub-line "Before you begin the coursework", the course name, and a placeholder panel standing in for the real affidavit text.', why: 'The learner has to attest before any coursework counts, and arrival is the only point where that is still true.', action: 'Tick the checkbox, then "Continue to course".' },
            { name: 'Study-manual Notice Affidavit', when: 'The learner has finished the coursework and is about to take the final exam.', detail: 'Heading "Study-manual Notice Affidavit", sub-line "After the coursework, before your final exam". Identical chrome and controls to the pre-course one — only the two strings differ.', why: 'A separate attestation the state requires at a different point. Collapsing the two into one modal would make the record ambiguous about which was signed.', action: 'Tick the checkbox, then "Continue to course".' },
            { name: 'Not yet agreed', when: 'Either affidavit has just opened.', detail: '"Continue to course" is disabled and greyed, with a not-allowed cursor. Cancel, the ✕ and Escape all close.', why: 'The button has to be visibly unavailable, not merely inert — an enabled-looking button that does nothing reads as broken.', action: 'Tick "I have read and understand this Affidavit" → Agreed. Cancel, the ✕ and Escape all close instead, identically.' },
            { name: 'Agreed', when: 'The learner has ticked the checkbox.', detail: '"Continue to course" turns on in the brand fill. ⚠ It then closes the modal through the same handler Cancel uses — agreeing and cancelling currently do exactly the same thing.', why: 'The attestation is the gate; the button is what passes it.', action: '"Continue to course" closes the modal. ⚠ So do Cancel, the ✕ and Escape — all four routes out are the same handler, and none records that the learner agreed.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Scrim', token: '--color-e2e-scrim' },
              { role: 'Modal surface + border', token: '--color-fixed-light, --color-e2e-form-outline' },
              { role: 'Title', token: '--font-heading-serif (Playfair on this page), --color-text-primary' },
              { role: 'Body + course line', token: '--color-neutral-950' },
              { role: 'Checkbox glyph', token: '--color-e2e-return' },
              { role: 'Placeholder document panel', token: '--color-e2e-form-locked' },
              { role: 'Continue (off)', token: '--color-text-secondary fill, not-allowed cursor' },
              { role: 'Continue (on)', token: '--color-xcel-brick fill, matching the demo’s other primary buttons' },
              { role: 'Cancel', token: '--color-primary-500 text link' },
            ],
            states: ['Continue disabled until the checkbox is ticked.', 'Escape, the ✕, and the scrim’s own Cancel link all close the modal identically.'],
            sources: [
              'The FINAL PROTOTYPE is the source of truth — "Open live preview" at the top of this page, with `?affidavit=1` appended. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/e2e/AffidavitModal.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What if the learner has not ticked the checkbox?', answer: '"Continue to course" renders disabled and clicking it does nothing.' },
            { question: 'What if the learner closes the modal any other way?', answer: 'Every route out is identical — Cancel, the ✕, Escape and an agreed Continue all close it and remove the param. Nothing records that the learner agreed.' },
          ],
          edgeCases: [
            'Cancel and an agreed Continue are currently indistinguishable in effect — both simply close the modal and reveal Home. If "Cancel" is meant to send the learner somewhere else (back to Confirmation & Password, or block them from the course), that is unbuilt.',
            'The modal has no server-side or persisted record of the acknowledgment — closing it (by any route) and reopening via the same URL param resets the checkbox to unticked.',
          ],
          ctas: [
            { name: 'I have read and understand this Affidavit', does: 'The attestation checkbox. Ticking it enables Continue; nothing is recorded anywhere.' },
            { name: 'Continue to course', does: 'Closes the modal and reveals Home. ⚠ It calls the SAME handler as Cancel, so agreeing and cancelling are currently indistinguishable — that is the open decision on this component.' },
            { name: 'Cancel', does: 'Closes the modal and reveals Home.' },
            { name: '✕ and Escape', does: 'Both close the modal, identically to Cancel.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Should Cancel do something different from an agreed Continue?',
            decision: 'Not decided — both currently call the same close handler. Worth settling whether Cancel should route the learner elsewhere (back to Confirmation & Password, or block entry to the course) before this ships.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Does agreeing to the affidavit need to be recorded anywhere?',
            decision: 'Not today — nothing persists the acknowledgment. Reopening the modal always starts unticked.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
        ],
        openItems: [
          'A real difference between Cancel and Continue.',
          'Whether/how the acknowledgment should be recorded.',
          'Real affidavit text to replace the placeholder panel.',
          'Deriving the course name from the same source the rest of Home uses, rather than a hardcoded string.',
        ],
      },
      alsoConsider: [
        { name: 'Atlas Home — Overview', location: 'See its own dev-handoff feature.', note: 'The page this modal opens over; the Overview handoff notes the modal is out-of-scope-shared infrastructure with the Invite & Purchase flow.' },
      ],
      flagsNote: 'No feature flag controls this modal — it opens purely off the `?affidavit=1` URL param.',
    },
  },
]

export function prototypeFeatureById(id: string): PrototypeFeature | undefined {
  return PROTOTYPE_FEATURES.find((f) => f.id === id)
}

/**
 * The preview URL for one handoff component, by id.
 *
 * No XCEL feature authors `devHandoff` notes yet, so this returns null for
 * everything today — kept because `ComponentLivePreview` calls it, and because
 * the moment a row grows a component breakdown the preview should resolve with
 * no code change.
 *
 * Resolution order — the component's own `previewUrl`, else its parent
 * feature's canonical preview (first `pages` entry → `livePreviewUrl` → `to`).
 * Returns null when neither exists, and the caller renders a fallback naming
 * the field to author.
 */
export function componentPreviewUrl(componentId: string): string | null {
  for (const f of PROTOTYPE_FEATURES) {
    const found =
      f.devHandoff?.components.find((c) => c.id === componentId) ??
      f.devHandoff?.uiComponents?.find((c) => c.id === componentId)
    if (!found) continue
    return found.previewUrl ?? f.pages?.[0]?.to ?? f.livePreviewUrl ?? f.to ?? null
  }
  return null
}
