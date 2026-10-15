import { createContext, useContext } from 'react'
import type { PlanAction, PlanState } from './compassPlanStore'

/** The plan's context and hook — a plain `.ts` module beside the provider,
 *  for react-refresh's "only export components" rule (the same split
 *  `compassPages.ts` makes). See `CompassPlanContext` for what it holds. */
export type PlanControls = {
  rubi: boolean
  returnVer: 'A' | 'B'
  under: 'none' | 'next' | 'coming'
  dayMode: 'skip' | 'menu'
}
export type PlanContextValue = { plan: PlanState; dispatch: (a: PlanAction) => void; controls: PlanControls }
export const PlanContext = createContext<PlanContextValue | null>(null)

export function useCompassPlan(): PlanContextValue {
  const v = useContext(PlanContext)
  if (!v) throw new Error('useCompassPlan must be used within a CompassPlanProvider')
  return v
}
