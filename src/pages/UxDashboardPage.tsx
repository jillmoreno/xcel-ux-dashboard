import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  PROTOTYPE_FEATURES,
  prototypeFeatureById,
  prototypeScopeLabel,
  prototypeScopeOwner,
  type PrototypeFeature,
} from '@/data/prototypeFeatures'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'
import { HUB_DOCS } from '@/data/hubDocs'
import { HubResourcesPanel } from '@/components/prototype/HubResourcesPanel'
import { PrototypeFeaturePage } from './PrototypeFeaturePage'
import { ComponentPreviewThumb } from '@/components/prototype/ComponentPreviewThumb'
import { GeneratedThumb, THUMB_W, THUMB_H } from '@/components/prototype/GeneratedThumb'
import { primaryPreviewSrc } from '@/components/prototype/featurePreviewSrc'
import { ArchiveTable } from '@/components/prototype/ArchiveTable'
import { QaNotesPanel } from '@/components/prototype/QaNotesPanel'
import { DemoPanel, LinksPanel, PrdsPanel, ResearchPanel } from '@/components/prototype/LinksPanel'
import { TodoBoardPanel } from '@/components/prototype/TodoBoardPanel'
import { LINK_PRODUCTS, useLinkCount, type LinkProduct } from '@/data/linkStore'
import { formatUpdated } from '@/components/prototype/formatUpdated'
import { useDemoCount } from '@/data/demoStore'
import { useResearchCount } from '@/data/researchStore'
import { usePrdCount } from '@/data/prdStore'
import { isTodoColumn, useTodoBoardCount } from '@/data/todoBoardStore'
import { useQaNoteCount } from '@/data/qaNoteStore'
import { UX_TOKEN_BRIDGE, mirrorPaletteToRoot } from '@/components/prototype/uxPaletteBridge'
import {
  DEV_STATUS_LABEL,
  DEV_STATUS_SEQUENCE,
  featureStatusChipFor,
  featureStatusKeyOf,
  devStatusStrokeFor,
  getFeatureRollupStatus,
  readDevStatusMap,
  setFeatureRollupStatus,
  type DevStatus,
  type FeatureStatusKey,
} from '@/components/prototype/devHandoffStatusUtil'
import {
  getDoneOverrides,
  getInDesignOverrides,
  setFeatureDone,
  setFeatureInDesign,
} from '@/components/prototype/prototypeDoneUtil'
import { ActionMenu } from '@/components/ui/ActionMenu'
import {
  ArrowLeft,
  Bolt,
  CalendarDay,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHalf,
  Clock,
  Flag,
  Grid,
  Circle,
  Lightbulb,
  LockSolid,
  MessageCircle,
  Monitor,
  Moon,
  Search,
  Share2,
  Sliders,
  Sun,
  User,
  X, HourglassClock} from '@/icons'
import { Toast } from '@/components/ui/Toast'

/**
 * UX dashboard — the prototype's front door, at `/` (and still reachable at
 * `/ux-dashboard`). It replaced the tile-grid landing on 2026-08-24; that page
 * is intact but unrouted (see the `prototype-tile-landing` row in
 * `archivedItems.ts`).
 *
 * Two things it changed:
 *
 *   1. A persistent left nav — Demo · Research · Development · Archive, and
 *      until 2026-10-15 Design · Exploration — instead of the
 *      section-chooser-then-tabs the old landing used. Every section is one click from every other, and the
 *      current one is always named.
 *   2. Projects as a LIST rather than a tile grid, in the shape of a hosting
 *      dashboard: thumbnail, name, meta, status right, kebab. At 26 features a
 *      grid of five-line cards is roughly three screens of scrolling; rows fit
 *      about twelve per screen and put status in a column you can scan.
 *
 * ── The open question this is built to answer ──────────────────────────────
 * Design vs Development is NOT derivable from the data as it stands. Only 4 of
 * 26 features carry a `devStatus`, and the obvious proxies are worse: splitting
 * on "has dev-handoff notes" files the four testing links and the three
 * whole-platform dashboards under Design, which is plainly wrong.
 *
 * So `sectionOf()` below is the whole argument, in one function. It reads
 * `devStatus` where it exists and falls back to category, which is a guess for
 * the 22 features that have no status yet. Changing the rule means changing
 * this function and nothing else — that is the point of putting it here.
 *
 * The row kebab is how a status gets set without editing the data file. It
 * writes the SAME per-browser stores the feature gateways read
 * (`cgp.devHandoffStatus`, `cgp.prototypeDone`), so a status set here shows on
 * the gateway and vice versa. An override beats the authored `devStatus`, which
 * is why setting one used to move a row between Design and Development — since
 * 2026-10-15 there is no Design, and a status only changes the chip.
 */

/* ── The taxonomy ─────────────────────────────────────────────────────────── */

type UxSection =
  | 'demo'
  | 'links'
  | 'prds'
  | 'prototypes'
  | 'research'
  | 'exploration'
  | 'development'
  | 'done'
  | 'archive'
  | 'qa-notes'
  | 'todo-board'
  | 'hub-resources'

/*
 * THERE IS NO SECTION GATE (2026-10-15). Until then Design, Exploration,
 * Archive and QA Notes shared one gate id (`design-and-development`), drawn in
 * the rail as a divider under a "Designers" eyebrow and, before 2026-09-18, as
 * a password modal. The Netlify site password is the only lock now — one site,
 * one door — so the gate, its modal wiring and the eyebrow went together:
 * Design is retired, Explorations moved up under PRDs, and Archive and QA
 * Notes moved under Dev Handoff. The `designers-gate` row in
 * `src/data/archivedItems.ts` says how it was wired. `PrototypeLock.tsx` and
 * `prototypeLockUtil.ts` are untouched — the archived tile landing reads them.
 */

type SectionDef = {
  id: UxSection
  label: string
  blurb: string
  /** Sections that are not lists of features declare their own count. */
  count?: number
}

/** The order here IS the nav order. Every section is open — see the note on
 *  the retired gate above. */
const SECTIONS: SectionDef[] = [
  {
    // FIRST, and the landing section: the product as it stands — the live
    // React build at its committed flag baseline. ONE ROW PER SCOPE
    // (`PROTOTYPE_SCOPES` in prototypeFeatures.ts), and promoting a feature
    // here means flipping its flag default on `main` —
    // `.claude/skills/promote-to-prototype` — never adding a row for a scope
    // that already has one. Ungated, because this is the thing stakeholders
    // are sent to see. `UxDashboard.smoke.test.tsx` compares the whole section
    // against an expected set, in both directions.
    id: 'prototypes',
    label: 'Prototypes',
    /* ⚠ ONE ROW PER SCOPE, AND THAT IS THE FEATURE (2026-09-28, restated
       2026-10-14). Prototypes is the SOURCE OF TRUTH for developers and
       stakeholders: what the product currently is. It held exactly one row
       until 2026-10-14, when the product grew three doors on one journey —
       how a learner gets in, what they land in, where they study — and each
       became a row. What the one-row rule actually guaranteed is kept in a
       stricter form: every row is the SAME build (`main`, at `?demo=1`), so
       there is still nothing to ask "which one is real?" about. Two things to
       look at for the SAME scope belong in REFINEMENT, which takes any number
       of rows, is authored in the browser, and is visible to stakeholders too
       (it carries no `gate`). `UxDashboard.smoke.test.tsx` compares this
       section in both directions and pins the shape of every row's route. */
    // NO BLURB — 2026-10-14, Jillienne on the preview: "remove this". The
    // rows carry the explanation now (scope, owner, Updated, Coming soon),
    // and a sentence over them repeated it. Empty draws no lede at all; see
    // the render site, which skips the <p> rather than drawing a blank one.
    blurb: '',
  },
  {
    // The REVIEW INBOX, authored on the page (2026-09-18) — labelled
    // "Refinement" because that is what happens here: a designer's branch,
    // built by Netlify at its own URL, put up so the team can open it and
    // discuss it, and — once the row is flipped public — stakeholders can too.
    // Nothing in `PROTOTYPE_FEATURES` routes here; `bySection.demo` is empty by
    // design and the count is `useDemoCount`. See `demoStore.ts`.
    //
    // The id stays `demo` so `?section=demo` links, the `demos` Blobs store and
    // the `/api/demos` endpoint do not churn on a label change. Before
    // 2026-09-18 this section (then labelled Demo) held the product build; that
    // row is in Prototypes now.
    id: 'demo',
    label: 'Refinement',
    /* The counterweight to Prototypes' single row: as many as you like, because
       nothing here claims to be settled. */
    blurb:
      'Work in review — branches, components and explorations the team is discussing. As many as you like; nothing here is the source of truth. Added on the page, not in code.',
  },
  {
    // A BOARD since 2026-10-07, authored on the page like Resources — before
    // that an empty state waiting for a generated decisions log XCEL never
    // grew. Ungated, so a stakeholder can read the evidence behind a decision.
    // No `count` field for the same reason Links has none: the number is live,
    // from `useResearchCount`.
    id: 'research',
    label: 'Research',
    blurb:
      'The evidence behind the designs — studies, findings, rationale and references. Added on the page, not in code.',
  },
  {
    // UNGATED, which is the decision in this entry. (It sat directly under
    // Refinement until 2026-09-29; Research is between them now. The ordering
    // was never the point — being ungated is.)
    // Prototypes is the passwordless front door and this sits beside it, so a
    // link added here is a link a stakeholder can reach unaccompanied — the
    // same consideration `UxDashboard.smoke.test.tsx` guards for Prototypes'
    // rows. It is open rather than gated because the section's whole job is
    // being the place you send someone; behind the shared password it would be
    // a bookmark file.
    //
    // Labelled "Other Links" (2026-09-18) so it read as the catch-all beside
    // Refinement, whose rows are ALSO links — briefs, boards, Figma files,
    // anything that is not a branch under review. RENAMED "Resources"
    // 2026-10-07, the day Research and PRDs became boards: with three
    // sibling boards "Other" no longer said which one this was. The id stays
    // `links` so `?section=links`, the `links` store and `/api/links` do not
    // churn — the same call as Refinement keeping id `demo`.
    //
    // No `count` field: links are authored on the page, so a static number is
    // wrong the moment one is added. Supplied live below, like To Do's and QA
    // Notes'.
    id: 'links',
    label: 'Resources',
    blurb: 'Everything that lives elsewhere — briefs, boards, builds and references. Added on the page, not in code.',
  },
  {
    // The fourth board (2026-10-07), Research's twin: the product requirements
    // documents the designs answer. A section rather than a Type on Other
    // Links because "the brief" is a different question from "everything
    // else". Ungated like its siblings; count is live, from `usePrdCount`.
    id: 'prds',
    label: 'PRDs',
    blurb:
      'The product requirements the designs answer — one link per document. Added on the page, not in code.',
  },
  {
    // The hand-authored documents — outside products and ideas rebuilt on our
    // tokens and conventions. Seven `PROTOTYPE_FEATURES` rows with
    // `category: exploration` and no `devStatus`. MOVED HERE 2026-10-15, from
    // the retired Designers group at the foot of the rail to directly under
    // PRDs — the briefs and the documents answering them, side by side in the
    // nav — and renamed from "Exploration". Jillienne on the preview, after a
    // card-under-the-board version: "explorations should be its own page
    // below the PRDs option in the left nav." The id stays `exploration` so
    // `?section=exploration` links and `category: exploration` need no alias.
    id: 'exploration',
    label: 'Explorations',
    blurb: 'Outside products and ideas rebuilt on our tokens, components and UX conventions — documents, kept in code.',
  },
  // ARCHIVED 2026-10-15 — Design stood here, first in the old restricted
  // group, with Exploration beneath it (moved up under PRDs, above). Design
  // listed nothing (no row carries an in-design status) and the team no
  // longer uses the stage. See the `design-section` row in
  // `src/data/archivedItems.ts`.
  // ARCHIVED 2026-09-29 — Sandbox stood here, between Exploration and
  // Development. Unwired, not deleted: see the `sandbox-section` row in
  // `src/data/archivedItems.ts`.
  {
    // UNGATED since 2026-09-23, at Jillienne's request — Development and Done
    // moved out of the shared `design-and-development` gate and now sit under
    // their own "Dev Handoff" eyebrow (see `NAV_EYEBROWS` below), visible on
    // the PUBLIC build for the first time. Design and Exploration keep their
    // gate and stay exactly where they are — this only pulls Development and
    // Done out of that group, nothing else in it moved. (Sandbox was in that
    // sentence too until it was archived on 2026-09-29.)
    id: 'development',
    label: 'Development',
    blurb: 'Specified and handed off, in build, or under test.',
  },
  {
    // Finished work, pulled out of the pipeline sections so those show only
    // what is still moving. Done is a STATE, not a stage, which is why it
    // outranks everything else in `sectionOf` — a feature that is done is done
    // whatever its devStatus says.
    //
    // UNGATED alongside Development, same reasoning and same date — see the
    // comment there.
    id: 'done',
    label: 'Done',
    blurb: 'Finished and signed off — kept for reference, not in flight.',
  },
  {
    // Ungated since 2026-10-15 with the rest of the old restricted group — the
    // site password is the lock. Sits under Dev Handoff with QA Notes.
    id: 'archive',
    label: 'Archive',
    blurb:
      'Components and variants removed from the project — what each was, where the code still lives, and how to bring it back.',
    count: ARCHIVED_ITEMS.length,
  },
  {
    // Ungated since 2026-10-15, like Archive — the site password is the lock.
    //
    // It briefly carried a feature flag on top of the old group gate, defaulting
    // off. That was
    // a second lock on an already-locked door, and it put the key on the wrong
    // side of it: the Feature Flag panel only mounts inside `AppLayout`, which
    // this page sits outside, so there was no way to switch the section on from
    // the page it lives on.
    id: 'qa-notes',
    label: 'QA Notes',
    blurb:
      'Findings from design-vs-build review — an Expected and an Actual capture, the detail, and where each one stands.',
    // No `count` here: findings can be authored on the page, so a static number
    // is wrong as soon as one is added. Supplied live below, like To Do's.
  },
  {
    // THE TEAM'S OWN BOARD (2026-10-15) — who is working on what, as four
    // columns a card moves across. Authored on the page like the four link
    // boards, on its own Netlify Blobs store (`netlify/functions/
    // todo-board.ts`); nothing in `PROTOTYPE_FEATURES` routes here, so
    // `bySection['todo-board']` is empty by design and the count is live from
    // `useTodoBoardCount`.
    //
    // FIRST of the two Team sections, because it is the one people come back
    // to in a week: the board is live work, the shelf below it is reference.
    // The order here IS the nav order, so moving it is one line — but the
    // "Team" eyebrow is keyed on THIS id (`NAV_EYEBROWS`), so swapping the two
    // means moving the eyebrow with them.
    //
    // ⚠ NOT the archived To Do section (`todo-section` in `archivedItems.ts`,
    // 2026-09-29, id `todo`). That was a per-browser checklist in
    // `localStorage`; `TodoPanel.tsx` and `todoStore.ts` are untouched by this
    // and its restore note still describes a real, separate restore. The id
    // here is `todo-board` precisely so the two cannot be confused — and so
    // an old `?section=todo` link does not silently land on a different thing
    // than the one it was written for.
    id: 'todo-board',
    label: 'To Do Board',
    blurb:
      'Who is working on what — move a card as its status changes so nobody doubles up. Added on the page, not in code.',
  },
  {
    // HUB RESOURCES — 2026-10-15, Jillienne: "add a Hub Resources in the new
    // team section where this new document will live."
    //
    // The Hub's own documents, read-only, over `HUB_DOCS` in
    // `src/data/hubDocs.ts`. LAST in the nav, second of the two Team sections.
    //
    // ⚠ NOT a board and not a feature list. The rows are files in this
    // repository, so the list changes with a commit — which is why the panel
    // has no Add button and why `count` can be a static number here, unlike
    // the To Do Board's live one or Refinement's.
    //
    // It is also the first way back to the guides since 2026-09-29, when the
    // Contributing section was archived and the "How to read this dashboard"
    // link came off the rail foot. Both of those are still gone and still
    // pinned gone; this replaces neither — it is a shelf holding all three,
    // not either of them restored.
    id: 'hub-resources',
    label: 'Hub Resources',
    blurb:
      'How this dashboard is worked on, and how to read it — the guides that ship with the site. Each opens in a new tab, with a PDF beside it.',
    count: HUB_DOCS.length,
  },
  // ARCHIVED 2026-09-29 — the To Do and Contributing sections stood here, last
  // in the restricted group. Both are unwired, not deleted: see the `todo-section`
  // and `contributing-section` rows in `src/data/archivedItems.ts` for the
  // re-wire, and note that neither of their documents/stores was touched.
]

