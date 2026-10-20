import { createElement, type ReactNode } from 'react'
import {
  ReadinessPanelPreview,
  ProgressStatesPreview,
  PaceRingPreview,
  ExamDateCardPreview,
  QuickLinksPreview,
  CourseHeadPreview,
  AffidavitModalPreview,
} from './AtlasHandoffPreviews'

/**
 * Looks up a live, all-variants gallery by `uiComponents`/`components` id.
 * Returns `undefined` for anything not registered, so `ComponentLivePreview`
 * (in `PrototypeHandoffDetailPage.tsx`) falls back to its iframe behavior
 * unchanged — this is additive, not a replacement of that path.
 *
 * Split out from `AtlasHandoffPreviews.tsx` (2026-10-20): this function isn't
 * a component, and `react-refresh/only-export-components` doesn't allow a
 * `.tsx` file to export a non-component alongside its components — the same
 * reason this repo splits `v4/shared.tsx` from `v4/sharedUtil.ts` elsewhere.
 * `createElement` (rather than JSX) is what lets this file stay a plain
 * `.ts` module instead of a second `.tsx`.
 */
export function atlasHandoffPreview(componentId: string): ReactNode | undefined {
  switch (componentId) {
    case 'atlas-home-readiness-panel':
      return createElement(ReadinessPanelPreview)
    case 'atlas-home-progress-states':
      return createElement(ProgressStatesPreview)
    case 'atlas-home-pace-ring':
      return createElement(PaceRingPreview)
    case 'atlas-home-exam-date-card':
      return createElement(ExamDateCardPreview)
    case 'atlas-home-quick-links':
      return createElement(QuickLinksPreview)
    case 'atlas-home-course-head':
      return createElement(CourseHeadPreview)
    case 'atlas-home-affidavit-modal':
      return createElement(AffidavitModalPreview)
    default:
      return undefined
  }
}
