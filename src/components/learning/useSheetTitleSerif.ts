import type { CSSProperties } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useAtlasSkin } from '@/components/layout/atlasBrandSkin'

/**
 * The side sheets' titles in the heading serif — Playfair — on the Atlas
 * versions (2026-11-03, Eric's request: "change the title in the side sheets
 * to playfair"). Exam Details, Common questions, a Get Licensed step and the
 * course's State Requirements all open as a sheet from Quick Links.
 *
 * ⚠ THE SHEETS ARE SHARED, so this is the one switch rather than a fork of
 * each panel: `null` off the Atlas versions (no Atlas skin on `<html>`) or
 * with `atlas-sheet-title-serif` off, and the panels keep their own title
 * style untouched. `--font-heading-serif` rather than a literal, so the
 * Headings control still swaps it. The weight stays the panel's own.
 */
export function useSheetTitleSerif(): CSSProperties | null {
  const on = useFeatureFlag('atlas-sheet-title-serif').enabled
  const atlas = useAtlasSkin() != null
  return on && atlas ? SERIF : null
}

/* One step up the Atlas scale (2026-11-03, Eric's request). The panels'
   titles were 21/27 — the scale's H8 (22 on this Home) — so one level up is
   H7, 27/29 under Playfair. */
const SERIF: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontSize: 'var(--type-atlas-h7-base-size, 24px)',
  lineHeight: 'var(--type-atlas-h7-base-line, 28px)',
  letterSpacing: '-0.01em',
}

/**
 * …and the same sheets' left and right padding at 32, from the shared 22
 * (2026-11-03, Eric's request) — the head (Close, eyebrow, title) and the
 * scrolling body both, so they keep one edge. Same switch, same reach:
 * `null` off the Atlas versions or with `atlas-sheet-title-serif` off.
 */
export function useSheetInset(): CSSProperties | null {
  const on = useFeatureFlag('atlas-sheet-title-serif').enabled
  const atlas = useAtlasSkin() != null
  return on && atlas ? INSET : null
}

const INSET: CSSProperties = { paddingLeft: 32, paddingRight: 32 }
