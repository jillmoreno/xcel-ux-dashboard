import type { SubNavItem } from '@/components/ui/SubNav'

/**
 * THE COMPASS COURSE'S FIVE PANES — 2026-09-18, the direct ask ("Options will
 * include: Overview, Course, Flashcards, Exam Simulator, Progress").
 *
 * Order is the ask's own, and it reads as the learner's path through a course:
 * what this is, the material, the drilling, the mock exam, then how it went.
 *
 * **NO PANE HAS CONTENT, and that is deliberate rather than unfinished.** The
 * whole launcher is a lo-fi placeholder (see `CourseLauncherView`), so five
 * panes of authored Compass UI would be five times the invention this version
 * has refused throughout — the same call as "Readiness — not designed yet" on
 * the square tiles. What each pane does today is NAME itself above the
 * placeholder, which is what makes the nav answer a click instead of looking
 * broken.
 *
 * **NO GLYPHS, as of later the same day** — `SubNav` is text-only now (the
 * direct ask, made from the account rail). That retires both of the judgement
 * calls this list used to carry and document, which is worth recording because
 * each was a compromise rather than a choice:
 *
 *   - **Flashcards** had `Notebook` as a STAND-IN, because FA's `clone` /
 *     `cards-blank` is the right drawing and is not vendored.
 *   - **Progress** had `Gauge`, which is the Readiness RAIL row's own glyph —
 *     and the two are on screen together, since the rail collapses to
 *     icon-over-short-text when the launcher opens.
 *
 * Neither needs resolving now. If glyphs ever come back to this rail, they are
 * the two to settle first, and vendoring `clone` and `chart-line` is what
 * settles them.
 *
 * IN ITS OWN MODULE rather than beside `CourseLauncherView` in `PlatformShell`:
 * exporting a non-component from that file is a `react-refresh` lint error, and
 * the list is worth importing without mounting the shell.
 */
export const COMPASS_PANES = [
  { id: 'overview', label: 'Overview' },
  { id: 'course', label: 'Course' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'exam-simulator', label: 'Exam Simulator' },
  { id: 'progress', label: 'Progress' },
] as const satisfies readonly SubNavItem<string>[]

export type CompassPaneId = (typeof COMPASS_PANES)[number]['id']
