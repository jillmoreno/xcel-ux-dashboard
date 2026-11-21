import type { Brand, Membership } from '@/context/AccountContext'
import type { DevStatus } from '@/components/prototype/devHandoffStatusUtil'
import { HANDOFF_FEATURES } from './handoffFeatures'

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
  /* `'prototype'` STOOD HERE from 2026-09-18 to 2026-11-21 — the live product
     build on the Prototypes section, one row per `PrototypeScope`. The
     section went with the simple Hub (`prototypes-section` in
     `archivedItems.ts`; the rows and the member are on `hub-advanced`), and
     the member went with it rather than staying as a value nothing routes:
     `sectionOf` sends every category that is not done to Development now. */
  | 'dev-handoff'
  | 'testing'
  /** The hand-authored HTML documents under `public/prototypes/`. ⚠ THE
   *  EXPLORATIONS SECTION WAS ARCHIVED 2026-11-21 (`explorations-section` in
   *  `archivedItems.ts`) and its fourteen rows with it. The member stays, like
   *  `sandbox` below: the type block is verbatim from the LMS, the archived
   *  rows in `archivedFeatureRows.ts` and the unrouted tile landing
   *  (`PrototypeLandingPage.tsx`) still carry it, and `sectionOf` in
   *  `UxDashboardPage.tsx` now routes it to Development in an explicit
   *  branch. */
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

/**
 * The product's surfaces — the word a dev handoff's `surface` tag uses
 * (`SURFACE_TAG` in `UxDashboardPage.tsx`) and the value the handoff
 * skeleton names.
 *
 * ⚠ `PROTOTYPE_SCOPES` STOOD HERE from 2026-10-14 to 2026-11-21: one entry per
 * scope with its label, the question it answered and its OWNER (design
 * authority, not merge authority — Jillienne for end to end, Afsana & Eric
 * for invite, Eric for Atlas, Anjani for Compass, Cody for admin), plus
 * `prototypeScopeLabel` / `prototypeScopeOwner`. It was the Prototypes
 * section's roster — one row per scope, owners' Staged tags, the `share-to-
 * stage` and `decide-defaults` routines read it — and went with that section
 * on the simple Hub: `prototypes-section` in `archivedItems.ts`; the list is
 * verbatim on `hub-advanced`. The type stays because the handoff rows still
 * say which surface they are about.
 */
export type PrototypeScope = 'end-to-end' | 'invite' | 'atlas' | 'compass' | 'admin'

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
  /**
   * A PICTURE of the state, shown under the description. `src` is any URL that
   * renders that state alone — the convention is a design board plus its own
   * isolation param, e.g.
   * `/prototypes/home-identity-strip-variants.html?only=st-auto-renews`, so the
   * board stays the single place these are drawn and the handoff cannot drift
   * from it.
   *
   * Prefer an id-addressed URL over a cropped one. A crop is a set of pixel
   * offsets that keep pointing somewhere after the document beneath them moves,
   * and the failure is silent — the wrong state, rendered confidently.
   *
   * `height` is the frame's height in CSS px (default 120); size it to the
   * state, since a tall frame round a 46px row is mostly empty.
   */
  preview?: { src: string; height?: number }
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
  /** Render the component's live preview as its own section, directly under the
   *  Quick Summary. OPT-IN and meant for SMALL components: it is the real
   *  render, so a component that stacks every variant (e.g. the renewal-states
   *  trio at ~2,900px) would bury its own spec underneath it. */
  showPreview?: boolean
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
  /** DESIGNER'S NOTES (2026-10-26, Jillienne: "blank on default, and you can
   *  ask the designer for any additional notes when the handoff is being
   *  created"). Free-form paragraphs from the designer to engineering —
   *  anything the structured sections have no slot for. Rendered as the LAST
   *  section of the one-page handoff, drawn even when empty so a reader can
   *  see there was nothing to add, and exported to Markdown only when there
   *  is something. `/dev-handoff-notes` asks for it at the end of authoring. */
  designerNotes?: string[]
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
  /* `prototypeScope?: PrototypeScope` STOOD HERE (2026-10-14 → 2026-11-21):
     which surface a Prototypes row was the source of truth for. Gone with the
     section — `prototypes-section` in `archivedItems.ts`. A handoff names its
     surface with `surface` below, which is a different claim. */
  /**
   * When this row last changed — an ISO timestamp, shown on the row as its
   * "Updated" tag (2026-10-14, Jillienne's ask). On a dev handoff it is
   * stamped by `/dev-handoff-notes` on every write; `HandoffFolder.test.ts`
   * checks it parses. (It was the Prototypes rows' "last changed on `main`"
   * stamp too, maintained at the merge, until that section went on
   * 2026-11-21.)
   */
  lastUpdated?: string
  /* `linkRetired?: boolean` STOOD HERE (2026-11-17 → 2026-11-21): the
     deactivated Prototypes link, which drew the row live and sent the click to
     `/prototype-unavailable/<id>` and its message. Gone with the section and
     the screen (`PrototypeLinkRetiredPage.tsx`, on `hub-advanced`). */
  /**
   * DEV HANDOFF ROWS ONLY (2026-10-27, Jillienne on the Development board:
   * "above the feature tag, add the designer tag and last updated tag, same
   * styling we do on the prototypes page … feature could be updated to Atlas,
   * Invite Flow, Compass, or Admin"). `surface` is which product surface the
   * handoff is about — the kind tag's word — and `owner` is the designer who
   * wrote it, the tag with the user icon — the person who RAN the routine, not
   * the surface's owner (2026-10-27: four Atlas Home rows briefly read "Eric"
   * off a fallback to the scope owner; Jill wrote them). No fallback now. `lastUpdated` is reused for the Updated tag: when the handoff last
   * changed, stamped by `/dev-handoff-notes` on every write.
   *
   * ⚠ This is the handoff's own claim about what it covers, not "this row IS
   * the surface" — that was the Prototypes rows' `prototypeScope`, gone with
   * them.
   */
  surface?: PrototypeScope
  owner?: string
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
  /**
   * Anything this feature points at that lives elsewhere — research, decks,
   * transcripts, write-ups, Figma files, a deployed build — surfaced as its own
   * "Links:" line in the gateway header. Deliberately open-ended rather than
   * scoped to one kind, so a link can just be added as needed. Same two-source shape as
   * `jiraTickets`: this array is the shared baseline everyone sees, and links
   * added at runtime persist per browser in localStorage and merge with it.
   *
   * `label` is optional but usually worth writing: unlabelled falls back to the
   * hostname, and these URLs often end in a document id, so a row of
   * unlabelled ones reads as noise.
   *
   * NOT the `links` nav section — that is the dashboard's shared address book;
   * this is scoped to one feature and sits beside its Jira row.
   */
  links?: { url: string; label?: string }[]
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
   * Zoom the LIVE preview thumbnail into one region instead of showing the
   * whole page at 1/4. The rectangle is in the 1440-wide frame's own CSS
   * pixels: `x`/`y` is its top-left, `w` its width, and the height follows
   * from the thumb's aspect — so a focus is "start here, this wide".
   *
   * GEOMETRY, because it decides what you can ask for: the thumb is 360x244
   * and the frame is 1440 wide, so showing the full width IS the 1/4 render
   * (1440 / (360/244) = 976, the whole page). Any real zoom therefore crops
   * horizontally. A wide, short subject cannot be both fully spanned and
   * legible — pick which end matters.
   *
   * Ignored when `thumbnail` is set (a flat image is already the crop it is).
   */
  thumbnailFocus?: { x: number; y: number; w: number }
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
 *  Since 2026-11-21 the hand-authored rows are the four Atlas Home dev
 *  handoffs of 2026-10-19 alone; every newer handoff is a file in
 *  `src/data/handoffs/` (spread in below). Until that day this array also
 *  opened with the five Prototypes rows and the fourteen Explorations rows —
 *  the standalone HTML documents served from this repo's `public/prototypes/`
 *  at `PROTOTYPE_BASE = '/prototypes'`, same-origin so the site password
 *  covered them, copied in from `jill-dashboard-ux-designs/explorations/
 *  finserv-learner-brief/` by `./deploy-xcel-prototypes.sh` there. The rows,
 *  the constant and the reasoning (why same-origin rather than a pointer at
 *  the Common LMS deploy; why Explorations and not Design) are verbatim on
 *  `hub-advanced`; the documents are still in `public/prototypes/` and the
 *  smoke suites still test them.
 * ───────────────────────────────────────────────────────────────────────── */