/**
 * The sections THIS BUILD shows. On the public Netlify project
 * (`VITE_GATEWAY_MODE=public`, see `gatewayMode.ts`) every gated section is
 * dropped from the list — not locked, ABSENT: no nav row, no divider, no
 * password modal, and `sectionFromParam` below cannot resolve a `?section=`
 * pointing at one, so a deep link lands on Demo with nothing to unlock.
 *
 * `SECTIONS` above stays the authored full set; everything that renders or
 * resolves a section reads THIS list. A new gated section needs no change here.
 */
// Every section, on every build that renders the gateway (2026-10-15: the
// public build that filtered out the gated ones is retired; the testing build
// never renders this page). `gate` on a section is now a note about who it is
// for, not a filter anything reads.
const VISIBLE_SECTIONS: SectionDef[] = SECTIONS

/** The section a bare `/` opens — the first in the nav, and the one a
 *  stakeholder should see first: the product itself. `?section=` is dropped
 *  from the URL when this is selected, so the landing address stays clean. */
const DEFAULT_SECTION: UxSection = 'prototypes'

/**
 * Eyebrow labels drawn above specific ungated rows in the nav rail, added
 * 2026-09-23 for the public Demo build — keyed by section id rather than
 * index, so reordering `SECTIONS` cannot silently leave a label on the wrong
 * row. Each names the row it sits directly above:
 *
 *   Demo             → Prototypes
 *   Design & Research → Refinement, Research, Resources, PRDs, Explorations
 *   Dev Handoff      → Development, Done, Archive, QA Notes
 *
 * Explorations joined Design & Research and Archive and QA Notes joined Dev
 * Handoff on 2026-10-15, when the divider and the "Designers" eyebrow that
 * stood above them went with the section gate.
 */
const NAV_EYEBROWS: Partial<Record<UxSection, string>> = {
  prototypes: 'Demo',
  demo: 'Design & Research',
  development: 'Dev Handoff',
  // TEAM — 2026-10-15. The fourth group, and the first that is about how the
  // team works rather than about the product: the board (who is on what) and
  // the shelf of the Hub's own guides. Neither is dev handoff and neither is a
  // prototype, and filing either under an existing group would have made that
  // eyebrow wrong for it.
  //
  // ⚠ ONE ENTRY FOR THE WHOLE GROUP, on its FIRST section. An eyebrow is drawn
  // directly above the row it is keyed to, so a second entry for
  // `hub-resources` would print "Team" twice, once over each row. Reorder the
  // two in `SECTIONS` and this key moves with them.
  'todo-board': 'Team',
}

/** `?section=` values the OLD tile landing wrote, mapped onto the new sections.
 *  Feature gateways still link back with these ("← Back"), and links already
 *  shared carry them, so a stale value has to land somewhere sensible rather
 *  than silently dropping the reviewer on Demo. */
const LEGACY_SECTIONS: Record<string, UxSection> = {
  demo: 'demo',
  // The old tile landing's name for the product-build section, which is
  // Prototypes now rather than Demo.
  dashboard: 'prototypes',
  dev: 'development',
  // Design was retired 2026-10-15; anything it would have held (a row with a
  // status) sits on the Development board.
  design: 'development',
}

function sectionFromParam(value: string | null, tab: string | null): UxSection | null {
  // The archive used to be a TAB inside the dev section (`?section=dev&tab=archive`),
  // so that pairing has to resolve to the archive section, not to Development.
  const isVisible = (id: string) => VISIBLE_SECTIONS.some((s) => s.id === id)
  const resolved: UxSection | null =
    tab === 'archive'
      ? 'archive'
      : !value
        ? null
        : isVisible(value)
          ? (value as UxSection)
          : (LEGACY_SECTIONS[value] ?? null)
  // Checked AFTER resolving, so a legacy alias (`dev` → Development) or the
  // archive-tab pairing cannot name a section this build does not show — on
  // the public build those land on Demo like any other unknown value.
  return resolved && isVisible(resolved) ? resolved : null
}

/* ── Theme ────────────────────────────────────────────────────────────────
   Three appearances, matching the platform's own Appearance model: `hybrid` is
   what that model calls "Dim" — a light content pane with a dark nav.

   Deliberately LOCAL to this page rather than the app-wide ThemeContext. This
   is prototype chrome; a reviewer who wants the gateway dark is not asking for
   the product prototypes they demo from it to go dark too. Its own storage key
   keeps the two independent. */
type UxTheme = 'light' | 'hybrid' | 'dim' | 'dark'

/** The colour scheme, independent of the light/dark appearance — the two are
 *  separate axes, so every palette is available in all four appearances rather
 *  than a new scheme arriving as a fifth mode that only exists at one
 *  lightness. */
type UxPaletteId = 'moss' | 'ember' | 'tide' | 'fern'

const THEME_KEY = 'cgp.uxDashboardTheme'
const PALETTE_KEY = 'cgp.uxDashboardPalette'

const PALETTE_META: { id: UxPaletteId; label: string; hint: string; swatch: string[] }[] = [
  { id: 'moss', label: 'Moss', hint: 'Forest green, teal, citron', swatch: ['#1D251F', '#397574', '#8F9738'] },
  { id: 'ember', label: 'Ember', hint: 'Deep blue, slate, orange', swatch: ['#154B8A', '#658588', '#CC8119'] },
  { id: 'tide', label: 'Tide', hint: 'Sky blue, aqua, linen', swatch: ['#439BCD', '#8DCCCA', '#E4E1DC'] },
  { id: 'fern', label: 'Fern', hint: 'Indigo, sea green, lime', swatch: ['#323D67', '#6FAE9E', '#A8DB83'] },
]

const PALETTE_IDS = PALETTE_META.map((pal) => pal.id)

/* Ordered light → dark, so the menu reads as a ramp rather than a set. */
const THEMES: { id: UxTheme; label: string; hint: string; Icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', hint: 'Light throughout', Icon: Sun },
  { id: 'hybrid', label: 'Hybrid', hint: 'Dark nav, light content', Icon: CircleHalf },
  { id: 'dim', label: 'Dim', hint: 'Softer dark, one grey family', Icon: Circle },
  { id: 'dark', label: 'Dark', hint: 'Dark throughout', Icon: Moon },
]

function readPalette(): UxPaletteId {
  try {
    const v = localStorage.getItem(PALETTE_KEY) as UxPaletteId | null
    return v && PALETTE_IDS.includes(v) ? v : DEFAULT_PALETTE
  } catch {
    return DEFAULT_PALETTE
  }
}

/** The default a first-time visitor gets — someone opening the deployed link
 *  with nothing stored. Fern · Hybrid: the dark rail against light content. */
const DEFAULT_PALETTE: UxPaletteId = 'fern'
const DEFAULT_THEME: UxTheme = 'hybrid'

