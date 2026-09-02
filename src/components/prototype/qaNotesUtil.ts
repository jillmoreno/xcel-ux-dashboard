/**
 * QA Notes — the non-component helpers.
 *
 * Split out of `QaNotesPanel.tsx` on purpose: a module that exports both
 * components and plain functions breaks fast refresh, which is the same reason
 * `todoStore.ts` sits beside `TodoPanel.tsx` and `giftRecipientsUtil.ts` beside
 * its panel.
 */

import { type QaNote, type QaSeverity, type QaStatus } from '@/data/qaNotes'
import {
  captureKey,
  contextCapturesFor,
  contextKey,
  type CaptureIndex,
  type CaptureLabel,
  type QaCapture,
} from '@/data/qaCaptureStore'

/** Status order for the filter strip. Open leads because it is the working set;
 *  Won't fix trails because it is the only one nobody acts on. */
export const QA_STATUSES: QaStatus[] = ['Open', 'Needs decision', 'Fixed', "Won't fix"]

/** Most severe first — the order a triage pass reads them in. */
export const QA_SEVERITIES: QaSeverity[] = ['Blocker', 'High', 'Medium', 'Low']

/** Ranks for the default sort. Severity decides, and `loggedDate` cannot break
 *  the tie because every finding in the seed set was logged the same day — so
 *  the id is the tiebreaker, which also keeps the order stable across renders. */
const SEVERITY_RANK: Record<QaSeverity, number> = { Blocker: 0, High: 1, Medium: 2, Low: 3 }

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/**
 * `2026-08-26` → `Aug 26, 2026`.
 *
 * Parsed by hand rather than through `new Date(iso)`: that constructor reads a
 * bare date as UTC, so in any negative-offset timezone it renders the day
 * before. The same reason `giftRecipientsUtil` parses its ISO dates by hand.
 */
export function formatLoggedDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

/** A bullet is nested when it carries the leading two-space prefix. One level
 *  only — see the note in `qaNotes.ts` for why the model is a flat list. */
export function isNestedBullet(bullet: string): boolean {
  return bullet.startsWith('  ')
}

export function bulletText(bullet: string): string {
  return bullet.trim()
}

/** Search covers the title and every bullet — the two fields that carry the
 *  finding now that the prose expected/actual pair is gone. Deliberately NOT id
 *  or status: those have their own controls, and matching them would make a
 *  status pill and the search box disagree about what "Open" means. */
function matchesQuery(note: QaNote, q: string): boolean {
  if (!q) return true
  return [note.title, ...note.bullets].join(' ').toLowerCase().includes(q)
}

export type QaFilters = {
  /** Already lower-cased and trimmed by the caller. */
  query: string
  /** `null` = All. */
  status: QaStatus | null
  /** Empty = no severity narrowing (not "none match"). */
  severities: QaSeverity[]
}

export function filterQaNotes<T extends QaNote>(notes: T[], f: QaFilters): T[] {
  return notes.filter(
    (n) =>
      matchesQuery(n, f.query) &&
      (f.status === null || n.status === f.status) &&
      (f.severities.length === 0 || f.severities.includes(n.severity)),
  )
}

/** Most severe first. Applied after filtering, so the pick decides which rows
 *  appear and this decides only what order they appear in. */
export function sortQaNotes<T extends QaNote>(notes: T[]): T[] {
  return [...notes].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.id.localeCompare(b.id),
  )
}

/** How many notes carry each status. Counts the WHOLE set, not the current
 *  selection, so a pill says how many it would show rather than how many
 *  survive the pick already made — the same rule the project list's status
 *  pills follow. */
export function statusCounts(notes: QaNote[]): Map<QaStatus, number> {
  const m = new Map<QaStatus, number>()
  for (const s of QA_STATUSES) m.set(s, 0)
  for (const n of notes) m.set(n.status, (m.get(n.status) ?? 0) + 1)
  return m
}

/** The sub-line under the page title. Reports the two numbers that describe the
 *  backlog's shape — what is open, and what is waiting on somebody. */
export function qaSummaryLine(notes: QaNote[]): string {
  const counts = statusCounts(notes)
  const total = notes.length
  return `${total} ${total === 1 ? 'item' : 'items'} · ${counts.get('Open') ?? 0} open · ${
    counts.get('Needs decision') ?? 0
  } needing a decision`
}


/* ── capture slots ────────────────────────────────────────────────────────── */

/**
 * A finding has exactly two capture slots, Expected and Actual, and each can be
 * filled from either of two places: a file committed at `screens[].src`, or a
 * blob dropped onto the live page. This is the one place that resolves the pair.
 */
export type CaptureSlot = {
  label: CaptureLabel
  /** The blob key, shared with the upload endpoint. */
  key: string
  /** Path from the data file, when one is committed. */
  committedSrc: string | null
  /** Uploaded blob, when one exists. Wins over `committedSrc`. */
  capture: QaCapture | null
}

/** The fixed pair. Not derived from the data, so an empty `screens` still has
 *  two slots to drop into. */
const SLOT_LABELS: CaptureLabel[] = ['Expected', 'Actual']

/**
 * Both slots for a finding, filled from the data file and the uploaded index.
 *
 * An upload wins over a committed path, and clearing the upload falls back to
 * the committed file — so dropping is always reversible and can never take away
 * something that is in git.
 */
export function captureSlotsFor(note: QaNote, index: CaptureIndex): CaptureSlot[] {
  return SLOT_LABELS.map((label) => {
    const committed = note.screens.find((s) => s.label === label)
    return {
      label,
      key: captureKey(note.id, label),
      committedSrc: committed?.src ?? null,
      capture: index.byKey.get(captureKey(note.id, label)) ?? null,
    }
  })
}

/** Slots that actually have an image behind them. What the list rows count and
 *  render — an empty slot is a drop target, not a capture. */
export function filledSlots(slots: CaptureSlot[]): CaptureSlot[] {
  return slots.filter((s) => s.capture !== null || s.committedSrc !== null)
}

/** A context image on a finding: supporting material, not part of the
 *  Expected/Actual comparison. */
export type ContextSlot = { key: string; index: number; capture: QaCapture }

/** A finding's context images, in index order. Empty for most findings. */
export function contextSlotsFor(note: QaNote, index: CaptureIndex): ContextSlot[] {
  return contextCapturesFor(index, note.id).map(({ index: i, capture }) => ({
    key: contextKey(note.id, i),
    index: i,
    capture,
  }))
}
