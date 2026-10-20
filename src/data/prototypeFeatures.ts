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
    lastUpdated: '2026-10-20T18:17:05Z',
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
    lastUpdated: '2026-10-19T20:51:14Z',
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
    lastUpdated: '2026-10-20T18:17:05Z',
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
    lastUpdated: '2026-10-20T17:44:29Z',
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
      { id: 'atlas-pace-card', label: 'Study pace card', note: '⚠ DECIDES WHAT THE LEFT COLUMN IS. `ring` (the committed default) renders `AtlasPaceRingCard` — Course progress over Study pace in one panel. `states` renders the tan five-state `AtlasCourseProgressStates` instead. Design bar, but the DEFAULT ships to everyone.' },
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
          quickSummary:
            'This is the current Home for Atlas Learning. It’s meant to give dev a map of the whole page before they open the individual component handoffs, plus the open questions nobody’s decided yet (Quick Links side, link tiles, long title).',
          variants: [
            {
              name: 'WIP chrome',
              when: 'Dashboard version renders WIP-like (not White/E2E)',
              detail: 'Course card and Quick Links each keep their own shadowed, padded surface; the left column’s sections lose the shared outlined panel and stand as separate cards.',
            },
            {
              name: 'White / End-to-End Demo chrome',
              when: '`isEricAtlasWhiteLike(version)` is true — includes End-to-End Demo, the committed default',
              detail: 'The course card loses its shadow and goes full-width/flush (no card padding of its own); the Course progress ring and Study pace share one outlined panel with a hairline between them (Readiness joins the same panel when its flag is on); the course-head sits on its own Primary 100 panel; no course tabs.',
            },
            {
              name: 'Quick Links side',
              when: '`atlas-wip-quick-links-side` flag',
              detail: 'Left (default, `order: -1`) or right. Moves the whole rail without moving its markup.',
            },
          ],
          uxLogic: [
            'Page is a flex row: the course card (`flex: 0 1 830px`/800px on White) and the Quick Links rail (`width: 234`), 32px apart.',
            '`onWhite` is computed from the RESOLVED dashboard version (`resolveDashboardVersion`), not the raw `?version=` param — a bare `?demo=1` must resolve to its own default chrome, not fall through to WIP’s.',
            'Inside the course card: a course head (tabs + title + buttons), then a rule, then a row of [left column: the Course progress + Study pace panel, with Readiness under it when enabled] / [vertical divider] / [right column: Study Journey + Get Licensed steps].',
            'The Top Nav’s Home button fires `ATLAS_HOME_REFRESH`, a window event every demo card listens for: Progress resets to Not Started and every card remounts (fresh `key`), so a reviewer can restart the whole story from one button.',
            'Clicking the Course Progress card advances the Demo Controls’ Progress to the next of its five stages — the dropdown and the card are the same control, not two.',
          ],
          uiUxLogic: {
            why:
              'One page, one state model: Progress drives the course-progress card, the readiness level, the current journey stop and (via the resolved stage) whether the page shows the Completed view. A developer wiring this to real data needs one source of truth, not five.',
            edgeCases: [
              'Completed view (Progress = Completed, 100%): the Course Progress card is hidden entirely (the dropdown still reaches it) and the right column’s Step 1 swaps the journey list for a "Congratulations!" block.',
              'The vestigial `longTitle`/`V2_LONG_TITLE` path (copied in from the V2/V3 Home it was forked from) only ever reaches the hidden course-tabs array on this chrome — White/E2E never render tabs, so it has no visible effect here. The title actually shown comes from `useEndToEndCourseTitle()`, a separate mechanism. Don’t "fix" one assuming it drives the other.',
            ],
            toasterLogic: ['None at the page level — see each card’s own handoff.'],
          },
          designSpec: {
            tokens: [
              { role: 'Page gap (card ↔ Quick Links rail)', token: '32px, 40px on White' },
              { role: 'Card surface (WIP)', token: '--color-compass-course-card · --shadow-compass-md' },
              { role: 'Card surface (White/E2E)', token: '--color-fixed-light · no shadow' },
              { role: 'Column rule', token: '--color-primary-100' },
            ],
            sources: [
              'No tracked Figma frame for this exact composition — it was assembled through a sequence of live code requests on top of earlier forks (V2/V3/WIP/White). Reference the live prototype (the Live Preview tab on this gateway) as the source of truth, not a Figma node.',
              'src/components/compass/AtlasHomeEricE2E.tsx',
            ],
          },
          acceptanceCriteria: [
            'A bare `?demo=1` (no `?version=`) resolves to End-to-End Demo’s own chrome — never WIP’s toned layout with course tabs showing.',
            'Pressing the Top Nav Home button resets Progress to Not Started and every demo card (Progress, Readiness, Exam Date) remounts to its zero state.',
            'The Quick Links rail moves side without re-flowing its own contents, driven by one flag read in one place.',
          ],
          data: [
            'Dashboard version resolution (`resolveDashboardVersion`, `isEricAtlasWhiteLike`) — today URL/flag driven; a real build needs this to be an account-level "which experience" decision, not a query param.',
            'The learner’s active course(s) — today `WHITE_COURSES`, three invented demo courses plus the real one from `useEndToEndCourseTitle()`.',
          ],
          stubs: [
            'Every card on the page reads its figures from the Demo Controls’ Progress flag rather than a real learner progress record — see each card’s own handoff for what replaces it.',
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
            'Cover image, "Current course:" eyebrow, title, an Expires/Days-to-complete meta row, and two buttons (Course Overview, Begin/Resume Course). Renders in one of two layouts depending on chrome and a click-to-flip toggle.',
          quickSummary:
            'The course card at the top of Home — cover, title, expiry/days-to-complete, Begin/Resume.',
          variants: [
            {
              name: 'WIP layout (cover beside title)',
              when: 'Default header layout',
              detail: '260px cover beside the eyebrow/title/meta, both buttons in a row beneath. Clicking the cover swaps to the White-style layout.',
            },
            {
              name: 'White-style layout (stacked)',
              when: 'After clicking the cover once (`whiteHead` state), or always on Eric/Atlas White itself',
              detail: '130px cover beside a bottom-aligned eyebrow/title/meta row, then Course Overview (fixed 130px) and Begin/Resume on their own row beneath.',
            },
            {
              name: 'Not started',
              when: 'Progress = Not Started',
              detail: 'Button reads "Begin Course".',
            },
            {
              name: 'In progress / milestone',
              when: 'Progress past Not Started, short of Complete',
              detail: 'Button reads "Resume Course".',
            },
            {
              name: 'No exam date set',
              when: 'No access-expiry date resolves',
              detail: 'The Expires/Days-to-complete meta row is omitted entirely — never a blank or zeroed row.',
            },
            {
              name: 'Course tabs (multi-course)',
              when: '2+ courses AND chrome is NOT White/E2E',
              detail: 'A "Courses:" strip above the title. Hidden entirely on White/E2E chrome regardless of course count — see the Overview handoff’s note on the vestigial long-title path this strip is the only consumer of.',
            },
            {
              name: 'Long title',
              when: '`atlas-home-long-title` flag on',
              detail: 'The visible title (`useEndToEndCourseTitle()`) becomes "Florida Life and Health Pre-licensing with Comprehensive Exam Simulators" instead of the short form — the SAME flag read also changes the title on Invited Product Detail and Checkout, so all three agree.',
            },
          ],
          uxLogic: [
            'Title shown is `useEndToEndCourseTitle()` — short or long per the flag — NOT the vestigial `currentTitle`/`longTitle` local variables, which only feed the hidden tab strip on this chrome.',
            'Cover is whichever course’s tab is active via `?whiteCourse=`; absent → the first of `WHITE_COURSES`.',
            'Expires meta: "Expires:" (WIP) or "Course Access Ends:" (White/E2E) + the date, then either a divider + "Days to complete: N days" (WIP) or an inline ", N days to complete" with no divider (White/E2E).',
            'Course Overview button only renders when `onOverview` is supplied; Begin/Resume only when `onBegin` is — an action with no handler never renders as a live-looking disabled control on this component (unlike the sibling Home Course Card, which disables rather than omits).',
            'Clicking the cover is a pure local-state toggle (`whiteHead`) between the two layouts — see the Overview handoff’s decision: this is a design-review A/B, not a shipping interaction.',
          ],
          uiUxLogic: {
            why: 'One header has to answer three questions at a glance: which course, how far along, and what to do next — across two layouts the team is still comparing.',
            actions: [
              { name: 'Course Overview', detail: 'Opens the Compass Overview page for the active course (`coursePage=overview`). Omitted when no handler is given.' },
              { name: 'Begin Course / Resume Course', detail: 'Opens the Compass Course page (`coursePage=course`). Label follows the Progress stage.' },
              { name: 'Click cover', detail: 'Toggles the header between its two layouts. See decision in the Overview handoff — not meant to ship.' },
            ],
            edgeCases: [
              'Long course title: wraps within the title column; the cover keeps its fixed width/aspect regardless.',
              'No cover image: the button/image slot is simply omitted (`shownCover ? ... : null`), title and meta take the row alone.',
            ],
            toasterLogic: ['None — both real actions navigate; the layout toggle has no feedback beyond the visual swap.'],
          },
          designSpec: {
            tokens: [
              { role: 'Eyebrow ("Current course:")', token: '--color-compass-page-eyebrow' },
              { role: 'Title', token: '--color-compass-page-heading · --font-heading-serif · --type-atlas-h4-base-size/line' },
              { role: 'Meta label / value', token: '--color-neutral-700 (label) · --color-text-primary (value)' },
              { role: 'Meta row rules (WIP)', token: '--color-primary-100 top/bottom · --color-primary-200 divider' },
              { role: 'Buttons', token: '.cre-compass-primary / .cre-compass-secondary · --font-body' },
            ],
            responsive: [
              'WIP cover is 260px (matches the left column below it); White/E2E’s stacked cover is a fixed 130px × min 105px.',
              'On White, the course-head sits in its own Primary 100 panel, 40px inset, 20px corners, 16px margin below before the Progress row.',
            ],
            sources: [
              'No tracked Figma frame for E2E’s current header specifically — reference the live prototype (Live Preview tab) over any Figma node; the file’s own comments cite several node ids from earlier forks (V2/V3/WIP/White) that have since diverged.',
              'src/components/compass/AtlasHomeEricE2E.tsx',
            ],
          },
          acceptanceCriteria: [
            'The visible title reflects `atlas-home-long-title` and matches Invited Product Detail / Checkout when the flag is on.',
            'With no resolvable access-expiry date, the Expires row does not render at all (not blank, not zeroed).',
            'Course Overview and Begin/Resume each render only when given a handler; neither ships as a dead-looking enabled control.',
            'Course tabs never render on White/E2E chrome, regardless of how many courses are passed.',
          ],
          statesMatrix: [
            { state: 'No cover image', behavior: 'Image slot omitted; title/meta take the full row.' },
            { state: 'No handler for an action', behavior: 'Button/chip omitted, not disabled.' },
          ],
          data: [
            'Active course + cover — today `WHITE_COURSES` (three invented demo courses) plus `useEndToEndCourseTitle()` for the real one.',
            'Access-expiry date and days-to-complete — today the pace model (`studyPace`), fed by fixture hours/access-expiry.',
          ],
          a11y: [
            'Cover-as-toggle buttons carry an explicit `aria-label` stating which layout pressing them shows ("Course header — layout 1 of 2. Press to show the next layout."), since the image itself gives no visual affordance of being a button.',
            'Title is an <h2> inside the course card’s <section aria-label="Current course">.',
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Should the click-to-flip header layout toggle ship?',
            decision:
              'No — see the Overview handoff. It exists so the two layouts can be compared live during review; a real build should commit to one and remove `whiteHead`/the cover button entirely.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Why does the Begin/Resume button never read "Review Course" the way the sibling Home Course Card does once coursework is complete?',
            decision:
              'Not wired here — `progressPick === \'not-started\'` is the only branch; Milestone and Completed still read "Resume Course". Flagged for the designer: confirm whether Completed should relabel the button, matching the Home Course Card’s own rule.',
            status: 'Needs weigh-in',
            owner: 'Eric',
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
    title: 'Atlas Home — Course Progress Panel',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The left column of the Atlas Home, in its two arms. `ring` (the committed default) is `AtlasPaceRingCard` — a Course progress dial over a Study pace plan, in one panel. `states` is the tan five-state card it forked from: Study Pace at 0%, the real completion dial, a Milestone celebration, Complete, and Expired, stepped by clicking it.',
    tileBlurb:
      'The Course progress ring over Study pace (the default), and the tan five-state card behind the other arm of `atlas-pace-card`.',
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
      { id: 'atlas-pace-card', label: 'Study pace card', note: '⚠ WHICH OF THE TWO ARMS BELOW RENDERS. `ring` is the committed default (`defaultVariant: \'ring\'`); `states` is the tan card. Both read the same `studyPace` model, so they cannot disagree about the plan — only about how much of it to show.' },
    ],
    devHandoff: {
      intro:
        'One card, five states, advanced by clicking anywhere on it (or Enter/Space) — a review device standing in for whatever will eventually read the learner’s real progress record.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-pace-ring',
          name: 'Atlas Home — Course Progress + Study Pace (ring)',
          tabLabel: 'Pace Ring',
          location: 'src/components/compass/AtlasPaceRingCard.tsx',
          summary:
            '⚠ THE DEFAULT ARM — what a bare `?demo=1` renders, and therefore what every reviewer sees unless they change it. One panel holding two labelled sections: Course progress (an eyebrow over a `ProgressDial`) and, under a hairline, Study pace (the pace’s name read off Compass’s planner, the weekly goal, and an Estimated completion date). Readiness, when its flag is on, renders beneath as a third section sharing the same eyebrow.',
          quickSummary:
            'This is the left column of the Home as it stands. It replaced the tan five-state card as the default on 2026-10-16 — the tan one is still there behind the Design bar. Course progress sits on top because where the learner has got to is the first thing they want; the plan follows from it.',
          variants: [
            { name: 'Course progress', when: 'Always', detail: 'Eyebrow + `ProgressDial` at `percent`. ⚠ It survives 100% (2026-10-16) — completion and readiness are two axes, and a learner can be ready at less than 100%.' },
            { name: 'Study pace — a plan fits', when: '`weeks != null`', detail: 'The pace’s NAME (derived via `paceName` over `PLANNER_PLAN`, not typed — renaming a pace in Compass renames it here), the weekly goal row, and the Estimated completion date.' },
            { name: 'Study pace — no plan fits', when: '`weeks == null`', detail: 'TWO ARMS, and the card names whichever deadline actually bound (`noPaceMessage`, reading the pace model’s own `binding`). ACCESS-bound: "Not enough access left" / "No study pace fits in the time remaining." / "Extend your access to get a plan." EXAM-bound: "Not enough time before your exam" / "No study pace fits: coursework has to finish by <date>, 7 days before your exam, to leave time to review." — and NO advice line, because a booked exam is not something a learner can extend. ⚠ The wording is shared with `AtlasCourseProgressStates` rather than copied, so the two cards cannot disagree about whether the question is answerable OR about which deadline made it unanswerable. Reached ONE way on this Home: a short access window (the Demo Controls’ Expires setting). The default Automatic window leaves room, so the plan arm is what opens — always, on any browser. ⚠ A STORED EXAM DATE NO LONGER REACHES IT (2026-10-20). `cgp.examDate` is per-browser and authored by the COMPASS surfaces; this Home has no control over it — both of its exam prompts are decoration — so a date typed in Compass used to dead-end the card permanently on that machine with nothing on screen to explain it. The Home passes no exam date to `studyPace`; the EXAM arm is still live wherever a surface owns the date, and wiring Add Date is what brings it back here. `AtlasHomeExamDate.test.tsx` pins it.' },
            { name: 'Readiness below', when: '`readinessBelow` — i.e. `atlas-readiness-section` is on', detail: 'Bottom padding drops to 0 so the Readiness card can sit flush inside the same panel and take the same eyebrow (`matchPaceEyebrow`).' },
            { name: 'Left-aligned column', when: 'The column-alignment design control', detail: 'The eyebrows are left in BOTH arms; what moves is the goal row. The dials, the sentence and the completion date stay centred.' },
          ],
          uxLogic: [
            '⚠ Course progress LEADS the column (2026-10-16) — it sat under Study pace only because the dial used to live inside that card.',
            'A hairline under Course progress, not just a gap: the figure above it is a different KIND of thing from the plan below, and 24px of air reads as spacing rather than a boundary.',
            'The week goal is DERIVED from the same `paceFit` the Estimated-completion date reads — a hardcoded week count is how those two start describing different plans.',
            '⚠ NO WEEK-COUNT FALLBACK (2026-10-19). It was `: 3`, a figure nothing had computed, printed at the one moment the model has no plan to offer. `undefined` is what the card reads as "no pace fits", so the goal line, the hours line and the completion date all fall silent together.',
            'Unlike the tan arm, this card is NOT a click-to-advance review device — it has no `onAdvance`. The Demo Controls’ Progress dropdown is the only thing that moves its figures.',
          ],
          uiUxLogic: {
            why:
              'The tan card steps through five states of a journey; this one shows ONE number and a way to change the plan behind it. Both read the same `studyPace` model, so they answer the same question differently rather than disagreeing about it.',
            edgeCases: [
              'The committed default opens at 0% and the Automatic access window — thirty days — still fits a plan, so the section opens on the PLAN arm (“Average · 4 Week Goal”), with Estimated completion below it. ⚠ THAT IS NOW TRUE ON ANY BROWSER (2026-10-20). It used to depend on `cgp.examDate` being unset: a date entered on a Compass surface survived reloads, appeared on NEITHER control bar, and turned this section into “Not enough time before your exam” for good — the one way this page could look wrong with every visible setting correct. The Home no longer reads it. The remaining no-plan arm needs a shorter Expires setting, which is a visible control.',
              '⚠ FORKED FROM `HybridHomeV1`’s pace panel (its `PACE_PANEL` + `ProgressDial`), copied rather than imported so a change here is not a change in another designer’s working Home. The LAYOUT is duplicated; the DATA is not.',
            ],
            toasterLogic: ['None — the only action is Customize Your Pace, which routes to Compass’s study planner.'],
          },
          designSpec: {
            tokens: [
              { role: 'Panel', token: 'transparent — the outlined panel comes from the Home (`WHITE_PROGRESS_PANEL`), not from this card' },
              { role: 'Eyebrow', token: '--color-neutral-800 (shared via `atlasSectionEyebrow`)' },
              { role: 'Divider under Course progress', token: '--color-atlas-nav-rule' },
              { role: 'Dial figure', token: '--font-heading-serif' },
              { role: 'Goal note', token: '--font-body' },
            ],
            sources: [
              'src/components/compass/AtlasPaceRingCard.tsx',
              'Forked from the pace panel in `HybridHomeV1.tsx` — reference the live prototype, not a Figma node.',
            ],
          },
          acceptanceCriteria: [
            'A bare `?demo=1` renders THIS card in the left column — not the tan five-state one. If course-progress and study-pace are separate tan cards, the page is on the `states` arm.',
            'Course progress stays visible at 100% rather than being swapped out.',
            'When no study pace fits the remaining access, the goal row, the hours line and the completion date are all absent together — never one figure left standing on its own.',
          ],
          data: [
            'The learner’s completion percentage — today the Demo Controls’ Progress flag via the shared ladder, not a progress record.',
            'The study plan — today `PLANNER_PLAN`, the same fixture Compass’s planner opens on, read through `paceName`/`studyPace`.',
          ],
          stubs: [
            'Customize Your Pace routes to the Compass study planner; nothing persists a chosen pace back to this card.',
          ],
        },
        {
          id: 'atlas-home-progress-states',
          name: 'Atlas Home — Course Progress States',
          tabLabel: 'Progress States',
          location: 'src/components/compass/AtlasCourseProgressStates.tsx',
          summary:
            '⚠ THE NON-DEFAULT ARM — reachable at `?ff=atlas-pace-card:states`, or from the Design bar. A single card cycling through five states of the current course’s progress: Study Pace (nothing started yet), Course Progress (the real completion dial), Milestone, Complete, and Expired. On Home, clicking it steps the PAGE’s shared Progress control rather than its own local state, so Readiness and the Study Journey move with it.',
          quickSummary:
            'The tan five-state progress module (Study Pace, Course Progress, Milestone, Complete, Expired) — the arm the page shipped with before the ring became the default on 2026-10-16. Right now clicking the card itself is just a review trick to flip states — only the Current state shows real numbers, the rest are placeholder copy.',
          variants: [
            { name: 'Zero / Study Pace', when: 'percent ≤ 0', detail: '"We’ve set up a moderate study plan for you" + a pace pill (Moderate) + "Edit My Study Pace". No dial — a 0% course never shows a 0% ring.' },
            { name: 'Current / Course Progress', when: '0 < percent < 100, not Milestone', detail: 'The real dial (the page’s own `percent`) + "Expected completion" + "Course access" figures, both real.' },
            { name: 'Milestone', when: 'Selected via the Design/Demo Progress control', detail: 'Dial pinned to 68% (design figure, not derived from `percent`) + "Great Work!!" + fixed "June 3" / "28 Days, Ends June 10" figures.' },
            { name: 'Complete', when: 'Selected via the Progress control', detail: 'Dial at 100% + "Amazing Job!!" + fixed "June 1" / "9 Days, Ends June 10" figures.' },
            { name: 'Expired', when: 'Selected via the Progress control', detail: '"We’re sorry but your course has expired" + a drawn (unwired) "Extend Course Now" button — clicking it is a click on the card, not the button.' },
            { name: 'bare (combined panel)', when: 'On White/End-to-End Demo chrome, sharing one outlined panel with Readiness when that flag is on', detail: 'No card fill/border of its own; eyebrow swaps to "Pre-Licensing Progress"; drops the Course access figure, the post-copy rule, and the "Edit My Study Pace" link entirely.' },
          ],
          uxLogic: [
            'The WHOLE card is `role="button"`/`tabIndex={0}`; a click OR Enter/Space anywhere on it advances to the next state — not just "Edit My Study Pace" or "Extend Course Now", which are drawn but inert.',
            'When `onAdvance` is supplied (as Home does), the click calls it INSTEAD of the component’s own internal state — so the card becomes an alternate control surface for the Demo Controls’ Progress flag, not a thing with progress of its own.',
            'A 0% course is forced to the Study Pace screen even if the cycle is mid-walk — `current` is only reachable when `percent > 0`.',
            'Only the Current state reads real figures (`percent`, `expected`, `access`, all passed in). Milestone, Complete and Expired render FIXED design copy (68%, "June 3", "28 Days", "Ends June 10", etc.) regardless of the actual course.',
            'The aria-label states the step number, state name and that pressing shows the next state — it changes with every state, so a screen-reader user always knows where the cycle is and what activating it does.',
          ],
          uiUxLogic: {
            why:
              'One card needs to stand in for progress at every point in a course’s life, including two states (Milestone, Expired) a prototype has no way to reach from real data yet — so it is built as a steppable review device first, a real progress display second.',
            variants: [
              { name: 'Zero', why: 'A learner who hasn’t started needs a plan, not a 0% ring — a ring at zero reads as something broken.', action: '"Edit My Study Pace" (drawn, not wired).' },
              { name: 'Current', why: 'The one state with real stakes — how far along, and whether access will outlast the work.', action: 'No action beyond the Study Pace edit link below it.' },
              { name: 'Milestone', why: 'A celebratory check-in ahead of 100%, to reinforce pace.', action: '"Edit My Study Pace" (drawn, not wired).' },
              { name: 'Complete', why: 'Closes the loop and hands off to the next step (flashcards, Exam Simulator).', action: 'None — no edit link once there is no pace left to edit.' },
              { name: 'Expired', why: 'Access lapsed before completion — the one state asking for a purchase decision.', action: '"Extend Course Now" (drawn, not wired; a click anywhere on the card advances state instead).' },
            ],
            edgeCases: [
              'Milestone/Complete/Expired are reachable ONLY via the Demo Controls’ Progress dropdown on Home (clicking the card alone cycles 1→5→1 through all five using its OWN state, which only matches the page when nothing else is driving it via `onAdvance`).',
              'The 100%-at-Complete figure (via the shared `V3_PROGRESS` map in `AtlasHomeEricE2E`) does not always match `percent`, because Milestone/Complete deliberately override the dial to fixed values (68 / 100) rather than reading the page’s own figure.',
            ],
            toasterLogic: ['None — the whole card is one stepping control; neither drawn action fires anything.'],
          },
          designSpec: {
            tokens: [
              { role: 'Card surface', token: '--color-primary-100 (card chrome only — omitted in `bare`)' },
              { role: 'Eyebrow', token: '--color-primary-500 (card) · --color-neutral-800 (bare)' },
              { role: 'Dial track', token: '--color-atlas-tan-300' },
              { role: 'Dial fill', token: '--color-atlas-dial-fill, falls back to --color-primary-500' },
              { role: 'Dial figure + "Amazing/Great" cheer', token: '--font-heading-serif' },
              { role: 'Rules between figures', token: '--color-primary-200' },
            ],
            states: ['No hover styling — `cursor: pointer` is the only affordance beyond the aria-label.'],
            sources: [
              'Reference the live prototype (Live Preview tab) as the primary source — figure placement and copy were iterated live against it.',
              'Figma "Atlas-UX-Design" component 267:8267 (the five states) and node 286:9455 (the `bare` combined-panel treatment), per the file’s own comments — not re-verified against current Figma, so treat the prototype as authoritative if the two disagree.',
              'src/components/compass/AtlasCourseProgressStates.tsx',
            ],
          },
          acceptanceCriteria: [
            'Clicking (or Enter/Space on) any part of the card advances state — not only the drawn link/button text.',
            'A course at 0% never renders a 0%-filled ring; it shows the Study Pace screen.',
            'Only the Current state’s figures are driven by real data; Milestone/Complete/Expired figures are static copy until a real source replaces them.',
            '`bare` renders with no card fill/border/Course-access-figure/edit-link, for the shared outlined panel.',
          ],
          statesMatrix: [
            { state: 'percent ≤ 0 mid-cycle', behavior: 'Forced to Zero regardless of where the click-cycle was.' },
            { state: 'No `access` figure supplied', behavior: 'The Course access figure (and its rule) is simply omitted on Current.' },
          ],
          data: [
            'percent (0–100) — the active course’s real completion.',
            'expected { value, note } — the pace model’s projected finish date, real on Current.',
            'access { value, note } | null — days left + expiry date, real on Current; absent on the other four, which use fixed copy instead.',
            'initialStage — which of the five states to open on (set by the Design bar’s Progress control today).',
          ],
          stubs: [
            '"Edit My Study Pace" is drawn, not wired to anything — decide whether it opens a real pace editor or is dropped once the card stops being a click-to-cycle device.',
            '"Extend Course Now" is drawn, not wired — same question for Expired.',
            'Milestone/Complete/Expired figures (68%, "June 3", "28 Days", "Ends June 10", "June 1", "9 Days") are invented design copy with no connection to the real course — a real build needs these computed the same way Current’s figures are.',
          ],
          a11y: [
            'The card is `role="button"` `tabIndex={0}` with a dynamic `aria-label` ("Course progress — state N of 5, {name}. Press to show the next state.") — both the step count and name update per state.',
            'The dial is `role="img"` with `aria-label="{pct}% complete"`; its ring and percentage text are otherwise `aria-hidden`.',
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'Do "Edit My Study Pace" and "Extend Course Now" become real actions?',
            decision:
              'Not yet — both are drawn text/buttons, and a click on EITHER is read as a click on the whole card (advance state), not as pressing them specifically. A real build needs to decide whether these get their own click targets independent of the card’s advance-state behavior, or whether the card itself stops being click-to-cycle once real data drives it.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
          {
            question: 'Why does a 0%-complete course never show a 0% dial?',
            decision: 'A ring reading 0% looks broken rather than "not started yet" — the Study Pace screen (a plan, not a stalled number) is the deliberate replacement (2026-10-09).',
            status: 'Decided',
          },
          {
            question: 'Are Milestone/Complete/Expired\'s figures meant to be real, or are they permanently fixed design states?',
            decision:
              'Unresolved. Today they are fixed design copy, same for every learner, every brand. If they ship as-is, every learner reaching Milestone sees "68%" and "1 week" regardless of their actual pace.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
        ],
        openItems: [
          'Whether Edit My Study Pace / Extend Course Now get real, independently-clickable actions.',
          'Whether Milestone/Complete/Expired read real figures before this ships, or stay fixed design states.',
        ],
      },
      alsoConsider: [
        { name: 'Readiness panel', location: 'See its own dev-handoff feature.', note: 'Sits directly below this card (or shares its outlined panel on White/E2E); its level follows this card’s stage via the same Progress control.' },
      ],
      flagsNote:
        '`atlas-v3-progress` picks the opening state; clicking the card (or Enter/Space) also advances it when the card is wired to the page via `onAdvance`, as it is on Home.',
    },
  },
  {
    /*
     * ATLAS HOME — READINESS PANEL. 2026-10-19. AtlasReadinessCard — the
     * five-level "Readiness for state exam" half-dial, directly below Course
     * Progress (or sharing its outlined panel on White/E2E).
     *
     * devStatus: 'in-design'. No `quickSummary` yet — ask before writing one.
     */
    id: 'xcel-atlas-home-readiness-panel',
    title: 'Atlas Home — Readiness Panel',
    accent: 'blue',
    icon: 'grid',
    blurb:
      '⚠ OFF ON MAIN — `atlas-readiness-section` is `defaultEnabled: false` (2026-10-19, Jillienne: "readiness off"), so this panel does NOT render on a bare `?demo=1`; open it with `?ff=atlas-readiness-section`. The five-level "Readiness for state exam" half-dial on the Atlas Home, whose opening level follows the Course Progress card and which — on its own — steps forward by clicking it, the same review-device pattern as Progress.',
    tileBlurb:
      'Off by default — a half-dial under Course Progress, Novice → Advanced Beginner → Competent → Proficient → Exam Ready, synced to its stage.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'in-design',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home (End-to-End Demo)',
        note: '⚠ THE FLAG IS OFF ON MAIN, so this link shows the page WITHOUT the panel — it is here because it is the page the panel belongs to. Use the link below to actually see it.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
      {
        label: 'Readiness panel switched on — what this handoff describes',
        note: 'The same page with `?ff=atlas-readiness-section`, which turns the panel on for this visit only. It renders below Course progress, sharing the ring panel and its eyebrow (`matchPaceEyebrow`). Click the card to step through its five levels, or change UI/UX Demo Tools → Progress to re-sync it.',
        to: '/dashboard-rebrand?demo=1&section=dashboard&ff=atlas-readiness-section',
      },
    ],
    featureFlags: [
      { id: 'atlas-readiness-section', label: 'Readiness section', note: '⚠ THE GATE ON THIS WHOLE PANEL, and it is OFF on main (`defaultEnabled: false`). `src/components/compass/AtlasHomeEricE2E.tsx` renders the card under `{!showReadiness ? null : …}`. A design-bar control, but the default is what ships.' },
      { id: 'atlas-v3-progress', label: 'Progress', note: 'Picks which of the five Readiness levels the card opens on (via a fixed map) — the two cards never open out of sync, though this one can still be clicked independently afterward.' },
    ],
    devHandoff: {
      intro:
        'A half-dial under Course Progress naming a readiness LEVEL rather than a percent, opening in step with Progress and then — like Progress — steppable on its own by clicking it.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-readiness-panel',
          name: 'Atlas Home — Readiness Panel',
          tabLabel: 'Readiness',
          location: 'src/components/compass/AtlasReadinessCard.tsx',
          summary:
            'A card asking "How Ready are you for your State Exam?" over a half-dial (the top half of a ring) naming one of five levels — Novice, Advanced Beginner, Competent, Proficient, Exam Ready — instead of showing a percent. Its OPENING level follows the Course Progress card’s stage (a fixed lookup table), and from there a click or Enter/Space on the card steps it forward through the five on its own — the same click-to-cycle review-device pattern Course Progress uses, built independently of it.',
          quickSummary:
            'The "how ready are you for your exam" half-dial under Progress. It opens at a level that roughly follows Progress, but clicking it on its own is independent, and clicking past Exam Ready resets the whole page back to Not Started — that last part needs a real decision before it ships.',
          variants: [
            { name: 'Novice (level 1, 13% fill)', when: 'Progress opens at Not Started or Expired', detail: 'Default/reset level. The arc fractions (13/38/66/85/100%) are read off the design’s drawn arcs, not given as numbers anywhere.' },
            { name: 'Advanced Beginner (level 2, 38% fill)', when: 'Progress opens On Track', detail: '—' },
            { name: 'Competent (level 3, 66% fill)', when: 'Progress opens at Milestone', detail: '—' },
            { name: 'Proficient (level 4, 85% fill)', when: 'Progress opens at Completed', detail: 'The HIGHEST level the Progress sync ever opens on — Exam Ready is reachable only by clicking the card manually past Proficient.' },
            { name: 'Exam Ready (level 5, 100% fill)', when: 'Clicked manually one level past Proficient', detail: 'Clicking (or Enter/Space) AGAIN from here does not wrap to Novice like every other level does — see uxLogic.' },
            { name: 'bare (combined panel)', when: 'On White/End-to-End Demo chrome, sharing the outlined panel with the Course progress + Study pace ring', detail: 'No card fill of its own; drops the "How Ready are you…" question AND the "Help me get ready" link entirely — only the eyebrow + dial remain.' },
          ],
          uxLogic: [
            'The WHOLE card is `role="button"`/`tabIndex={0}` — a click or Enter/Space anywhere on it (not just the "Help me get ready" link, which is drawn text and not a real link) advances to the next level.',
            'The card’s OPENING level is set from the Course Progress card’s stage via a fixed lookup (Not Started/Expired → Novice, On Track → Advanced Beginner, Milestone → Competent, Completed → Proficient) — so the two cards never open disagreeing with each other, even though nothing keeps them in sync AFTER that: clicking Readiness on its own does not move Progress, and vice versa.',
            'Clicking past Exam Ready (level 5) does NOT wrap back to Novice the way every other level wraps to the next — on Home it instead resets the WHOLE PAGE’s shared Progress control back to Not Started (`onPastLast`), which also resets Course Progress and the Study Journey. A learner reading only the Readiness card has no way to predict that from what’s on screen.',
            'The aria-label states the level number, its name, and that pressing shows the next one — it updates on every level, so a screen-reader user always knows where the cycle is and what activating it does.',
          ],
          uiUxLogic: {
            why:
              'A plain percent (like Course Progress’s dial) answers "how much of the course is done"; this card answers a different question — "could I pass the exam right now" — so it needed its own vocabulary (five named competency levels) rather than reusing Progress’s number.',
            edgeCases: [
              'The Progress→Readiness sync map never opens Readiness higher than Proficient (level 4) — Exam Ready is reachable only by a manual click past it, so it’s effectively undemoable through the Design bar’s Progress control alone.',
              'The reset-to-Not-Started behavior on a past-Exam-Ready click is Home-specific wiring (`onPastLast`), not something the component does on its own — a standalone mount of this card with no `onPastLast` simply wraps to Novice like every other level.',
            ],
            toasterLogic: ['None — the whole card is one stepping control; the "Help me get ready" text fires nothing.'],
          },
          designSpec: {
            tokens: [
              { role: 'Card surface', token: '--color-atlas-tan-200 (card chrome only — omitted in `bare`)' },
              { role: 'Eyebrow + caption ("Overall readiness")', token: '--color-primary-500' },
              { role: 'Dial track', token: '--color-atlas-tan-500' },
              { role: 'Dial fill', token: '--color-atlas-dial-fill, falls back to --color-primary-500 — same fallback Course Progress’s dial uses' },
              { role: 'Level name', token: '--font-heading-serif, --color-primary-800' },
              { role: 'Rules above/below the question', token: '--color-atlas-tan-300' },
              { role: '"Help me get ready" link', token: '--color-compass-page-button' },
            ],
            states: ['No hover styling — `cursor: pointer` is the only affordance beyond the aria-label, same as Course Progress.'],
            sources: [
              'Reference the live prototype (Live Preview tab) as the primary source.',
              'Figma "Atlas-UX-Design" component 295:10698 (the five-level card, replacing an earlier single 35% card at 254:8012) and node 286:9455 (the `bare` combined-panel treatment), per the file’s own comments — not re-verified against current Figma.',
              'src/components/compass/AtlasReadinessCard.tsx',
            ],
          },
          acceptanceCriteria: [
            'Clicking (or Enter/Space on) any part of the card advances to the next level.',
            'The opening level matches the Course Progress card’s stage per the documented lookup, every time the page loads or Progress changes.',
            'Clicking past Exam Ready on Home resets the shared Progress control to Not Started rather than wrapping to Novice.',
            '`bare` renders with no card fill, no question line, and no "Help me get ready" link — eyebrow + dial only.',
          ],
          statesMatrix: [
            { state: 'Progress stage has no readiness mapping', behavior: 'Falls back to Novice (level 1).' },
            { state: 'Clicked past Exam Ready, not on Home (no `onPastLast` supplied)', behavior: 'Wraps back to Novice like every other level.' },
          ],
          data: [
            'initialLevel (0–4) — which of the five levels to open on; Home computes this from the Course Progress stage rather than passing a raw number.',
            'onPastLast — optional callback fired instead of wrapping when Exam Ready is clicked; Home uses it to reset the page’s Progress control.',
          ],
          stubs: [
            '"Help me get ready" is drawn styled as a link but fires nothing — decide its real destination (a study-plan screen? exam-prep content?) before this ships.',
            'The correlation between Progress and Readiness is a one-time opening-level lookup, not a live rule — Eric’s own comment notes "we will correlate these at some level to course progress at a later date," meaning today’s sync is a placeholder for whatever that real rule turns out to be.',
          ],
          a11y: [
            'The card is `role="button"` `tabIndex={0}` with a dynamic `aria-label` ("Readiness for state exam — {name}, level N of 5. Press to show the next level.").',
            'The dial’s arc and level text are `aria-hidden`; the aria-label on the card carries the equivalent information.',
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
            question: 'Why does clicking past Exam Ready reset the whole page to Not Started instead of wrapping to Novice?',
            decision:
              'Deliberate on Home (`onPastLast` resets the shared Progress control) — reaching Exam Ready is treated as "done with this cycle," and Eric wanted the demo able to loop the whole Home back to its start from there. Not documented as a learner-facing behavior; unclear whether it should survive into a real build.',
            status: 'Needs weigh-in',
            owner: 'Eric',
          },
        ],
        openItems: [
          'What "Help me get ready" should link to.',
          'What the real Progress ↔ Readiness correlation rule will be, once it exists.',
          'Whether resetting the whole page from Readiness’s past-Exam-Ready click is intended end-user behavior or just a demo convenience.',
        ],
      },
      alsoConsider: [
        { name: 'Course Progress panel', location: 'See its own dev-handoff feature.', note: 'Sits directly above this card (or shares its outlined panel on White/E2E); drives this card’s opening level.' },
      ],
      flagsNote:
        '`atlas-v3-progress` indirectly picks this card’s opening level (via the Course Progress stage it maps from) — there is no flag that targets Readiness directly.',
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
            'A single card cycling through four stages to collect and show a learner’s state exam date: Default ("Do you know your state exam date?"), No ("No state exam date yet? That’s okay."), Yes (a working month calendar), and Set (the chosen date + days remaining, with an Edit link back to the calendar). On the Home layout it is wired in BETWEEN Course Progress and Readiness — but is hidden there today by an `onWhite` check that returns null for both White and End-to-End Demo chrome.',
          quickSummary:
            'A working exam-date picker, but it’s currently hidden — it doesn’t appear anywhere on Home today even though it’s fully built. Need to decide if it comes back.',
          variants: [
            { name: 'Default', when: 'No exam date has been set yet, card just mounted/reset', detail: '"Do you know your state exam date?" + Not Yet (→ No) / Yes (→ Yes, opens the calendar). On Home, its intro sub-line is hidden via `hideIntroCopy`.' },
            { name: 'No', when: '"Not Yet" was clicked', detail: '"No state exam date yet? That’s okay." + a registration blurb (the word "here" is bold but NOT a working link — destination undecided) + "I have my exam date" (→ Yes).' },
            { name: 'Yes (calendar)', when: '"Yes" or "I have my exam date" was clicked, or Edit from Set', detail: 'A real month calendar opening on today’s month (or the saved date’s month, when editing). Past days and neighboring months’ days are not selectable; today is ringed; "Set Exam Date" stays disabled until a day is picked; "Cancel" returns to wherever the learner came from (or back to Set, if a date was already saved).' },
            { name: 'Set', when: 'A date was picked and "Set Exam Date" was clicked', detail: '"Your state exam date:" + a date tile + a days-remaining tile ("Today is your state exam" at zero days) + an "Edit" link back to the calendar, pre-opened on the saved month.' },
          ],
          uxLogic: [
            'The exam date lives in LOCAL COMPONENT STATE ONLY — nothing downstream (the pace model’s "Expected completion" figure, the Study Journey, the Readiness card) reads it. Setting a date here changes nothing else on the page.',
            'Past calendar days and neighboring-month days at the grid’s edges are not selectable — stepping a month is the only way to reach a neighboring month’s dates, and the component will not let the calendar step back before today’s month.',
            '"Cancel" is context-aware: it returns to the stage the learner came FROM (Default or No) when no date is saved yet, but returns to Set (not Default) once a date exists — so cancelling an edit never discards a previously saved date.',
            'The whole card remounts on the page’s shared refresh key — the Top Nav’s Home button resets it (along with Course Progress and Readiness) back to Default, discarding any locally-set exam date.',
            'Colours are the COMPASS palette on every brand (not the active brand’s own palette) EXCEPT the buttons and text links, which keep the brand’s own button colour — a deliberate two-palette mix, not an oversight.',
          ],
          uiUxLogic: {
            why:
              'An exam date is the one piece of context the pace model and Study Journey most need and least reliably have, so the card exists to collect it opportunistically with as little friction as a two-tap flow (pick a day, confirm) — but it is explicitly NOT yet treated as real data anywhere else on the page.',
            variants: [
              { name: 'Default → No', why: 'A learner without a date yet still needs a path forward (registering) rather than a dead end.', action: '"Not Yet" (no-op beyond switching stage).' },
              { name: 'No → Yes', why: 'Once registered, the learner should be able to add the date in the same place they were asked for it.', action: '"I have my exam date" opens the calendar.' },
              { name: 'Yes → Set', why: 'Confirms the pick before committing it, and keeps "Set Exam Date" disabled until there is something to confirm.', action: 'Pick a day, then "Set Exam Date" (disabled until a day is picked).' },
              { name: 'Set → Yes (Edit)', why: 'A date is not a one-time entry — plans change.', action: '"Edit" reopens the calendar on the saved date’s month.' },
            ],
            edgeCases: [
              'The card is wired into the Home layout at a fixed position (between Course Progress and Readiness) regardless of which stage it is in, so the column’s height changes as the card cycles through its four stages — nothing reserves a fixed height for it.',
              'The "here" registration link in the No stage reads as bold text rather than a real link, so a learner clicking it today gets nothing — it is drawn exactly as a link would be, which risks reading as a bug rather than an unfinished feature.',
            ],
            toasterLogic: ['None — setting, editing or cancelling an exam date fires no toast.'],
          },
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
              'Reference the live prototype would normally be the primary source, but this card does NOT render on the End-to-End Demo route today — see the devStatus note above. Its behavior was read directly from the component source instead.',
              'Figma "Atlas-UX-Design" component 224:4118, "Set Exam Date" (per the file’s own comment) — not re-verified against current Figma.',
              'src/components/compass/AtlasExamDateCard.tsx',
            ],
          },
          acceptanceCriteria: [
            'The card cycles Default → No/Yes → Set (with Edit returning to Yes) exactly as described, and Cancel’s destination depends on whether a date is already saved.',
            'Past days and neighboring-month days are never selectable; "Set Exam Date" stays disabled with no day picked.',
            'The calendar cannot be stepped back before the current month.',
            'On this baseline (White/End-to-End Demo), the card does not render at all — confirm that is still the intended behavior before building against it.',
          ],
          statesMatrix: [
            { state: 'onWhite (White or End-to-End Demo chrome)', behavior: 'Card is not rendered at all — `null`.' },
            { state: 'WIP chrome (out of this handoff’s scope)', behavior: 'Card renders, positioned between Course Progress and Readiness.' },
          ],
          data: [
            'stateName — the state name shown in the Yes stage’s question ("your {stateName} state exam?"); Home passes the learner’s real state.',
            'examDate — purely local state; nothing reads it from outside the component today.',
          ],
          stubs: [
            'The entire card is a stub relative to the rest of the page: the exam date it collects is not wired to the pace model, Study Journey, or anywhere else.',
            'The "here" registration link (No stage) has no destination yet.',
          ],
          a11y: [
            'The calendar grid is `role="grid"` with `role="columnheader"` weekday letters and `role="gridcell"` day buttons, each carrying a full spoken date in its `aria-label` and `aria-selected` on the picked day.',
            'The current month/year label is `aria-live="polite"` so stepping months announces the change.',
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
      'The right column’s three steps — Study Journey (Step 1), Pass State Exam (Step 2), Get Licensed in {state} (Step 3) — where Step 1’s list on this baseline is a fixed 7-line display rather than the real, per-learner computed journey.',
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
            'Step 1 is headed "Study Journey" and lists the stops of the licensing coursework; Step 2 is "Pass State Exam" and Step 3 is "Get Licensed in {state}" (from the published GET_LICENSED_STEPS data, retitled with the learner’s state). On THIS baseline, Step 1’s displayed list is a fixed array of 7 titles (`WHITE_JOURNEY_TITLES`, sourced from a separate Figma frame) with only the first row ever marked current — it does not read the real, computed `journeyStopsFor(path)` sequence that drives the equivalent rail elsewhere in the app (the Learning Path page’s detail panel, the Study Journey widget).',
          quickSummary:
            'Step 1/2/3 on the right side of Home. Important: Step 1’s list is a fixed, hardcoded set of lines today — it does not move with the Progress control the way Progress and Readiness do. That’s worth a decision before dev builds against it.',
          variants: [
            { name: 'Step 1 — Study Journey (default)', when: 'Progress is anything but Completed', detail: 'A fixed 7-line list: Pre-course Affidavit, Pre-Licensing Lessons (13 of 42 completed), Prep Review (23), Simulated Exams (3), Study-manual Notice Affidavit, Final Course Exam, Survey & Certificate. Row 1 always renders as the bold "current" stop; rows 2–7 are always muted "not started" — regardless of the Progress control.' },
            { name: 'Step 1 — Congratulations (Completed)', when: 'Progress = Completed', detail: 'Replaces the whole list with an eyebrow + "Congratulations!" + "You’ve completed your course and passed your course exams. Time to get ready for your state exam!"' },
            { name: 'Step 2 — Pass State Exam', when: 'Always', detail: '"150 questions in 150 minutes. 70% to pass." No link on this chrome (its "What to expect" link is dropped here; WIP keeps it).' },
            { name: 'Step 3 — Get Licensed in {state}', when: 'Always', detail: 'Retitled from the published "Apply for your License" using the learner’s state name. "Submit your certificate of completion with the application." No link on this chrome either ("How to apply" is dropped here; WIP keeps it).' },
            { name: '{state} State Requirements button', when: 'Always, when `onOpenRequirements` is supplied', detail: 'The only click target left in this whole section on this baseline — opens the requirements sheet.' },
          ],
          uxLogic: [
            'Step 1’s list is `journeyStopsFor(path)` everywhere else in the app (a real, computed sequence of the learner’s actual coursework progress), but on White/End-to-End Demo chrome it is DISCARDED in favor of a hardcoded 7-title array — only the FIRST row is ever shown as current/in-progress, and the per-stop "done X of Y chapters, Next: Chapter N — Name" detail line (visible on WIP) never renders here at all.',
            'That means stepping the Progress control through Not Started → On Track → Milestone → Completed visibly moves the Course Progress dial and the Readiness half-dial on this baseline, but Step 1’s list stays frozen — the ONE exception is Completed, which swaps the whole list for a Congratulations block.',
            'Steps 2 and 3 always show their title + one line of detail; their own "What to expect" / "How to apply" links exist in the component but are unconditionally hidden on this chrome (`!onWhite` gate) — so neither step opens anything on its own.',
            'The published licensing path actually has THREE steps after the coursework (Schedule State Exam → Pass State Exam → Apply for your License), but Home shows only the last two as "Step 2" and "Step 3" — "Schedule State Exam" never appears here.',
            'Journey rows that ARE shown with a chevron (on WIP, where the real list is used) only get one when the stop is not current and its status is not "not-started" — on this baseline every non-current row is always "not-started" by construction, so no row ever gets a chevron here either.',
          ],
          uiUxLogic: {
            why:
              'Steps 2 and 3 exist to keep the licensing path visible past the point the LMS stops tracking it (scheduling and sitting a state exam, then applying, both happen outside the product) — Step 1 exists to show what is still being tracked inside it.',
            edgeCases: [
              'A `V3 drops the Attestation & Affidavit stop` filter still runs on the real `journeyStopsFor` output inside this component, but since White/End-to-End Demo never displays that real output (it shows the fixed array instead), the filter has no visible effect on this baseline — it only matters on WIP, where the real list is shown.',
              'The Completed-stage Congratulations copy ("passed your course exams") is stated unconditionally, with no dependency on whether the Step 1 list (fixed or real) actually shows every stop as complete.',
            ],
            toasterLogic: ['None — this section fires no toasts; its only interaction is the State Requirements button, which opens a sheet.'],
          },
          designSpec: {
            tokens: [
              { role: 'Step eyebrow ("Step 1" / "Step 2" / "Step 3")', token: 'bold weight, shares STEP_EYEBROW style' },
              { role: 'Step / stop title', token: '--font-heading-serif via STEP_TITLE for step titles; --font-body for journey row text' },
              { role: 'Current journey row', token: '--color-atlas-home-current-stop, falls back to --color-compass-page-button' },
              { role: 'Muted journey rows + step detail copy', token: '--color-text-secondary' },
              { role: '"Next" pill (WIP only — never shown on this baseline)', token: 'NEXT_PILL style' },
              { role: 'Chevron (WIP only — never shown on this baseline)', token: '--color-atlas-home-icon, falls back to --color-compass-page-button' },
            ],
            states: ['No hover styling on journey rows themselves — only the (hidden-here) chevron and (hidden-here) step links are interactive elements, both plain link-style buttons.'],
            sources: [
              'Reference the live prototype (Live Preview tab) as the primary source — what it shows is the fixed 7-line list, not the computed journey.',
              'Figma frame 265:8144 for the fixed White journey list, per the file’s own comment — not re-verified against current Figma.',
              'src/components/compass/AtlasHomeEricE2E.tsx, src/components/learning/studyJourneyUtil.ts, src/data/nyProducerRequirements.ts',
            ],
          },
          acceptanceCriteria: [
            'Step 1 shows the fixed 7-line list on every Progress value except Completed, where it shows the Congratulations block instead.',
            'Steps 2 and 3 render title + one line of detail only, with no links, on this chrome.',
            'The "{state} State Requirements" button is the only click target in this section.',
            'Confirm whether Step 1 should instead read the real, computed `journeyStopsFor(path)` sequence before this ships — see the decisions log.',
          ],
          statesMatrix: [
            { state: 'Progress = Completed', behavior: 'Step 1 list replaced by the Congratulations block; Steps 2 & 3 and the Requirements button are unaffected.' },
            { state: 'Any other Progress value', behavior: 'Step 1 shows the fixed 7-line list with row 1 always current — visually unchanged by which Progress value is picked.' },
          ],
          data: [
            'The fixed Step 1 titles are hardcoded in `WHITE_JOURNEY_TITLES`, not derived from any path or fixture.',
            'Step 2 and Step 3’s copy comes from `GET_LICENSED_STEPS` (a published, 3-entry array) — Home reads its LAST TWO entries only, by array position (`length - 2`, `length - 1`), not by id.',
            'The state name in Step 3’s title comes from `jurisdictionName(path.state)`, a small hardcoded lookup (today: NY, FL) that falls back to the raw state code for anything unmapped.',
          ],
          stubs: [
            'Step 1’s list on this baseline is entirely disconnected from the learner’s real progress — wiring it to `journeyStopsFor(path)` (as WIP already does) is the obvious next step if that disconnect is not intentional.',
            'Steps 2 and 3’s own links ("What to expect" / "How to apply") exist in the component but are switched off for this chrome — flip `onWhite` out of that condition to turn them back on.',
            '"Schedule State Exam" (the published first of three licensing steps) has no presence on Home at all today.',
          ],
          a11y: [
            'Each step section carries `aria-label={title}`; the journey list is a plain `<ol>` with no special roles — it is presentational text here, not an interactive stepper, since every row on this baseline is non-interactive.',
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
          quickSummary:
            'The compact nav card next to the course card — My Courses, My Certificates, and a few sheet links. Some of its links are the only way to reach things that are turned off elsewhere on this same page (the Study Journey’s own links), which is worth knowing before dev "fixes" one side without the other.',
          variants: [
            { name: 'Default rows (Home)', when: 'Always', detail: 'My Courses · My Certificates · Exam Information · Applying for a License · State Requirements — 5 rows. Flashcards and Exam Simulator are hidden via `withoutCoursePages` (shown on other hosts, e.g. the Atlas My Courses page).' },
            { name: 'Home row (built, hidden)', when: 'Never, on any host — `SHOW_HOME_LINK` is hardcoded `false`', detail: 'A House icon + "Home" row exists in the component (first in the list, active when there’s no `section` param) but is unconditionally suppressed since 2026-10-07.' },
            { name: 'Active row', when: 'The current `section`/`coursePage` matches a row', detail: 'A full-width white rounded capsule behind the row, text stepped to SemiBold. On Home itself this never triggers for any VISIBLE row — the one row that would be active there (Home) is the hidden one.' },
            { name: 'Hover / focus', when: 'Pointer or keyboard focus on a row', detail: 'A trailing chevron fades in (reserving its space, so the row never shifts) and the label steps to Medium weight (reserved via a hidden duplicate so the card never resizes on hover).' },
          ],
          uxLogic: [
            'My Courses / My Certificates are SECTION links — clicking sets the shell’s `section` query param in place (no real navigation).',
            'Exam Information / Applying for a License / State Requirements are SHEET links — on Home they call the SAME `onOpenStep` / `onOpenRequirements` callbacks the Study Journey section receives, so they open the identical sheets. Without those handlers (a host that owns no sheets) they fall back to setting `?open=` on the Home URL instead, for a host like `MembershipOverview` to read and act on.',
            'Because Home DOES supply those handlers to this card but withholds them from the Study Journey section’s own Step 2/3 links (see that handoff), "Applying for a License" and "State Requirements" are reachable from Quick Links even though the inline links that would otherwise lead to the same places are switched off elsewhere on this same page.',
            'A row with no `onClick` at all renders `disabled` — on Home every visible row has a real handler, so none render disabled here; a host that supplies neither prop would get one disabled row (State Requirements, whose only source is the `onOpenRequirements` prop with no URL fallback).',
          ],
          uiUxLogic: {
            why:
              'A compact, always-visible list of "where do I go next" destinations that does not compete with the Study Journey’s own step-by-step narrative — it exists so a learner who wants My Certificates or the exam requirements does not have to read through Steps 1–3 to find them.',
            edgeCases: [
              'The "Home" row is fully built (icon, active-state logic, everything) and simply switched off by one `const SHOW_HOME_LINK = false` — turning it on costs nothing but might read oddly on Home itself, where it would always show as the active row (since Home never sets a `section`).',
              'All three sheet links share the same fallback shape (`handler ?? homeAndOpen(...)`), so a host supplying neither `onOpenStep` nor `onOpenRequirements` still gets working rows — they just navigate to Home with an `?open=` param instead of calling a handler directly.',
            ],
            toasterLogic: ['None.'],
          },
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
              'Reference the live prototype (Live Preview tab) as the primary source.',
              'Figma "Atlas-UX-Design", Home V2’s right column, node 161:662 (per the file’s own comment, originally "More Information for Your Journey") — not re-verified against current Figma.',
              'src/components/compass/AtlasJourneyLinksCard.tsx',
            ],
          },
          acceptanceCriteria: [
            'My Courses and My Certificates switch the shell’s section in place; neither performs a full navigation.',
            'Exam Information, Applying for a License and State Requirements open the same in-place sheets Home’s Study Journey section would otherwise link to.',
            'Flashcards and Exam Simulator are absent on Home.',
            'The Home row stays hidden unless `SHOW_HOME_LINK` is explicitly turned back on.',
          ],
          statesMatrix: [
            { state: 'No `onOpenStep` / `onOpenRequirements` supplied', behavior: 'Sheet links fall back to setting `?open=` on the current URL instead of calling a handler.' },
            { state: '`withoutCoursePages` true (Home)', behavior: 'Flashcards and Exam Simulator rows are omitted entirely.' },
          ],
          data: [
            'onOpenStep / onOpenRequirements — the two callbacks shared with the Study Journey section; Home supplies both as real handlers.',
            'withoutCoursePages, titleRule — presentation-only props Home sets true/true respectively.',
          ],
          stubs: [
            'The Home row is fully built and simply off — flip `SHOW_HOME_LINK` to bring it back, but reconsider whether it should show as permanently "active" on Home itself first.',
          ],
          a11y: [
            'The card is a `<nav aria-label="Quick links">`; each row is a real `<button>` with `aria-current="page"` when active and `disabled` when it has no handler.',
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
            'A centered dialog, portalled to `<body>` over a darkened page, titled "Affidavit" with a hardcoded course line ("Florida Life & Health Pre-licensing") and a placeholder grey panel standing in for the real affidavit text. A single checkbox ("I have read and understand this Affidavit") must be ticked before "Continue to course" is enabled — but Continue and Cancel both call the SAME close handler, so there is no behavioral difference between agreeing and cancelling today.',
          quickSummary:
            'The affidavit popup that shows up after Confirmation & Password when a new learner lands on Home. Right now Cancel and agreeing both do the exact same thing — that needs a real decision on what Cancel should actually do.',
          variants: [
            { name: 'Unchecked (default)', when: 'On open', detail: '"Continue to course" is disabled (`--color-text-secondary` fill, not-allowed cursor). Cancel, the ✕, and Escape all close the modal.' },
            { name: 'Checked', when: 'The checkbox is ticked', detail: '"Continue to course" turns on (XCEL brick fill, matching the demo’s other primary buttons) — but clicking it closes the modal via the exact same handler Cancel uses.' },
          ],
          uxLogic: [
            'Opened by Home reading `?affidavit=1` from the URL — set by the Invite flow’s Confirmation & Password page on successful submit, or reachable directly by appending the param.',
            'Closing it (any of Cancel, ✕, Escape, or an agreed Continue) deletes the `affidavit` param with a `replace` navigation, so a page refresh after closing does not reopen it.',
            'Focus is moved to the checkbox on open (`autoFocus`) — "the one thing to do" per the component’s own comment — but there is no focus TRAP: Tab can move focus out of the dialog into the page behind it, which Escape and the visible scrim suggest should not be possible.',
            'The course name shown ("Florida Life & Health Pre-licensing") is a hardcoded string, not read from `useEndToEndCourseTitle()` — the same mechanism the course head and Study Journey read from. It happens to agree with the demo’s short-title default today, but will silently disagree if that default, or the long-title flag, changes.',
          ],
          uiUxLogic: {
            why:
              'A legal-style gate the learner must acknowledge before starting a licensing course — the design’s point is the acknowledgment itself (the checkbox), with the actual affidavit TEXT left as a placeholder pending real legal copy.',
            edgeCases: [
              'Cancel and an agreed Continue are currently indistinguishable in effect — both simply close the modal and reveal Home. If "Cancel" is meant to send the learner somewhere else (back to Confirmation & Password, or block them from the course), that is unbuilt.',
              'The modal has no server-side or persisted record of the acknowledgment — closing it (by any route) and reopening via the same URL param resets the checkbox to unticked.',
            ],
            toasterLogic: ['None.'],
          },
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
              'Reference the live prototype (Live Preview tab, with `?affidavit=1` appended) as the primary source.',
              'Figma "Atlas UX Design" 428:3054, per the file’s own comment — not re-verified against current Figma.',
              'src/components/e2e/AffidavitModal.tsx',
            ],
          },
          acceptanceCriteria: [
            'Opens over Home when `?affidavit=1` is present; closing (by any route) removes the param via a replace navigation.',
            '"Continue to course" stays disabled until the checkbox is ticked.',
            'Decide and implement a real difference between Cancel and an agreed Continue before this ships — today they are the same action.',
            'Replace the placeholder document panel with real affidavit text, and derive the course name from the same source the rest of Home uses.',
          ],
          statesMatrix: [
            { state: 'Checkbox unticked', behavior: '"Continue to course" renders disabled; clicking it does nothing.' },
            { state: 'Any close route (Cancel / ✕ / Escape / agreed Continue)', behavior: 'Identical outcome — the modal closes and the `affidavit` param is removed.' },
          ],
          data: ['onClose — the only prop; Home supplies a handler that strips the `affidavit` URL param.'],
          stubs: [
            'The affidavit text itself is an unlabeled grey placeholder panel — no real copy exists yet.',
            'Cancel and Continue are functionally identical; neither records the acknowledgment anywhere, and Cancel does not send the learner anywhere different from agreeing.',
            'The course name line is a hardcoded string rather than derived from the page’s own course-title source.',
          ],
          a11y: [
            '`role="dialog"` `aria-modal="true"` with `aria-labelledby` pointing at the title; focus moves to the checkbox on open; Escape closes it.',
            'No focus trap — Tab can move focus into the darkened page behind the modal, which the scrim visually suggests should not be reachable.',
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
