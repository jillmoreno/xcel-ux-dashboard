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
 * Headings control still swaps it. The weight, size and line stay the
 * panel's own.
 */
export function useSheetTitleSerif(): CSSProperties | null {
  const on = useFeatureFlag('atlas-sheet-title-serif').enabled
  const atlas = useAtlasSkin() != null
  return on && atlas ? SERIF : null
}

const SERIF: CSSProperties = { fontFamily: 'var(--font-heading-serif)', letterSpacing: '-0.01em' }
