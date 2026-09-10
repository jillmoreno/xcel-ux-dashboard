/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ARCHIVE — things removed from the XCEL project
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Rendered by `ArchiveTable` in the dashboard's Archive section. Hand-edited;
 *  there is no generator.
 *
 *  NO LONGER EMPTY as of 2026-09-10 — one row. It was empty on purpose before
 *  that, and the rule behind it still holds: do not seed this with rows from
 *  the other dashboards' archives to make it look populated, because a restore
 *  note pointing at another repo's files is worse than no row at all.
 *
 *  THE CONVENTION THIS FILE ENFORCES, for when there is something to put here:
 *
 *    Don't delete outright. When you remove something, UNWIRE it (pull it from
 *    routes, render paths, flags) but KEEP the file(s) in the repo, just
 *    unreferenced — then add a row here pointing at them, with a `restoreNote`
 *    that lists the actual re-wire steps. Bringing it back should be a re-wire,
 *    never a rebuild.
 *
 *  `restoreNote` is the field that earns its keep, and the one most often
 *  written too thinly. Name the files, the exact call sites, and anything that
 *  was deliberately NOT restored — a note that just says "re-add the component"
 *  is how a removal becomes permanent by accident.
 *
 *  The first row turned out not to be the one predicted here (the XCEL rows
 *  moving out of the Common LMS dashboard — still an open question, and still
 *  that project's archive rather than this one, since the code being unwired
 *  would be theirs). It was a card on the Profile page instead.
 */
export type ArchivedItem = {
  /** Stable id (kebab-case). */
  id: string
  /** Component / feature / variant name. */
  name: string
  /** One line: what it was / what it did. */
  what: string
  /** Where the code still lives (file path[s]) — kept in-repo, just unwired. */
  location: string
  /** The feature flag or route that governed it, if any. */
  flag?: string
  /** When it was archived — 'YYYY-MM-DD'. */
  dateRemoved: string
  /** Why it was pulled from the project. */
  reason: string
  /** How to bring it back — the re-wire steps / which flag or route to restore. */
  restoreNote: string
  /**
   * Optional screenshot of what it looked like, shown in the detail Sheet.
   * A path under `public/` (served at BASE_URL), e.g. 'archive/my-thing.png'.
   * Drop the PNG in `public/archive/`. Absent → the Sheet shows a placeholder.
   */
  screenshot?: string
}

export const ARCHIVED_ITEMS: ArchivedItem[] = [
  {
    id: 'profile-motivational-statement',
    name: 'Motivational Statement card (Profile)',
    what: 'A card on the Profile page holding the learner’s own motivational statement, with an edit pencil opening the real `MotivationalStatementPanel` (the only card there wired to anything but a stub).',
    location:
      'src/components/account/profile/ProfileCards.tsx (`MotivationalStatementCard`, still exported, no longer imported) · src/components/membership/MotivationalStatementPanel.tsx · src/context/MotivationContext.tsx',
    dateRemoved: '2026-09-10',
    reason:
      'Editorial — removed from the Profile page at Jillienne’s request. NOT a capability or data problem: the statement is real, the panel works, and the context is untouched.',
    restoreNote:
      'Re-add `MotivationalStatementCard` to the import from `@/components/account/profile/ProfileCards` in src/pages/ProfilePage.tsx and render it as the FIRST child of the right-hand column, above `MembershipPlanCard`. Nothing else moved: the component, `MotivationalStatementPanel` and `MotivationContext` are all intact and unchanged, and the panel is STILL REACHABLE from the left rail (`NavProfileHeader` → MotivationalStatementPanel), so the feature was never gone — only this second door on it. Deliberately NOT restored alongside it: the Membership Plan card, which left the same page on the same day for an unrelated reason (it is gated on `supportsMembership`, not archived, and returns by itself for a brand that sells one).',
  },
]