const AUTHORED_FEATURES: PrototypeFeature[] = [
  /* THE PROTOTYPES AND EXPLORATIONS ROWS STOOD HERE until 2026-11-21 — the
     five `category: 'prototype'` rows (`xcel-dashboard`, `xcel-invite`,
     `xcel-atlas-learning`, `xcel-compass`, `xcel-admin-coming-soon`) and the
     fourteen `category: 'exploration'` document rows. The simple Hub has
     neither section; both sets are verbatim on the `hub-advanced` branch
     (`git show hub-advanced:src/data/prototypeFeatures.ts`) and the rows
     `prototypes-section` and `explorations-section` in `archivedItems.ts`
     say how to bring them back. The documents themselves are untouched
     under `public/prototypes/`. The two 2026-10-15 archive notes that said
     "cut-and-paste back at the marked spot" (`desktop-platform-row`,
     `admin-tool-row`) now mean the spot on `hub-advanced`. */
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
     * devStatus: 'ready-for-dev' (2026-10-22). No `quickSummary` yet — ask
     * before writing one.
     */
    id: 'xcel-atlas-home-course-head',
    surface: 'atlas',
    owner: 'Jill',
    lastUpdated: '2026-10-21T17:44:45Z',
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
    devStatus: 'ready-for-dev',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home — the final prototype',
        note: 'The course head leads the card. Click the cover image to flip between the two header layouts.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-home-long-title', label: 'Long title', note: 'Swaps in the long course name, here and on Invited Product Detail / Checkout at once. Off by default.' },
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
          location: 'Src/components/compass/AtlasHomeEricE2E.tsx — the course-head block inside `AtlasHomeEricE2E` (not exported separately), plus `WhiteStyleHead`',
          summary:
            'Cover image, a "Current course" eyebrow, the title, an access-expiry meta row and the action row — Course Overview and Begin/Resume Course, joined by View Certificate once the course is complete and by Purchase Extension from a week out. The cover sits beside a vertically centred title, meta row and actions.',
          variants: [
            { name: 'Not started', when: 'The learner has not opened the course.', detail: 'The button reads "Begin Course".', why: 'The first click into a course is a different promise from returning to one.', action: '"Begin Course" opens the first lesson.', howToSee: 'Demo bar → Progress → Not Started' },
            { name: 'In progress', when: 'The learner has started but not finished.', detail: 'The button reads "Resume Course".', why: '"Resume" only makes sense once there is somewhere to resume to.', action: '"Resume Course" returns them where they stopped.', howToSee: 'Demo bar → Progress → On Track' },
            { name: 'Course complete', when: 'The learner has finished the course and still has access.', detail: 'The eyebrow becomes "Congrats! You have completed this course." in place of "Current course", and the meta row drops its countdown and shows the access date alone. ⚠ The days figure is time the learner still needs; at the end it is time they no longer have, so counting it down reads as a deadline against work already done. The access date stays — access really does end then, certificate or no certificate.', why: 'The eyebrow is the card’s status line, and a finished course still labelled "Current course" is the status being wrong. Moving the celebration there also leaves the meta row doing one job — saying when access ends — instead of carrying a countdown and a congratulation at once.', action: 'The primary button becomes "Review Course" and opens the coursework, the same place Resume does. "View Certificate" appears beside Course Overview — reviewing the material and collecting the certificate are different things a finished learner wants, so both are offered rather than one standing in for the other.', howToSee: 'Demo bar → Progress → Ready 100%' },
            { name: 'Expires soon', when: 'Seven or fewer usable days of access are left — but more than two.', detail: 'The meta row turns amber: the label, the date and the count all step to Warning 700, the count to bold, "to complete" becomes "left to complete", and a triangle-exclamation leads the line. The icon is part of the state, not decoration — it is the cue that survives a greyscale screen, where the tone alone says nothing at all. A "Purchase Extension" button also appears first in the action row, outlined in the same amber. The title is untouched.', why: 'A countdown the learner is meant to notice has to read differently from one they are meant to ignore — and the offer has to be on screen while they can still act on it, which is the only reason to warn them at all. Amber first, red only in the last two days: a warning that looks like a failure stops being a warning.', action: 'Purchase Extension joins Course Overview and Begin/Resume; none of the three is taken away.', howToSee: 'Demo bar → Expires → 7 days' },
            { name: 'Down to the last days', when: 'Two or fewer usable days of access are left.', detail: 'Red. The row steps to Error 600 and the mark becomes a calendar-exclamation; Purchase Extension re-outlines in the same red. On the last usable day the count stops being a figure: the row reads "Course Access Ends: 05/12/2026, Today is the last day!" rather than "0 days", because a literal zero reads as a bug rather than as urgency. All three buttons stay — the learner can still work today, so nothing is taken away; what was added is the way to buy more time.', why: 'A quantity and a deadline are different things and have to read differently. "2 days" is still something to plan against; today is not, so the sentence replaces the sum. Red rather than amber because this is the last point at which acting still helps.', action: 'Purchase Extension, Course Overview and Begin/Resume — all three.', howToSee: 'Demo bar → Expires → 1 day' },
            { name: 'Expired', when: 'Access ended before the learner finished.', detail: 'The card reshapes, and the parts are one decision. The eyebrow reads "Expired". The meta row goes past tense — calendar-exclamation, then "Course Access Ended: 05/08/2026" — in Neutral 800, with no count at all, because there is nothing left to count. Course Overview and Begin/Resume both come off: Overview opens Compass, which is the course, and there is nothing to resume. A single primary "Purchase Extension" stands where the two of them were. The panel also drops Primary 100 for the Course Progress card’s own tan, so the two read as one material in two states.', why: 'Access ending is not another point on the progress scale — the course stops being something to resume and becomes something to buy. Eyebrow, tense, panel and call to action all change together because they are all saying the same thing, and the purchase takes the primary treatment because nothing else is left for it to compete with.', action: '"Purchase Extension", alone and primary — drawn, not wired. See the `xcel-purchase-extension` handoff, which gathers all four surfaces that make this offer.', howToSee: 'Demo bar → Expires → Expired' },
            { name: 'Long access window', when: 'More than sixty days of access are left.', detail: 'The count switches unit: "57 weeks to complete" rather than "399 days". The remainder is dropped when the weeks divide evenly, so it reads "57 weeks" and not "57 weeks, 0 days"; otherwise it is "12 weeks, 6 days". Sixty itself still counts in days — the threshold is "more than".', why: 'A three-figure day count stops being a quantity anyone can feel. "399 days" reads as "a lot"; "57 weeks" says the same thing in a form the learner can picture against a calendar. Under the threshold days stay days, because that is the unit someone with a fortnight left is already thinking in.', action: 'Unchanged.', howToSee: 'Demo bar → Expires → 90, 120 or 400 days' },
            { name: 'No end date', when: 'The course has no access-expiry date.', detail: 'The Expires / days-to-complete row is omitted entirely — never a blank row and never a zero.', why: 'A row reading "Expires: —" tells the learner less than no row at all.', action: 'Unchanged; only the meta row goes.' },
            { name: 'Long title', when: 'The course name is too long for one line.', detail: 'The title wraps rather than truncating, and the meta row and buttons move down with it. Worth building against the longest real course name, not the demo one.', why: 'Course names are supplied data, so the layout has to survive the long ones.', action: 'Unchanged.', howToSee: 'Demo bar → Long title' },
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
              'Responsive, and the rendered proof is below. The cover holds its 256px; the title column carries a 436px basis — what its three buttons measure — so it keeps the width its own content needs instead of being the first thing squeezed. ⚠ Four pixels of headroom at the design width: the buttons measure 436 in a 440 column, so a longer label on any of the three puts the action row over onto a second line. Below about 796px the cover and the column stack rather than the column collapsing.',
              'Padding and margins, measured off the Final Prototype — 40px inset all round on the panel, 24px between the cover and the title column, 15px between the title block and the action row, 8px between buttons, 32px below the panel before the progress row. Corners: 20px on the panel, 12px on the cover.',
            ],
            sources: [
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
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
            { name: 'View Certificate', does: 'Opens the actual certificate in a new tab — most likely through a PDF viewer plugin, not an in-app page. Appears beside Course Overview once the course is complete; it does not replace Review Course, because the two offer different things. ⚠ Today it routes to the My Certificates list instead, which is a placeholder for the real document.' },
            { name: 'Review Course', does: 'Reopens the coursework in Compass — the same destination as Resume Course. Shown once the course is complete and access is still available, because reviewing the material is what a learner does between finishing the coursework and sitting the state exam.' },
            { name: 'Purchase Extension', does: '⚠ Drawn, not wired — it does nothing today. Intended to sell more access time; the open questions behind it are on the `xcel-purchase-extension` row — what is being sold, whether progress returns, and where the button goes are all still unanswered. Appears beside the other two on the last day, and alone once access has gone.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'What is the Purchase Extension flow?',
            decision:
              'Not understood yet, and the button is already drawn in three states — outlined in amber from seven usable days out, in red inside the last two, and alone and primary once access has gone. Nothing happens when it is pressed. What is being sold (more days, a new window, the course again), where the button goes (a checkout, a sheet over Home, the existing Invite & Purchase checkout), and whether the offer changes with how much of the course was finished are all open; they are written up on the `xcel-purchase-extension` row, which exists for exactly this. Until it is answered a build should treat the button as a placeholder, not a route.',
            status: 'Needs weigh-in',
            owner: 'Jillienne',
          },
          {
            question: 'What number of days left should turn the course access amber?',
            decision:
              'Seven usable days for amber, two for red — `courseExpiryTier` in `src/data/courseExpiry.ts`, and it is the one place the question is answered. Counted in days the learner can actually study in (expiry minus one), because "under seven days" has to mean seven days of work or the warning fires a day before the figure beside it justifies. ⚠ It is not `courseExpiryState`, and the two are not rivals: that one answers a catalogue question — should this card in a grid of thirteen wear a badge? — over a per-course window defaulting to 60 days and clamped to half the enrolment period. This answers a hero question: the learner is looking at one course, and how close is the end? Same module, two spans, on purpose.',
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
     * ATLAS HOME — BELOW THE COURSE CARD. 2026-10-19, rescoped 2026-10-21
     * ("lets adjust so that everything below the course card is all part of
     * this one feature ticket"): three components — the Panel, Steps 1–3 and
     * the Exam Date — because an exam date set in Step 2 re-plans the pace
     * column, and one Progress control drives the dial, the readiness band and
     * the journey's current stop together.
     *
     * ⚠ THIS HEADER NAMED `AtlasCourseProgressStates` UNTIL 2026-10-22, which
     * was the tan five-state card — a DIFFERENT component, whose handoff was
     * retired on 2026-10-21 (`atlas-home-progress-states-handoff` in
     * `archivedItems.ts`). It survived the rescope by being a comment nobody
     * reads while editing the data below it.
     *
     * devStatus: 'ready-for-dev' (2026-10-22). No `quickSummary` yet — ask
     * before writing one.
     */
    id: 'xcel-atlas-home-below-course-card',
    surface: 'atlas',
    owner: 'Jill',
    lastUpdated: '2026-10-22T12:39:39Z',
    title: 'Atlas Home — Below the Course Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'Everything on the Atlas Home below the course card: the progress panel on the left, the three Study Journey steps on the right, and the exam date that ties them together.',
    tileBlurb:
      'The progress column and the Study Journey, and every scenario where one moves the other.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'ready-for-dev',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home — the final prototype',
        note: 'Leads the left column — the ring card, which is what a bare `?demo=1` renders. Use UI/UX Demo Tools → Progress to move the figures; the Design bar’s Study pace card control switches to the `states` card.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-v3-progress', label: 'Progress', note: 'Which of the five states the module opens on (`not-started`, `on-track`, `milestone`, `completed`, `expired`). Readiness and the Study Journey’s current stop follow the same pick.' },
      { id: 'atlas-pace-card', label: 'Study pace card', note: 'Leave it on `ring` — that is the committed default and the only version this handoff describes. The flag still has a `states` variant that renders the tan five-state card, but the concept is retired and is no longer documented anywhere; see `atlas-home-progress-states-handoff` in the Archive. Setting it to `states` shows a card nothing here describes.' },
      { id: 'atlas-readiness-section', label: 'Readiness section', note: 'The gate on this whole panel, and it is off on main (`defaultEnabled: false`). `src/components/compass/AtlasHomeEricE2E.tsx` renders the card under `{!showReadiness ? Null : …}`. A design-bar control, but the default is what ships.' },
    ],
    devHandoff: {
      intro:
        'One card, five states, advanced by clicking anywhere on it (or Enter/Space) — A review device standing in for whatever will eventually read the learner’s real progress record.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-panel',
          name: 'The Panel',
          tabLabel: 'The Panel',
          location: 'The panel is the Home\'s own layout (`WHITE_PROGRESS_PANEL` in src/components/compass/AtlasHomeJillMain.tsx); the parts inside it are src/components/compass/AtlasPaceRingCard.tsx and src/components/compass/AtlasReadinessCard.tsx.',
          summary:
            'The left column of the Atlas Home. One panel, 296px wide, holding four things in order: course progress, the study pace, estimated completion, and exam readiness. A booked exam date adds a fifth row. The states below cover the panel as a whole first, then the study pace on its own, then the readiness bands.',
          variants: [
            { name: 'Course progress — 0%', when: 'Nothing started.', detail: 'Empty ring, "0% COMPLETE" in the middle.' },
            { name: 'Course progress — 36%', when: 'Part-way through.', detail: 'The arc fills clockwise from the top. The figure is the learner’s real percentage.' },
            { name: 'Course progress — 100%', when: 'Coursework finished.', detail: 'Full ring. It stays on screen — completion and readiness are different things, and a learner can be ready before they are finished.' },

            { name: 'Study pace — the default, at 0%', when: 'A plan fits and the learner has not started.', detail: 'The pace name and week goal, the hours a week, and the starting-point line with its "here" link to the planner. Estimated completion sits underneath with its own countdown.', why: 'On day one there is no standing to report, so the card offers the plan and a way to change it.', action: '"here" opens the study planner in Compass.', howToSee: 'A bare ?demo=1.' },
            { name: 'Study pace — on track', when: 'The learner is keeping to the goal.', detail: 'The starting-point line is replaced by how they are doing: "You’re averaging 4 hours a week. That’s right on track for your 3-week goal."', why: 'Once there is a pace to report, how it is going is worth more than advice about setting one.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → On track.' },
            { name: 'Study pace — ahead of goal', when: 'Averaging more than the goal asks.', detail: '"…That’s ahead of your 3-week goal — keep it up and you’ll finish early."', why: 'The only line on the card about the learner rather than the plan, so it is the only thing that moves.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → Ahead of goal.' },
            { name: 'Study pace — behind, recoverable', when: 'A little under the goal, with time to recover.', detail: '"You’re averaging 2¾ hours a week, just under your goal. One extra study session this week will help you get back on track."', why: 'Being slightly behind is the most common state and the most fixable, so the line names the fix instead of the failure.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → Behind — recoverable.' },
            { name: 'Study pace — off track', when: 'At this rate the learner will not finish by the estimated date.', detail: '"…At this rate you won’t finish by Nov 2. Open your Study Planner to adjust your goal." It names the date it is measured against, and Study Plan is a link.', why: 'This is the one standing where the plan itself has stopped being true, so it is the one that asks for the plan to change.', action: '"Study Planner" opens the planner.', howToSee: 'Demo bar → Pacing standing → Off track — adjust the goal.' },
            { name: 'Study pace — no data yet', when: 'The learner has logged nothing this week — which is not the same as nothing ever.', detail: '"No study time logged yet this week. Your 3-week goal asks for about 4 hours a week." No averaging clause, because there is nothing to average. ⚠ It cannot happen at 0%: until a learner starts, the card shows the starting-point line and no standing at all. So this is someone part-way through who has taken the week off — which is why the dial beside it reads 42% and not zero.', why: 'Zero is not a standing. "Averaging 0 hours" reads as failure on a week that may be one day old.', action: 'Unchanged.', howToSee: 'Demo bar → Pacing standing → No data yet, with Progress anywhere above Not Started.' },
            { name: 'Study pace — no plan fits', when: 'There is not enough time left for any honest plan.', detail: 'The goal row and the figures go. The card names whichever deadline bound it: the exam ("coursework has to finish seven days before your exam") or the access window, which also offers an extension. ⚠ The exam is checked first.', why: 'An honest refusal beats a plan that cannot be met, and naming the deadline tells the learner which one to change.', action: 'Extend your access, on the access branch only.', howToSee: 'Demo bar → Expires → 1 day, or enter an exam date inside a week.' },

            { name: 'With an exam date entered', when: 'The learner has booked a state exam.', detail: 'A second figure row joins Estimated completion — the exam, with its own countdown — and the plan above re-plans to finish seven days before it. Entering 28 May moved the card from "4 Week Goal · June 5" to "1 Week Goal · May 17".', why: 'A booked date outranks an estimate: the plan has to be read against the deadline the learner committed to.', action: 'None here. The date is set, changed and removed in Step 2 of the Study Journey.', howToSee: 'Study Journey → Step 2 → Add Date.' },
            { name: 'Exam before the course expires', when: 'The exam falls inside the access window — the learner will sit it while the course is still open.', detail: 'The EXAM binds, because it comes first. The plan compresses to finish seven days before the exam rather than running to the access date, so the week goal and the hours a week both rise. Against a 10 June window, a 2 June exam gives "2 Week Goal · about 8 hours a week · May 22", where the same card with no exam reads "4 Week Goal · about 3 hours · June 5". ⚠ Estimated completion still sits ABOVE the exam, and always will — the plan is built to land seven days before the exam, so the two rows cannot swap places.', why: 'Two deadlines exist and only the earlier one can bind. Planning to the access date here would promise the learner time they will not have before they sit the exam.', action: 'None — both rows are figures.', howToSee: 'Step 2 → Add Date → a date before the Expires setting.' },
            { name: 'Exam after the course expires', when: 'Access runs out before the exam — the learner loses the course with the exam still ahead.', detail: 'ACCESS binds, not the exam. The plan is built to finish before access ends and is identical to having no exam at all; the exam row sits below it as a later milestone the plan does not reach. Against a 10 June window, a 15 July exam still reads "4 Week Goal · June 5". ⚠ The learner can buy their way out of this one: an extension keeps the course open between the access date and the exam, and the plan then re-plans to the exam instead.', why: 'A learner cannot study after access ends, whatever their exam date says, so the plan has to respect the closer wall. Naming the exam below it is what shows them the gap an extension would close.', action: 'The extension offer is on the course card above; nothing on this card changes it.', howToSee: 'Step 2 → Add Date → a date after the Expires setting.' },

            { name: 'Access has ended — the course expired', when: 'The access window has closed. Whatever the exam date said, there is no coursework to pace any more.', detail: 'Everything below the dial goes: the pace, the week goal, the estimated completion, the exam row and the divider between them. The eyebrow reads "Progress paused", the arc turns neutral, and one line gives the percentage reached and the extension window. ⚠ This is the end of every state above it, including the two exam ones — an exam still ahead does not keep the plan alive, because the learner has nothing left to study.', why: 'A plan is advice about a future the learner no longer has. How far they got is the one fact still worth showing, and it is the argument for buying more time.', action: 'Purchase an extension — the offer is on the course card above.', howToSee: 'Demo bar → Expires → Expired.' },

            { name: 'Access has ended — with the exam still booked', when: 'The alternative to the state above, for a decision — not something the product does today.', detail: 'The same expired card, with the exam row kept below the dial. It is the only row that could survive, and it brings its own hairline back with it. One prop apart from the state above: `examWhenExpired` on `AtlasPaceRingCard`. ⚠ Both Homes already pass `expired` and `exam` together, so choosing this is a default to change rather than a feature to build.', why: 'For: a booked exam is the strongest reason to buy the extension, and the line over the dial is already making that pitch. Against: the card is deliberately stripped to the one fact that still matters, and a date the learner can do nothing about from here is a second.', action: 'Purchase an extension — unchanged, and still on the course card above.', howToSee: 'Not reachable in the product. This row is the only place it renders.' },

            { name: 'Readiness — Not Started', when: 'Nothing scored yet.', detail: 'The track is drawn and no arc is. ⚠ Not a sixth band — "nothing measured yet" is not a point on the scale.', why: 'An empty dial says the measurement has not happened; a dial at zero says the learner scored nothing.', action: 'None.', howToSee: 'Demo bar → Progress → Not Started, with the Readiness section on.' },
            { name: 'Readiness — Beginner', when: 'Early in the course.', detail: 'Dial at 14%. "Early in development, with substantial knowledge gaps."' },
            { name: 'Readiness — Developing', when: 'Making progress.', detail: 'Dial at 36%. "Building competency, but still has meaningful gaps."' },
            { name: 'Readiness — Proficient', when: 'Past the milestone.', detail: 'Dial at 75%. "Strong understanding; has not yet reached the ready threshold."' },
            { name: 'Readiness — Ready', when: 'At the top of the scale.', detail: 'Dial at 100%. "Considered ready for the target outcome or exam." ⚠ Readiness is not completion — a learner can finish a course and not be ready.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Panel fill', token: '--color-atlas-tan-100' },
              { role: 'Rules between the parts', token: '--color-atlas-nav-rule' },
              { role: 'Section eyebrows', token: '--color-neutral-800' },
              { role: 'Panel', token: 'Transparent — the outlined panel comes from the Home (`WHITE_PROGRESS_PANEL`), not from this card' },
              { role: 'Eyebrow', token: '--color-neutral-800 (shared via `atlasSectionEyebrow`)' },
              { role: 'Divider under Course progress', token: '--color-atlas-nav-rule' },
              { role: 'Dial figure', token: '--font-heading-serif' },
              { role: 'Goal note', token: '--font-body' },
              { role: 'Card surface', token: '--color-atlas-tan-200 — dropped entirely under the Combined panel option' },
              { role: 'Eyebrow + caption ("Overall readiness")', token: '--color-primary-500' },
              { role: 'Dial track', token: '--color-atlas-tan-500' },
              { role: 'Dial fill', token: '--color-atlas-dial-fill, falls back to --color-primary-500 — same fallback Course Progress’s dial uses' },
              { role: 'Level name', token: '--font-heading-serif, --color-primary-800' },
              { role: 'Rules above/below the question', token: '--color-atlas-tan-300' },
            ],
            responsive: [

            ],
            states: [

            ],
            sources: [
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page. Append `?ff=atlas-readiness-section` to see the readiness part; it is off by default.',
              'Implemented in src/components/compass/AtlasPaceRingCard.tsx and src/components/compass/AtlasReadinessCard.tsx, inside the Home\'s own panel.',
            ],
          },
          statesMatrix: [
            { question: 'What are all the Progress possibilities?', answer: 'Ten steps, not five — `ATLAS_PROGRESS_LADDER` is the list, and the Progress control draws straight from it: Not Started 0% · Beginner 14% · Developing 36% · Proficient 75% · Education Completed 80% · Certification Exam Passed 86% · Prep Review Completed 92% · Exam Simulators Completed 95% · Affidavit Signed 98% · Ready 100%. The default is Not Started. Every step carries its own percent and its own readiness band, so the dial and the half-dial can never be stepped out of sync — the mapping is the `readiness` field on the step, not a second table. And 80 is a finish line, not just a number: `lessonsDoneFor` reads it off that step, so it is where "36 of 36" is reached.' },
            { question: 'What are ALL the pacing possibilities?', answer: 'Three axes, and they compose. (1) intensity — `dashboard-pace-style`, a multiplier on the hours the course claims: Crammer ×0.75, Average ×1 (default), Thorough ×1.3. It moves the week goal, the hours a week, the completion date, the pace name and the pace icon together. (2) standing — `atlas-pace-standing`, the sentence under the goal: On track (default) · Ahead of goal · Behind — recoverable · Off track — adjust the goal · No data yet. (3) whether a plan fits at all — fits, or does not, and when it does not the card names which deadline bound it: both cases share the heading "Not Enough Time Remaining" and differ below it — access-bound gives the days of access left and offers an extension; exam-bound says there is not enough time before the exam date and offers rescheduling, because a booked exam cannot be extended. ⚠ The exam is checked first, and those two sentences are now the only thing telling a learner which deadline bound them. Intensity is on the design bar and standing is on the demo bar, so the two are reached from different places.' },
            { question: 'What changes when an exam date is entered, versus not?', answer: 'Not entered (the default): Estimated completion is the only figure row, and the plan is bound by the access window alone. Entered: a FLORIDA STATE EXAM row joins beneath it with its own count, and the pace RE-plans against the exam — coursework has to finish seven days before it (`EXAM_BUFFER_DAYS`). Measured on the prototype: adding 28 May moved the plan from "4 Week Goal · June 5" to "1 Week Goal · about 14 hours a week · May 17". Push the date inside the buffer and no plan fits at all, named as exam-bound. Both columns are reachable here — Step 2 of the Study Journey owns the date: Add Date, the calendar, Edit and Remove all live on this page and write `cgp.examDate`.' },
            { question: 'What changes when Readiness is shown, versus not?', answer: 'Not shown, and that is the default (`atlas-readiness-section` is `defaultEnabled: false`): the panel is three parts and nothing marks the absence — no placeholder, no gap. Shown: the half-dial joins as a fourth part, sharing the panel and the column\'s eyebrow rather than bringing a card of its own, and the pace card drops its bottom padding to 0 so the two sit flush. Its own five states are Not Started (track drawn, no arc — an absence of measurement, not a band) and then Beginner · Developing · Proficient · Ready. It opens on the band the Progress step names and can then be clicked forward independently.' },
            { question: 'What does the whole panel do once access has ended?', answer: 'It keeps the dial and drops everything that describes a plan — the pace name, the goal, the standing sentence, Estimated completion and the exam row all go, and so does the hairline under Course progress. Readiness is hidden too, even with its flag on. The eyebrow reads "Progress paused", the arc steps to neutral, and one sentence names the percent reached. ⚠ This outranks every axis above it: no intensity, standing or exam date changes it.' },
            { question: 'What does a bare ?demo=1 actually open on?', answer: 'The plan branch. The committed default is 0% progress on the Automatic access window — thirty days — which still fits a study plan, so the section opens on "Average · 4 Week Goal" with an Estimated completion beneath it. A reviewer who changes nothing never sees the no-plan branch.' },
            { question: 'What if the learner has booked an exam and access is running out?', answer: 'The EXAM is checked first. If the coursework cannot finish seven days before a booked exam the card is exam-bound, whatever the access window says — A date the learner has committed to outranks one they can still extend.' },
            { question: 'Is this card safe to restyle?', answer: 'The layout yes, the data no. Its panel markup was duplicated from the tan card rather than shared, so editing what it draws touches nothing else. The pace model underneath is shared — change `studyPace` and every surface that reads it moves with you.' },
            { question: 'What if a progress stage has no readiness band mapped to it?', answer: 'It falls back to Beginner, the first band.' },
            { question: 'How does a reviewer move it through the bands?', answer: 'The Progress control on the demo bar, and only that — each of its ten steps names the band it opens. It is not a control: a card that changes itself lets a stakeholder knock the demo out of step with the bar mid-walkthrough, with nothing on screen explaining why it moved.' },
          ],
          edgeCases: [
            'The panel belongs to the Home, not to a component. There is no `<ProgressPanel>` to build against — `WHITE_PROGRESS_PANEL` is a style object in the Home, and each card renders `bare` inside it. A developer wiring these into a different page has to bring the panel with them, or both cards will draw without a surface.',
            'The two date rows never change order. Estimated completion is the plan\u2019s finish date, and every plan is clamped to the binding deadline \u2014 the exam minus seven days, or the access date \u2014 so the finish is always the earlier of the two and always on top. There is no state where the exam is the nearer date while both rows show. The one state where the exam IS the nearest thing on the card is "no plan fits", and there the estimated completion row is absent entirely.',
            'Every band is reachable from the Progress control (2026-10-20). Under the retired five-level scale the sync map topped out at Proficient and Exam Ready could only be reached by clicking the card; with four bands, `completed` maps to Ready — the top — so nothing is undemoable through the Progress control any more. The empty Not Started state is the one thing the map does not produce: it needs the `notStarted` prop.',
          ],
          ctas: [
            { name: 'None of its own', does: 'The panel is a container, and only the pace card has controls — "Customize Your Pace" and "Extend your access". Readiness has none: it is a readout, and nothing on it responds to a click.' },
            { name: 'Customize Your Pace', does: 'Opens Compass\'s study planner, where the learner picks a pace. Nothing persists the chosen pace back to this card yet.' },
            { name: 'Extend your access', does: 'Shown only in the access-bound no-plan branch. Drawn, not wired — it is the same offer the course head\'s Purchase Extension makes.' },
          ],
        },
        {
          id: 'atlas-home-steps',
          name: 'Steps 1–3',
          tabLabel: 'Steps 1–3',
          location: 'Src/components/compass/AtlasHomeEricE2E.tsx (JourneyRow, Step) + src/components/learning/studyJourneyUtil.ts (journeyStopsFor) + src/data/nyProducerRequirements.ts (GET_LICENSED_STEPS, jurisdictionName)',
          summary:
            'The three steps down the right of the Home. Step 1, "Complete Coursework", lists the course sequence; Step 2 is "Pass State Exam"; Step 3 is "Get Licensed in {state}", which takes the state name from the published licensing data. The list follows the learner: completed stops carry a check, the one they are on is bold, and Pre-Licensing Education shows a live "N of 36 completed". Every step of the Progress control moves it, because each one carries its own `stepsDone`.',
          variants: [
            { name: 'Nothing started', when: 'Day one — no lesson opened yet.', detail: 'No row carries a check. Pre-Licensing Education is the bold current stop and reads "0 of 36 completed".', why: 'The sequence is worth seeing before any of it is done; it is what the learner bought.', howToSee: 'Demo bar → Progress → Not Started 0%' },
            { name: 'Default', when: 'The learner is working through the coursework.', detail: 'Step 1 is headed "Complete Coursework" and lists the course sequence: Pre-Licensing Education (N of 36 completed) · Certification Exam · Prep Review (23) · State Exam Simulators (3) · Affidavit · Survey & Certificate. A "Pre-course Affidavit" row sits above those six and is dropped whenever the pre-course affidavit is off, which is the default — so six rows is what a reviewer normally sees, and seven includes the affidavit row. The current stop is bold with an open ring; the ones behind it carry a check. The figures in brackets — Prep Review (23), State Exam Simulators (3) — are constants. Step 2 carries the exam-date prompt ("When is your exam?", with Add Date and Exam Information beneath) and Step 3 the learner’s own state over an "Applying for a License" line; neither ever changes.', why: 'The journey is three steps long and only the first one moves — showing all three keeps the state exam and the licence in view from day one.', action: 'Everything blue here is a link. Step 1\u2019s rows open the course material — the handler is `onOpenStop(stop.id)`, and that is what a learner clicking "Pre-Licensing Education" should get. Exam Information and Applying for a License open their sheets. ⚠ Build the stop links — the prototype just will not follow them. `LINKS_OFF` in `AtlasHomeJillMain` withholds the handler, because leaving Home is the one thing this demo refuses to do — the two sheets are exempt only because a sheet opens over Home and closes back to it. So the stop rows are inert in these renders and on the prototype, and that is the demo, not the design.' },
            { name: 'Part-way through the coursework', when: 'Lessons done, the first stop still open.', detail: 'Still no checks — the education row is one stop and it is not finished until 36 of 36. Only its count moves, to "16 of 36 completed".', why: 'A stop ticks when it is done, not when it is going well. The count is what carries progress inside a stop.', howToSee: 'Demo bar → Progress → Developing 36%' },
            { name: 'Education finished, exam next', when: 'The 36 lessons are done.', detail: 'The first check appears: Pre-Licensing Education reads "36 of 36 completed" and is ticked, and Certification Exam becomes the bold current stop.', why: 'The hand-off between stops is the moment the list earns its place — it answers "what now" without the learner going looking.', howToSee: 'Demo bar → Progress → Education Completed 80%' },
            { name: 'One stop left', when: 'Everything but the survey is behind them.', detail: 'Five checks, and Survey & Certificate is the bold current stop.', why: 'The end of the list is reachable in the demo, so nobody has to take the last state on trust.', howToSee: 'Demo bar → Progress → Affidavit Signed 98%' },
            { name: 'Regulated course — stops unlock in order', when: 'The jurisdiction requires the coursework in sequence.', detail: 'Every stop after the current one swaps its open ring for a small grey padlock. The current stop keeps its ring, and anything already done keeps its check — ⚠ done outranks locked, because a course you finished does not re-lock behind you. The list, the order and the counts are otherwise identical to Default.', why: 'Where the regulator requires sequence, a row the learner cannot open yet has to say so — an open-looking row that refuses the click is worse than a locked one.', action: 'A locked stop does not open — that is the point of the lock. An unlocked one opens the course material as it does on Default.', howToSee: 'Demo bar → Course → Sequencing → Regulated' },
            { name: 'All coursework done', when: 'The learner has finished every lesson.', detail: 'The same list, with the education row reading "36 of 36 completed". Step 1 does not become A Congratulations block. One exists in the component, but it is drawn only by the other progress card — on this page the list stays and the congratulation appears in the course head instead, where the days-remaining line is replaced by "Congrats! You have completed this course."', why: 'The learner still has two steps to go; replacing the list with a celebration would hide the sequence at the moment they need to see what is next.', action: 'None.', howToSee: 'Demo bar → Progress → Ready 100%' },
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
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.' + ' What it shows is the fixed 7-line list, not a computed journey.',
              'Implemented in src/components/compass/AtlasHomeEricE2E.tsx, src/components/learning/studyJourneyUtil.ts and src/data/nyProducerRequirements.ts.',
            ],
          },
          statesMatrix: [
            { question: 'What if the learner has finished the coursework?', answer: 'The education row reads 36 of 36. Step 1 does not become a Congratulations block on this page — that panel belongs to the other progress card.' },
            { question: 'What if the learner is part-way through?', answer: 'Step 1 looks the same at every stage except the count on the education row — no row is ever ticked, and none is current beyond the first.' },
          ],
          edgeCases: [
            '⚠ Dead code worth knowing about: a filter that drops the Attestation & Affidavit stop still runs inside this component, on the computed list Home never displays. It has no visible effect — but it will the moment anyone switches Step 1 over to the real sequence, which is the obvious next change here.',
            'The Completed-stage Congratulations copy ("passed your course exams") is stated unconditionally, with no dependency on whether the Step 1 list (fixed or real) actually shows every stop as complete.',
          ],
          ctas: [
            { name: 'State Requirements', does: 'Opens the state-requirements sheet over the page. The only live control in this whole section.' },
            { name: 'Exam Information', does: 'Opens the exam-information sheet. Shown under Step 2.' },
            { name: 'Applying for a License', does: 'Opens the licence-application sheet. Shown under Step 3.' },
            { name: 'Add Date', does: 'Step 2\'s exam-date prompt. Drawn, not wired on this screen — the exam-date card is the surface that collects it.' },
            { name: 'The Step 1 rows', does: 'Not controls. The coursework list is a checklist here; no row navigates and none shows a chevron.' },
          ],
        },        {
          id: 'atlas-home-exam-date',
          name: 'The Exam Date',
          tabLabel: 'Exam Date',
          location: '`ExamDatePrompt` in src/components/compass/AtlasHomeJillMain.tsx, with the month grid in src/components/compass/AtlasExamCalendar.tsx.',
          summary:
            'How a learner tells the Home when their state exam is. Step 2 asks "When is your exam?"; Add Date opens a month calendar in place; saving turns the step into a completed one showing the day, the days remaining, and an Edit button. The date is stored in `cgp.examDate`, and it does more than display — it re-plans the study pace against the exam.',
          variants: [
            { name: 'When is your exam?', when: 'No date stored — the default, and what every learner meets first.', detail: 'Step 2 reads "When is your exam?" over "Entering your exam date will help us structure your study plan.", with Add Date and Exam Information beneath. Nothing else on the page mentions an exam.', why: 'The question is asked where the answer belongs — the step that IS the exam — rather than in a prompt floating above the journey.', action: 'Add Date opens the calendar in place.', howToSee: 'A bare ?demo=1, with no date stored.' },
            { name: 'The calendar', when: 'Add Date has been pressed.', detail: 'A month grid opens inside the step, with Cancel and Set Exam Date under it. ⚠ It opens on the demo clock, not the wall clock — May 2026 on the fixture, which is what the `today` prop is for: before it, the calendar opened on the real month over a pace model anchored to May, and the same date read two different counts. The past is disabled, 21 of the 43 cells on the May grid, and Set Exam Date stays disabled until a day is picked so the button cannot save nothing.', why: 'Picking in place keeps the learner in the journey. A date is a small answer and does not deserve a page change.', action: 'Set Exam Date saves it. Cancel returns to the question with nothing stored.', howToSee: 'Step 2 → Add Date.' },
            { name: 'The date is added', when: 'A day has been picked and saved.', detail: 'Two things change together, which is why they are shown together. Step 2 becomes a finished stop — "Scheduled" with Edit beside it, over "Thursday, May 28, 2026 | 17 Days" — and the question and Add Date are gone. The column on the left gains a FLORIDA STATE EXAM row under Estimated completion and re-plans the pace to finish seven days before the exam: "4 Week Goal · June 5" becomes "1 Week Goal · about 14 hours a week · May 17". ⚠ Step 1 does not move. The exam changes the plan and the step that asked for it, nothing else on the page.', why: 'A step that has been answered should read as answered — and the date is only worth collecting because it changes the plan, so the handoff shows the plan changing.', action: 'Edit reopens the calendar on the stored date.', howToSee: 'Step 2 → Add Date → pick a day → Set Exam Date.' },
            { name: 'Removing the date', when: 'Edit has been pressed on a stored date.', detail: 'The calendar returns on the saved day and a third button comes with it: Remove, beside Cancel and Set Exam Date. Pressing it clears `cgp.examDate` — Step 2 goes back to asking, the exam row leaves the left column, and the pace re-plans against the access window alone, back to "4 Week Goal · June 5".', why: 'Edit alone lets a learner move a date but never say they no longer have one — and this date drives the pace model, so with no way out a mistyped exam re-plans the course permanently, per browser. Remove is what makes the date safe to enter at all.', action: 'Remove clears the date. Cancel leaves it as it was.', howToSee: 'Step 2 → Edit, once a date is set.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Step heading + the question', token: '--font-body · --color-text-primary' },
              { role: 'Add Date / Set Exam Date', token: '.cre-compass-primary' },
              { role: 'Cancel / Remove / Edit', token: '.cre-compass-secondary' },
              { role: 'Disabled past days', token: '--color-text-tertiary' },
            ],
            responsive: [
              '⚠ Not responsive, and that is the spec. Step 2 sits in the Study Journey column of a fixed desktop layout; nothing in the product renders it at another width.',
              'The calendar opens in flow rather than over the page — the step grows and the steps below it move down. There is no overlay, no focus trap and nothing to dismiss.',
            ],
            sources: [
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page, then Step 2. Every figure in this handoff was read off it on 2026-10-21.',
              '⚠ And it is the only source: these four states have no isolated preview on this page, deliberately. The flow writes `cgp.examDate`, which is the same per-browser key the product reads — so a preview with working buttons would let a reader set the real demo\'s exam date by pressing Set Exam Date inside a handoff, and then wonder why the Final Prototype had re-planned. A render that cannot be pressed would show three of the four states as the same picture. Walk it on the prototype instead.',
              'Implemented in src/components/compass/AtlasHomeJillMain.tsx (`ExamDatePrompt`) and src/components/compass/AtlasExamCalendar.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What does setting a date actually change?', answer: 'Three things at once. Step 2 becomes the Scheduled stop. The pace column gains a FLORIDA STATE EXAM figure row with its own count. And the pace re-plans — coursework has to finish seven days before the exam (`EXAM_BUFFER_DAYS`), so adding 28 May moved the card from "4 Week Goal · June 5" to "1 Week Goal · about 14 hours a week · May 17". Measured, not inferred.' },
            { question: 'Where is the date kept, and who else sees it?', answer: '`cgp.examDate`, in the browser — so it is per-device and survives a reload, and a date set in Compass is already there when Home opens. ⚠ It is not per learner. Two people sharing a browser share an exam date, which is a demo-fixture property and not a shipping one.' },
            { question: 'What date should the calendar open on?', answer: 'Today’s month, with today’s date as the first day a learner can pick. ⚠ The renders on this page open on May 2026 because the whole prototype runs on a fixture clock — the calendar takes `today` as a prop rather than calling `new Date()`, and the demo passes the fixture so the grid and the pace model cannot disagree about what day it is. In the product that prop is today.' },
          ],
          ctas: [
            { name: 'Add Date', does: 'Opens the month calendar inside Step 2. The entry point for the whole flow.' },
            { name: 'Set Exam Date', does: 'Saves the picked day to `cgp.examDate`, closes the calendar and turns Step 2 into the Scheduled stop. Disabled until a day is picked.' },
            { name: 'Cancel', does: 'Closes the calendar and changes nothing — the stored date, if there was one, is untouched.' },
            { name: 'Edit', does: 'Reopens the calendar on the stored date, and brings Remove with it.' },
            { name: 'Remove', does: 'Clears the stored date. Step 2 returns to asking, the exam figure row goes, and the pace re-plans against the access window alone.' },
            { name: 'Exam Information', does: 'Opens the Exam Information sheet — the same one Quick Links points at. Present in every state; it is about the exam, not about the date.' },
            { name: 'Set Exam Date', does: 'Saves the picked date and moves the card to its Date-set state. Disabled until a day is chosen.' },
            { name: 'Edit', does: 'Reopens the calendar on the saved date. A date is not a one-time entry.' },
          ],
        },
      ],
      decisions: {
        items: [
          {
            question: 'When should the readiness summary start showing on the Atlas Home?',
            decision:
              'We need more requirements. There is no rule for when a learner first sees it — today the section is behind a flag that ships off, so whether it appears at all is a setting rather than a decision about the learner. What has to be answered: does it show from enrolment, or only once there is something measured to show, and does it stay once it has appeared.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
          {
            question: 'Should the collected exam date actually drive anything (pace model, Study Journey)?',
            decision:
              'Yes. The date re-plans the pace to finish seven days before the exam, adds the exam row to the pace column, and moves Step 2 to Scheduled. Safe to wire here because Step 2 can show the date, change it and remove it — a page that can only display one leaves the learner no way to undo it.',
            status: 'Decided',
          },
          {
            question: 'Where does the seven-day review buffer come from?',
            decision:
              'Nobody has signed it off. It was invented in the study-plan exploration, which named every unverified rule after itself — this one was `EXAM_BUFFER_INVENTED = 7`, "days between coursework done and sit date", listed with its owner as FinServ + state ops. The product copied the number into `EXAM_BUFFER_DAYS` only so the two surfaces would not quote different gaps. ⚠ It is load-bearing now: it sets the plan a learner is given, and it decides when the card refuses to make one at all. Every "seven days" in this handoff traces back to that one placeholder.',
            status: 'Needs weigh-in',
            owner: 'FinServ + state ops',
          },
          {
            question: 'Should Step 1’s Study Journey list reflect the learner’s real progress?',
            decision:
              'It already does. Every step of the Progress control carries a `stepsDone`, so moving it ticks the stops behind the learner and moves the bold current row forward — Not Started leaves nothing checked with Pre-Licensing Education current; Education Completed checks that row and makes Certification Exam current; Affidavit Signed checks the first five. The lesson count moves with it. ⚠ Completion does not replace the list: the Congratulations block exists in the component but draws only under the other progress card, so this page keeps the list and puts the congratulation in the course head.',
            status: 'Decided',
          },
        ],
        openItems: [
          'Whether seven days is the right review buffer — it is an invented placeholder, and it sets both the plan and the point at which no plan fits.',
          'What the real Progress ↔ Readiness correlation rule will be, once it exists.',
          'Whether the Readiness section ships on — it is `defaultEnabled: false`, so the panel a reviewer sees by default is only half of what this handoff documents.',
        ],
      },
      flagsNote:
        '`atlas-v3-progress` picks the opening state; clicking the card (or Enter/Space) also advances it when the card is wired to the page via `onAdvance`, as it is on Home.',
    },
  },
  {
    /*
     * ATLAS HOME — QUICK LINKS CARD. 2026-10-19. AtlasJourneyLinksCard — the
     * "Quick Links" nav card in its own rail beside the course card.
     *
     * devStatus: 'ready-for-dev' (2026-10-22). No `quickSummary` yet — ask
     * before writing one.
     */
    id: 'xcel-atlas-home-quick-links',
    surface: 'atlas',
    owner: 'Jill',
    lastUpdated: '2026-10-22T12:02:11Z',
    title: 'Atlas Home — Quick Links Card',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The "Quick Links" nav card sitting in its own rail beside the course card — my Courses, My Certificates, and the Exam Information / Applying for a License / State Requirements sheets, several of which are the only working route to functionality the Study Journey section’s own links drop on this page.',
    tileBlurb:
      'My Courses, My Certificates, Exam Information, Applying for a License, State Requirements — in a 234px rail, left of the course card by default.',
    kind: 'guided',
    status: 'ready',
    category: 'dev-handoff',
    devStatus: 'ready-for-dev',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home — the final prototype',
        note: 'Sits in its own 234px-wide rail beside the course card, left by default. Its side is controlled by a flag with no control surface on this version’s own Design bar — see the Overview handoff’s logged decision on `atlas-wip-quick-links-side`.',
        to: '/dashboard-rebrand?demo=1&section=dashboard',
      },
    ],
    featureFlags: [
      { id: 'atlas-wip-quick-links-side', label: 'Quick Links side', note: 'Left (default) or Right — already logged as an open decision on the Overview handoff: this version reads the flag but cannot set it from its own bar.' },
    ],
    devHandoff: {
      intro:
        'A compact nav card of section links and sheet links sitting beside the course card — on Home, several of its sheet links are the only way to reach destinations the Study Journey section’s own inline links drop for this page.',
      components: [],
      uiComponents: [
        {
          id: 'atlas-home-quick-links',
          name: 'Atlas Home — Quick Links Card',
          tabLabel: 'Quick Links',
          location: 'Src/components/compass/AtlasJourneyLinksCard.tsx',
          summary:
            'A bordered 234px-wide card titled "Quick Links" listing section links (My Courses, My Certificates) that switch the shell’s section in place, and sheet links (Exam Information, Applying for a License, State Requirements) that open in-place sheets when the host supplies handlers — which Home does. On Home, two course-page links (Flashcards, Exam Simulator) are hidden via `withoutCoursePages`, and a built but currently-off "Home" row sits above all of them behind a hardcoded constant.',
          variants: [
            { name: 'Default', when: 'The learner arrives on Home.', detail: 'A bordered 234px card titled "Quick Links", five rows: My Courses · My Certificates · Exam Information · Applying for a License · State Requirements. ⚠ Flashcards and Exam Simulator are not in the list — the rail is a navigation card here, not a course-tools card, and the remaining icons step up a size to fill the room.', why: 'One compact place to reach the things that are not on the Home screen itself.', action: 'The three information rows open their sheets, shown below. My Courses and My Certificates each have their own handoff since 2026-11-02 \u2014 `xcel-atlas-my-courses` and `xcel-atlas-my-certificates`. \u26a0 This card does not appear on either of those pages: the Quick Links control hides it there, so it belongs to Home alone and these two rows are the only way in.' },
            { name: 'Hover / focus', when: 'The pointer is over a row, or the row has keyboard focus.', detail: 'A trailing chevron fades in and the label steps to Medium. Both reserve their space, so the row never shifts as it changes — the chevron’s width and the heavier label are held by a hidden duplicate.', why: 'A row has to read as clickable before it is clicked, without the list jumping as the pointer crosses it.', action: 'Activates the row. ⚠ Every row does something as of 2026-11-02: My Courses and My Certificates were drawn with this same hover treatment and wired to nothing, so they read as clickable and were not. They open their pages now.' },

            { name: 'Sheet — Exam Information', when: 'The Exam Information row is pressed.', detail: 'A 480px-wide panel slides in from the right, over the page, headed "Exam Details" — the jurisdiction and provider ("Florida licence · Pearson VUE"), three rows that go deeper, and the Governing Agency block with its name, phone, website and address. The page behind it does not move. ⚠ Each of the three rows opens inside this panel rather than over it; the three states below are those views.', why: 'The exam facts are a reference, not a destination — a sheet keeps the learner on Home while they read.', action: 'Any of the three rows goes a level deeper. Close returns to Home with nothing changed.', howToSee: 'Quick Links → Exam Information.' },
            { name: 'Sheet — Applying for a License', when: 'The Applying for a License row is pressed.', detail: 'The same panel treatment, carrying the licence application — the steps, the fee and the governing agency for the learner’s own state.', why: 'Same reason as the exam sheet: reference material that should not cost the learner their place.', action: 'Close returns to Home.', howToSee: 'Quick Links → Applying for a License.' },
            { name: 'Sheet — State Requirements', when: 'The State Requirements row is pressed.', detail: 'The same panel, listing the jurisdiction’s requirements — the hours, the lines of authority and the exam facts behind them.', why: 'Same reason again. All three rows are the same kind of answer and get the same kind of panel.', action: 'Close returns to Home.', howToSee: 'Quick Links → State Requirements.' },

            { name: 'Sheet — How to schedule your exam', when: 'The first row of Exam Details is pressed.', detail: 'The panel replaces its contents with "Schedule State Exam": who handles the booking (Pearson VUE), the jurisdiction, and the $44 exam fee. Back sits where Close was.', why: 'Booking is a different job from reading about the exam, and it belongs to someone else — naming the provider and the fee is what the learner needs before they leave to do it.', action: 'Back returns to the Exam Details summary.', howToSee: 'Quick Links → Exam Information → How to schedule your exam.' },
            { name: 'Sheet — What to expect on your exam', when: 'The second row of Exam Details is pressed.', detail: '"Pass State Exam": 150 scored questions in 165 minutes, 70% to pass, over the same provider and jurisdiction lines — then the case for the Prep Review Course and the Exam Simulators, which are the two parts of the 3-Part program students rate highest.', why: 'What the paper actually is, and what passing takes, is the fact the learner is really asking for.', action: 'Back returns to the summary.', howToSee: 'Quick Links → Exam Information → What to expect on your exam.' },
            { name: 'Sheet — Common questions', when: 'The third row of Exam Details is pressed.', detail: 'Question-and-answer pairs: rescheduling after booking, when results arrive, retakes, and what to bring. ⚠ It carries its own banner — "Demo content — answers pending confirmation from PSI" — so the state of the data is on screen rather than only in this handoff. ⚠ And that banner names PSI while the sheet above it says Pearson VUE, which is the question below about where this content comes from, visible in one view.', why: 'The long tail of exam questions does not belong in the summary, and it is the part most likely to be read once and never again.', action: 'Back returns to the summary.', howToSee: 'Quick Links → Exam Information → Common questions.' },
          ],
          designSpec: {
            tokens: [
              { role: 'Card border', token: '--color-atlas-nav-rule default, overridden on Home to a 95%-darkened --color-atlas-slate-100' },
              { role: 'Title', token: '--font-heading-serif, --color-text-primary' },
              { role: 'Row icon + hover chevron', token: '--color-atlas-home-icon, falls back to --color-compass-page-button' },
              { role: 'Title rule (optional)', token: '--color-atlas-tan-300' },
            ],
            states: ['Hover/focus: chevron fades in, label steps to Medium (space reserved so nothing shifts).'],
            sources: [
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page. Where anything else disagrees with it, the prototype is right.',
              'Implemented in src/components/compass/AtlasJourneyLinksCard.tsx.',
            ],
          },
          statesMatrix: [
            { question: 'What if a sheet has no data for this state?', answer: 'Then the row does not render. Every sheet is expected to have its content for every jurisdiction the product sells — a link that opens an empty panel is worse than an absent link, because the learner has to press it to find out there is nothing there. ⚠ The card does not enforce this today: a row renders whether or not its sheet can answer. Pass the row only when its data exists.' },
          ],
          ctas: [
            { name: 'My Courses', does: 'Opens ?section=courses \u2014 the learner\u2019s library on the LMS course card under a serif title, no rail and no list controls. Designed 2026-11-02; see the `xcel-atlas-my-courses` handoff.' },
            { name: 'My Certificates', does: 'Opens ?section=certificates \u2014 the certificate cards, every one of them opening a Certificate Details slide-over that now covers issued and not-yet-earned certificates. Designed 2026-11-02; see the `xcel-atlas-my-certificates` handoff.' },
            { name: 'Exam Information', does: 'Opens the exam-information sheet over the page.' },
            { name: 'Applying for a License', does: 'Opens the licence-application sheet.' },
            { name: 'State Requirements', does: 'Opens the state-requirements sheet.' },
          ],
        },
      ],
      /* ⚠ PRESENT AND EMPTY, ON PURPOSE (2026-10-22, Jillienne: "just because
         there are no questions - doesnt mean to remove the section completely,
         just show a default - no questions at the moment text"). Dropping the
         key hides the section and its nav chip, which reads as a handoff that
         was never asked the question. An empty list says it was asked and the
         answer is none — `DecisionsBody` draws the placeholder. */
      decisions: {
        items: [
          {
            question: 'How are the sheets kept in sync with each state\u2019s exam details and requirements?',
            decision:
              'Undecided. The exam provider, the fees, the pass mark and the licensing requirements all differ by jurisdiction and all change without us \u2014 and the three sheets are only as good as that data. There is no source or refresh story for it yet.',
            status: 'Needs weigh-in',
            owner: 'Product',
          },
        ],
      },
      alsoConsider: [
        { name: 'Atlas Home — Overview', location: 'See its own dev-handoff feature.', note: 'Already logs the `atlas-wip-quick-links-side` flag as an open decision — this card is what that flag positions.' },
        { name: 'Study Journey & Get Licensed Steps', location: 'See its own dev-handoff feature.', note: 'Shares the same `onOpenStep`/`onOpenRequirements` callbacks, but its own inline links to the same destinations are disabled here while this card’s are not.' },
      ],
      flagsNote: '`atlas-wip-quick-links-side` picks which side of the course card this rail sits on — see the Overview handoff for why this page cannot change it.',
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
    surface: 'atlas',
    owner: 'Jill',
    lastUpdated: '2026-10-22T12:39:39Z',
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
    devStatus: 'not-ready',
    brands: ['xcel'],
    pages: [
      {
        label: 'Atlas Home — the final prototype, via the Affidavit URL param',
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
            'A centered dialog, portalled to `<body>` over a darkened page, titled by its `kind` — "Pre-course Affidavit" or "Study-manual Notice Affidavit", the journey rows’ own wording, so the modal and the row that opens it cannot say different things — with a hardcoded course line ("Florida Life & Health Pre-licensing") and a placeholder grey panel standing in for the real affidavit text. A single checkbox ("I have read and understand this Affidavit") must be ticked before "Continue to course" is enabled — but Continue and Cancel both call the same close handler, so there is no behavioral difference between agreeing and cancelling today.',
          variants: [
            { name: 'Pre-course Affidavit', when: 'The learner arrives, before any coursework.', detail: 'Heading "Pre-course Affidavit", sub-line "Before you begin the coursework", the course name, and a placeholder panel standing in for the real affidavit text.', why: 'The learner has to attest before any coursework counts, and arrival is the only point where that is still true.', action: 'Tick the checkbox, then "Continue to course".' },
            { name: 'Study-manual Notice Affidavit', when: 'The learner has finished the coursework and is about to take the final exam.', detail: 'Heading "Study-manual Notice Affidavit", sub-line "After the coursework, before your final exam". Identical layout and controls to the pre-course one — only the two strings differ.', why: 'A separate attestation the state requires at a different point. Collapsing the two into one modal would make the record ambiguous about which was signed.', action: 'Tick the checkbox, then "Continue to course".' },
            { name: 'Not yet agreed', when: 'Either affidavit has just opened.', detail: '"Continue to course" is disabled and greyed, with a not-allowed cursor. Cancel, the ✕ and Escape all close.', why: 'The button has to be visibly unavailable, not merely inert — an enabled-looking button that does nothing reads as broken.', action: 'Tick "I have read and understand this Affidavit" → Agreed. Cancel, the ✕ and Escape all close instead, identically.' },
            { name: 'Agreed', when: 'The learner has ticked the checkbox.', detail: '"Continue to course" turns on in the brand fill. It then closes the modal through the same handler Cancel uses — agreeing and cancelling currently do exactly the same thing.', why: 'The attestation is the gate; the button is what passes it.', action: '"Continue to course" closes the modal. ⚠ So do Cancel, the ✕ and Escape — all four routes out are the same handler, and none records that the learner agreed.' },
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
              'The Final Prototype is the source of truth — "Open live preview" at the top of this page, with `?affidavit=1` appended. Where anything else disagrees with it, the prototype is right.',
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
            { name: 'Continue to course', does: 'Closes the modal and reveals Home. ⚠ It calls the same handler as Cancel, so agreeing and cancelling are currently indistinguishable — that is the open decision on this component.' },
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

/**
 * The rows the dashboard lists: the hand-authored ones above, then every dev
 * handoff in `src/data/handoffs/` (2026-10-26 — one file per feature, the
 * designers' own; `handoffFeatures.ts` says why). Consumers see one list.
 */
export const PROTOTYPE_FEATURES: PrototypeFeature[] = [...AUTHORED_FEATURES, ...HANDOFF_FEATURES]

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
