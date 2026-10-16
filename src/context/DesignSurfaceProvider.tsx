import { useMemo, useState, type ReactNode } from 'react'
import { DesignSurfaceContext, type DesignSurfaceId } from './designSurface'

/**
 * Holds the surface id for the tree under it. The type, the context and the
 * two hooks live in `designSurface.ts` — see the note there for why this is
 * a context rather than a URL param, and why the file is split.
 */
export function DesignSurfaceProvider({ children }: { children: ReactNode }) {
  const [surface, setSurface] = useState<DesignSurfaceId | null>(null)
  const value = useMemo(() => ({ surface, setSurface }), [surface])
  return <DesignSurfaceContext.Provider value={value}>{children}</DesignSurfaceContext.Provider>
}
