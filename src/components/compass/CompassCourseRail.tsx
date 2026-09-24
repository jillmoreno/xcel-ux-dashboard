import { Fragment, type CSSProperties, type ReactNode } from 'react'
import {
  CircleCheckRegular,
  CircleCheckSolid,
  CircleRegular,
  CircleSolid,
  ClockRegular,
  HouseRegular,
  SlashForwardSolid,
} from '@/icons'
import type {
  CompassCourseRailConfig,
  CompassTocChild,
  CompassTocSection,
  CompassTocStatus,
} from './CompassCourseRail.types'

/**
 * COMPASS LMS COURSE LEFT RAIL NAVIGATION — Figma
 * "Atlas-Compass-Global-Navigation", node 49:2922, 2026-09-22.
 *
 * The left rail for ACTUAL COURSE PAGES in the Compass LMS — the course player,
 * as opposed to the Atlas dashboard's navigation. Built to be reused by every
 * future Compass page: it renders only what its `CompassCourseRailConfig`
 * gives it (breadcrumb, title, progress, table of contents, resources) and
 * resolves nothing itself. **As of 2026-09-22 it is used on exactly one page**
 * — the Atlas/Compass version's Course page (`section=course&coursePage=course`),
 * wired in `PlatformShell` via `AtlasCompassCourseRail`.
 *
 * Top to bottom, as the design draws it:
 *
 *   1. **Breadcrumb** — home icon / the steps between / the page you are on.
 *   2. **Course title**, then a **"N% Complete"** pill.
 *   3. **TABLE OF CONTENTS** — sections, with the CURRENT section expanded onto
 *      a spine of its lessons. Everything status-shaped (icon, weight, fill,
 *      "Done", "Up next") is DERIVED from each entry's `status`, so a page
 *      cannot author a "Done" beside something not done.
 *   4. **RESOURCES** — ordinary rail rows (`.cre-atlas-nav-row`).
 *
 * Status is never colour alone: every entry carries its state in words for
 * assistive tech (the icons are `aria-hidden`), and the current lesson is
 * `aria-current="step"` as well as tinted, Bold and marked with a clock (the
 * design's "Now" marker was removed on 2026-09-24).
 *
 * Departures from the design, each small and on purpose:
 *
 * - **Every mark is Font Awesome, in the weight the design names** (2026-09-23):
 *   Solid `circle` / `circle-check` for sections, Regular `circle` /
 *   `circle-check` / `clock` for lessons, Regular `house` and Solid
 *   `slash-forward` in the breadcrumb — fetched from the FA API (7.3.1) into
 *   `src/icons/`. They were CSS shapes and a text "/" until those files were
 *   vendored; the registry's default weight is otherwise Light.
 * - **Open Sans throughout**, where the design names Source Sans 3 for the
 *   crumbs and the pill — that face is not loaded in this app.
 * - **The current crumb is `#767676`, not `#777`** — `#777` is 4.48:1 on white,
 *   just under AA at 11px.
 *
 * **UPCOMING ENTRIES ARE MUTED, AND THAT MISSES AA — kept because it is the
 * design (restyled 2026-09-23).** A not-started lesson is `#a2a2a2` on white
 * (2.56:1) and a not-started section `#afb2b5` (2.16:1), both under the 4.5:1
 * text needs. They are kept as drawn because the muting IS the message —
 * "not reached yet" — and nothing rides on the colour alone: every entry also
 * states its status in words. If they must pass, `--color-compass-rail-upcoming-*`
 * is the one place to raise them.
 *
 * **The spine carries progress.** Its segment beside each lesson is the ink
 * colour for done and current lessons and the beige for not-started ones, so
 * the navy line runs down to where the learner is and stops.
 */
