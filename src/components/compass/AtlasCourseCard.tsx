import type { CSSProperties } from 'react'
import { CalendarRegular } from '@/icons'
import { COMPASS_BUTTON } from './compassButton'

/**
 * THE ATLAS COURSE CARD — Figma "Atlas-UX-Design" node 213:3619, 2026-10-06,
 * Eric's request: "Remove existing course cards and replace with the attached
 * card styling and content". Drawn by the Atlas My Courses page in place of the
 * shared `CourseCard` grid.
 *
 * Image (150 tall, 4 radius) with an optional status badge on its top-left
 * corner (the functional WARNING ramp — "Due Soon") · the title in the heading serif at Medium 18/23
 * over a hairline · "Available until" with the date Bold and the time Regular ·
 * a full-width primary button.
 */
export type AtlasCourseCardData = {
  id: string
  title: string
  imageUrl: string
  /** e.g. "Due Soon"; omitted → no badge. */
  badge?: string
  /** Bold part of the availability line, e.g. "October 19, 2026". */
  availableDate: string
  /** The rest of it, e.g. "5:49 PM CDT". */
  availableTime?: string
  actionLabel: string
  /** `secondary`: the outline button — white fill, brand-red border and label
   *  (2026-10-06, for the Begin Course cards). Default `primary`. */
  actionStyle?: 'primary' | 'secondary'
}

export function AtlasCourseCard({ data, onAction }: { data: AtlasCourseCardData; onAction?: () => void }) {
  return (
    <article aria-label={data.title} style={CARD}>
      {/* The badge rides the image's top-left corner, 6px up and left of its
          frame — into the card's padding, which is left as it is (2026-10-06,
          Eric's request; it sat above the title). */}
      <div style={{ position: 'relative' }}>
        <img src={data.imageUrl} alt="" aria-hidden style={IMAGE} />
        {data.badge ? (
          <span style={{ ...BADGE, position: 'absolute', top: -6, left: -6 }}>
            <CalendarRegular size={11} aria-hidden />
            {data.badge}
          </span>
        ) : null}
      </div>
      {/* 16 from the image to the title text (the card's 8 gap + the title's
          8 padding) — 8 less than before (2026-10-06); the wrapper's own 8 went. */}
      <h3 style={TITLE}>{data.title}</h3>
      {/* 16 under the dates, 8 more than the design (2026-10-06). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 16, color: 'var(--color-text-secondary)' }}>
        {/* The icon flush left with the date under it (it sat centred in a
            16px box), and both lines 1px larger — 12 and 11 (2026-10-06). */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: '18px' }}>
          <CalendarRegular size={12} aria-hidden />
          Available until:
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, lineHeight: '18px', whiteSpace: 'nowrap' }}>
          <strong style={{ fontWeight: 700 }}>{data.availableDate}</strong>
          {data.availableTime ? ` ${data.availableTime}` : null}
        </span>
      </div>
      <button
        type="button"
        className={
          data.actionStyle === 'secondary'
            ? 'cre-compass-secondary cre-atlas-card-secondary'
            : 'cre-compass-primary cre-compass-btn-primary'
        }
        onClick={onAction}
        disabled={!onAction}
        style={BUTTON}
      >
        {data.actionLabel}
      </button>
    </article>
  )
}

/* 24 in, 12 radius, the warm hairline (Figma #E0DBCD — the Atlas rule).
   A SUBGRID of four rows — image, title, dates, button — on the row of cards
   (2026-10-06, Eric's request: titles "expand vertically to match the depth of
   the longest one"). Each title row takes the tallest title in the row, so the
   rules under the titles, the dates and the buttons all line up. The parent
   must be a grid; `PlatformShell`'s My Courses grid is. */
const CARD: CSSProperties = {
  display: 'grid',
  gridRow: 'span 4',
  gridTemplateRows: 'subgrid',
  rowGap: 8,
  padding: 24,
  boxSizing: 'border-box',
  borderRadius: 12,
  border: '1px solid var(--color-atlas-nav-rule)',
  // The Course Overview course card's fill (2026-10-06, Eric's request).
  background: 'var(--color-compass-course-card)',
  minWidth: 0,
}
const IMAGE: CSSProperties = {
  display: 'block',
  width: '100%',
  height: 150,
  objectFit: 'cover',
  borderRadius: 4, // 2 under the Figma's 6 (2026-10-06)
}
/* Solid in the functional warning 400, #FAC353, no border, a black Bold
   label with the FA calendar (regular) before it (2026-10-06, Eric's requests —
   a run of them: 100 fill / 400 stroke / 700 ink, then solid 400 with white,
   600, 500, then this). Black (#202020) on #FAC353 is about 10:1, so it passes AA
   comfortably — the white labels before it did not. */
const BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  // A capsule — fully round ends — and 2px more each side (2026-10-06).
  padding: '4px 10px',
  borderRadius: 999,
  background: 'var(--color-warning-400)',
  color: 'var(--color-neutral-900)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700, // Bold (2026-10-06); it was SemiBold 600
  // 11 / 14, a size up from 10 / 13 (2026-10-06); the 4×8 padding is kept,
  // so the tag grows around it.
  fontSize: 11,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
}
/* Heading serif, Medium 18 / 23 (Figma: Source Serif 4 Medium). Deliberately
   NOT `.cre-compass-course-title`, which would take it to 400 under Source
   Serif 4; the face's heading rule holds it at the design's 500. */
const TITLE: CSSProperties = {
  alignSelf: 'stretch',
  margin: 0,
  // 16 under the title, above its rule — 8 more than the design (2026-10-06).
  padding: '8px 0 16px',
  borderBottom: '1px solid var(--color-border-subtle)',
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '23px',
  color: 'var(--color-text-primary)',
}
const BUTTON: CSSProperties = {
  ...COMPASS_BUTTON,
  // At the foot of its subgrid row, so the buttons line up across the row.
  alignSelf: 'end',
  width: '100%',
  height: 35,
  minHeight: 0,
  padding: '5px 8px',
  fontSize: 13.5,
  lineHeight: '20.25px',
}
