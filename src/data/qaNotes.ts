/**
 * QA Notes — the data.
 *
 * An internal tracker for design-vs-build QA findings, rendered by
 * `QaNotesPanel` in the Design & Development sandbox. Every item below is a
 * real finding from the expired-CLP review, not sample data.
 *
 * Conventions this file exists to hold:
 *
 * - `id` is sequential and NEVER renumbered. A finding is referred to by its id
 *   in the bullets of other findings ("see QA-006"), in tickets, and in review
 *   notes, so renumbering silently rewrites those references.
 * - `screenCount` is deliberately absent. It is derived from `screens.length`
 *   at the render site; storing it gives two places to disagree about the same
 *   fact, and the one that drifts is always the copy.
 * - `blockedOn` is `null`, never an empty string. `null` renders an em dash;
 *   `''` renders a gap that reads as missing data.
 * - `bullets` marks nesting with a LEADING TWO SPACES rather than a nested
 *   array. A nested bullet here is always a rider on the line above it — one
 *   level, never two — so a flat list with a prefix is the whole model, and a
 *   tree would invite a depth the renderer does not draw.
 * - `screens` is the COMMITTED capture set only. It is not the whole picture:
 *   captures are normally dropped onto the live page and stored server-side (see
 *   `public/qa/README.md`), and an upload wins over a committed path for the same
 *   slot. So an empty `screens` does not mean a finding has no screenshots.
 * - `label` is the union `'Expected' | 'Actual'` and the capture keys are derived
 *   from it, so widening it means widening `CaptureLabel` in `qaCaptureStore.ts`
 *   and the function's `KEY_PATTERN` together.
 */

export type QaStatus = 'Open' | 'Needs decision' | 'Fixed' | "Won't fix"
export type QaSeverity = 'Blocker' | 'High' | 'Medium' | 'Low'

export interface QaScreen {
  label: 'Expected' | 'Actual'
  /**
   * A committed file under `public/qa/`, or `null`.
   *
   * This is the only channel for a screenshot that lives in the repo. Findings
   * authored on the page carry `screens: []` — their pictures are uploads keyed
   * to the finding id, held in the capture store, not here.
   */
  src: string | null
}

/**
 * One finding.
 *
 * Deliberately small. Surface, state, category, blocked-on, the prose
 * expected/actual pair, screenshot captions, feature flag and ticket ref were all
 * removed on 2026-08-26: the form was long enough that filling it in was a chore,
 * and the two captures — labelled Expected and Actual — already carry the
 * comparison the prose pair was restating. What is left is what a finding cannot
 * do without: what it is, how bad it is, where it stands, and the detail.
 */
export interface QaNote {
  /** 'QA-001' — assigned by the server, sequential, never renumbered. */
  id: string
  title: string
  severity: QaSeverity
  status: QaStatus
  /** ISO 8601 date, stamped server-side. */
  loggedDate: string
  /** A leading two-space prefix marks a nested bullet. One level, no deeper. */
  bullets: string[]
  /** Committed screenshot paths only — see `QaScreen.src`. */
  screens: QaScreen[]
}

// ─── QA NOTES DATA — append new items here ──────────────────────────
/**
 * EMPTY ON PURPOSE.
 *
 * Findings are authored on the live page and stored server-side — see
 * `public/qa/README.md`. This array is the COMMITTED seed, and keeping it empty
 * means the page starts blank and everything in it was written through the form.
 *
 * It is still load-bearing in two ways:
 *
 * - It is what `committedIdFloor()` measures, so ids continue from the highest
 *   entry here. Empty ⇒ the first authored finding is QA-001.
 * - It is what **Copy as data file** produces. Pasting that output back over
 *   this array is how stored findings become committed ones, which is the only
 *   backup the Blobs store has.
 *
 * The original 18 expired-CLP findings were seeded here and removed on
 * 2026-08-26 once authoring worked; they are in git history at commit 22cc382 if
 * they are ever wanted back — note they carry fields this type no longer has.
 */
export const QA_NOTES: QaNote[] = []
