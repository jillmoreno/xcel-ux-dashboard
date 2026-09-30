/**
 * ATLAS HEADING FONTS (2026-09-29) — the Demo Controls' Fonts dropdown, for
 * comparing heading faces on the real Atlas pages. The list is the XCEL Atlas
 * Style Guide's current face (DM Serif Display) plus the faces on the "Atlas
 * Serif Trials" page (claude.ai/artifact/7RBHGa9AXBT3wieEZw1N8e) — less Gloock,
 * Yeseva One and Albert Sans, taken out on 2026-09-29 at the designer's
 * request, and Plus Jakarta Sans, replaced by Open Sans the next day — each with
 * the trial's own settings so it reads as it did there:
 *
 *   - `weight` is the ONLY weight loaded. Weight synthesis is off under the
 *     Atlas palette and each face ships one weight, so every heading renders
 *     at the trial weight whatever weight its component asks for.
 *   - `sizeScale` / `lineScale` scale the guide's heading tokens
 *     (`--type-atlas-h*`): the trials set Playfair 2 about 27% larger with
 *     about 19% tighter lines.
 *   - Source Serif 4 is SemiBold (600), one step under the trial's Bold
 *     (2026-09-29, the designer's request).
 *
 * Mechanics mirror the Brand control: `?fonts=` in the URL, mirrored onto
 * `<html data-atlas-font>` by `PlatformShell`, which also loads the chosen
 * face from Google Fonts on demand (DM Serif Display is always loaded, by
 * index.html). tokens.css "ATLAS HEADING FONTS" holds the per-face values.
 */
export type AtlasFont =
  | 'dm-serif-display'
  | 'playfair-2'
  | 'source-serif-4'
  | 'figtree'
  | 'open-sans'
  | 'outfit'
  | 'instrument-sans'

export const ATLAS_FONTS: readonly {
  font: AtlasFont
  label: string
  /** Google Fonts css2 `family=` value, one weight only. Absent for the face
   *  index.html already loads. */
  google?: string
  /** Left out of the Demo Controls' dropdown, but still a valid `?fonts=`
   *  value with its tokens intact — un-hiding is deleting this flag. */
  hidden?: boolean
}[] = [
  { font: 'dm-serif-display', label: 'DM Serif Display (current)' },
  { font: 'playfair-2', label: 'Playfair 2', google: 'Playfair:wght@700' },
  // 500 is loaded too, for the Home course title alone (2026-09-30); every
  // other heading is held at 600 by a rule in tokens.css.
  { font: 'source-serif-4', label: 'Source Serif 4', google: 'Source+Serif+4:wght@500;600' },
  { font: 'figtree', label: 'Proxima Nova stand-in (Figtree)', google: 'Figtree:wght@500' },
  // Hidden from the dropdown 2026-09-30 (the designer's request); the
  // semi-bold / course-title-500 rules in tokens.css stay for it.
  { font: 'open-sans', label: 'Open Sans', google: 'Open+Sans:wght@500', hidden: true },
  { font: 'outfit', label: 'Outfit', google: 'Outfit:wght@400' },
  { font: 'instrument-sans', label: 'Instrument Sans', google: 'Instrument+Sans:wght@500' },
]

export const ATLAS_FONT_PARAM = 'fonts'

/** `?fonts=` → a known face, else the current one. Validated, not cast. */
export function atlasFontFor(param: string | null): AtlasFont {
  return ATLAS_FONTS.some((f) => f.font === param) ? (param as AtlasFont) : 'dm-serif-display'
}

/** The Google Fonts stylesheet for a face, or null when index.html has it. */
export function atlasFontHref(font: AtlasFont): string | null {
  const google = ATLAS_FONTS.find((f) => f.font === font)?.google
  return google ? `https://fonts.googleapis.com/css2?family=${google}&display=swap` : null
}