function readTheme(): UxTheme {
  try {
    const v = localStorage.getItem(THEME_KEY)
    // `light` has to be listed explicitly now that it is no longer the
    // fallback — otherwise an explicit Light choice would read as "nothing
    // stored" and get bounced to the default.
    return v === 'light' || v === 'dark' || v === 'hybrid' || v === 'dim'
      ? v
      : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

/** The two appearances that put the document into the dark token set. Dim adds
 *  a scoped attribute on top that softens the surfaces — see tokens.css. */
const IS_DARK: Record<UxTheme, boolean> = { light: false, hybrid: false, dim: true, dark: true }

/** The nav's own colors, read from the page's scoped palette so every
 *  appearance defines them in ONE place (PALETTES below) instead of a
 *  JS object per mode. */
type NavPalette = {
  surface: string
  border: string
  fg: string
  muted: string
  /** The appearance's own accent, in the polarity the RAIL needs. */
  eyebrow: string
  activeBg: string
  activeFg: string
  countBg: string
  countFg: string
  activeCountBg: string
  activeCountFg: string
}

const NAV: NavPalette = {
  surface: 'var(--ux-nav)',
  border: 'var(--ux-nav-border)',
  fg: 'var(--ux-nav-fg)',
  muted: 'var(--ux-nav-muted)',
  eyebrow: 'var(--ux-nav-eyebrow)',
  activeBg: 'var(--ux-nav-active)',
  activeFg: 'var(--ux-nav-active-fg)',
  countBg: 'var(--ux-nav-count)',
  countFg: 'var(--ux-nav-count-fg)',
  activeCountBg: 'var(--ux-nav-active-count)',
  activeCountFg: 'var(--ux-nav-active-count-fg)',
}

/**
 * The UX dashboard's OWN palette — a mossy forest set that belongs to this
 * page, not to any brand:
 *
 *   #1D251F ink · #397574 teal · #4A532B moss · #8F9738 citron · #B0C6BE sage
 *
 * It lives here rather than in tokens.css because this page is outside
 * `AppLayout` and is the one surface with no brand: the product prototypes it
 * links to keep their own tokens, and the embedded feature gateway still
 * renders on them. Applied as CSS custom properties on the shell root, so the
 * module-level style consts below can reference `var(--ux-*)` — a JS-only
 * palette could not reach them.
 *
 * Every value was picked against the surface it sits on: all text clears 4.5:1
 * on both its card and its hover background in all four appearances (see the
 * audit note in CLAUDE.md). STATUS colours are deliberately NOT in here — they
 * stay on the semantic ramps, because two of the five palette colours are
 * olive-greens that a green "Ready for Dev" would disappear into.
 */
type UxVars = Record<string, string>

/* ── Moss ───────────────────────────────────────────────────────────────────
   The five, raw. Within a palette these are the only source colours —
   everything else was mixed from them, so re-palletting is a change to one
   block plus the mixed values it feeds. */
const INK = '#1D251F'
const TEAL = '#397574'
const MOSS = '#4A532B'
const CITRON = '#8F9738'
const SAGE = '#B0C6BE'

/* The dark rail, shared by Hybrid, Dim and Dark. Ink is lighter than the Dark
   page background and darker than the Dim card, so the rail reads as its own
   plane in both rather than merging with the list beside it. */
/* The content plane in Light and Hybrid — the two appearances that share each
   palette's `*_LIGHT` content set, which is why one spread covers both.

   Deliberately its OWN token rather than a white `--ux-bg`: that one is the
   "one step off the card" recessed surface — the row hover, the selected
   appearance row, and, through UX_TOKEN_BRIDGE's `--color-neutral-50` mapping,
   the archive table's row hover and the QA panel's inset fields. Whiten it and
   every one of those loses its only separation from the white card it sits on.

   The dark appearances never define it, so `shellStyle`'s fallback keeps their
   paper on `--ux-bg` exactly as before. */
const LIGHT_PAGE: UxVars = { '--ux-page': '#FFFFFF' }

/* The brand mark is the same in every appearance — it is a logo, and a logo
   that changes colour per mode stops being one. */
const MOSS_MARK: UxVars = { '--ux-mark': INK, '--ux-mark-fg': CITRON }

const MOSS_DARK_NAV: UxVars = {
  '--ux-nav': INK,
  '--ux-nav-border': '#3D4842',
  '--ux-nav-fg': '#C8D7D2',
  '--ux-nav-muted': '#8D9F98',
  '--ux-nav-eyebrow': '#A0AE7B',
  '--ux-nav-active': '#336361',
  /* Always-white, not a theme token: this rail is dark in every appearance. */
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#37423C',
  '--ux-nav-count-fg': '#C8D7D2',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': INK,
}

/* A sage PANEL, not a near-white one. At #F1F5F3 the rail was grey at a
   glance and the palette only showed in the accents; at 52% sage it reads as
   its own plane and as the same family as the dark rail. The active row is the
   solid teal used on the dark rail too, so "where am I" looks identical in
   every appearance. */
const MOSS_LIGHT_NAV: UxVars = {
  '--ux-nav': '#D6E1DD',
  '--ux-nav-border': '#C1D3CC',
  '--ux-nav-fg': INK,
  '--ux-nav-muted': '#535955',
  '--ux-nav-eyebrow': MOSS,
  '--ux-nav-active': '#336563',
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#EAF0EE',
  '--ux-nav-count-fg': '#535955',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#24504E',
}

/* Light content: sage-tinted paper, white cards, ink type, a darkened teal for
   anything interactive (raw teal is 5.29:1 on white but only 4.49:1 on the row
   hover, which is where links actually get read). */
const MOSS_LIGHT: UxVars = {
  ...LIGHT_PAGE,
  '--ux-bg': '#E7EEEC',
  '--ux-card': '#FFFFFF',
  '--ux-card-hover': '#EFF4F2',
  '--ux-border': '#C8D7D2',
  '--ux-text': INK,
  '--ux-text-2': '#5C625E',
  '--ux-text-3': '#6E7370',
  '--ux-accent': '#336563',
  '--ux-accent-soft': '#D7E3E3',
  '--ux-accent-strong': '#24504E',
  '--ux-on-accent': '#FFFFFF',
  '--ux-chip': '#E4EBE8',
  '--ux-eyebrow': MOSS,
  '--ux-hue-teal': TEAL,
  '--ux-hue-gold': CITRON,
  '--ux-hue-blue': MOSS,
  '--ux-hue-neutral': SAGE,
  '--ux-hue-teal-fg': '#315F5C',
  '--ux-hue-gold-fg': '#6F7731',
  '--ux-hue-blue-fg': '#3D4628',
  '--ux-hue-neutral-fg': '#57665F',
}

/* The dark pair share their type and accent — only the surfaces differ, which
   is what Dim vs Dark IS. Citron mixed toward sage: raw citron is 3.16:1 on
   white and only 3.31:1 on the Dim card, so neither end of the palette can be
   the accent on its own. */
const MOSS_DARK_TYPE: UxVars = {
  '--ux-text': '#C8D7D2',
  '--ux-text-2': SAGE,
  '--ux-text-3': '#90A39B',
  '--ux-accent': '#A0AE7B',
  '--ux-accent-soft': 'rgb(160 174 123 / 0.16)',
  '--ux-accent-strong': '#C2CDA4',
  '--ux-on-accent': INK,
  '--ux-eyebrow': '#A0AE7B',
  '--ux-hue-teal': TEAL,
  '--ux-hue-gold': CITRON,
  '--ux-hue-blue': MOSS,
  '--ux-hue-neutral': SAGE,
  '--ux-hue-teal-fg': '#80A6A0',
  '--ux-hue-gold-fg': '#A3B388',
  '--ux-hue-blue-fg': '#96A891',
  '--ux-hue-neutral-fg': SAGE,
}

/**
 * `ArchiveTable` is a shared component and draws on the BRAND surface tokens,
 * which under the dark theme are a deep navy — a blue block sitting inside a
 * forest-green page. Rather than fork the component, its wrapper re-points the
 * four surface/text tokens it uses at the palette, so it inherits the page it
 * is on. Deliberately NOT applied to the embedded feature gateway: that is
 * product documentation and should keep reading in the product's own colours.
 */
const ARCHIVE_BRIDGE = UX_TOKEN_BRIDGE

const MOSS_PALETTE: Record<UxTheme, UxVars> = {
  light: { ...MOSS_MARK, ...MOSS_LIGHT, ...MOSS_LIGHT_NAV },
  hybrid: { ...MOSS_MARK, ...MOSS_LIGHT, ...MOSS_DARK_NAV },
  dim: {
    ...MOSS_MARK,
    ...MOSS_DARK_TYPE,
    ...MOSS_DARK_NAV,
    '--ux-bg': '#27302A',
    '--ux-card': '#2D3730',
    '--ux-card-hover': '#353F38',
    '--ux-border': '#4C5952',
    '--ux-chip': '#3A453F',
  },
  dark: {
    ...MOSS_MARK,
    ...MOSS_DARK_TYPE,
    ...MOSS_DARK_NAV,
    '--ux-bg': '#0F1310',
    '--ux-card': '#1A211C',
    '--ux-card-hover': '#1F2A25',
    '--ux-border': '#333E38',
    '--ux-chip': '#28322C',
  },
}

/* ── Ember ──────────────────────────────────────────────────────────────────
 * #154B8A blue · #616A3A olive · #658588 slate · #CC8119 orange · #8F2720 brick
 *
 * Built to the same rules as Moss, and the same two colours turn out to be
 * unusable as small text: orange is 3.12:1 on white and slate 3.99:1, so the
 * light accent is the blue (8.73:1) and the dark accent is orange lightened
 * toward white. Brick earns the eyebrow — 8.47:1 on white, and a warm
 * counterweight to a page anchored by blue.
 */
const BLUE = '#154B8A'
const OLIVE = '#616A3A'
const SLATE = '#658588'
const ORANGE = '#CC8119'
const BRICK = '#8F2720'
/* Not a palette entry — the blue taken most of the way to black, which is what
   gives this scheme a bottom end. Every dark surface below is mixed from it. */
const NAVY = '#04101C'

const EMBER_MARK: UxVars = { '--ux-mark': NAVY, '--ux-mark-fg': ORANGE }

const EMBER_DARK_NAV: UxVars = {
  '--ux-nav': NAVY,
  '--ux-nav-border': '#1E313E',
  '--ux-nav-fg': '#DDE4E5',
  '--ux-nav-muted': '#AABCBE',
  '--ux-nav-eyebrow': '#DAA459',
  /* The full blue, not a mix: on a rail this deep it reads as a lit row. */
  '--ux-nav-active': BLUE,
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#172732',
  '--ux-nav-count-fg': '#DDE4E5',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#0F3663',
}

const EMBER_LIGHT_NAV: UxVars = {
  '--ux-nav': '#CBD6D7',
  '--ux-nav-border': '#B4C4C5',
  '--ux-nav-fg': '#071A2F',
  '--ux-nav-muted': '#3E4C5D',
  '--ux-nav-eyebrow': BRICK,
  '--ux-nav-active': BLUE,
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#E6EBEC',
  '--ux-nav-count-fg': '#3E4C5D',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#0F3663',
}

const EMBER_LIGHT: UxVars = {
  ...LIGHT_PAGE,
  '--ux-bg': '#E8EDED',
  '--ux-card': '#FFFFFF',
  '--ux-card-hover': '#F1F4F4',
  '--ux-border': '#BECCCD',
  '--ux-text': '#071A2F',
  '--ux-text-2': '#4C5A69',
  '--ux-text-3': '#5A6675',
  '--ux-accent': BLUE,
  '--ux-accent-soft': '#E1E8F0',
  '--ux-accent-strong': '#0F3461',
  '--ux-on-accent': '#FFFFFF',
  '--ux-chip': '#E0E7E7',
  '--ux-eyebrow': BRICK,
  '--ux-hue-teal': SLATE,
  '--ux-hue-gold': ORANGE,
  '--ux-hue-blue': BLUE,
  '--ux-hue-neutral': OLIVE,
  '--ux-hue-teal-fg': '#3F5254',
  '--ux-hue-gold-fg': '#7E5010',
  '--ux-hue-blue-fg': '#0D2E56',
  '--ux-hue-neutral-fg': '#3C4224',
}

const EMBER_DARK_TYPE: UxVars = {
  '--ux-text': '#DDE4E5',
  '--ux-text-2': '#AABCBE',
  '--ux-text-3': '#9DB1B3',
  '--ux-accent': '#DAA459',
  '--ux-accent-soft': 'rgb(218 164 89 / 0.16)',
  '--ux-accent-strong': '#E3BA80',
  '--ux-on-accent': NAVY,
  '--ux-eyebrow': '#DAA459',
  '--ux-hue-teal': SLATE,
  '--ux-hue-gold': ORANGE,
  '--ux-hue-blue': BLUE,
  '--ux-hue-neutral': OLIVE,
  '--ux-hue-teal-fg': '#AFC0C1',
  '--ux-hue-gold-fg': '#E4BD87',
  '--ux-hue-blue-fg': '#85A1C2',
  '--ux-hue-neutral-fg': '#ADB299',
}

const EMBER_PALETTE: Record<UxTheme, UxVars> = {
  light: { ...EMBER_MARK, ...EMBER_LIGHT, ...EMBER_LIGHT_NAV },
  hybrid: { ...EMBER_MARK, ...EMBER_LIGHT, ...EMBER_DARK_NAV },
  dim: {
    ...EMBER_MARK,
    ...EMBER_DARK_TYPE,
    ...EMBER_DARK_NAV,
    '--ux-bg': '#0E2338',
    '--ux-card': '#152F49',
    '--ux-card-hover': '#1B3855',
    '--ux-border': '#2A4559',
    '--ux-chip': '#22415E',
  },
  dark: {
    ...EMBER_MARK,
    ...EMBER_DARK_TYPE,
    ...EMBER_DARK_NAV,
    '--ux-bg': '#061420',
    '--ux-card': '#0C2438',
    '--ux-card-hover': '#102C43',
    '--ux-border': '#233D4D',
    '--ux-chip': '#17334A',
  },
}

/* ── Tide ───────────────────────────────────────────────────────────────────
 * #439BCD sky · #8BB8CC steel · #8DCCCA aqua · #B4DACB mint · #E4E1DC linen
 *
 * The odd one out: it has no dark end at all — its DARKEST colour is 3.08:1 on
 * white, so not one of the five can carry body text on a light page. Light mode
 * therefore types in a derived ink (the sky taken most of the way to black) and
 * uses the palette itself for surfaces and tints. Dark mode is where it pays
 * off: every one of the five is 6.8:1 or better on black, so the raw colours
 * become the type and the accent with no mixing at all.
 */
const SKY = '#439BCD'
const STEEL = '#8BB8CC'
const AQUA = '#8DCCCA'
const MINT = '#B4DACB'
const LINEN = '#E4E1DC'
const TIDE_INK = '#102531'
const TIDE_NAVY = '#081319'

const TIDE_MARK: UxVars = { '--ux-mark': TIDE_NAVY, '--ux-mark-fg': AQUA }

const TIDE_DARK_NAV: UxVars = {
  '--ux-nav': TIDE_NAVY,
  '--ux-nav-border': '#22343D',
  '--ux-nav-fg': LINEN,
  '--ux-nav-muted': STEEL,
  '--ux-nav-eyebrow': AQUA,
  '--ux-nav-active': '#2A607F',
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#22343D',
  '--ux-nav-count-fg': LINEN,
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#1E4459',
}

const TIDE_LIGHT_NAV: UxVars = {
  '--ux-nav': '#CEE1EA',
  '--ux-nav-border': '#B8D2DE',
  '--ux-nav-fg': TIDE_INK,
  '--ux-nav-muted': '#45555E',
  '--ux-nav-eyebrow': '#415E5D',
  '--ux-nav-active': '#275A77',
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#F3F2EF',
  '--ux-nav-count-fg': '#45555E',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#1E4459',
}

const TIDE_LIGHT: UxVars = {
  ...LIGHT_PAGE,
  /* Linen, not white-blue: the palette's one warm colour keeps the page from
     reading as a wash of the same blue the cards sit on. */
  '--ux-bg': '#F0EEEC',
  '--ux-card': '#FFFFFF',
  '--ux-card-hover': '#F7F6F4',
  '--ux-border': '#CBDFE8',
  '--ux-text': TIDE_INK,
  '--ux-text-2': '#4C5B64',
  '--ux-text-3': '#5C6B73',
  '--ux-accent': '#275A77',
  '--ux-accent-soft': '#DCEAF3',
  '--ux-accent-strong': '#1B4058',
  '--ux-on-accent': '#FFFFFF',
  '--ux-chip': '#ECEAE6',
  '--ux-eyebrow': '#415E5D',
  '--ux-hue-teal': AQUA,
  '--ux-hue-gold': LINEN,
  '--ux-hue-blue': SKY,
  '--ux-hue-neutral': STEEL,
  '--ux-hue-teal-fg': '#466665',
  '--ux-hue-gold-fg': '#5B5A58',
  '--ux-hue-blue-fg': '#255571',
  '--ux-hue-neutral-fg': '#465C66',
}

const TIDE_DARK_TYPE: UxVars = {
  '--ux-text': LINEN,
  '--ux-text-2': MINT,
  '--ux-text-3': '#ABCCDA',
  '--ux-accent': AQUA,
  '--ux-accent-soft': 'rgb(141 204 202 / 0.16)',
  '--ux-accent-strong': '#BFE1E0',
  '--ux-on-accent': TIDE_INK,
  '--ux-eyebrow': AQUA,
  '--ux-hue-teal': AQUA,
  '--ux-hue-gold': LINEN,
  '--ux-hue-blue': SKY,
  '--ux-hue-neutral': STEEL,
  '--ux-hue-teal-fg': '#AFDBDA',
  '--ux-hue-gold-fg': '#E9E7E3',
  '--ux-hue-blue-fg': '#8EC3E1',
  '--ux-hue-neutral-fg': '#AECDDB',
}

const TIDE_PALETTE: Record<UxTheme, UxVars> = {
  light: { ...TIDE_MARK, ...TIDE_LIGHT, ...TIDE_LIGHT_NAV },
  hybrid: { ...TIDE_MARK, ...TIDE_LIGHT, ...TIDE_DARK_NAV },
  dim: {
    ...TIDE_MARK,
    ...TIDE_DARK_TYPE,
    ...TIDE_DARK_NAV,
    '--ux-bg': '#1C303B',
    '--ux-card': '#283B46',
    '--ux-card-hover': '#344650',
    '--ux-border': '#425C69',
    '--ux-chip': '#40515A',
  },
  dark: {
    ...TIDE_MARK,
    ...TIDE_DARK_TYPE,
    ...TIDE_DARK_NAV,
    '--ux-bg': '#0B1A22',
    '--ux-card': '#0D1F29',
    '--ux-card-hover': '#0F232E',
    '--ux-border': '#2E4753',
    '--ux-chip': '#112835',
  },
}

/* ── Fern ───────────────────────────────────────────────────────────────────
 * #323D67 indigo · #8C909C grey · #6FAE9E sea · #A8DB83 lime · #D1ECDF pale
 *
 * The only palette whose dark anchor is strong enough to be both the rail AND
 * the light-mode accent (10.51:1 on white), so indigo does both jobs and the
 * greens are left to do the warming.
 */
const INDIGO = '#323D67'
const GREY = '#8C909C'
const SEA = '#6FAE9E'
const LIME = '#A8DB83'
const PALEMINT = '#D1ECDF'
const FERN_NAVY = '#0F121F'

const FERN_MARK: UxVars = { '--ux-mark': FERN_NAVY, '--ux-mark-fg': LIME }

const FERN_DARK_NAV: UxVars = {
  '--ux-nav': FERN_NAVY,
  '--ux-nav-border': '#2D303D',
  '--ux-nav-fg': PALEMINT,
  '--ux-nav-muted': '#B8D0CC',
  '--ux-nav-eyebrow': LIME,
  '--ux-nav-active': '#43685F',
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#2D303D',
  '--ux-nav-count-fg': PALEMINT,
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#2B4741',
}

const FERN_LIGHT_NAV: UxVars = {
  '--ux-nav': '#DEF1E8',
  '--ux-nav-border': '#C3DED3',
  '--ux-nav-fg': '#2B3459',
  '--ux-nav-muted': '#4E5678',
  '--ux-nav-eyebrow': '#3A5A52',
  '--ux-nav-active': INDIGO,
  '--ux-nav-active-fg': '#FFFFFF',
  '--ux-nav-count': '#EDF8F3',
  '--ux-nav-count-fg': '#4E5678',
  '--ux-nav-active-count': 'rgb(255 255 255 / 0.92)',
  '--ux-nav-active-count-fg': '#232A48',
}

const FERN_LIGHT: UxVars = {
  ...LIGHT_PAGE,
  '--ux-bg': '#EEF8F3',
  '--ux-card': '#FFFFFF',
  '--ux-card-hover': '#F6FCF9',
  '--ux-border': '#C9D4D2',
  '--ux-text': '#2B3459',
  '--ux-text-2': '#576082',
  '--ux-text-3': '#636C8B',
  '--ux-accent': INDIGO,
  '--ux-accent-soft': '#E0E3EC',
  '--ux-accent-strong': '#232A48',
  '--ux-on-accent': '#FFFFFF',
  '--ux-chip': '#E6F5EE',
  '--ux-eyebrow': '#3A5A52',
  '--ux-hue-teal': SEA,
  '--ux-hue-gold': LIME,
  '--ux-hue-blue': INDIGO,
  '--ux-hue-neutral': GREY,
  '--ux-hue-teal-fg': '#3A5A52',
  '--ux-hue-gold-fg': '#465C37',
  '--ux-hue-blue-fg': '#283152',
  '--ux-hue-neutral-fg': '#494B51',
}

const FERN_DARK_TYPE: UxVars = {
  '--ux-text': PALEMINT,
  '--ux-text-2': '#B8D0CC',
  '--ux-text-3': '#A1B8BB',
  '--ux-accent': LIME,
  '--ux-accent-soft': 'rgb(168 219 131 / 0.16)',
  '--ux-accent-strong': '#C6E7AE',
  '--ux-on-accent': FERN_NAVY,
  '--ux-eyebrow': LIME,
  '--ux-hue-teal': SEA,
  '--ux-hue-gold': LIME,
  '--ux-hue-blue': INDIGO,
  '--ux-hue-neutral': GREY,
  '--ux-hue-teal-fg': '#ABD0C7',
  '--ux-hue-gold-fg': '#C0E5A6',
  '--ux-hue-blue-fg': '#A9AEBF',
  '--ux-hue-neutral-fg': '#BCBFC6',
}

const FERN_PALETTE: Record<UxTheme, UxVars> = {
  light: { ...FERN_MARK, ...FERN_LIGHT, ...FERN_LIGHT_NAV },
  hybrid: { ...FERN_MARK, ...FERN_LIGHT, ...FERN_DARK_NAV },
  dim: {
    ...FERN_MARK,
    ...FERN_DARK_TYPE,
    ...FERN_DARK_NAV,
    '--ux-bg': '#283152',
    '--ux-card': '#2F3961',
    '--ux-card-hover': INDIGO,
    '--ux-border': '#4B5373',
    '--ux-chip': '#2B3459',
  },
  dark: {
    ...FERN_MARK,
    ...FERN_DARK_TYPE,
    ...FERN_DARK_NAV,
    '--ux-bg': '#161B2D',
    '--ux-card': '#1D233C',
    '--ux-card-hover': '#222946',
    '--ux-border': '#3E4459',
    '--ux-chip': '#262E4E',
  },
}

const PALETTES: Record<UxPaletteId, Record<UxTheme, UxVars>> = {
  moss: MOSS_PALETTE,
  ember: EMBER_PALETTE,
  tide: TIDE_PALETTE,
  fern: FERN_PALETTE,
}

/**
 * Which nav section a feature belongs to.
 *
 * The rule, in priority order:
 *   1. An authored `devStatus` wins — it already drives the tile banner and the
 *      status pills, so reusing it means one field feeds three surfaces rather
 *      than adding a fourth that can disagree with them.
 *   2. Otherwise fall back to category. `demo` and `dashboard` are things you
 *      show; `testing` is build infrastructure; everything else is a document,
 *      which is Explorations.
 *
 * Step 2 is the guess. Authoring `devStatus` on the remaining features would
 * remove it entirely.
 */
/* Not exported: this file exports a component, and react-refresh needs a
   component-only module. If another surface ever needs this rule, it moves to
   its own util rather than being exported from a page.

   `effective` is the status AFTER any per-browser override from the row kebab,
   so setting "Ready for dev" actually moves the row into Development rather
   than just recolouring its chip. The tile landing behaved the same way — a
   status change moved the tile between tabs live. */
function sectionOf(
  f: PrototypeFeature,
  effective?: DevStatus | 'mixed' | null,
  isDone?: boolean,
): UxSection {
  // Done outranks the rest: it is where a feature ENDS, so it should not also
  // sit in Development claiming to be in flight.
  if (isDone ?? f.done) return 'done'
  const status = effective && effective !== 'mixed' ? effective : f.devStatus
  // Any authored status puts the row on the Development board (2026-10-15 —
  // Design, where `in-design` and `needs-discussion` used to land, is retired;
  // the status chip says which stage the row is at). `isDevelopmentStatus` in
  // devHandoffStatusUtil still names the development-side half, for the chip
  // colours and the filter order.
  if (status) return 'development'
  // The product build. `demo` / `dashboard` are the LMS's names for the same
  // thing and route here too; nothing routes to the Demo SECTION, which is a
  // panel authored on the page rather than a list of rows (2026-09-18).
  if (f.category === 'prototype' || f.category === 'demo' || f.category === 'dashboard') return 'prototypes'
  if (f.category === 'testing') return 'development'
  /* A dev handoff belongs on the Development board even with no authored
     status — paired with the `not-ready` default in `featureStatusKeyOf`, that
     means forgetting to author one puts the row in front of engineering marked
     "don't start", rather than hiding it among the documents where they never
     look. */
  if (f.category === 'dev-handoff') return 'development'
  // Ported outside products and hand-authored documents get their own section
  // — they are a different kind of thing from a feature row.
  if (f.category === 'exploration') return 'exploration'
  // ARCHIVED 2026-09-29 — the Sandbox SECTION is gone, but `'sandbox'` stays in
  // `FeatureCategory` because that union is verbatim from the LMS (CLAUDE.md,
  // "Data files"), so a row ported carrying it must still compile.
  //
  // THIS BRANCH IS DELIBERATELY EXPLICIT RATHER THAN DELETED. Delete it and the
  // category falls through to the `return 'exploration'` below, reaching the same
  // place — which is the silent failure `archive-a-feature` warns about: it
  // type-checks, it passes, and nobody can tell "routed here on purpose" from
  // "routed here because the branch that caught it is gone". One line to say so.
  if (f.category === 'sandbox') return 'exploration'
  return 'exploration'
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

const ICONS = { grid: Grid, calendar: CalendarDay, flag: Flag, monitor: Monitor, lightbulb: Lightbulb } as const

/** The dev cycle's own sequence, used to order the status filter pills so they
 *  read design → done rather than alphabetically.
 *
 *  (It also drove a Status option on a Sort control, removed 2026-08-24. The
 *  list is short and authored in a deliberate order; re-sorting it mostly threw
 *  that order away.) */
const STATUS_ORDER: FeatureStatusKey[] = [
  'in-design',
  'needs-discussion',
  'blocked',
  'ready-for-dev',
  'in-development',
  'mixed',
  'none',
  'done',
  'coming-soon',
]

/** The feature's handoff-card ids — what a roll-up status writes to. Falls back
 *  to `uiComponents`, because the current authoring convention puts the
 *  breakdown there and leaves `components: []`; without the fallback those
 *  features (Gift Recipients, Recommended for You) could not take a status at
 *  all. Empty for a feature with no handoff notes of either kind. */
function componentIdsOf(f: PrototypeFeature): string[] {
  const dh = f.devHandoff
  if (!dh) return []
  const ids = dh.components?.length ? dh.components : (dh.uiComponents ?? [])
  return ids.map((c) => c.id)
}

function rollupOf(f: PrototypeFeature): DevStatus | 'mixed' | null {
  const ids = componentIdsOf(f)
  return ids.length ? getFeatureRollupStatus(f.id, ids) : null
}

/** A feature's status key, resolved through the SAME function the landing board
 *  uses. `done` / `inDesign` come from the caller so a kebab toggle re-renders
 *  immediately instead of waiting for a reload. */
function statusKeyOf(
  f: PrototypeFeature,
  done: Record<string, boolean> = {},
  inDesign: Record<string, boolean> = {},
): FeatureStatusKey {
  return featureStatusKeyOf(
    f,
    done[f.id] ?? !!f.done,
    inDesign[f.id] ?? !!f.inProgress,
    rollupOf(f),
  )
}

export function UxDashboardPage() {
  const [params, setParams] = useSearchParams()
  // The section is URL-driven so a view is shareable and the browser's own Back
  // works between sections — the tile landing behaved this way and reviewers
  // have links that depend on it.
  const urlSection = sectionFromParam(params.get('section'), params.get('tab'))
  const [section, setSectionState] = useState<UxSection>(urlSection ?? DEFAULT_SECTION)
  const setSection = (next: UxSection) => {
    setSectionState(next)
    const p = new URLSearchParams(params)
    if (next === DEFAULT_SECTION) p.delete('section')
    else p.set('section', next)
    // Changing section closes an open gateway — the list you land on is the
    // list for that section, not someone else's feature.
    p.delete('open')
    setParams(p, { replace: true })
  }

  /**
   * `?section=demo&add=1&url=…&title=…&note=…&product=…&feature=…` — the
   * `share` skill's hand-off (2026-09-21, when it was `promote-to-refinement`;
   * `product` added 2026-10-14 so a Compass branch opens tagged Compass, and
   * `feature` 2026-10-15 so the next chunk of a feature lands in the group the
   * last one is already in). The page owns the router state, so it is
   * the page that reads the params and takes them off the address once
   * `DemoPanel` has opened its form with them; the panel stripping them itself
   * via `history.replaceState` would leave the router believing they were
   * still there, and the next `setSection` would write them straight back.
   * Read once, into state, so the object identity is stable across renders.
   */
  const [demoPrefill] = useState(() => {
    // Gated on the SECTION as well as `add`, since 2026-10-15: the To Do Board
    // takes the same `add=1` hand-off, and without this one address would arm
    // both prefills — the board's would open its sheet and the demo's would
    // sit un-consumed, keeping the params on the address for a reload to
    // reopen. An `add` with no section never reached a form anyway: the page
    // lands on Prototypes, which has no Add.
    if (urlSection !== 'demo' || !params.has('add')) return null
    // Validated against the catalog, not trusted: an unknown tag falls back to
    // the form's own default rather than reaching the draft as a string.
    const product = params.get('product')
    return {
      url: params.get('url') ?? '',
      title: params.get('title') ?? '',
      note: params.get('note') ?? '',
      product: LINK_PRODUCTS.some((x) => x.id === product) ? (product as LinkProduct) : undefined,
      // Free text, so there is nothing to validate it against — the form caps
      // its length and the board groups case-insensitively, which is the whole
      // of the contract. Absent leaves the field empty and the row ungrouped.
      feature: params.get('feature') ?? '',
    }
  })
  const consumeDemoPrefill = useCallback(() => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        for (const k of ['add', 'url', 'title', 'note', 'product', 'feature']) p.delete(k)
        return p
      },
      { replace: true },
    )
  }, [setParams])

  /**
   * `?section=todo-board&add=1&column=refine&title=…&note=…&owner=…` — the
   * second half of `promote-to-refinement` (2026-10-15). Sharing a branch now
   * files the card that says somebody has to look at it, in Ready For
   * Refinement, beside the row it just added to the board above.
   *
   * Read, validated and stripped here for the same three reasons the demo
   * prefill is: the page owns the router state, a param is a request rather
   * than a fact, and the object identity has to be stable across renders or
   * the panel's effect re-fires.
   */
  const [todoPrefill] = useState(() => {
    if (urlSection !== 'todo-board' || !params.has('add')) return null
    // Validated against the four columns, not cast: an unknown id would reach
    // the form as a `<select>` with no matching option. `owner` cannot be
    // validated here — the roster is the board's, and `resolveOwner` answers
    // for it once the endpoint has.
    const column = params.get('column')
    return {
      title: params.get('title') ?? '',
      note: params.get('note') ?? '',
      owner: params.get('owner') ?? '',
      column: isTodoColumn(column) ? column : undefined,
    }
  })
  const consumeTodoPrefill = useCallback(() => {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        for (const k of ['add', 'title', 'note', 'owner', 'column']) p.delete(k)
        return p
      },
      { replace: true },
    )
  }, [setParams])

  // Per-browser overrides, held in state so a kebab change re-renders — and, via
  // sectionOf, can move a row into another section immediately.
  const [done, setDone] = useState<Record<string, boolean>>(getDoneOverrides)
  const [inDesign, setInDesign] = useState<Record<string, boolean>>(getInDesignOverrides)
  const [statusTick, setStatusTick] = useState(0)
  const [theme, setTheme] = useState<UxTheme>(readTheme)
  const [palette, setPaletteState] = useState<UxPaletteId>(readPalette)
  const setPalette = (next: UxPaletteId) => {
    setPaletteState(next)
    try {
      localStorage.setItem(PALETTE_KEY, next)
    } catch {
      /* private mode — the choice just does not persist */
    }
  }
  // Status colours are picked for a white surface; on the dark themes they need
  // the light stops of the same hue, or the 10.5px chip text fails AA.
  const dark = IS_DARK[theme]
  const [themeOpen, setThemeOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)
  const nav: NavPalette = NAV

  // `data-theme` is a document-level attribute, so it is set on mount and
  // REMOVED on unmount — leaving it behind would darken every other route,
  // none of which opt into a theme.
  useEffect(() => {
    const root = document.documentElement
    if (IS_DARK[theme]) root.setAttribute('data-theme', 'dark')
    else root.removeAttribute('data-theme')
    if (theme === 'dim') root.setAttribute('data-ux-dim', 'on')
    else root.removeAttribute('data-ux-dim')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      /* private mode — the choice just does not persist */
    }
    return () => {
      root.removeAttribute('data-theme')
      root.removeAttribute('data-ux-dim')
    }
  }, [theme])

  // Outside click / Escape close the popover, the same shape every other menu
  // in this project uses.
  useEffect(() => {
    if (!themeOpen) return
    const onDown = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setThemeOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [themeOpen])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<FeatureStatusKey | 'all'>('all')

  // Demo shows no dev-cycle status. Everything in it is presentation-ready by
  // definition — that is what the section IS — so a status tag there either
  // says "Ready" (no information) or contradicts the section's own promise.
  // The filter pills go with it: a control that filters an attribute the rows
  // do not show is a dead control.
  const showStatus = section !== 'prototypes'


  // A feature gateway opened INSIDE this frame (`?open=<featureId>`). Demo rows
  // are excluded on purpose — those tiles exist to drop a stakeholder into the
  // live platform, and wrapping that in the UX dashboard's nav would be the
  // opposite of what they are for. Everything else is a spec you read while
  // working the board, so it keeps the nav.
  //
  // Resolved against the FEATURE'S OWN section, so a row no section lists
  // cannot be opened in-frame by naming it.
  const openId = params.get('open')
  const openCandidate = openId ? prototypeFeatureById(openId) : undefined
  const openDef = openCandidate
    ? VISIBLE_SECTIONS.find((d) => d.id === sectionOf(openCandidate, rollupOf(openCandidate)))
    : undefined
  const openFeature = openCandidate && openDef ? openCandidate : undefined
  const opensInFrame = (f: PrototypeFeature) => section !== 'prototypes' && !f.externalUrl && !f.to
  const setOpen = (id: string | null) => {
    const p = new URLSearchParams(params)
    if (id) p.set('open', id)
    else p.delete('open')
    setParams(p)
    if (id) window.scrollTo({ top: 0 })
  }

  const toggleDone = (f: PrototypeFeature) => {
    const next = !(done[f.id] ?? !!f.done)
    setDone((prev) => ({ ...prev, [f.id]: next }))
    setFeatureDone(f.id, next)
  }
  const toggleInDesign = (f: PrototypeFeature) => {
    const next = !(inDesign[f.id] ?? !!f.inProgress)
    setInDesign((prev) => ({ ...prev, [f.id]: next }))
    setFeatureInDesign(f.id, next)
  }
  const setRollup = (f: PrototypeFeature, status: DevStatus | null) => {
    setFeatureRollupStatus(f.id, componentIdsOf(f), status)
    // The store is read through getFeatureRollupStatus on every render, so a
    // tick is all that is needed to pick the write up.
    readDevStatusMap()
    setStatusTick((n) => n + 1)
  }

  /** Live open-item count for the To Do nav badge. Kept out of this component's
   *  state so the page does not have to own the list. */
  /** Live finding count for the QA Notes badge — the committed set plus whatever
   *  has been authored on the page. */
  const qaCount = useQaNoteCount()
  /** Live link count for the Links badge. There is no committed set to seed
   *  from, so this starts at 0 and settles on the first fetch. */
  const linkCount = useLinkCount()
  /** Live demo count. On the public build only the rows flipped public are
   *  shown, so the badge counts only those — a badge over a shorter list reads
   *  as a load failure. Same mechanism as `useLinkCount`; see `demoStore.ts`. */
  const demoCount = useDemoCount()
  /** Live research-link count. Same mechanism as `useLinkCount`; see
   *  `researchStore.ts`. */
  const researchCount = useResearchCount()
  /** Live PRD-link count. Same mechanism again; see `prdStore.ts`. */
  const prdCount = usePrdCount()
  /** Live card count for the To Do Board badge. Same mechanism again; see
   *  `todoBoardStore.ts`. ⚠ The trap the archived To Do section's restore note
   *  names applies here too: everything compiles and the row still draws
   *  without this, showing a permanent 0. */
  const todoBoardCount = useTodoBoardCount()

  const bySection = useMemo(() => {
    const out: Record<UxSection, PrototypeFeature[]> = {
      // Not a list of features — the Demo panel owns its own data, so this
      // stays empty by design and the nav count comes from `useDemoCount`.
      demo: [],
      prototypes: [],
      // Not a list of features — the Links panel owns its own data, so this
      // stays empty by design and the nav count comes from `useLinkCount`.
      links: [],
      // Same again: boards, counted by `useResearchCount` / `usePrdCount`.
      research: [],
      prds: [],
      exploration: [],
      development: [],
      done: [],
      archive: [],
      // Not a list of features either — the panel reads `HUB_DOCS`, and the
      // nav count is the static `count` on the SectionDef.
      'hub-resources': [],
      // Not a list of features — the QA panel owns its own data, so this stays
      // empty by design and the nav count comes from the `count` field.
      'qa-notes': [],
      // Same again: the board owns its own store, counted by
      // `useTodoBoardCount`.
      'todo-board': [],
    }
    for (const f of PROTOTYPE_FEATURES) {
      out[sectionOf(f, rollupOf(f), done[f.id] ?? !!f.done)].push(f)
    }
    return out
    // statusTick: a roll-up write changes which section a row belongs to; the
    // done map moves a row into (or out of) Done from the kebab.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusTick invalidates an impure localStorage read
  }, [statusTick, done])

  const q = query.trim().toLowerCase()
  const inSection = bySection[section]

  // Counts come from the section BEFORE the status filter, so a pill always
  // says how many it would show rather than how many survive the current pick.
  const statusCounts = useMemo(() => {
    const m = new Map<FeatureStatusKey, number>()
    for (const f of inSection) {
      const k = statusKeyOf(f, done, inDesign)
      m.set(k, (m.get(k) ?? 0) + 1)
    }
    return [...m.entries()].sort(
      (a, b) => STATUS_ORDER.indexOf(a[0]) - STATUS_ORDER.indexOf(b[0]),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusTick invalidates an impure localStorage read
  }, [inSection, done, inDesign, statusTick])

  const rows = useMemo(() => {
    const out = inSection.filter(
      (f) =>
        (!q || f.title.toLowerCase().includes(q) || (f.tileBlurb ?? f.blurb).toLowerCase().includes(q)) &&
        (status === 'all' || statusKeyOf(f, done, inDesign) === status),
    )
    /* READY FOR DEV LEADS (2026-10-21, Jillienne: "this is marked ready for
       Dev, lets make the Ready for Dev always be the first shown at the top").
       It is the one status that is a HANDOFF — the row is waiting on someone
       else, and a developer opening Development should not have to scan nine
       rows to find which ones are theirs. Everything else keeps its authored
       order behind it.

       A PARTITION, NOT A SORT BY `STATUS_ORDER`. Ordering the whole list by
       the dev cycle would also reshuffle the eight rows nobody asked about,
       and that order is authored — it is the sequence the sections were
       written in, which is itself information. Two buckets, each internally
       untouched.

       ⚠ NOT IN PROTOTYPES, which is why this is gated on `showStatus` rather
       than on the section name: that section's order is a decision
       (`PROTOTYPE_SCOPES`, end-to-end always first, pinned by
       `UxDashboard.smoke.test.tsx`) and it is the one section that draws no
       status chip at all — so there is nothing visible for a reader to tie the
       reordering to. The two facts travel together, so one flag covers both.

       Keys are computed ONCE into a map rather than inside the comparator:
       `statusKeyOf` reads the roll-up out of localStorage, and a comparator
       runs O(n log n) times. */
    const ordered = showStatus
      ? (() => {
          const keys = new Map(out.map((f) => [f.id, statusKeyOf(f, done, inDesign)]))
          const ready = out.filter((f) => keys.get(f.id) === 'ready-for-dev')
          return ready.length && ready.length < out.length
            ? [...ready, ...out.filter((f) => keys.get(f.id) !== 'ready-for-dev')]
            : out
        })()
      : out
    // Authored order, with pinned rows leading. Applied AFTER the filters, so
    // a pin cannot smuggle a row past a search or a status filter — it only
    // decides where a row that already matched sits. It is also applied after
    // the Ready-for-Dev partition, so an explicit pin still wins: a pin is
    // someone's deliberate choice about one row, and a status is not.
    const pinned = ordered.filter((f) => f.pinned)
    return pinned.length ? [...pinned, ...ordered.filter((f) => !f.pinned)] : ordered
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusTick invalidates an impure localStorage read
  }, [inSection, q, status, done, inDesign, statusTick, showStatus])

  // The palette, resolved once so the shell and the root mirror below cannot
  // disagree about which scheme is active.
  const paletteVars = PALETTES[palette][theme]
  // Mirror it onto the document root for the duration of this page. Everything
  // rendered inside the shell already inherits the inline copy below; this exists
  // for overlays that portal to `document.body` (the QA detail sheet), which are
  // outside the shell and would otherwise fall back to the brand's own surface
  // colours. Cleaned up on unmount so the palette never outlives the page.
  useEffect(() => mirrorPaletteToRoot(paletteVars as Record<string, string>), [paletteVars])

  /* The grouped row list — one card per group, rows inside.

     PROTOTYPES IS TWO LISTS — 2026-10-14, Jillienne on the preview: "this is
     the same as the main branch, so can we have it separated from the rest to
     better indicate that it's the Final Prototype, Source of Truth". The
     end-to-end row stands in its own card under its own heading; the doors
     around it — the work in progress — sit in a second card beneath. Every
     other section is the one unlabelled list it always was. */
  const rowGroups = groupRows(section, rows).map((g) => (
    <div key={g.id} data-group={g.id}>
      {g.label && (
        <div style={groupHeadStyle}>
          <p style={groupLabelStyle}>{g.label}</p>
          {g.note && <p style={groupNoteStyle}>{g.note}</p>}
        </div>
      )}
      <div style={listStyle}>
        {g.rows.map((f, i) => (
          <ProjectRow
            key={f.id}
            feature={f}
            first={i === 0}
            last={i === g.rows.length - 1}
            statusKey={statusKeyOf(f, done, inDesign)}
            isDone={done[f.id] ?? !!f.done}
            isInDesign={inDesign[f.id] ?? !!f.inProgress}
            onToggleDone={toggleDone}
            onToggleInDesign={toggleInDesign}
            onSetRollup={setRollup}
            dark={dark}
            onOpen={opensInFrame(f) ? setOpen : undefined}
            showStatus={showStatus}
          />
        ))}
      </div>
    </div>
  ))

  return (
    // The palette is applied here as custom properties rather than in
    // tokens.css: it is scoped to this page by construction, and the
    // module-level style consts below can still read it.
    <div style={{ ...shellStyle, ...(paletteVars as CSSProperties) }}>
      {/* ── Left nav ── */}
      <aside style={{ ...navStyle, background: nav.surface, borderRightColor: nav.border }} aria-label="Sections">
        <div style={{ ...brandStyle, color: nav.fg }}>
          <span aria-hidden style={brandMarkStyle}>
            <Grid size={16} />
          </span>
          {/* The mark stays a single tile beside a two-line lockup, rather than
              sitting above a sub-line indented past it. */}
          <span style={brandTextStyle}>
            UX Design Hub
            {/* "Atlas LMS", not "XCEL LMS" — 2026-10-15, Jillienne: the product
                is XCEL, the dashboard being built is Atlas, and the lockup
                names the two surfaces the Hub holds — Atlas and Compass. */}
            <span style={{ ...brandSubStyle, color: nav.muted }}>Atlas LMS &amp; Compass Learning</span>
            {/* The lockup's third line — "Design Link" / "Demo Link", which
                build you were on — was REMOVED 2026-10-15 (Jillienne), the
                first step of retiring the demo site: with one site there is
                no second build to be told apart from. */}
          </span>
        </div>
        {/* Same rule as the one above the restricted group, so the rail reads as
            one system of separators rather than two. */}
        <hr style={{ ...brandDividerStyle, borderTopColor: nav.border }} />
        <nav style={navListStyle}>
          {VISIBLE_SECTIONS.map((s, i) => {
            const active = s.id === section
            const count =
              s.id === 'qa-notes'
                ? qaCount
                : s.id === 'links'
                  ? linkCount
                  : s.id === 'demo'
                    ? demoCount
                    : s.id === 'research'
                      ? researchCount
                      : s.id === 'prds'
                        ? prdCount
                        : s.id === 'todo-board'
                          ? todoBoardCount
                          : (s.count ?? bySection[s.id].length)
            return (
              <div key={s.id}>
                {/* NAV_EYEBROWS rows first — authored, by id, above specific
                    ungated sections (Demo, Design & Research, Dev Handoff).
                    The very first row (Prototypes) skips the rule: the brand
                    divider above the <nav> already separates it. */}
                {NAV_EYEBROWS[s.id] && (
                  <>
                    {i > 0 && <hr style={{ ...dividerStyle, borderTopColor: nav.border }} />}
                    <p style={{ ...navEyebrowStyle, color: nav.eyebrow }}>{NAV_EYEBROWS[s.id]}</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSection(s.id)}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    ...navItemStyle,
                    color: active ? nav.activeFg : nav.muted,
                    background: active ? nav.activeBg : 'transparent',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  <span style={navItemLabelStyle}>
                    {s.label}
                  </span>
                  <span
                    style={{
                      ...navCountStyle,
                      background: active ? nav.activeCountBg : nav.countBg,
                      color: active ? nav.activeCountFg : nav.countFg,
                    }}
                  >
                    {count}
                  </span>
                </button>
              </div>
            )
          })}
        </nav>
        <div ref={themeRef} style={themeWrapStyle}>
          <button
            type="button"
            onClick={() => setThemeOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={themeOpen}
            style={{ ...themeBtnStyle, color: nav.muted, borderColor: nav.border }}
          >
            <Sliders size={14} aria-hidden style={{ flex: 'none' }} />
            {/* The label alone since 2026-09-29. It used to show the current
                value under it ("Fern · Hybrid"), which is the one fact a reader
                can already SEE — the whole page is rendered in it. The menu
                still marks which is active, so nothing is lost by not naming it
                here, and the control drops from two lines to one. */}
            <span style={themeBtnLabelStyle}>Appearance</span>
          </button>
          {themeOpen && (
            <div role="menu" aria-label="Appearance" style={themeMenuStyle}>
              {/* Two axes, two groups. Picking a palette does NOT close the
                  menu — comparing two schemes means flipping between them, and
                  a menu that shuts on every pick makes that four clicks. */}
              <p style={themeGroupLabelStyle}>Palette</p>
              {PALETTE_META.map((pal) => {
                const on = pal.id === palette
                return (
                  <button
                    key={pal.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    onClick={() => setPalette(pal.id)}
                    style={{ ...themeOptionStyle, ...(on ? themeOptionOnStyle : null) }}
                  >
                    <span aria-hidden style={swatchStyle}>
                      {pal.swatch.map((c) => (
                        <span key={c} style={{ ...swatchDotStyle, background: c }} />
                      ))}
                    </span>
                    <span style={themeOptionBodyStyle}>
                      <span style={themeOptionLabelStyle}>{pal.label}</span>
                      <span style={themeOptionHintStyle}>{pal.hint}</span>
                    </span>
                    {on && <span aria-hidden>✓</span>}
                  </button>
                )
              })}
              <p style={themeGroupLabelStyle}>Appearance</p>
              {THEMES.map((t) => {
                const on = t.id === theme
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={on}
                    onClick={() => {
                      setTheme(t.id)
                      setThemeOpen(false)
                    }}
                    style={{ ...themeOptionStyle, ...(on ? themeOptionOnStyle : null) }}
                  >
                    <t.Icon size={15} aria-hidden />
                    <span style={themeOptionBodyStyle}>
                      <span style={themeOptionLabelStyle}>{t.label}</span>
                      <span style={themeOptionHintStyle}>{t.hint}</span>
                    </span>
                    {on && <span aria-hidden>✓</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* ── Projects ── */}
      <main style={section === 'todo-board' ? mainWideStyle : mainStyle}>
        {openFeature ? (
          <>
            <button type="button" onClick={() => setOpen(null)} style={backLinkStyle}>
              <ChevronRight
                size={13}
                aria-hidden
                style={{ transform: 'rotate(180deg)', flex: 'none' }}
              />
              All {VISIBLE_SECTIONS.find((s) => s.id === section)!.label.toLowerCase()} projects
            </button>
            <PrototypeFeaturePage featureId={openFeature.id} embedded />
          </>
        ) : (
        <>
        <header style={headerStyle}>
          {/* No eyebrow over the section title — 2026-10-14, Jillienne on the
              preview: "remove the eyebrow from all the pages". Every section
              shares this header, so this is every page. */}
          <h1 style={h1Style}>{VISIBLE_SECTIONS.find((s) => s.id === section)!.label}</h1>
          {VISIBLE_SECTIONS.find((s) => s.id === section)!.blurb && (
            <p style={ledeStyle}>{VISIBLE_SECTIONS.find((s) => s.id === section)!.blurb}</p>
          )}
        </header>

        {section === 'research' ? (
          // The Links panel over the research board — see `ResearchPanel` in
          // `LinksPanel.tsx`. No bridge wrapper, same reason as Links below.
          <ResearchPanel />
        ) : section === 'qa-notes' ? (
          // Same bridge the archive table uses: the panel is styled on brand
          // tokens, and these six re-point them at this page's palette so it
          // re-skins with the four schemes and four appearances.
          <div style={ARCHIVE_BRIDGE}>
            <QaNotesPanel />
          </div>
        ) : section === 'links' ? (
          // No `ARCHIVE_BRIDGE` wrapper: the panel is styled on this page's own
          // `--ux-*` palette rather than the brand tokens, like `TodoPanel`, so
          // it already re-skins with the four schemes and four appearances.
          <LinksPanel />
        ) : section === 'prds' ? (
          <PrdsPanel />
        ) : section === 'demo' ? (
          // The same panel as Links with a different board behind it — see
          // `LinkBoardPanel`. Read-only and filtered to public rows on the
          // public build; that asymmetry is the review gate.
          <DemoPanel prefill={demoPrefill} onPrefillConsumed={consumeDemoPrefill} />
        ) : section === 'todo-board' ? (
          // No `ARCHIVE_BRIDGE` wrapper, same as Links: the panel is styled on
          // this page's own `--ux-*` palette rather than the brand tokens. Its
          // two SHEETS do need the bridge, because they portal out of this
          // shell — they carry it themselves, see `TodoBoardSheets.tsx`.
          <TodoBoardPanel prefill={todoPrefill} onPrefillConsumed={consumeTodoPrefill} />
        ) : section === 'archive' ? (
          <div style={ARCHIVE_BRIDGE}>
            <ArchiveTable />
          </div>
        ) : section === 'hub-resources' ? (
          // No `ARCHIVE_BRIDGE`: styled on this page's own `--ux-*` palette,
          // the same call `LinksPanel` makes.
          <HubResourcesPanel />
        ) : (
          <>
            <div style={toolbarStyle}>
              <label style={searchWrapStyle}>
                <Search size={15} aria-hidden />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects"
                  aria-label="Search projects"
                  style={searchInputStyle}
                />
              </label>
              <span style={countStyle}>
                {rows.length} {rows.length === 1 ? 'project' : 'projects'}
              </span>
            </div>

            {/* Status pills. Counts are of the SECTION, not of the current
                selection, so a pill says how many it would show rather than how
                many survive the pick you already made. Only statuses actually
                present render — an empty pill is a dead control. */}
            {showStatus && statusCounts.length > 1 && (
              <div style={pillRowStyle} role="group" aria-label="Filter by status">
                <StatusPill
                  label="All"
                  count={inSection.length}
                  active={status === 'all'}
                  onClick={() => setStatus('all')}
                />
                {statusCounts.map(([key, count]) => (
                  <StatusPill
                    key={key}
                    label={featureStatusChipFor(key, dark).label}
                    color={featureStatusChipFor(key, dark).color}
                    count={count}
                    active={status === key}
                    onClick={() => setStatus(status === key ? 'all' : key)}
                  />
                ))}
              </div>
            )}

            {rows.length === 0 ? (
              <p style={emptyStyle}>
                {q ? `Nothing matches “${query}”.` : 'Nothing in this section yet.'}
              </p>
            ) : (
              rowGroups
            )}
          </>
        )}
        </>
        )}
      </main>
    </div>
  )
}

/* ── One project row ──────────────────────────────────────────────────────── */

const STATUS_MENU_GLYPH: Record<DevStatus, typeof Lightbulb> = {
  'in-design': Lightbulb,
  'needs-discussion': MessageCircle,
  blocked: LockSolid,
  /* An hourglass, not a second lock: `blocked` means something is stopping this
     and `not-ready` means it is not finished yet. Paired against
     `ready-for-dev`'s CircleCheck, the two read as the opposites they are. */
  'not-ready': HourglassClock,
  'ready-for-dev': CircleCheck,
  'in-development': Bolt,
}

/** Per-status glyph for the kebab, so the menu reads at a glance rather than as
 *  five identical rows of text. Same colour resolver as the status chip, so the
 *  menu and the chip can never disagree — including on a dark surface. */
function statusMenuIcon(status: DevStatus, dark: boolean): ReactNode {
  const Glyph = STATUS_MENU_GLYPH[status]
  return <Glyph size={15} aria-hidden style={{ color: devStatusStrokeFor(status, dark) }} />
}

type ProjectRowProps = {
  feature: PrototypeFeature
  statusKey: FeatureStatusKey
  isDone: boolean
  isInDesign: boolean
  first: boolean
  last: boolean
  dark: boolean
  /** Set when this row's gateway should open inside the dashboard frame. The
   *  row stays a real `<a href>` either way, so cmd/middle-click still opens
   *  the standalone `/prototype/:id` page in a new tab. */
  onOpen?: (id: string) => void
  /** False in Demo, where a dev-cycle status says nothing. */
  showStatus: boolean
  onToggleDone: (f: PrototypeFeature) => void
  onToggleInDesign: (f: PrototypeFeature) => void
  onSetRollup: (f: PrototypeFeature, status: DevStatus | null) => void
}

function ProjectRow({
  feature,
  statusKey,
  isDone,
  isInDesign,
  first,
  last,
  dark,
  onOpen,
  showStatus,
  onToggleDone,
  onToggleInDesign,
  onSetRollup,
}: ProjectRowProps) {
  const [hover, setHover] = useState(false)
  const [copied, setCopied] = useState(false)
  const Icon = ICONS[feature.icon] ?? Grid
  // The same picture the feature's gateway header shows — an authored
  // `thumbnail` if there is one, else a live miniature of its preview. Rows
  // whose feature has neither keep the generated accent + icon mark.
  /* A PLACEHOLDER — 2026-10-14. A `coming-soon` row is drawn, not linked:
     no `<a>`, no hover, no chevron, no kebab (every action in it is about a
     row that goes somewhere), and the status tag is shown even where the
     section hides status — "Coming soon" is the one thing the row has to say.
     Two kinds: nothing built yet (the Admin row, no `to`), and a surface HELD
     BACK with its `to` kept on record (the end-to-end row, the same evening:
     "don't remove the work, just hide users from clicking on it"). Either
     kind draws the generated mark, not a live frame — see `hasPreview`. */
  const placeholder = feature.status === 'coming-soon'
  const preview = primaryPreviewSrc(feature)
  // A placeholder shows the GENERATED mark whatever it has on record — Jillienne
  // on the preview, 2026-10-14: "make that image a default icon image like the
  // admin tool to show it's disabled". A live frame of the surface behind a
  // held-back row read as an invitation; the abstract mark reads as closed.
  const hasPreview = !placeholder && Boolean(feature.thumbnail || preview)
  const href = feature.externalUrl ?? feature.to ?? `/prototype/${feature.id}`
  const external = Boolean(feature.externalUrl)
  const isPrototypeRow = feature.category === 'prototype'
  /* The three facts a Prototypes row carries beside its title (2026-10-14):
     which door it is (an empty scope label means none — the product row),
     whose surface it is, and when that surface last changed on `main`. */
  const owner = prototypeScopeOwner(feature.prototypeScope)
  /* The owner tag is a user ICON and the name, not the word "Owner" — Jillienne
     on the preview, 2026-10-14. The word stays for a screen reader, visually
     hidden, so the tag still reads "Owner: Anjani" where it is read aloud. */
  // Owner, then Updated, then the scope LAST — 2026-10-15, Jillienne on the
  // live site: "move these top ones to the bottom". Who and when lead; what
  // door it is closes the stack.
  const prototypeTags: { key: string; text: string; icon?: ReactNode; srPrefix?: string }[] = [
    { key: 'owner', text: owner ?? '', icon: <User size={11} aria-hidden style={{ flex: 'none' }} />, srPrefix: 'Owner: ' },
    { key: 'updated', text: feature.lastUpdated ? `Updated ${formatUpdated(feature.lastUpdated)}` : '' },
    { key: 'scope', text: prototypeScopeLabel(feature.prototypeScope) || '' },
  ].filter((t) => t.text)
  // Three labels, answering "how much of the product is this?":
  //   Standalone HTML — leaves the app entirely (the route column used to be
  //     the only thing that said so; with it gone the kind tag carries it)
  //   Full platform   — the whole app, to navigate freely
  //   Feature         — one feature. Every `guided` tile is one, and so are the
  //     `explore` tiles that open a single page rather than the platform, which
  //     say so via `kindLabel`.
  //   A PROTOTYPES row says which DOOR it is instead (2026-10-14): three rows
  //     in that section all open the same build, so "Full platform" three
  //     times would say nothing, and the scope label is the one thing that
  //     tells them apart at a glance.
  //   An EMPTY scope label means no kind tag at all (the end-to-end row,
  //     2026-10-14) — the column stays so the other rows' tags still line up.
  const scopeLabel = prototypeScopeLabel(feature.prototypeScope)
  const meta =
    scopeLabel === ''
      ? []
      : [
          scopeLabel ??
            feature.kindLabel ??
            (external ? 'Standalone HTML' : feature.kind === 'explore' ? 'Full platform' : 'Feature'),
        ]
  // The row's status chip and the pill that filters it are the same resolver,
  // so a pill can never disagree with the rows it produces.
  const chip = featureStatusChipFor(statusKey, dark)

  // A roll-up status is written to the feature's handoff CARDS, so a feature
  // with no handoff notes has nowhere to put one. Those rows get the In Design
  // toggle instead — otherwise they'd have no way to carry a status at all.
  const rollupStatus = rollupOf(feature)
  const canSetRollup = componentIdsOf(feature).length > 0

  const copyLink = () => {
    const url = external ? href : `${window.location.origin}${href}`
    // A rejection here (no clipboard permission, document not focused) must not
    // surface as an unhandled rejection — the toast is the only feedback.
    navigator.clipboard?.writeText(url).catch(() => {})
    setCopied(true)
  }

  /* A PROTOTYPES ROW'S KEBAB IS "COPY LINK" AND NOTHING ELSE — 2026-10-14,
     Jillienne on the preview. `showStatus` is false exactly in Prototypes (see
     the note on it), and every other item here is a dev-cycle action — Mark
     in design, Mark done, the six roll-up statuses — which says nothing about
     a row that IS the product. Keyed off `showStatus` rather than a new prop
     because the two are one fact: a section that shows no status has no
     status to set. */
  const copyOnly = !showStatus
  const copyItem = {
    id: 'copy-link',
    label: 'Copy link',
    icon: <Share2 size={15} aria-hidden />,
    onSelect: copyLink,
  }
  const items = copyOnly ? [copyItem] : [
    copyItem,
    ...(canSetRollup
      ? [
          ...DEV_STATUS_SEQUENCE.map((st) => ({
            id: `status-${st}`,
            label: rollupStatus === st ? `${DEV_STATUS_LABEL[st]} ✓` : DEV_STATUS_LABEL[st],
            icon: statusMenuIcon(st, dark),
            onSelect: () => onSetRollup(feature, st),
          })),
          ...(rollupStatus
            ? [
                {
                  id: 'status-clear',
                  label: 'Clear status',
                  icon: <X size={15} aria-hidden />,
                  onSelect: () => onSetRollup(feature, null),
                },
              ]
            : []),
        ]
      : [
          {
            id: 'in-design',
            label: isInDesign ? 'Clear in design' : 'Mark in design',
            icon: <Clock size={15} aria-hidden />,
            onSelect: () => onToggleInDesign(feature),
          },
        ]),
    {
      id: 'done',
      label: isDone ? 'Reopen' : 'Mark done',
      icon: isDone ? <ArrowLeft size={15} aria-hidden /> : <Check size={15} aria-hidden />,
      onSelect: () => onToggleDone(feature),
    },
  ]

  const inner = (
    <>
      {/* Thumbnail. Generated from the feature's own accent + icon by default:
          27 hand-made screenshots would need remaking every time a screen
          changes, and a stale thumbnail is worse than an abstract one. A
          feature whose point IS the visual can override with a real capture
          via `thumbnail` — see the field's note in prototypeFeatures.ts. */}
      {hasPreview ? (
        /* ⚠ THE COMPONENT, NOT THE PAGE (2026-10-21, Jillienne: "have these
           images match"). The feature header shows a zoomed render of the
           component a handoff is about; this row was still scaling a 1440px
           page into 160px, so the same feature was illustrated two different
           ways depending on which screen you were on. `ComponentPreviewThumb`
           falls back to the page thumbnail for features with no component
           render, so nothing that worked before stops working. */
        <ComponentPreviewThumb
          feature={feature}
          src={preview}
          width={THUMB_W}
          height={THUMB_H}
          radius="var(--radius-md)"
        />
      ) : (
        <GeneratedThumb accent={feature.accent}>
          {/* Scales with the tile — a 20px glyph swims in a 160x110 panel. */}
          <Icon size={34} />
        </GeneratedThumb>
      )}

      <span style={bodyStyle}>
        <span style={titleRowStyle}>
          <span style={nameStyle}>{feature.title}</span>
        </span>
        <span style={blurbStyle}>{feature.tileBlurb ?? feature.blurb}</span>
      </span>

      {/* Kind + status as tags in their own column. They used to sit under the
          blurb with the route path out here; the path was the least useful
          thing on the row (it repeats the title, and the chevron already says
          "this goes somewhere"), and putting the two tags in a fixed column
          means they line up down the list instead of starting at whatever
          x-position the blurb happened to end on. */}
      {isPrototypeRow ? (
        /* A PROTOTYPES ROW'S TAG COLUMN — 2026-10-14, Jillienne on the preview:
           outlined, square-cornered TAGS rather than filled pills, stacked —
           the scope, who owns the surface, and when it last changed on main.
           A placeholder adds its "Coming soon" tag and has no Updated. */
        <span style={tagAreaPrototypeStyle}>
          <span style={tagStackStyle}>
            {prototypeTags.map((t) => (
              <span key={t.key} style={t.icon ? { ...prototypeTagStyle, display: 'inline-flex', alignItems: 'center', gap: 4 } : prototypeTagStyle}>
                {t.icon}
                {t.srPrefix && <span className="cre-visually-hidden">{t.srPrefix}</span>}
                {t.text}
              </span>
            ))}
          </span>
          {/* "Coming soon" sits to the RIGHT of the stack, not under it —
              2026-10-15, Jillienne on the live site. The column is there on
              every row, empty on the ones that open, so the stacks and the
              chevrons stay aligned down the list. The whole `border`
              shorthand, not `borderColor` over it: React writes the longhand
              after the shorthand and the browser drops the widths. */}
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {placeholder && (
              <span style={{ ...prototypeTagStyle, color: chip.color, border: `1px solid ${chip.color}` }}>
                {chip.label}
              </span>
            )}
          </span>
        </span>
      ) : (
        <span style={showStatus ? tagColStyle : tagColSoloStyle}>
          {meta.map((m) => (
            <span key={m} style={metaChipStyle}>
              {m}
            </span>
          ))}
          {showStatus && (
            <span style={{ ...metaChipStyle, ...statusTagStyle(chip.color) }}>{chip.label}</span>
          )}
        </span>
      )}

      {placeholder ? (
        // Keeps the chevron's column so the tags line up with the rows above.
        <span aria-hidden style={{ flex: 'none', width: 15 }} />
      ) : (
        <ChevronRight
          aria-hidden
          size={15}
          style={{ flex: 'none', color: hover ? 'var(--ux-accent)' : 'var(--ux-text-3)' }}
        />
      )}
    </>
  )

  /* READY FOR DEV WEARS A GREEN LEFT STROKE (2026-10-21, Jillienne: "when
     ready for dev, also include a green left stroke on this component to help
     them see which are ok to work on"). Sorting those rows to the top says
     which they are only while you are at the top of the list; the stroke says
     it wherever the row has been scrolled to, and it is the one status a
     developer is scanning FOR.

     ⚠ AN INSET BOX-SHADOW, NOT A `border-left`. The row's padding is
     `14px 12px 14px 18px`, so a 3px border would push every cell 3px right and
     the thumbnails, titles and tags would stop lining up with the rows above —
     the exact misalignment the placeholder's spacer above exists to prevent.
     An inset shadow occupies no layout box, and it CLIPS TO THE BORDER RADIUS,
     so on the first row (which rounds its own top-left) the stroke follows the
     corner instead of overshooting it.

     Gated on `showStatus` for the same single reason the row sort is: a
     section that draws no status chip (Prototypes) must not carry a status
     colour either, or there is a green bar on the page with nothing anywhere
     to explain it. */
  const readyStroke = showStatus && statusKey === 'ready-for-dev'
  // The list no longer clips (the kebab menu would be cut off), so the end rows
  // round their own corners to keep the card's shape on hover.
  const wrap: CSSProperties = {
    ...rowWrapStyle,
    background: hover ? 'var(--ux-bg)' : 'var(--ux-card)',
    borderBottom: last ? 'none' : rowWrapStyle.borderBottom,
    borderTopLeftRadius: first ? 'var(--radius-lg)' : undefined,
    borderTopRightRadius: first ? 'var(--radius-lg)' : undefined,
    borderBottomLeftRadius: last ? 'var(--radius-lg)' : undefined,
    borderBottomRightRadius: last ? 'var(--radius-lg)' : undefined,
    ...(readyStroke && {
      boxShadow: `inset 3px 0 0 ${devStatusStrokeFor('ready-for-dev', dark)}`,
    }),
  }
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  }
  const linkProps = {
    style: { ...rowLinkStyle, flex: 1 },
    ...handlers,
    // Only a plain primary click is intercepted — a modified click is the
    // reviewer asking for a new tab, and that should still get the real page.
    onClick: onOpen
      ? (e: ReactMouseEvent<HTMLAnchorElement>) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
          e.preventDefault()
          onOpen(feature.id)
        }
      : undefined,
  }

  if (placeholder) {
    return (
      <div
        style={{ ...wrap, background: 'var(--ux-card)' }}
        aria-disabled="true"
        data-row={feature.id}
        data-placeholder={feature.id}
      >
        <span style={{ ...rowLinkStyle, flex: 1, opacity: 0.62, cursor: 'default' }}>{inner}</span>
        {/* Where the kebab would be. Without it the row's grid is a kebab wider
            and its tags sit 40px right of the rows above — Jillienne on the
            preview, "have these all vertically align". Conditional exactly
            as the kebab is, so the public build (no kebabs anywhere) stays
            aligned too. */}
        <span aria-hidden style={{ flex: 'none', width: 32 }} />
      </div>
    )
  }

  return (
    <div style={wrap} data-row={feature.id} onMouseEnter={handlers.onMouseEnter} onMouseLeave={handlers.onMouseLeave}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
          {inner}
        </a>
      ) : (
        <Link to={href} {...linkProps}>
          {inner}
        </Link>
      )}
      {/*
        THE ROW KEBAB IS DESIGN-SITE ONLY — 2026-09-24, the direct ask.

        Every item behind it is a DESIGN action: the six dev-cycle statuses,
        Clear status, Mark done, Copy link. A stakeholder on the demo site has
        no reason to set "Ready for Dev" on anything, and every one of those
        writes persists (localStorage `cgp.devHandoffStatus` /
        `cgp.prototypeDone`) and OVERRIDES the authored `devStatus` — so a
        stray click there silently moves a row between Design and Development
        for that person, with nothing on the page explaining why.

        ⚠ Not rendered at all, rather than disabled: a greyed kebab invites the
        question "why can't I?", which is a conversation the demo is not for.
        Same call as the admin robot.
      */}
      {(
        <span style={{ flex: 'none' }}>
          {/* Gray, not the amber accent the shared kebab defaults to —
              2026-10-14, Jillienne on the preview ("make the ellipsis gray").
              On a project row the dots are the quietest thing in the row;
              amber made them the loudest. `--ux-text-3` is the gateway's own
              tertiary ink, the colour the chevron rests in. */}
          <ActionMenu
            label={`Actions for ${feature.title}`}
            items={items}
            triggerStyle={{ color: 'var(--ux-text-3)' }}
          />
        </span>
      )}
      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        {external ? href : `${window.location.origin}${href}`}
      </Toast>
    </div>
  )
}

function StatusPill({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  color?: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{ ...pillStyle, ...(active ? pillActiveStyle : null) }}
    >
      {color && <span aria-hidden style={{ ...statusDotStyle, background: color }} />}
      {label}
      <span style={{ ...pillCountStyle, ...(active ? pillCountActiveStyle : null) }}>{count}</span>
    </button>
  )
}

/* ── styles ───────────────────────────────────────────────────────────────── */

const shellStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '232px minmax(0, 1fr)',
  minHeight: '100vh',
  /* The page's paper. Falls back to `--ux-bg` so the two dark appearances are
     unchanged; only the light sets define `--ux-page` (see LIGHT_PAGE). */
  background: 'var(--ux-page, var(--ux-bg))',
}

const navStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 22,
  padding: '26px 16px',
  borderRight: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
}

const brandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '0 8px',
  fontFamily: 'var(--font-heading)',
  fontSize: 16,
  fontWeight: 700,
}

const brandTextStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.15,
}

