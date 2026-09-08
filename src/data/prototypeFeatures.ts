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
  | 'dev-handoff'
  | 'testing'
  | 'exploration'
  /** Standalone full HTML files being actively worked on — the ones that live
   *  in `public/prototypes/` or `explorations/` and get manipulated directly
   *  rather than built as React. Routes the row to the UX dashboard's Sandbox
   *  section. Like `exploration`, this is a CATEGORY lever because an authored
   *  `devStatus` can only route to Design or Development — so leave `devStatus`
   *  off a sandbox row, or it will be pulled out of Sandbox. */
  | 'sandbox'

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

/** A component documented in depth for the implementing developer. */
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
  /** Optional short status badge shown on the handoff tile + detail header
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
   * the renewal fixtures follow. It is parsed by hand there, never through
   * `new Date(iso)`, which is UTC and shifts the day in western timezones.
   */
  badgeDate?: string
  /** Where it lives in the codebase (file path, optionally a node). */
  location: string
  /** One- or two-sentence summary of what it is and where it appears. */
  summary: string
  /** The PO's framing — who it's for, what they want, and why it matters.
   *  Renders SECOND in the handoff, directly after the preview: you see the
   *  component first, then read the intent against it. */
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
    id: 'xcel-lms',
    title: 'XCEL LMS — Desktop Platform',
    accent: 'blue',
    icon: 'monitor',
    blurb:
      'The dashboard project’s overlapping surfaces assembled into one desktop product and re-skinned to XCEL — the dark left rail, the Current Learning Path band, the Study Calendar, My Courses, Certificates, Recommended and the Catalogue. Structure is STC; colour is a primary ramp derived from the XCEL wordmark red over a charcoal rail. A provenance toggle overlays each card with the real component it came from, so "what actually overlaps" is checkable rather than asserted.',
    tileBlurb:
      'The dashboard surfaces that already overlap FinServ, assembled as one desktop product on XCEL brand colour. Provenance toggle names every component.',
    kind: 'explore',
    // `explore` normally reads "Full platform" on the home row; these open ONE
    // document each, so the label is corrected rather than left overclaiming.
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    pinned: true,
    externalUrl: `${PROTOTYPE_BASE}/xcel-lms-desktop.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-lms-desktop.html`,
    brands: ['xcel'],
  },
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
  {
    id: 'xcel-admin-tool',
    title: 'XCEL Admin Tool — Forked Roster',
    accent: 'blue',
    icon: 'grid',
    blurb:
      'The admin platform itself, forked from PartnerHub’s single-file app rather than rebuilt: the PartnerHub wordmark replaced by plain-text “Admin Tool”, a scope chip naming the admin’s own subtree root, and three columns added — Paid by, Seat, and a deadline-derived Risk that collapses PartnerHub’s five status COUNT columns into the one per-learner answer flow 06 asks for. Three view presets (Who is stuck · Invite follow-up · Seats) re-scope and re-sort the same rows, each on its own URL hash, and the learner panel gains an admin brief: compliance, seat and payer, activity, exam attempts. The self-paid variant is held behind a visible gate rather than guessed.',
    tileBlurb:
      'PartnerHub forked to an agency admin tool. Three columns, three presets over one roster, and the learner panel rewritten as an admin brief.',
    kind: 'explore',
    kindLabel: 'Standalone HTML',
    status: 'ready',
    category: 'exploration',
    externalUrl: `${PROTOTYPE_BASE}/xcel-admin-tool.html`,
    livePreviewUrl: `${PROTOTYPE_BASE}/xcel-admin-tool.html`,
    brands: ['xcel'],
  },
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