export function CompassCourseRail({
  breadcrumb,
  courseTitle,
  progressPct,
  toc,
  resources,
}: CompassCourseRailConfig) {
  const currentIndex = toc.findIndex((s) => s.status === 'current')
  // "Up next" goes on the FIRST not-started section after the current one —
  // derived here so it moves by itself when the current section changes.
  const upNextId =
    currentIndex >= 0
      ? toc.slice(currentIndex + 1).find((s) => s.status === 'not-started')?.id
      : undefined
  const pct = Math.max(0, Math.min(100, Math.round(progressPct)))

  return (
    <div className="cre-compass-rail" style={COLUMN}>
      <Breadcrumb crumbs={breadcrumb} />

      <div style={BODY}>
        <div style={TITLE_BLOCK}>
          <p style={COURSE_TITLE}>{courseTitle}</p>
          <p style={PROGRESS_PILL}>{pct}% Complete</p>
        </div>

        <nav aria-labelledby="compass-rail-toc">
          <p id="compass-rail-toc" style={CAPTION}>
            Table of Contents
          </p>
          <ol style={TOC_LIST}>
            {toc.map((section) => (
              <Fragment key={section.id}>
                <SectionRow section={section} />
                {section.status === 'done' ? (
                  <NoteRow bar>Done</NoteRow>
                ) : section.status === 'current' && section.children?.length ? (
                  <li style={{ listStyle: 'none' }}>
                    <ol aria-label={`${section.label} lessons`} style={CHILD_LIST}>
                      {section.children.map((child) => (
                        <ChildRow key={child.id} child={child} />
                      ))}
                    </ol>
                  </li>
                ) : section.id === upNextId ? (
                  <NoteRow>Up next</NoteRow>
                ) : null}
              </Fragment>
            ))}
          </ol>
        </nav>

        {resources.length > 0 ? (
          <div style={RESOURCES_GROUP}>
            <p id="compass-rail-resources" style={CAPTION}>
              Resources
            </p>
            <ul aria-labelledby="compass-rail-resources" style={RESOURCE_LIST}>
              {resources.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    className="cre-atlas-nav-row"
                    onClick={r.onSelect}
                    disabled={!r.onSelect}
                    style={RESOURCE_ROW}
                  >
                    {r.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/* ── Breadcrumb ─────────────────────────────────────────────────────────── */

function Breadcrumb({ crumbs }: { crumbs: CompassCourseRailConfig['breadcrumb'] }) {
  const last = crumbs.length - 1
  return (
    <nav aria-label="Breadcrumb">
      <ol style={CRUMBS}>
        {crumbs.map((crumb, i) => (
          <li key={`${i}-${crumb.label}`} style={CRUMB_ITEM}>
            {i > 0 ? (
              <span aria-hidden style={SEPARATOR}>
                <SlashForwardSolid size={10} aria-hidden />
              </span>
            ) : null}
            {i === 0 ? (
              <button
                type="button"
                className="cre-compass-crumb-link"
                onClick={crumb.onSelect}
                aria-label={crumb.label}
                style={HOME_BUTTON}
              >
                <HouseRegular size={11} aria-hidden />
              </button>
            ) : i === last ? (
              <span aria-current="page" style={CURRENT_CRUMB}>
                {crumb.label}
              </span>
            ) : (
              <button
                type="button"
                className="cre-compass-crumb-link"
                onClick={crumb.onSelect}
                style={CRUMB_LINK}
              >
                {crumb.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* ── Table of contents ──────────────────────────────────────────────────── */

const STATUS_WORDS: Record<CompassTocStatus, string> = {
  done: 'completed',
  current: 'in progress',
  'not-started': 'not started',
}

/**
 * A section row — the design's "TOC - Section Title" component (Figma 13:22,
 * restyled 2026-09-23), in its three drawn states:
 *
 *   - **Completed** — 30px, 1px in, gap 10, the solid check, Medium `#404040`.
 *   - **Active** — 36px, 1px in, gap 10. The 2px section-ink line runs the
 *     row's full height THROUGH the dot, so the "Done" bar above and the lesson
 *     spine below read as one continuous line. SemiBold, 16px leading, and it
 *     WRAPS — the design gives it a 186px box, so a long section title takes
 *     two lines rather than running off the rail.
 *   - **Default** (not started) — 30px, flush, gap 11, a beige dot, `#818181`.
 *
 * The design's fourth state, "No Icon Completed", is the "Done" note below a
 * completed section — `NoteRow`.
 */
function SectionRow({ section }: { section: CompassTocSection }) {
  const current = section.status === 'current'
  const upcoming = section.status === 'not-started'
  const done = section.status === 'done'
  const content = (
    <>
      <span style={current ? SECTION_SLOT_ACTIVE : done ? SECTION_SLOT_DONE : SECTION_SLOT_UPCOMING}>
        {current ? <span aria-hidden style={ACTIVE_LINE} /> : null}
        {/* A DONE section's line starts RIGHT BELOW its check and runs to the
            row's foot, where the "Done" bar picks it up (2026-09-24). Without
            it, a title that wraps to two lines leaves a gap between the check
            (centred in the taller row) and the bar. */}
        {done ? <span aria-hidden style={DONE_LINE} /> : null}
        <StatusIcon status={section.status} size="section" />
      </span>
      <span
        style={
          current ? SECTION_LABEL_CURRENT : upcoming ? SECTION_LABEL_UPCOMING : SECTION_LABEL
        }
      >
        {section.label}
      </span>
      <span className="cre-visually-hidden">, {STATUS_WORDS[section.status]}</span>
    </>
  )
  return (
    <li
      style={{
        ...SECTION_ROW,
        minHeight: current ? 36 : 30,
        // The ACTIVE row takes no vertical padding: its line runs the row's
        // full height through the dot and must meet the "Done" bar above and
        // the lesson spine below with no gap. Its 36px and 16px leading already
        // hold two lines of title.
        // The active row now shares the done row's 5px padding (2026-09-24),
        // as its title shares the done row's 20px line spacing — so every
        // section title sets to one rhythm. The design's 36px stays the floor.
        gap: upcoming ? 11 : 10,
        paddingLeft: upcoming ? 0 : 1,
      }}
    >
      {section.onSelect ? (
        <button type="button" className="cre-compass-toc-row" onClick={section.onSelect} style={ROW_BUTTON}>
          {content}
        </button>
      ) : (
        content
      )}
    </li>
  )
}

/**
 * A lesson row — the design's "TOC - Child Item" component (Figma 13:38,
 * restyled 2026-09-23):
 *
 *   - **Icon Active** (current) — a CLOCK and the label (Bold since 2026-09-24;
 *     the design's "Now" marker removed the same day), in
 *     the section ink `#3d5a73`, on the `#eceef0` fill.
 *   - **Icon Completed** — the circle-check in `#3d5a73`, Medium `#404040`.
 *   - **Icon Default** (not started) — a `#baa78b` ring, `#818181` text and a
 *     `#cec0ac` spine segment…
 *   - **…and Icon Hover**, which is Icon Default under the pointer: the spine
 *     goes navy, the ring `#3d5a73`, the text `#404040`. It applies to every
 *     not-started row, linked or not.
 *
 * THE NOT-STARTED COLOURS LIVE IN `.cre-compass-toc-child`, not inline —
 * `:hover` cannot be written in `CSSProperties`, and an inline colour would
 * beat the hover rule while looking correct (the `.cre-uxlinks-title` trap).
 */
function ChildRow({ child }: { child: CompassTocChild }) {
  const current = child.status === 'current'
  const upcoming = child.status === 'not-started'
  const content = (
    <>
      <span style={CHILD_SLOT}>
        <StatusIcon status={child.status} size="child" />
      </span>
      <span
        className={upcoming ? 'cre-compass-toc-label' : undefined}
        style={current ? CHILD_LABEL_CURRENT : upcoming ? CHILD_LABEL_UPCOMING : CHILD_LABEL}
      >
        {child.label}
      </span>
      {/* NO "Now" marker (removed 2026-09-24, the direct ask). The current
          lesson is still told apart three ways — the clock, the Bold title on
          the #eceef0 fill — and in words for assistive tech. */}
      <span className="cre-visually-hidden">, {STATUS_WORDS[child.status]}</span>
    </>
  )
  return (
    <li
      className={upcoming ? 'cre-compass-toc-child is-upcoming' : undefined}
      style={CHILD_ROW}
      aria-current={current ? 'step' : undefined}
    >
      {/* Ink beside what is done or current, beige beside what is not — the
          navy runs down to where the learner is and stops. The beige, and its
          hover, are the class's. */}
      <span
        aria-hidden
        className={upcoming ? 'cre-compass-toc-spine' : undefined}
        style={upcoming ? SPINE : SPINE_PROGRESS}
      />
      <span style={current ? CHILD_INNER_CURRENT : CHILD_INNER}>
        {child.onSelect ? (
          <button type="button" className="cre-compass-toc-row" onClick={child.onSelect} style={ROW_BUTTON}>
            {content}
          </button>
        ) : (
          content
        )}
      </span>
    </li>
  )
}

/** "Done" (under a done section, with the ink bar) or "Up next". */
function NoteRow({ children, bar = false }: { children: ReactNode; bar?: boolean }) {
  return (
    <li aria-hidden style={bar ? NOTE_ROW : { ...NOTE_ROW, height: 20 }}>
      <span style={bar ? NOTE_BAR : NOTE_BAR_SPACER} />
      <span style={NOTE_TEXT}>{children}</span>
    </li>
  )
}

/**
 * The status marks, drawn rather than vendored — see the component doc.
 * Section: done = a 15px filled circle carrying a check; current = a 14px
 * filled ink circle; upcoming = the same 14px circle in the muted beige.
 * Lesson: done = the registry's outline `CircleCheck`; current = an ink ring;
 * upcoming = a beige ring.
 */
function StatusIcon({ status, size }: { status: CompassTocStatus; size: 'section' | 'child' }) {
  if (size === 'section') {
    if (status === 'done') {
      return (
        <span aria-hidden style={{ ...MARK, color: 'var(--color-compass-rail-section-ink)' }}>
          <CircleCheckSolid size={15} aria-hidden />
        </span>
      )
    }
    return (
      <span
        aria-hidden
        style={{
          ...MARK,
          // Round, so the active ring below follows the circle exactly.
          borderRadius: '50%',
          color:
            status === 'current'
              ? 'var(--color-compass-rail-section-ink)'
              : 'var(--color-compass-rail-upcoming-section-mark)',
          // THE ACTIVE DOT'S 5px RING (Figma 13:23, 2026-09-23) — a halo of
          // the current-lesson grey, measured off the design's 24px render
          // (5 + 14 + 5). A box-shadow on this round wrapper, so it takes no
          // layout room and cannot move the dot off the line's x; it paints
          // over the line running through the dot, which is how the design
          // draws it.
          ...(status === 'current'
            ? { boxShadow: '0 0 0 5px var(--color-compass-rail-active-halo)' }
            : null),
          // Above the active row's line, which runs through it.
          position: 'relative',
        }}
      >
        <CircleSolid size={14} aria-hidden />
      </span>
    )
  }
  // Lessons: 15px Regular marks in the section ink (Figma 13:38). The CURRENT
  // lesson is a clock — "in progress".
  if (status === 'done') {
    return (
      <span aria-hidden style={{ ...MARK, color: 'var(--color-compass-rail-lesson-ink)' }}>
        <CircleCheckRegular size={15} aria-hidden />
      </span>
    )
  }
  if (status === 'current') {
    return (
      <span aria-hidden style={{ ...MARK, color: 'var(--color-compass-rail-lesson-ink)' }}>
        <ClockRegular size={15} aria-hidden />
      </span>
    )
  }
  // Not started: the ring's colour, and its hover, are `.cre-compass-toc-ring`
  // — NO inline colour here, or it would beat the hover rule.
  return (
    <span aria-hidden className="cre-compass-toc-ring" style={MARK}>
      <CircleRegular size={15} aria-hidden />
    </span>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */
/* Colours are `--color-compass-rail-*` (tokens.css), so a future Compass
   surface can re-point the rail's palette without touching this file. */

const COLUMN: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
const BODY: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }

const CRUMBS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  flexWrap: 'wrap',
}
const CRUMB_ITEM: CSSProperties = { display: 'flex', alignItems: 'center', gap: 3, minHeight: 20 }
const HOME_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20,
  padding: '0 2px 1px 0',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 4,
}
const CRUMB_TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 500,
  lineHeight: '19px',
}
const CRUMB_LINK: CSSProperties = {
  ...CRUMB_TEXT,
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  borderRadius: 2,
}
const CURRENT_CRUMB: CSSProperties = { ...CRUMB_TEXT, color: 'var(--color-compass-rail-crumb)' }
/* FA `slash-forward` (Solid) at 10px, the design's size; the icon fills with
   the text colour. */
const SEPARATOR: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 20,
  color: 'var(--color-compass-rail-crumb-separator)',
}

/* The title's spacing MATCHES THE ATLAS COURSE RAIL's (2026-09-23, the direct
   ask): 8 above it (the column's gap, no extra top padding) and 14 from its
   text to the pill — the same 6px bottom padding + 8px gap `AtlasCourseSideNav`
   uses, so moving between the two course rails does not shift the title. The
   design's frame had 4 above and 12 below. */
const TITLE_BLOCK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '0 8px 8px 0',
}
const COURSE_TITLE: CSSProperties = {
  margin: 0,
  paddingBottom: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '21px',
  color: 'var(--color-text-primary)',
}
const PROGRESS_PILL: CSSProperties = {
  margin: 0,
  padding: '0 8px',
  borderRadius: 8,
  background: 'var(--color-compass-rail-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-compass-rail-text)',
}

/* Open Sans Bold 11 / 16.5, 0.1em, uppercase — the Atlas rail's caption. */
const CAPTION: CSSProperties = {
  margin: 0,
  paddingTop: 4,
  minHeight: 19.5,
  display: 'flex',
  alignItems: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '16.5px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-compass-rail-caption)',
}

const TOC_LIST: CSSProperties = {
  listStyle: 'none',
  margin: '4px 0 0',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}
const CHILD_LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}

/* A MINIMUM height, not a fixed one (2026-09-24): a long section title wraps
   to a second line and the row grows with it. The 5px above and below keep a
   single-line row at the design's 30px (20 + 10). */
/* TOP-aligned (2026-09-24): each section's icon sits on the FIRST line of its
   title, so on a title that wraps the icon's top meets the text's top rather
   than floating in the middle of the row. */
const SECTION_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  paddingTop: 5,
  paddingBottom: 5,
  paddingRight: 8,
  boxSizing: 'border-box',
  borderRadius: 8,
}
const ROW_BUTTON: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'inherit',
  flex: 1,
  minWidth: 0,
  height: '100%',
  padding: 0,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  font: 'inherit',
  color: 'inherit',
  textAlign: 'left',
  borderRadius: 8,
}
const ICON_SLOT: CSSProperties = {
  width: 15,
  flex: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}
/* SECTION icon slots — each centres its icon on the title's FIRST LINE, so the
   icon's top lines up with the top of the text:
     - done: a 15px check on a 20px line → 2.5px down;
     - active: a 14px dot on a 20px line → 3px down;
     - upcoming: a 14px dot on a 20px line → centred in a 20px box.
   Done and active STRETCH to the row's height so their line can run in them. */
const SECTION_SLOT_UPCOMING: CSSProperties = { ...ICON_SLOT, height: 20 }
const SECTION_SLOT_DONE: CSSProperties = {
  ...ICON_SLOT,
  position: 'relative',
  alignSelf: 'stretch',
  alignItems: 'flex-start',
  paddingTop: 2.5,
  boxSizing: 'border-box',
}
const SECTION_SLOT_ACTIVE: CSSProperties = {
  ...SECTION_SLOT_DONE,
  paddingTop: 3,
}
/* 2px, 6px in — the same x as the "Done" bar and the lesson spine (both sit
   7px into their rows, and this row is already 1px in). The row's 5px padding
   is crossed at both ends, so the line spans the whole row and meets the
   "Done" bar above and the spine below. */
const ACTIVE_LINE: CSSProperties = {
  position: 'absolute',
  left: 6,
  top: -5,
  bottom: -5,
  width: 2,
  background: 'var(--color-compass-rail-section-ink)',
}
/* From the bottom edge of the check (2.5 + 15 = 17.5px into the slot) to the
   row's foot — `bottom: -5` crosses the done row's 5px bottom padding. */
const DONE_LINE: CSSProperties = {
  ...ACTIVE_LINE,
  top: 17.5,
  bottom: -5,
}
/* Medium (500) throughout the TOC, restyled 2026-09-23 — it was Regular. */
const SECTION_LABEL: CSSProperties = {
  flex: 1,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '20px',
  fontWeight: 500,
  color: 'var(--color-compass-rail-text)',
  // Wraps rather than running off the rail — section titles can be long
  // ("Course Introduction - Life and Health Pre-licensing").
  whiteSpace: 'normal',
}
/* SemiBold and in the section ink, on the SAME 20px line spacing as every
   other section title (2026-09-24, the direct ask — it was the design's 16px,
   which set the active title tighter than the done one above it). */
const SECTION_LABEL_CURRENT: CSSProperties = {
  ...SECTION_LABEL,
  fontWeight: 600,
  whiteSpace: 'normal',
  color: 'var(--color-compass-rail-section-ink)',
}
const SECTION_LABEL_UPCOMING: CSSProperties = {
  ...SECTION_LABEL,
  color: 'var(--color-compass-rail-upcoming-section-text)',
}

/* 32px rows: 7px in, the 2px spine, 17 to the inner row, which pads 10 left. */
/* A MINIMUM height, and the row STRETCHES its spine (2026-09-24): lesson titles
   can be long ("Exam: Basic Principles of Life and Health Insurance") and wrap,
   so the row grows and the spine grows with it, staying continuous. A
   single-line row is still the design's 32px (8 + 16 + 8 inside). */
const CHILD_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  gap: 17,
  minHeight: 32,
  paddingLeft: 7,
}
/* The lesson icon centred on the title's FIRST line (16px), as the section
   icons are. */
const CHILD_SLOT: CSSProperties = { ...ICON_SLOT, height: 16 }
/* No background here — the not-started spine's beige and its hover are
   `.cre-compass-toc-spine`; done and current take SPINE_PROGRESS. */
const SPINE: CSSProperties = {
  width: 2,
  alignSelf: 'stretch',
  flex: 'none',
}
const SPINE_PROGRESS: CSSProperties = { ...SPINE, background: 'var(--color-compass-rail-ink)' }
/* 8px between icon and title — 2px LESS than the design's 10 (2026-09-24,
   the direct ask; it was briefly 12 from a misread of "move 2px"). 8px above and below the 16px line keeps a single-line row
   at 32. */
const CHILD_INNER: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  flex: 1,
  minWidth: 0,
  padding: '8px 0 8px 10px',
  boxSizing: 'border-box',
  borderRadius: 8,
}
const CHILD_INNER_CURRENT: CSSProperties = {
  ...CHILD_INNER,
  paddingRight: 8,
  background: 'var(--color-compass-rail-current-fill)',
}
const CHILD_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  // 12px, down from the design's 13 (2026-09-24, the direct ask).
  fontSize: 12,
  // 16px, tighter than the design's 20 (2026-09-24, the direct ask) — the
  // lessons wrap, and 20 on 13px text read as double-spaced.
  lineHeight: '16px',
  fontWeight: 500,
  color: 'var(--color-compass-rail-text)',
  // Wraps — lesson titles can be long.
  whiteSpace: 'normal',
}
/* BOLD (700), one step up from the design's SemiBold (2026-09-24, the direct
   ask) — the current lesson is the one row a learner scans for. */
const CHILD_LABEL_CURRENT: CSSProperties = {
  ...CHILD_LABEL,
  flex: 1,
  minWidth: 0,
  fontWeight: 700,
  color: 'var(--color-compass-rail-lesson-ink)',
}
/* No colour — `.cre-compass-toc-label` owns it, so hover can change it. */
const CHILD_LABEL_UPCOMING: CSSProperties = (() => {
  const { color: _color, ...rest } = CHILD_LABEL
  void _color
  return rest
})()

const NOTE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 17,
  height: 30,
  paddingLeft: 7,
  paddingRight: 8,
}
/* "No Icon Completed" in Figma 13:22 — the bar is the row's full height, in
   the section ink, so it meets the active row's line with no gap. */
const NOTE_BAR: CSSProperties = {
  width: 2,
  height: '100%',
  flex: 'none',
  background: 'var(--color-compass-rail-section-ink)',
}
const NOTE_BAR_SPACER: CSSProperties = { width: 2, height: 28, flex: 'none' }
const NOTE_TEXT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  lineHeight: '20px',
  color: 'var(--color-compass-rail-text)',
  whiteSpace: 'nowrap',
}


/* The wrapper every status mark sits in: the icon inside fills with
   `currentColor`, so the colour is set here (or by `.cre-compass-toc-ring`). */
const MARK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 'none',
}

const RESOURCES_GROUP: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 4,
}
const RESOURCE_LIST: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
}
/* The Atlas rail's row — padding, colour, background live in the class. */
const RESOURCE_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  minHeight: 34,
  borderRadius: 8,
  boxSizing: 'border-box',
  cursor: 'pointer',
  textAlign: 'left',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
}