/* `font-body`, not the heading face the line above uses: a sub-line set in the
   same family at a smaller size reads as a clipped second title rather than as
   a different kind of information. */
const brandSubStyle: CSSProperties = {
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

/* The rail's own gap already separates the brand from the nav, so this only
   needs the rule — no top margin. */
const brandDividerStyle: CSSProperties = {
  margin: '0 12px',
  border: 0,
  borderTop: '1px solid var(--ux-border)',
}

const brandMarkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  borderRadius: 'var(--radius-md)',
  /* The one place the palette speaks at full strength: a solid ink tile with a
     citron glyph. Citron is 3.16:1 on white — unusable as text — but 4.98:1 on
     ink, so this is where it earns its place. */
  background: 'var(--ux-mark)',
  color: 'var(--ux-mark-fg)',
}

const navListStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2 }

const navItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  width: '100%',
  padding: '9px 12px',
  border: 0,
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--ux-text-2)',
  font: 'inherit',
  fontSize: 13.5,
  textAlign: 'left',
  cursor: 'pointer',
}

const navItemLabelStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6 }

/** Divider between the open sections and the restricted group. */
const dividerStyle: CSSProperties = {
  margin: '14px 12px 10px',
  border: 0,
  borderTop: '1px solid var(--ux-border)',
}

