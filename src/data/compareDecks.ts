/**
 * COMPARE DECKS — the widget-by-widget comparisons at `/compare/:compareId`
 * (2026-11-16, Jillienne: "I want a toggle that can show the side by side UI
 * for these widgets at all the different variants, and then I can go through
 * and further refine how this should look").
 *
 * A deck names ONE surface, TWO (or more) versions of it, and the WIDGETS the
 * versions share — each widget rendered by the real component on each side,
 * in-process, at full width, nothing scaled. The Variants & Copy deck
 * (`variantDecks.ts`) rejected side by side because it forces a surface to
 * ~70%; this page accepts that cost for the comparison it exists to make, and
 * offers *V1 only* / *Refined only* / *stacked* for the moment type size has
 * to be judged.
 *
 * Metadata only, no JSX — the gateway and Hub Resources can list a deck
 * without importing a page. The render functions live beside the page in
 * `src/pages/compare/<id>.tsx`, keyed by the same widget ids.
 *
 * ⚠ WIDGET IDS ARE THE NOTE KEYS. The per-widget notes are stored server-side
 * under `notes[widgetId]` (`netlify/functions/compare-notes.ts`); renaming an
 * id orphans its note. Add, don't rename.
 */
export type CompareVersion = {
  id: string
  /** The column label — "V1 · Jeff's MVP". */
  label: string
  /** One line on where this version comes from. */
  blurb: string
  /** The product address that opens this version's page, for the "open in the
   *  product" link on the column head. */
  href: string
}

export type CompareVariantControl = {
  /** Which version the control belongs to. */
  version: string
  /** The key the page's render function reads — `hero`. */
  key: string
  label: string
  options: { value: string; label: string }[]
  defaultValue: string
  /** Which widgets this control changes; the control is drawn on those rows. */
  widgets: string[]
  /** Where the product reads the same choice from, for the row's caption. */
  flag?: string
}

export type CompareWidget = {
  id: string
  title: string
  /** What the widget is for, in one line — the thing both versions are
   *  trying to do, so the comparison is about how, not what. */
  purpose: string
  /** Set when only one side has it; the other column says so. */
  only?: string
}

export type CompareDeckMeta = {
  id: string
  title: string
  blurb: string
  surface: string
  versions: CompareVersion[]
  controls: CompareVariantControl[]
  widgets: CompareWidget[]
}

export const COMPARE_DECKS: CompareDeckMeta[] = [
  {
    id: 'compass-readiness',
    title: 'Readiness — V1 beside Refined',
    blurb:
      'Jeff’s Readiness page (V1) and the Refined rebuild, widget by widget, each drawn by the real component. The Refined hero has two arms; the levels panel and the topic rows can be lined up open or closed on both sides.',
    surface: 'Compass Learning · Readiness',
    versions: [
      {
        id: 'v1',
        label: 'V1 · Jeff’s MVP',
        blurb: 'His thirteen-page prototype, ported page for page. One authored state: 62%, Developing.',
        href: '/dashboard-rebrand?demo=1&section=compass&ff=compass-mvp-version:jeff&compassPage=readiness',
      },
      {
        id: 'refined',
        label: 'Refined',
        blurb: 'Readiness rebuilt on the November research. Every number on screen is derived from the fixture.',
        href: '/dashboard-rebrand?demo=1&section=compass&ff=compass-mvp-version:refined&compassPage=readiness',
      },
    ],
    controls: [
      {
        version: 'refined',
        key: 'hero',
        label: 'Hero',
        options: [
          { value: 'rings', label: 'Three rings' },
          { value: 'single', label: 'Single ring' },
        ],
        defaultValue: 'rings',
        widgets: ['hero'],
        flag: 'compass-refined-readiness-hero',
      },
      {
        version: 'both',
        key: 'levels',
        label: 'Levels panel',
        options: [
          { value: 'closed', label: 'Closed' },
          { value: 'open', label: 'Open' },
        ],
        defaultValue: 'closed',
        widgets: ['topics'],
      },
      {
        version: 'both',
        key: 'rows',
        label: 'Topic rows',
        options: [
          { value: 'default', label: 'As the page opens' },
          { value: 'all-open', label: 'All open' },
          { value: 'all-closed', label: 'All closed' },
        ],
        defaultValue: 'default',
        widgets: ['topics'],
      },
    ],
    widgets: [
      {
        id: 'head',
        title: 'Page head',
        purpose: 'Name the page and say what it is for, before any number.',
      },
      {
        id: 'hero',
        title: 'The score',
        purpose: 'Show where the learner stands, and what Ready means, in one look.',
      },
      {
        id: 'next',
        title: 'Do this next',
        purpose: 'The one move that lifts Readiness most, one click from being done — and the stale thing worth a look.',
      },
      {
        id: 'trend',
        title: 'Readiness over time',
        purpose: 'Show the direction, and that spaced practice is what moves it.',
      },
      {
        id: 'topics',
        title: 'Readiness by topic',
        purpose: 'Every topic and sub-topic on one scale, weakest first, with a way to practice each.',
      },
      {
        id: 'footnote',
        title: 'Footnote',
        purpose: 'Say what counts toward the score, and what Ready means.',
      },
    ],
  },
]

export function compareDeckById(id: string | undefined): CompareDeckMeta | undefined {
  return COMPARE_DECKS.find((d) => d.id === id)
}
