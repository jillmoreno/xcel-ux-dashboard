import {
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
  type FeatureAccent,
  type PrototypeFeature,
} from '@/data/prototypeFeatures'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'
import { PrototypeFeaturePage } from './PrototypeFeaturePage'
import { FeaturePreviewThumb } from '@/components/prototype/FeaturePreviewThumb'
import { primaryPreviewSrc } from '@/components/prototype/featurePreviewSrc'
import { ArchiveTable } from '@/components/prototype/ArchiveTable'
import { QaNotesPanel } from '@/components/prototype/QaNotesPanel'
import { TodoPanel } from '@/components/prototype/TodoPanel'
import { useTodoOpenCount } from '@/components/prototype/todoStore'
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
  Lock,
  LockSolid,
  MessageCircle,
  Monitor,
  Moon,
  Search,
  Share2,
  Sliders,
  Sun,
  X,
} from '@/icons'
import { Toast } from '@/components/ui/Toast'
import { PrototypePasswordModal } from '@/components/prototype/PrototypeLock'
import { isPrototypeUnlocked, markPrototypeUnlocked } from '@/components/prototype/prototypeLockUtil'

/**
 * UX dashboard — the prototype's front door, at `/` (and still reachable at
 * `/ux-dashboard`). It replaced the tile-grid landing on 2026-08-24; that page
 * is intact but unrouted (see the `prototype-tile-landing` row in
 * `archivedItems.ts`).
 *
 * Two things it changed:
 *
 *   1. A persistent left nav — Demo · Research · Design · Exploration ·
 *      Development · Archive — instead of the section-chooser-then-tabs the old
 *      landing used. Every section is one click from every other, and the
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
 * is why setting one can move a row between Design and Development.
 */

/* ── The taxonomy ─────────────────────────────────────────────────────────── */

type UxSection =
  | 'demo'
  | 'research'
  | 'todo'
  | 'design'
  | 'exploration'
  | 'sandbox'
  | 'development'
  | 'done'
  | 'archive'
  | 'qa-notes'

/**
 * ONE gate for every restricted section — Design, Exploration, Development,
 * Done and Archive all share this id, so a reviewer types the password once
 * and the whole group opens. (Exploration used to carry its own id and its own
 * hardcoded password, which meant two prompts for one body of work and, worse,
 * a password the Admin tools override could not reach.)
 *
 * The id matches the one the archived tile landing uses, so unlocking on either
 * surface carries to the other. The password itself is not here: it comes from
 * `getPrototypePassword()` — DEFAULT_PROTOTYPE_PASSWORD unless an admin has
 * set one (Admin tools → Prototype Password).
 */
const DEV_GATE_ID = 'design-and-development'

type SectionDef = {
  id: UxSection
  label: string
  blurb: string
  /** Which gate guards it, if any. Open sections omit this. */
  gate?: { id: string; title: string; password?: string }
  /** Sections that are not lists of features declare their own count. */
  count?: number
}

/** Authored, because the Research page is an iframe of a static HTML build
 *  (`public/research-rationale/`) with no array to count — so nothing can
 *  derive this and nothing will warn when it drifts.
 *
 *  PartnerHub's 14 entries are generated from `docs/ux-decisions.md` in the
 *  partnerhub-designs repo. Regenerate that page and update this number in the
 *  same commit; the page itself repeats the instruction in its own header. */
const RESEARCH_DECISIONS = 0

/** Open sections first, then the restricted group. The order here IS the nav
 *  order; the divider is drawn where `restricted` starts. */
