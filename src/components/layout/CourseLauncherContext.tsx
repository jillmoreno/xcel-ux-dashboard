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
type CourseLauncherState = {
  /** The course whose launcher is open in-shell, or `null` for the normal section. */
  courseId: string | null
  /** Open the in-shell launcher for a course. */
  open: (courseId: string) => void
  /** Close the launcher and return to the active section. */
  close: () => void
  /** True only inside the shell provider — lets consumers (e.g. `CourseSheet`)
   *  choose the in-shell launcher over the standalone `/courses/:id` route. */
  available: boolean
}

const NOOP: CourseLauncherState = {
  courseId: null,
  open: () => {},
  close: () => {},
  available: false,
}

const CourseLauncherContext = createContext<CourseLauncherState | null>(null)

export function CourseLauncherProvider({ children }: { children: ReactNode }) {
  const [courseId, setCourseId] = useState<string | null>(null)
  const value = useMemo<CourseLauncherState>(
    () => ({
      courseId,
      open: (id: string) => setCourseId(id),
      close: () => setCourseId(null),
      available: true,
    }),
    [courseId],
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