const navEyebrowStyle: CSSProperties = {
  margin: '0 12px 6px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
}

const navCountStyle: CSSProperties = {
  minWidth: 22,
  padding: '1px 7px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  fontSize: 11,
  fontWeight: 700,
  textAlign: 'center',
}

/**
 * The foot of the rail, and the only thing left down there since the "How to
 * read this dashboard" link was removed on 2026-09-29.
 *
 * `marginTop: auto` IS LOAD-BEARING and it has now moved three times: this
 * element → a footer paragraph → the About link → back here. Whatever is last
 * in the rail has to carry it, or the foot group stops being a foot group and
 * rides up under the sections. Removing the About link without moving this back
 * would have looked like a layout bug with no obvious cause.
 */
const themeWrapStyle: CSSProperties = { position: 'relative', marginTop: 'auto' }

const themeBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '8px 12px',
  border: '1px solid',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  font: 'inherit',
  fontSize: 12.5,
  textAlign: 'left',
  cursor: 'pointer',
}
/** 10px uppercase at 75% opacity was right while this was an EYEBROW over the
 *  current value — small and quiet so the value below it read first. With the
 *  value gone it is the button's own label, and an eyebrow with nothing under
 *  it just looks like faint text. It takes the button's size and weight now,
 *  matching the rail rows above it. */
