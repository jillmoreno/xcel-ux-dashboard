import { createContext, useContext, type MutableRefObject } from 'react'

/**
 * The context and its two hooks, split out of `demoShareActions.tsx`
 * (2026-10-26) so that file exports only a component and fast refresh keeps
 * working — the same split as `demoControlsUtil` / `DemoControlsBar`. See the
 * provider file for what the ref is and why it is a ref.
 */
export type DemoShareActions = {
  copyLink: () => void
  copyDemoLink: () => void
}

export type DemoShareCtx = {
  ref: MutableRefObject<DemoShareActions | null>
  /** Write the handlers — the bar calls this every render. A method on the
   *  provider rather than a bare `ref.current =` in the bar because the React
   *  Compiler lint refuses a mutation of a value returned from a hook; the
   *  mutation lives where the ref is constructed. */
  publish: (actions: DemoShareActions | null) => void
  notifyCopied: () => void
}

export const DemoShareContext = createContext<DemoShareCtx | null>(null)

/** For `DemoControlsBar` — publish the handlers. Safe outside a provider
 *  (returns null) so the bar can still be unit-mounted standalone. */
export function useDemoShareRegistry(): DemoShareCtx | null {
  return useContext(DemoShareContext)
}

/** For `PrototypeBar` — read them at click time. Null until the bar has
 *  published, which is also the signal that there is nothing to share (any
 *  route but the rebrand), so the kebab hides itself. */
export function useDemoShareActions(): DemoShareActions | null {
  return useContext(DemoShareContext)?.ref.current ?? null
}
