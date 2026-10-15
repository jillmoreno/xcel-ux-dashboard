import { useReducer, type ReactNode } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { initialPlan, withAbsence, type AbsenceKind, type PlanAction, type PlanState } from './compassPlanStore'
import { PlanContext, type PlanControls } from './compassPlanHooks'

/**
 * THE PLAN'S HOME — mounted once in `CompassLearningPage`, above the rail and
 * every page, so the Study planner and the Overview's Tonight card read and
 * write the same plan. See `compassPlanStore` for why one state.
 *
 * The four design controls that shape the planner are read here once and
 * handed down, so a component never asks the catalog for them twice and a
 * test can see every lever in one place:
 *
 * | control | what it decides |
 * |---|---|
 * | `compass-planner-rubi` | whether Rubi's panel is in the package |
 * | `compass-planner-return` | the return note after time away — A, or B with a catch-up review |
 * | `compass-planner-under` | what sits below the week — nothing, next week, or the coming sessions |
 * | `compass-planner-day-off` | taking a day off — a Skip button on hover, or a menu on click |
 * | `compass-planner-absence` | the absence seeded into the plan, so the return note has something to say |
 *
 * ⚠ THE PROVIDER REMOUNTS WHEN THE ABSENCE CHANGES (`key`), because an absence
 * is a different starting state, not a flag over the same one: it moves
 * "today". Everything else re-renders in place.
 */

const reduce = (s: PlanState, a: PlanAction) => a(s)

export function CompassPlanProvider({ children }: { children: ReactNode }) {
  const absence = (useFeatureFlag('compass-planner-absence').variant ?? 'none') as AbsenceKind
  const rubiFlag = useFeatureFlag('compass-planner-rubi')
  const returnVer = (useFeatureFlag('compass-planner-return').variant ?? 'A') as 'A' | 'B'
  const under = (useFeatureFlag('compass-planner-under').variant ?? 'none') as PlanControls['under']
  const dayMode = (useFeatureFlag('compass-planner-day-off').variant ?? 'skip') as PlanControls['dayMode']
  const controls: PlanControls = { rubi: rubiFlag.enabled, returnVer, under, dayMode }
  return (
    <PlanHolder key={absence} absence={absence} controls={controls}>
      {children}
    </PlanHolder>
  )
}

function PlanHolder({ absence, controls, children }: { absence: AbsenceKind; controls: PlanControls; children: ReactNode }) {
  const [plan, dispatch] = useReducer(reduce, absence, (kind) => withAbsence(initialPlan(), kind))
  return <PlanContext.Provider value={{ plan, dispatch, controls }}>{children}</PlanContext.Provider>
}