const themeBtnLabelStyle: CSSProperties = {
  fontWeight: 600,
  letterSpacing: '0.01em',
}


/** Opens upward — the trigger sits at the foot of the nav, so a downward menu
 *  would fall off the bottom of the viewport. */
const themeMenuStyle: CSSProperties = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: 0,
  right: 0,
  zIndex: 20,
  padding: 5,
  border: '1px solid var(--ux-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ux-card)',
  boxShadow: 'var(--shadow-card)',
}

const themeOptionStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  width: '100%',
  padding: '8px 10px',
  border: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  color: 'var(--ux-text)',
  font: 'inherit',
  fontSize: 12.5,
  textAlign: 'left',
  cursor: 'pointer',
}

/* `primary-100` inverts under the dark theme while the hint underneath stays
   `text-secondary`, which put the selected row's hint at 1.18:1. A one-step-back
   surface is theme-aware, leaves every text color alone, and the check mark —
   not the fill — is what actually says "selected". */
const themeOptionOnStyle: CSSProperties = {
  background: 'var(--ux-bg)',
  fontWeight: 700,
}

const themeOptionBodyStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }
const themeOptionLabelStyle: CSSProperties = { fontWeight: 700 }
const themeOptionHintStyle: CSSProperties = { fontSize: 11, color: 'var(--ux-text-2)' }