const SECTIONS: SectionDef[] = [
  { id: 'demo', label: 'Demo', blurb: 'Presentation-ready experiences to walk stakeholders through.' },
  {
    id: 'research',
    label: 'Research',
    blurb: 'The reasoning behind the designs — one entry per decision.',
    count: RESEARCH_DECISIONS,
  },
  {
    id: 'design',
    label: 'Design',
    blurb: 'In exploration or in design — decisions still open.',
    gate: { id: DEV_GATE_ID, title: 'Design' },
  },
  {
    id: 'exploration',
    label: 'Exploration',
    blurb: 'Outside products and ideas rebuilt on our tokens, components and UX conventions.',
    gate: { id: DEV_GATE_ID, title: 'Exploration' },
  },
  {
    // Raw HTML being worked on directly, rather than anything in the React
    // pipeline — which is why it sits beside Exploration rather than in the
    // Design → Development → Done run.
    id: 'sandbox',
    label: 'Sandbox',
    blurb:
      'Standalone HTML files in active development — opened, edited and reloaded directly, outside the app build.',
    gate: { id: DEV_GATE_ID, title: 'Sandbox' },
  },
  {
    id: 'development',
    label: 'Development',
    blurb: 'Specified and handed off, in build, or under test.',
    gate: { id: DEV_GATE_ID, title: 'Development' },
  },
  {
    // Finished work, pulled out of the pipeline sections so those show only
    // what is still moving. Done is a STATE, not a stage, which is why it
    // outranks everything else in `sectionOf` — a feature that is done is done
    // whatever its devStatus says.
    id: 'done',
    label: 'Done',
    blurb: 'Finished and signed off — kept for reference, not in flight.',
    gate: { id: DEV_GATE_ID, title: 'Done' },
  },
  {
    // Last, and gated like the rest of the restricted group — the archive used
    // to live inside Design & Development's Archive tab and was behind that
    // same password, so keeping it there preserves who can read it.
    id: 'archive',
    label: 'Archive',
    blurb:
      'Components and variants removed from the project — what each was, where the code still lives, and how to bring it back.',
    gate: { id: DEV_GATE_ID, title: 'Archive' },
    count: ARCHIVED_ITEMS.length,
  },
  {
    // Directly above To Do, and gated with the same id as the rest of the
    // restricted group — the shared password IS the access control here, the
    // same as it is for Archive and To Do.
    //
    // It briefly carried a feature flag on top of that, defaulting off. That was
    // a second lock on an already-locked door, and it put the key on the wrong
    // side of it: the Feature Flag panel only mounts inside `AppLayout`, which
    // this page sits outside, so there was no way to switch the section on from
    // the page it lives on.
    id: 'qa-notes',
    label: 'QA Notes',
    blurb:
      'Findings from design-vs-build review — an Expected and an Actual capture, the detail, and where each one stands.',
    gate: { id: DEV_GATE_ID, title: 'QA Notes' },
    // No `count` here: findings can be authored on the page, so a static number
    // is wrong as soon as one is added. Supplied live below, like To Do's.
  },
  {
    // Last in the restricted group, and gated with the same id as the rest, so
    // it opens with the one password the group already shares rather than
    // adding a second prompt. Its count is the number of OPEN items, supplied
    // live by `useTodoOpenCount` — not the static `count` field, which cannot
    // change as items are ticked off.
    id: 'todo',
    label: 'To Do',
    blurb: 'Upcoming projects and loose ends — paste them in, tag a stage, drag to rank.',
    gate: { id: DEV_GATE_ID, title: 'To Do' },
  },
]

/** Where the divider goes — the first restricted section. */
const FIRST_RESTRICTED = SECTIONS.findIndex((s) => s.gate)

/** `?section=` values the OLD tile landing wrote, mapped onto the new sections.
 *  Feature gateways still link back with these ("← Back"), and links already
 *  shared carry them, so a stale value has to land somewhere sensible rather
 *  than silently dropping the reviewer on Demo. */
const LEGACY_SECTIONS: Record<string, UxSection> = {
  demo: 'demo',
  dashboard: 'demo',
  dev: 'development',
  exploration: 'exploration',
}

