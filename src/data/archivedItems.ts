/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ARCHIVE — things removed from the XCEL project
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Rendered by `ArchiveTable` in the dashboard's Archive section. Hand-edited;
 *  there is no generator.
 *
 *  EMPTY ON PURPOSE. XCEL has not removed anything yet — it is four artifacts
 *  all still in design. An empty section is the honest state; do not seed it
 *  with rows from the other dashboards' archives to make it look populated,
 *  because a restore note that points at another repo's files is worse than no
 *  row at all.
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
 *  The likely FIRST row here, given where this project is: if the four XCEL
 *  rows are ever moved out of the Common LMS dashboard (the open question this
 *  repo was built alongside), that removal belongs in the LMS project's archive,
 *  not this one — the code being unwired is theirs.
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

export const ARCHIVED_ITEMS: ArchivedItem[] = []