const themeGroupLabelStyle: CSSProperties = {
  margin: '4px 8px 2px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--ux-text-3)',
}

/** Three dots of the palette itself, in place of the appearance rows' glyph —
 *  a scheme is easier to recognise by its colours than by a name. */
const swatchStyle: CSSProperties = { display: 'inline-flex', gap: 2, flex: 'none' }

const swatchDotStyle: CSSProperties = {
  width: 7,
  height: 14,
  borderRadius: 2,
  border: '1px solid rgb(0 0 0 / 0.12)',
}

// 24 on top, not 40 — 2026-10-14, Jillienne on the preview ("reduce top
// padding"), once the eyebrow above the title had gone and the title sat alone
// under a deep band of nothing.
const mainStyle: CSSProperties = { padding: '24px 32px 72px', maxWidth: 1080 }

/**
 * The To Do Board's main is WIDER than every other section's.
 *
 * 1080 is a reading measure — right for a list of rows with a title and a
 * note, which is what every other section is. The board is four columns side
 * by side, and at 1080 (826 of it after the padding) the fourth sat off the
 * edge behind a horizontal scrollbar. Scrolling sideways to see a column is
 * the one thing a board must not make you do: "what is in Ready for Handoff?"
 * is the question it exists to answer at a glance.
 *
 * `none` rather than a bigger number, because the columns share whatever
 * width there is (see `boardStyle`) — so the board grows with the window
 * instead of being capped at somebody's guess about a monitor.
 */