function sectionFromParam(value: string | null, tab: string | null): UxSection | null {
  // The archive used to be a TAB inside the dev section (`?section=dev&tab=archive`),
  // so that pairing has to resolve to the archive section, not to Development.
  if (tab === 'archive') return 'archive'
  if (!value) return null
  if (SECTIONS.some((s) => s.id === value)) return value as UxSection
  return LEGACY_SECTIONS[value] ?? null
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
 *      show; `testing` is build infrastructure; everything else is design.
 *
 * Step 2 is the guess. Authoring `devStatus` on the remaining 22 features would
 * remove it entirely — see the note the page renders under the Design section.
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
  // sit in Design or Development claiming to be in flight.
  if (isDone ?? f.done) return 'done'
  const status = effective && effective !== 'mixed' ? effective : f.devStatus
  if (status) {
    return status === 'ready-for-dev' || status === 'in-development' || status === 'blocked'
      ? 'development'
      : 'design'
  }
  if (f.category === 'demo' || f.category === 'dashboard') return 'demo'
  if (f.category === 'testing') return 'development'
  // Ported outside products get their own section rather than sitting in Design
  // — they are a different kind of thing, and they carry their own gate.
  if (f.category === 'exploration') return 'exploration'
  // Standalone HTML being worked on directly. Checked here, AFTER `devStatus`,
  // for the same reason exploration is: a status can only mean Design or
  // Development, so authoring one on a sandbox row would drag it out of here.
  if (f.category === 'sandbox') return 'sandbox'
  return 'design'
}

