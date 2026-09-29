import type { CSSProperties } from 'react'

/**
 * THREE WAYS TO DRAW THE EXAM PICKER'S CALENDAR — `exam-calendar-style`,
 * 2026-09-29.
 *
 * The brief: the picker "feels a little muted and minimalistic-looking". That
 * is a judgement about PRESENCE, and presence is not one dial — a calendar can
 * gain it by getting bigger, by getting a ground, or by getting brand. So these
 * three arms each turn a different one up, rather than being three steps along
 * the same slider.
 *
 * ⚠ SKINS ONLY. Every arm renders the SAME grid from the same `buildMonthCells`
 * output, with the same disabled / today / selected logic — that is the "fork
 * the layout, import the data" rule, and it is what makes the comparison about
 * the drawing rather than about three calendars that quietly disagree on which
 * days are bookable.
 *
 * WHAT EACH ONE ARGUES:
 *
 *  • `minimal` — the CONTROL, unchanged. A hairline box on the page ground, 22px
 *    nav, 11.5px numerals. Recessive on purpose: it is a field, not a feature,
 *    and the card around it is already doing the asking.
 *  • `framed` — the same calendar given ROOM and a surface: a raised card, a
 *    rule under the month, square-ish day cells about half again as large, and
 *    a real hover state. Argues the picker was thin rather than wrong.
 *  • `branded` — the calendar as an OBJECT: a navy cap across the top carrying
 *    the month in white, round day cells, the selected day a filled navy disc.
 *    ⚠ IT IS THE SAVED STATE'S TEAR-OFF, EARLIER — the readout you get after
 *    saving is a navy-capped calendar, so this makes the thing you pick from and
 *    the thing you end up with visibly the same object. That is the argument;
 *    the cost is that it is the loudest element on a card whose job is to ask a
 *    one-line question.
 */

export type ExamCalendarStyle = 'minimal' | 'framed' | 'branded'

export type CalendarSkin = {
  /** The bordered/raised box around the whole calendar. */
  frame: CSSProperties
  /** Row holding the arrows and the month label. */
  monthRow: CSSProperties
  /** True when the month row is a full-bleed coloured bar, so the frame must
   *  not pad it and the bar owns its own padding. */
  monthRowIsBar: boolean
  nav: CSSProperties
  monthLabel: CSSProperties
  /** Padding wrapper for everything under a full-bleed bar. Empty otherwise. */
  body: CSSProperties
  grid: CSSProperties
  dow: CSSProperties
  day: CSSProperties
  dayDisabled: CSSProperties
  dayToday: CSSProperties
  daySelected: CSSProperties
}

/* ─── minimal — the control, byte-for-byte what shipped ─────────────────── */

const minimal: CalendarSkin = {
  frame: {
    marginTop: 10,
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)',
    padding: 10,
    background: 'var(--color-surface-page)',
  },
  monthRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-primary)',
  },
  monthRowIsBar: false,
  nav: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface-card)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  monthLabel: { fontWeight: 700, fontSize: 12.5 },
  body: {},
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  dow: {
    fontFamily: 'var(--font-body)',
    fontSize: 9.5,
    fontWeight: 700,
    textAlign: 'center',
    paddingBottom: 3,
    color: 'var(--color-text-tertiary)',
  },
  day: {
    border: 0,
    background: 'transparent',
    borderRadius: 'var(--radius-sm)',
    padding: '4px 0',
    fontFamily: 'var(--font-body)',
    fontSize: 11.5,
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  dayDisabled: { color: 'var(--color-neutral-300)', cursor: 'not-allowed' },
  dayToday: { boxShadow: 'inset 0 0 0 1px var(--color-primary-600)' },
  daySelected: {
    background: 'var(--color-primary-600)',
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
  },
}

/* ─── framed — room and a surface ───────────────────────────────────────── */