const mainWideStyle: CSSProperties = { ...mainStyle, maxWidth: 'none' }
const headerStyle: CSSProperties = { marginBottom: 22 }


const h1Style: CSSProperties = {
  // Was 10 on top, which spaced the title off the eyebrow; no eyebrow now.
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 34,
  fontWeight: 500,
  color: 'var(--ux-text)',
}

const ledeStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 14,
  color: 'var(--ux-text-2)',
  maxWidth: '70ch',
}

const toolbarStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }

const searchWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  flex: '0 0 320px',
  padding: '8px 12px',
  border: '1px solid var(--ux-border)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-3)',
}

const searchInputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: 'none',
  background: 'transparent',
  font: 'inherit',
  fontSize: 13.5,
  color: 'var(--ux-text)',
}

const pillRowStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  padding: '5px 11px',
  border: '1px solid var(--ux-border)',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  font: 'inherit',
  fontSize: 12.5,
  cursor: 'pointer',
}

const pillActiveStyle: CSSProperties = {
  borderColor: 'var(--ux-accent)',
  background: 'var(--ux-accent-soft)',
  color: 'var(--ux-accent-strong)',
  fontWeight: 700,
}

const pillCountStyle: CSSProperties = {
  padding: '0 6px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  fontSize: 11,
  fontWeight: 700,
}

const pillCountActiveStyle: CSSProperties = {
  background: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

/** Still used by the filter pills above the list — a pill names the status in
 *  text, so the dot is a second cue there rather than the only one. */
const statusDotStyle: CSSProperties = { width: 7, height: 7, borderRadius: '50%', flex: 'none' }

const countStyle: CSSProperties = { marginLeft: 'auto', fontSize: 12.5, color: 'var(--ux-text-2)' }

/** How a section's rows are grouped into cards. Only Prototypes splits (see
 *  the render site); an empty group is dropped so a filtered search never
 *  shows a heading over nothing. */
function groupRows(
  section: UxSection,
  rows: PrototypeFeature[],
): { id: string; label?: string; note?: string; rows: PrototypeFeature[] }[] {
  if (section !== 'prototypes') return [{ id: 'all', rows }]
  const truth = rows.filter((f) => f.prototypeScope === 'end-to-end')
  const rest = rows.filter((f) => f.prototypeScope !== 'end-to-end')
  return [
    {
      id: 'source-of-truth',
      label: 'Final prototype — source of truth',
      note: 'What the product is right now: main, at the committed baseline.',
      rows: truth,
    },
    {
      id: 'in-progress',
      label: 'Work in progress',
      note: 'The doors around it, each its owner’s. What is picked from here becomes the final prototype.',
      rows: rest,
    },
  ].filter((g) => g.rows.length > 0)
}

const groupHeadStyle: CSSProperties = { margin: '22px 0 10px' }
const groupLabelStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--ux-text)',
}
const groupNoteStyle: CSSProperties = { margin: '3px 0 0', fontSize: 12.5, color: 'var(--ux-text-2)' }

const listStyle: CSSProperties = {
  border: '1px solid var(--ux-border)',
  borderRadius: 'var(--radius-lg)',
  /* Deliberately NOT `overflow: hidden` — the row kebab's menu is absolutely
     positioned, so clipping the list would clip the menu. The first/last rows
     round their own corners instead (see ProjectRow's `first` / `last`). */
  background: 'var(--ux-card)',
  boxShadow: 'var(--shadow-card)',
}

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
  gap: 16,
  alignItems: 'center',
  padding: '14px 18px',
  borderBottom: '1px solid var(--ux-border)',
  color: 'inherit',
  textDecoration: 'none',
  transition: 'background 120ms',
}

/** The row's clickable half. The kebab sits OUTSIDE it — a button nested in an
 *  anchor is invalid, and its menu would inherit the link's activation. */
const rowLinkStyle: CSSProperties = {
  ...rowStyle,
  borderBottom: 'none',
  padding: 0,
  minWidth: 0,
}

const rowWrapStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '14px 12px 14px 18px',
  borderBottom: '1px solid var(--ux-border)',
  transition: 'background 120ms',
}

const bodyStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }

const titleRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 9 }

const nameStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.25,
}

/* Three lines, not two: the 110px thumbnail sets the row height, and a
   title + 2 lines only fills ~62px of it. The third line uses space that was
   already being paid for, and the text column lost ~96px to the bigger tile —
   at two lines the blurbs were cutting mid-word. */
const blurbStyle: CSSProperties = {
  fontSize: 12.5,
  lineHeight: 1.5,
  color: 'var(--ux-text-2)',
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const metaChipStyle: CSSProperties = {
  padding: '1px 8px',
  /* Hugs its own text — the fixed grid column below aligns where each tag
     STARTS, it does not stretch the tag to fill it. */
  justifySelf: 'start',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
  fontSize: 10.5,
  fontWeight: 700,
  whiteSpace: 'nowrap',
}

/** Two fixed columns, not a flex row. Every row is its OWN grid container, so
 *  an `auto` column is sized by that row's own content — "Done" and "Needs
 *  Discussion" would put the kind chip at a different x on every line. The
 *  widths are the measured widest label in each column ("Standalone HTML" 100px,
 *  "Needs Discussion" 108px, at 10.5/700 + 8px padding a side) plus a little
 *  slack, so the tags all START at the same x down the whole list — each one
 *  still hugs its own text (`justifySelf: start` on the chip), so the column is
 *  the alignment guide, not the tag's width. */
const tagColStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '104px 112px',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
}

/** Demo drops the status column rather than leaving a 112px hole in front of
 *  the chevron. The kind column keeps its width, so the tag still lines up
 *  down the list. */
const tagColSoloStyle: CSSProperties = { ...tagColStyle, gridTemplateColumns: '104px' }

/** The Prototypes rows' tag area: the STACK (one tag per line, wide enough for
 *  "Updated Oct 14, 8:47 PM" at the tag's own size) and, to its right, a column
 *  for the status tag — "Coming soon" on a placeholder, empty otherwise, and
 *  present on every row so nothing shifts between them. */
const tagAreaPrototypeStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '156px 84px',
  alignItems: 'center',
  gap: 6,
  flex: 'none',
}
const tagStackStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '156px', alignItems: 'center', gap: 6 }

/** An outlined, square-cornered TAG — what the Prototypes rows wear instead
 *  of the filled pill (2026-10-14, Jillienne: "tags instead of badges,
 *  outlined, more square looking"). Same size and weight as the chip so the
 *  two never sit side by side at different scales. */
const prototypeTagStyle: CSSProperties = {
  ...metaChipStyle,
  background: 'transparent',
  border: '1px solid var(--ux-border)',
  borderRadius: 4,
  fontWeight: 600,
}


/** The status as a TAG rather than a dot + coloured text, so it reads as the
 *  same object as the kind chip beside it. The fill is a low mix of the status
 *  colour into whatever is behind it, so it tints on both the card and the
 *  hover background and in every theme — 12% is as far as it can go before the
 *  text's own contrast against it starts dropping below AA on the pale
 *  statuses. */
function statusTagStyle(color: string): CSSProperties {
  return { background: `color-mix(in srgb, ${color} 12%, transparent)`, color }
}

/** The in-frame gateway's "back to the list" control. A button, not a Link —
 *  it clears a search param on the page you are already on. */
const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  margin: '0 0 18px',
  padding: 0,
  border: 'none',
  background: 'none',
  color: 'var(--ux-accent)',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const emptyStyle: CSSProperties = {
  padding: '32px 4px',
  fontSize: 13.5,
  color: 'var(--ux-text-2)',
}
