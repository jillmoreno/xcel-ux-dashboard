import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * In-shell course launcher. Lets a card deep inside the Dashboard Rebrand shell
 * (e.g. the "Jump Back In" tile) open the Learning Launcher (`CourseDetailPage`)
 * *in place* — keeping the left rail — instead of navigating out to the
 * standalone `/courses/:id` route (which renders under the top nav). The shell
 * swaps its content column for the launcher when `courseId` is set; the rail and
 * a "back" affordance return to the dashboard.
 *
 * A context (not prop-threading) so the trigger card doesn't have to pass a
 * callback up through `MembershipV7`'s `SectionContent` → `MembershipOverview`.
 */
/**
 * What the OPENER knows about the course and the launcher cannot work out.
 *
 * Added 2026-09-22 for the Compass player, whose sidebar states the course
 * title and its percentage. Four attempts to derive those from `courseId`
 * inside the shell were all wrong, and the reason is structural rather than a
 * missing lookup: the id is a `jumpBackIn` card's, the card belongs to a
 * PERSONA's path override, and that path is not in `learningPathsFor(brand)`
 * at all — so no registry the shell can reach contains it. The component that
 * opens the launcher is holding the path; it passes what it has.
 *
 * OPTIONAL, so every existing `open(id)` call site keeps working unchanged —
 * the lo-fi launcher needs none of it.
 */
export type LaunchedCourseMeta = {
  /** The course as the learner would name it — the path title, which is what
   *  the dashboard's own COURSE PROGRESS heading states. */
  title?: string
  /** 0–100, the same figure Home shows for that path. */
  percentComplete?: number
  /**
   * The lesson the learner is on — the same number the Jump Back In card
   * prints, derived from completed lessons + 1.
   *
   * Passed for the same reason the title is: it is `totalCompleted + 1` off the
   * persona's resolved categories, and the shell cannot reach that object. See
   * the note above.
   */
  lessonNumber?: number
}

type CourseLauncherState = {
  /** The course whose launcher is open in-shell, or `null` for the normal section. */
  courseId: string | null
  /** What the opener knew about it — see `LaunchedCourseMeta`. Empty when the
   *  caller passed none. */
  meta: LaunchedCourseMeta
  /** Open the in-shell launcher for a course. */
  open: (courseId: string, meta?: LaunchedCourseMeta) => void
  /** Close the launcher and return to the active section. */
  close: () => void
  /** True only inside the shell provider — lets consumers (e.g. `CourseSheet`)
   *  choose the in-shell launcher over the standalone `/courses/:id` route. */
  available: boolean
}

const NOOP: CourseLauncherState = {
  courseId: null,
  meta: {},
  open: () => {},
  close: () => {},
  available: false,
}

const CourseLauncherContext = createContext<CourseLauncherState | null>(null)

export function CourseLauncherProvider({ children }: { children: ReactNode }) {
  const [courseId, setCourseId] = useState<string | null>(null)
  const [meta, setMeta] = useState<LaunchedCourseMeta>({})
  const value = useMemo<CourseLauncherState>(
    () => ({
      courseId,
      meta,
      open: (id: string, next?: LaunchedCourseMeta) => {
        setCourseId(id)
        // Replaced, not merged: stale meta from a previous open would title the
        // new course with the old one's name, which is the exact failure the
        // four derivation attempts produced.
        setMeta(next ?? {})
      },
      close: () => {
        setCourseId(null)
        setMeta({})
      },
      available: true,
    }),
    [courseId, meta],
  )
  return (
    <CourseLauncherContext.Provider value={value}>{children}</CourseLauncherContext.Provider>
  )
}

/** Returns the in-shell course-launcher controls. Falls back to a no-op outside
 *  a provider (e.g. unit-mounted cards / standalone pages), mirroring
 *  `useTheme` / `useDeviceFrame`, so consumers never crash without the shell. */
export function useCourseLauncher(): CourseLauncherState {
  return useContext(CourseLauncherContext) ?? NOOP
}
