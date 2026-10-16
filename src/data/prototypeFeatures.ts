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

/** One enumerated state of a component. `when` is the condition that
 *  produces it; `detail` is an optional note on copy / behavior. */
export type DevHandoffVariant = {
  name: string
  when: string
  detail?: string
}

/** One user-facing action a feature exposes. */
export type DevHandoffAction = {
  /** Action / control label (e.g. "Start Task", "Edit Study Plan"). */
  name: string
  /** What it does + any condition on when it appears. */
  detail: string
}

/** One card variant in the UI/UX-logic write-up — a state of the card,
 *  WHY that variant needs to exist, and the action it exposes. Richer than
 *  DevHandoffVariant (which just enumerates states by `when` + `detail`):
 *  this leads with the rationale + CTA so the logic reads as "why each
 *  variant, and what the learner does in it". */
export type DevHandoffLogicVariant = {
  /** Variant / state name (e.g. "Self-marked PDF / reading up next"). */
  name: string
  /** When this variant renders (trigger / condition). Optional. */
  when?: string
  /** Why this variant needs to exist — the problem it solves for the learner. */
  why: string
  /** The action the card exposes in this variant (CTA + behavior). */
  action: string
}

/** The "UI/UX logic" write-up for a component — the reasoning and rules
 *  worked through while designing it, captured for the developer:
 *   1. why it exists, 2. every action, 3. edge cases,
 *   4. toaster messaging + additional logic. */
export type DevHandoffUiUxLogic = {
  /** 1. Why this feature exists (the problem it solves). */
  why: string
  /** 2a. Flat list of the available actions — for simple components.
   *  When `variants` is set it takes precedence and this can be omitted. */
  actions?: DevHandoffAction[]
  /** 2b. The component's card variants, each with WHY that variant needs
   *  to exist + the action it exposes. Preferred for multi-state cards;
   *  rendered instead of `actions` when present. */
  variants?: DevHandoffLogicVariant[]
  /** 3. Edge-case scenarios the design handles. */
  edgeCases: string[]
  /** 4. Toaster messaging + any additional logic worked through. */
  toasterLogic: string[]
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

/** The design spec for a component — token references + states + responsive
 *  / motion notes + pointers to the sources of truth. Deliberately holds NO
 *  raw hex/px/font values; those live in tokens.css and Figma. */
export type DevHandoffDesignSpec = {
  /** Named-token references (role → CSS variable). */
  tokens: DevHandoffTokenRef[]
  /** Interaction / render states to build. */
  states?: string[]
  /** Responsive, layout, and motion notes. */
  responsive?: string[]
  /** Sources of truth — file paths, tokens.css, Figma node ids. */
  sources?: string[]
}

/** One row of the states matrix — a state and the expected behavior for it,
 *  covering the non-happy paths (loading / empty / error / overflow / etc.). */
export type DevHandoffState = {
  /** The state, e.g. "Loading", "Save in flight / error", "Long title". */
  state: string
  /** What should happen in that state. */
  behavior: string
}

/**
 * The Product Owner's framing for a component — the WHY, in the form a PO
 * writes it, ahead of any design or build detail.
 *
 * Structured rather than freeform prose on purpose: "as a / I want / so that"
 * is the format precisely because it forces a role and a benefit to be named,
 * and a free text field quietly becomes another summary. `value` is the part a
 * summary can't carry — why it is worth building at all — and `notes` is where
 * scope, and especially OUT of scope, gets stated before a dev infers it.
 */
export type DevHandoffUserStory = {
  /** The role, as the PO would name them — "member holding several licences",
   *  not "user". */
  asA: string
  /** The capability, from the learner's side. Not a UI description. */
  iWant: string
  /** The benefit. If this reads as a restatement of `iWant`, the story hasn't
   *  found its reason yet. */
  soThat: string
  /** Why it earns a place on the roadmap — the business case in a sentence. */
  value?: string
  /** Scope, non-goals, and anything a dev would otherwise have to infer. */
  notes?: string[]
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
  /**
   * The DESIGNER's own plain words — what this feature is about, told to the
   * developer before any spec. Leads the handoff (2026-09-09, Jillienne).
   *
   * Deliberately unstructured, and deliberately not written by Claude: this is
   * the one field on the page that carries the designer's voice, so it is
   * ASKED FOR, never inferred from the code or paraphrased from `summary`.
   * Leave it unset rather than guessing — an un-authored Quick Summary renders
   * its own "add your notes here" box, which is honest, whereas an invented one
   * reads as the designer's intent and is not.
   *
   * Plain text. Blank lines split paragraphs; a block whose every line starts
   * `* ` or `- ` renders as a list. There is no other formatting, on purpose
   * (see `QuickSummaryBody` in PrototypeFeaturePage).
   */
  quickSummary?: string
  /** The PO's framing — who it's for, what they want, and why it matters.
   *  Renders SECOND in the handoff, directly after the Quick Summary: the
   *  designer's words, then the PO's, then the spec. */
  userStory?: DevHandoffUserStory
  /** Every variant/state the component can render. */
  variants: DevHandoffVariant[]
  /** The rules that decide which variant renders + key behaviors. */
  uxLogic: string[]
  /** The UI/UX logic write-up: why it exists, actions, edge cases,
   *  and toaster messaging / additional logic. Rendered as its own
   *  section on the detail screen. */
  uiUxLogic?: DevHandoffUiUxLogic
  /** Token-referencing design spec (font / color / radius via named tokens,
   *  states, responsive + motion, sources). Rendered as its own section. */
  designSpec?: DevHandoffDesignSpec
  /** Testable Definition-of-Done checklist — what "built correctly" means. */
  acceptanceCriteria?: string[]
  /** Non-happy-path states the build must handle (loading / empty / error / …). */
  statesMatrix?: DevHandoffState[]
  /** What real data / API replaces the fixtures, and the fields needed. */
  data: string[]
  /** Stubs / TODOs the developer still has to wire up. */
  stubs?: string[]
  /** Accessibility notes worth preserving. */
  a11y?: string[]
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
    /* HELD BACK — 2026-10-14, Jillienne on the preview: "change this whole
       option to Coming soon like the Admin tool, as I need to pick things
       from all the others — don't remove the work, just hide users from
       clicking on it for now." So `coming-soon` with the `to` KEPT: the row
       draws disabled with its tags and a Coming soon tag, nothing to click,
       and the generated mark in place of its live preview (her ask, the same
       minute: "a default icon image like the admin tool to show it's
       disabled"). Releasing it is `status: 'ready'`, one word. */
    status: 'coming-soon',
    category: 'prototype',
    // The middle door of the three — see `PROTOTYPE_SCOPES`. This row is the
    // whole product; the Compass row below is one surface INSIDE it, reached
    // from here by clicking into a course, and the two render the same build.
    prototypeScope: 'end-to-end',
    // All four opening rows re-stamped at the 2026-10-15 ship that retired the
    // demo site: the shared chrome every row renders — the demo bar, the
    // version picker, the prototype bar — changed under all of them.
    lastUpdated: '2026-10-16T00:13:44Z',
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
    to: '/dashboard-rebrand?demo=1',
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
    lastUpdated: '2026-10-16T02:16:00Z',
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
    lastUpdated: '2026-10-16T00:13:44Z',
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
    lastUpdated: '2026-10-15T23:39:36Z',
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