/** True when the section placement is a fallback rather than authored. */
function isGuess(f: PrototypeFeature): boolean {
  // `done` is an authored placement too — a done feature is in Done because
  // the data says so, not because the category fallback guessed. Counting it
  // would have the banner claim the Done section was assembled by guesswork.
  return !f.devStatus && !f.done
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
  // A deep link into a RESTRICTED section has to meet the same gate the nav
  // does. It did not: `section` was seeded straight from the URL, so
  // `?section=design` rendered the list with no password asked — and now that a
  // row's whole spec can be deep-linked with `?open=`, that hole leaks more
  // than a list of titles. The link is not discarded, just held: the reviewer
  // lands on Demo with the modal up, and unlocking restores the target below.
  const urlDef = urlSection ? SECTIONS.find((d) => d.id === urlSection) : undefined
  const urlLocked = Boolean(urlDef?.gate) && !isPrototypeUnlocked(urlDef!.gate!.id)
  const [section, setSectionState] = useState<UxSection>(
    urlLocked ? 'demo' : (urlSection ?? 'demo'),
  )
  const setSection = (next: UxSection) => {
    setSectionState(next)
    const p = new URLSearchParams(params)
    if (next === 'demo') p.delete('section')
    else p.set('section', next)
    // Changing section closes an open gateway — the list you land on is the
    // list for that section, not someone else's feature.
    p.delete('open')
    setParams(p, { replace: true })
  }

  // Session unlock state, seeded from the shared store so a section already
  // opened on the landing page opens straight through here.
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>(() => ({
    [DEV_GATE_ID]: isPrototypeUnlocked(DEV_GATE_ID),
  }))
  // The section a password is currently being asked for. Selecting a locked
  // section does NOT change `section` — the reviewer stays where they are until
  // the gate opens, so a cancel cannot strand them on a section they cannot see.
  const [asking, setAsking] = useState<SectionDef | null>(urlLocked ? urlDef! : null)
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

  const isOpen = (def: SectionDef) => !def.gate || unlocked[def.gate.id]

  // Demo shows no dev-cycle status. Everything in it is presentation-ready by
  // definition — that is what the section IS — so a status tag there either
  // says "Ready" (no information) or contradicts the section's own promise.
  // The filter pills go with it: a control that filters an attribute the rows
  // do not show is a dead control.
  const showStatus = section !== 'demo'


  // A feature gateway opened INSIDE this frame (`?open=<featureId>`). Demo rows
  // are excluded on purpose — those tiles exist to drop a stakeholder into the
  // live platform, and wrapping that in the UX dashboard's nav would be the
  // opposite of what they are for. Everything else is a spec you read while
  // working the board, so it keeps the nav.
  //
  // The gate is checked against the FEATURE'S OWN section, not the one being
  // viewed: `?open=` must not be a side door around a locked section, and
  // cancelling the password modal must leave it shut rather than revealing the
  // spec behind it.
  const openId = params.get('open')
  const openCandidate = openId ? prototypeFeatureById(openId) : undefined
  const openDef = openCandidate
    ? SECTIONS.find((d) => d.id === sectionOf(openCandidate, rollupOf(openCandidate)))
    : undefined
  const openFeature = openCandidate && openDef && isOpen(openDef) ? openCandidate : undefined
  const opensInFrame = (f: PrototypeFeature) => section !== 'demo' && !f.externalUrl && !f.to
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
  const todoOpen = useTodoOpenCount()
  /** Live finding count for the QA Notes badge — the committed set plus whatever
   *  has been authored on the page. */
  const qaCount = useQaNoteCount()

  const bySection = useMemo(() => {
    const out: Record<UxSection, PrototypeFeature[]> = {
      demo: [],
      research: [],
      todo: [],
      design: [],
      exploration: [],
      sandbox: [],
      development: [],
      done: [],
      archive: [],
      // Not a list of features — the QA panel owns its own data, so this stays
      // empty by design and the nav count comes from the `count` field.
      'qa-notes': [],
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
    // Authored order, with pinned rows leading. Applied AFTER the filters, so
    // a pin cannot smuggle a row past a search or a status filter — it only
    // decides where a row that already matched sits.
    const pinned = out.filter((f) => f.pinned)
    return pinned.length ? [...pinned, ...out.filter((f) => !f.pinned)] : out
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statusTick invalidates an impure localStorage read
  }, [inSection, q, status, done, inDesign, statusTick])

  const guesses = bySection[section].filter(isGuess).length

  // The palette, resolved once so the shell and the root mirror below cannot
  // disagree about which scheme is active.
  const paletteVars = PALETTES[palette][theme]
  // Mirror it onto the document root for the duration of this page. Everything
  // rendered inside the shell already inherits the inline copy below; this exists
  // for overlays that portal to `document.body` (the QA detail sheet), which are
  // outside the shell and would otherwise fall back to the brand's own surface
  // colours. Cleaned up on unmount so the palette never outlives the page.
  useEffect(() => mirrorPaletteToRoot(paletteVars as Record<string, string>), [paletteVars])

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
            UX Dashboard
            <span style={{ ...brandSubStyle, color: nav.muted }}>XCEL LMS</span>
          </span>
        </div>
        {/* Same rule as the one above the restricted group, so the rail reads as
            one system of separators rather than two. */}
        <hr style={{ ...brandDividerStyle, borderTopColor: nav.border }} />
        <nav style={navListStyle}>
          {SECTIONS.map((s, i) => {
            const active = s.id === section
            // To Do's count is the live number of OPEN items, not a feature
            // tally — `bySection.todo` is always empty by design.
            const count =
              s.id === 'todo'
                ? todoOpen
                : s.id === 'qa-notes'
                  ? qaCount
                  : (s.count ?? bySection[s.id].length)
            const locked = Boolean(s.gate) && !isOpen(s)
            return (
              <div key={s.id}>
                {/* The divider and its eyebrow are drawn ONCE, before the first
                    restricted section, so adding another restricted section
                    below needs no change here. */}
                {i === FIRST_RESTRICTED && (
                  <>
                    <hr style={{ ...dividerStyle, borderTopColor: nav.border }} />
                    <p style={{ ...navEyebrowStyle, color: nav.muted }}>UX &amp; Dev Access</p>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => (isOpen(s) ? setSection(s.id) : setAsking(s))}
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
                    {locked && (
                      <>
                        <Lock size={11} aria-hidden style={{ color: nav.muted }} />
                        <span className="cre-visually-hidden"> — locked</span>
                      </>
                    )}
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
            {/* Two values in a 232px rail: "Appearance  Moss · Hybrid" wrapped
                mid-value and pushed the control taller, so the label sits above
                the value rather than beside it. */}
            <span style={themeBtnBodyStyle}>
              <span style={themeBtnLabelStyle}>Appearance</span>
              <span style={{ ...themeCurrentStyle, color: nav.fg }}>
                {PALETTE_META.find((pal) => pal.id === palette)!.label} ·{' '}
                {THEMES.find((t) => t.id === theme)!.label}
              </span>
            </span>
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
      <main style={mainStyle}>
        {openFeature ? (
          <>
            <button type="button" onClick={() => setOpen(null)} style={backLinkStyle}>
              <ChevronRight
                size={13}
                aria-hidden
                style={{ transform: 'rotate(180deg)', flex: 'none' }}
              />
              All {SECTIONS.find((s) => s.id === section)!.label.toLowerCase()} projects
            </button>
            <PrototypeFeaturePage featureId={openFeature.id} embedded />
          </>
        ) : (
        <>
        <header style={headerStyle}>
          <p style={{ ...eyebrowStyle, color: 'var(--ux-eyebrow)' }}>
            Prototype demo, features and specifications
          </p>
          <h1 style={h1Style}>{SECTIONS.find((s) => s.id === section)!.label}</h1>
          <p style={ledeStyle}>{SECTIONS.find((s) => s.id === section)!.blurb}</p>
        </header>

        {section === 'research' ? (
          <ResearchPanel />
        ) : section === 'qa-notes' ? (
          // Same bridge the archive table uses: the panel is styled on brand
          // tokens, and these six re-point them at this page's palette so it
          // re-skins with the four schemes and four appearances.
          <div style={ARCHIVE_BRIDGE}>
            <QaNotesPanel />
          </div>
        ) : section === 'todo' ? (
          <TodoPanel />
        ) : section === 'archive' ? (
          <div style={ARCHIVE_BRIDGE}>
            <ArchiveTable />
          </div>
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

            {/* Only Design and Development are split BY devStatus, so only they
                can be split wrongly by its absence. The banner used to render
                anywhere but Demo, which meant a new section inherited copy
                written for Development ("the testing links have no status of
                their own") that was not true of it. */}
            {guesses > 0 && (section === 'design' || section === 'development') && (
              <p style={noteStyle}>
                <strong>{guesses}</strong> of these are placed by category, not by an authored status —{' '}
                {section === 'design'
                  ? 'anything without a devStatus lands here by default.'
                  : 'they fall here on category alone.'}{' '}
                Authoring <code style={codeStyle}>devStatus</code> on them is what makes this split real.
              </p>
            )}

            {rows.length === 0 ? (
              <p style={emptyStyle}>
                {q ? (
                  `Nothing matches “${query}”.`
                ) : section === 'sandbox' ? (
                  // Names the field rather than just reporting emptiness — same
                  // convention as the feature gateway's empty tabs.
                  <>
                    Nothing here yet. Add a row to{' '}
                    <code style={codeStyle}>PROTOTYPE_FEATURES</code> with{' '}
                    <code style={codeStyle}>category: 'sandbox'</code> and an{' '}
                    <code style={codeStyle}>externalUrl</code> pointing at the file (e.g.{' '}
                    <code style={codeStyle}>/prototypes/my-file.html</code>). Leave{' '}
                    <code style={codeStyle}>devStatus</code> off — it would move the row to Design or
                    Development.
                  </>
                ) : (
                  'Nothing in this section yet.'
                )}
              </p>
            ) : (
              <div style={listStyle}>
                {rows.map((f, i) => (
                  <ProjectRow
                    key={f.id}
                    feature={f}
                    first={i === 0}
                    last={i === rows.length - 1}
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
            )}
          </>
        )}
        </>
        )}
      </main>

      {asking && (
        <PrototypePasswordModal
          featureTitle={asking.gate!.title}
          password={asking.gate!.password}
          onClose={() => setAsking(null)}
          onUnlock={() => {
            markPrototypeUnlocked(asking.gate!.id)
            setUnlocked((u) => ({ ...u, [asking.gate!.id]: true }))
            // Not `setSection`, which clears `?open=` — a gated deep link that
            // named a feature should land on that feature once it opens.
            setSectionState(asking.id)
            const p = new URLSearchParams(params)
            if (asking.id === 'demo') p.delete('section')
            else p.set('section', asking.id)
            if (asking.id !== urlSection) p.delete('open')
            setParams(p, { replace: true })
            setAsking(null)
          }}
        />
      )}
    </div>
  )
}

/* ── One project row ──────────────────────────────────────────────────────── */

const STATUS_MENU_GLYPH: Record<DevStatus, typeof Lightbulb> = {
  'in-design': Lightbulb,
  'needs-discussion': MessageCircle,
  blocked: LockSolid,
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
  const preview = primaryPreviewSrc(feature)
  const hasPreview = Boolean(feature.thumbnail || preview)
  const href = feature.externalUrl ?? feature.to ?? `/prototype/${feature.id}`
  const external = Boolean(feature.externalUrl)
  // Three labels, answering "how much of the product is this?":
  //   Standalone HTML — leaves the app entirely (the route column used to be
  //     the only thing that said so; with it gone the kind tag carries it)
  //   Full platform   — the whole app, to navigate freely
  //   Feature         — one feature. Every `guided` tile is one, and so are the
  //     `explore` tiles that open a single page rather than the platform, which
  //     say so via `kindLabel`.
  const meta = [
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

  const items = [
    {
      id: 'copy-link',
      label: 'Copy link',
      icon: <Share2 size={15} aria-hidden />,
      onSelect: copyLink,
    },
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
        <FeaturePreviewThumb
          feature={feature}
          src={preview}
          width={THUMB_W}
          height={THUMB_H}
          style={{ flex: 'none' }}
        />
      ) : (
        <span aria-hidden style={{ ...thumbStyle, ...ACCENT_THUMB[feature.accent] }}>
          {/* Scales with the tile — a 20px glyph swims in a 160x110 panel. */}
          <Icon size={34} />
        </span>
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

      <ChevronRight
        aria-hidden
        size={15}
        style={{ flex: 'none', color: hover ? 'var(--ux-accent)' : 'var(--ux-text-3)' }}
      />
    </>
  )

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

  return (
    <div style={wrap} onMouseEnter={handlers.onMouseEnter} onMouseLeave={handlers.onMouseLeave}>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
          {inner}
        </a>
      ) : (
        <Link to={href} {...linkProps}>
          {inner}
        </Link>
      )}
      <span style={{ flex: 'none' }}>
        <ActionMenu label={`Actions for ${feature.title}`} items={items} />
      </span>
      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        {external ? href : `${window.location.origin}${href}`}
      </Toast>
    </div>
  )
}

/** Research is not a list of features — it is the decisions log. The archive
 *  moved out to its own section beneath Development. */
/**
 * XCEL has no decisions log yet, so this section is deliberately EMPTY rather
 * than carrying a row that links to a page which does not exist.
 *
 * In the Common LMS and PartnerHub dashboards this renders one row into
 * `/research-rationale`, an iframe of a static HTML build generated from that
 * project's `ux-decisions.md`. XCEL has no equivalent file — its reasoning
 * currently lives inside the wireframes page (the inventory table and the four
 * hatched "not designed" frames) and in the exam task-type spec, neither of
 * which is a per-decision log.
 *
 * So the honest state is an empty section that names what would fill it. When
 * XCEL grows a decisions log: generate `public/research-rationale/index.html`
 * from it, restore the row below, and set `RESEARCH_DECISIONS` to the entry
 * count — it is authored by hand because nothing derives it and nothing warns
 * when it drifts.
 *
 * The row markup, kept for that restore:
 *
 *   <Link to="/research-rationale" style={{ ...rowStyle, background: 'var(--ux-card)',
 *     borderBottom: 'none', borderRadius: 'var(--radius-lg)' }}>
 *     <span aria-hidden style={{ ...thumbStyle, ...ACCENT_THUMB.teal }}>
 *       <Lightbulb size={34} />
 *     </span>
 *     <span style={bodyStyle}>
 *       <span style={nameStyle}>XCEL</span>
 *       <span style={blurbStyle}>The UX research and reasoning behind these
 *         designs — one entry per decision, each with sources.</span>
 *     </span>
 *     <ChevronRight aria-hidden size={15} style={{ flex: 'none', color: 'var(--ux-text-3)' }} />
 *   </Link>
 */
function ResearchPanel() {
  return (
    <div
      style={{
        ...listStyle,
        padding: '38px 28px',
        textAlign: 'center',
        color: 'var(--ux-text-2)',
      }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--ux-text-1)' }}>
        No decisions log yet
      </p>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, maxWidth: '56ch', marginInline: 'auto' }}>
        XCEL&rsquo;s reasoning currently lives inside the wireframes page — the inventory
        table and the four hatched &ldquo;not designed&rdquo; frames — and in the exam
        task-type spec. Neither is a per-decision log. When there is one, generate{' '}
        <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
          public/research-rationale/
        </code>{' '}
        from it and restore the row documented above this component.
      </p>
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

/** `marginTop: auto` pushes it to the foot of the rail. It used to share that
 *  job with a footer paragraph below it, which split the free space between
 *  the two; with the paragraph gone this takes it outright. */
const themeWrapStyle: CSSProperties = { position: 'relative', margin: 'auto 0 0' }

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

const themeBtnBodyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  minWidth: 0,
}

const themeBtnLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  opacity: 0.75,
}

const themeCurrentStyle: CSSProperties = {
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
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

const mainStyle: CSSProperties = { padding: '40px 32px 72px', maxWidth: 1080 }
const headerStyle: CSSProperties = { marginBottom: 22 }

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--ux-accent)',
}

const h1Style: CSSProperties = {
  margin: '10px 0 0',
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

/* The "placed by category" notice. On the amber warning ramp it read as an
   error inside a green page; it is a note, so it sits on the palette's citron
   instead and keeps its meaning from the copy + the left rule. */
const noteStyle: CSSProperties = {
  margin: '0 0 14px',
  padding: '10px 14px',
  borderLeft: '3px solid var(--ux-hue-gold)',
  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
  background: 'color-mix(in srgb, var(--ux-hue-gold) 16%, var(--ux-card))',
  color: 'var(--ux-text)',
  fontSize: 12.5,
  lineHeight: 1.6,
}

const codeStyle: CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 12 }

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

/** 160x110 — a real preview rather than a marker. The aspect is kept at exactly
 *  64/44 so the crop a capture gets is unchanged; only the scale moved. This is
 *  what sets the row height now (the text block is ~62px), so the list runs
 *  taller: 14 rows go from roughly 1160px to 1930px. That is the trade for
 *  being able to recognise a project by its screenshot. */
const THUMB_W = 160
const THUMB_H = 110

const thumbStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: THUMB_W,
  height: THUMB_H,
  flex: 'none',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--ux-border)',
}

/** Accent → thumbnail fill + glyph. Tinted brand surfaces, so a row reads as
 *  belonging to a family without needing a real screenshot. */
/* A feature's `accent` still picks its thumbnail, but the four hues are now the
   palette's own rather than the brand ramps — a teal/gold/blue set inside a
   moss-green page read as four foreign objects. The tint is mixed into the card
   so it follows the appearance, and each hue carries a per-mode foreground
   (`--ux-hue-*-fg`) picked to clear 3:1 on its own tint. */
const ACCENT_THUMB: Record<FeatureAccent, CSSProperties> = {
  teal: {
    background: 'color-mix(in srgb, var(--ux-hue-teal) 20%, var(--ux-card))',
    color: 'var(--ux-hue-teal-fg)',
  },
  gold: {
    background: 'color-mix(in srgb, var(--ux-hue-gold) 20%, var(--ux-card))',
    color: 'var(--ux-hue-gold-fg)',
  },
  blue: {
    background: 'color-mix(in srgb, var(--ux-hue-blue) 20%, var(--ux-card))',
    color: 'var(--ux-hue-blue-fg)',
  },
  neutral: {
    background: 'color-mix(in srgb, var(--ux-hue-neutral) 26%, var(--ux-card))',
    color: 'var(--ux-hue-neutral-fg)',
  },
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