const framed: CalendarSkin = {
  frame: {
    marginTop: 12,
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-md)',
    padding: 12,
    background: 'var(--color-surface-card)',
    boxShadow: 'var(--shadow-card)',
  },
  monthRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    marginBottom: 8,
    /* A rule under the month, which is the cheapest thing that makes the header
       read as a header rather than as the first row of the grid. */
    borderBottom: '1px solid var(--color-border-subtle)',
    fontFamily: 'var(--font-body)',
    color: 'var(--color-text-primary)',
  },
  monthRowIsBar: false,
  nav: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: '1px solid var(--color-border-subtle)',
    borderRadius: 'var(--radius-sm)',
    background: 'var(--color-surface-page)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  monthLabel: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--color-text-primary)',
  },
  body: {},
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 },
  dow: {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textAlign: 'center',
    paddingBottom: 6,
    color: 'var(--color-text-tertiary)',
  },
  day: {
    /* Square cells — the grid reads as a month rather than as seven columns of
       text once the cells have height of their own. */
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    background: 'transparent',
    borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
  },
  dayDisabled: { color: 'var(--color-neutral-300)', cursor: 'not-allowed', fontWeight: 400 },
  dayToday: {
    boxShadow: 'inset 0 0 0 1px var(--color-primary-600)',
    color: 'var(--color-primary-700)',
  },
  daySelected: {
    background: 'var(--color-primary-600)',
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
  },
}

/* ─── branded — the tear-off, earlier ───────────────────────────────────── */

const branded: CalendarSkin = {
  frame: {
    marginTop: 12,
    border: '1px solid var(--color-primary-500)',
    borderRadius: 'var(--radius-md)',
    /* No padding: the navy bar is full-bleed to the frame's edge, so the body
       below carries the padding instead. `overflow: hidden` is what lets the
       bar take the frame's top corners. */
    padding: 0,
    overflow: 'hidden',
    background: 'var(--color-surface-card)',
    boxShadow: 'var(--shadow-card)',
  },
  monthRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: 'var(--color-primary-500)',
    fontFamily: 'var(--font-body)',
    /* ⚠ `--color-text-inverse`, which is #ffffff in BOTH themes — the bar is
       navy in light and dark alike, so a theme-relative ink would flip off it. */
    color: 'var(--color-text-inverse)',
  },
  monthRowIsBar: true,
  nav: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    border: '1px solid color-mix(in srgb, var(--color-text-inverse) 45%, transparent)',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text-inverse)',
    cursor: 'pointer',
  },
  monthLabel: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--color-text-inverse)',
  },
  body: { padding: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  dow: {
    fontFamily: 'var(--font-body)',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.06em',
    textAlign: 'center',
    paddingBottom: 5,
    color: 'var(--color-primary-700)',
  },
  day: {
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 0,
    background: 'transparent',
    /* Round, echoing the binder-ring geometry of the tear-off this arm quotes. */
    borderRadius: 'var(--radius-pill)',
    fontFamily: 'var(--font-body)',
    fontSize: 12.5,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    cursor: 'pointer',
  },
  dayDisabled: { color: 'var(--color-neutral-300)', cursor: 'not-allowed', fontWeight: 400 },
  dayToday: { boxShadow: 'inset 0 0 0 1px var(--color-primary-500)' },
  daySelected: {
    background: 'var(--color-primary-700)',
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
  },
}

export const EXAM_CALENDAR_SKINS: Record<ExamCalendarStyle, CalendarSkin> = {
  minimal,
  framed,
  branded,
}

/** Falls back to `framed` — the branch default — for an unknown variant string,
 *  so a typo in `?ff=` renders a calendar rather than crashing on `undefined`. */
export function examCalendarSkin(variant: string | undefined): CalendarSkin {
  return EXAM_CALENDAR_SKINS[(variant as ExamCalendarStyle) ?? 'framed'] ?? EXAM_CALENDAR_SKINS.framed
}
