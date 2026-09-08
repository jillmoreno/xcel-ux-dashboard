/* eslint-disable react-refresh/only-export-components -- provider + hook in one
   file, same single-import pattern as CourseLauncherContext / MotivationContext. */
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

/**
 * In-shell Resource Library resource viewer. Lets a card in the Learning
 * Library grid open the resource viewer (`ResourceDetailPage`) *in place* —
 * keeping the left rail — instead of navigating out to the standalone
 * `/resources/:id` route (which renders under the top nav). The shell swaps its
 * content column for the viewer when `resourceId` is set; a "Back to Learning
 * Library" affordance returns to the section. Mirrors `CourseLauncherContext`.
 */
type ResourceLauncherState = {
  /** The resource whose viewer is open in-shell, or `null` for the normal section. */
  resourceId: string | null
  /** Open the in-shell viewer for a resource. */
  open: (resourceId: string) => void
  /** Close the viewer and return to the active section. */
  close: () => void
}

const NOOP: ResourceLauncherState = { resourceId: null, open: () => {}, close: () => {} }

const ResourceLauncherContext = createContext<ResourceLauncherState | null>(null)

export function ResourceLauncherProvider({ children }: { children: ReactNode }) {
  const [resourceId, setResourceId] = useState<string | null>(null)
  const value = useMemo<ResourceLauncherState>(
    () => ({
      resourceId,
      open: (id: string) => setResourceId(id),
      close: () => setResourceId(null),
    }),
    [resourceId],
  )
  return (
    <ResourceLauncherContext.Provider value={value}>{children}</ResourceLauncherContext.Provider>
  )
}

/** Returns the in-shell resource-viewer controls. Falls back to a no-op outside
 *  a provider (e.g. unit-mounted cards / standalone pages), mirroring
 *  `useCourseLauncher`, so consumers never crash without the shell. */
export function useResourceLauncher(): ResourceLauncherState {
  return useContext(ResourceLauncherContext) ?? NOOP
}
