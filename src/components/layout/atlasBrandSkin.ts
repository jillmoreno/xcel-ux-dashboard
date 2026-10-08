import { useSyncExternalStore } from 'react'

/**
 * ATLAS BRAND SKIN (2026-09-29) — which Colibri brand the Atlas/Compass pages
 * are dressed as. Eric's ask: a Brand control in the Demo Controls for
 * McKissock, CRE and Elite.
 *
 * It is a SKIN, not a brand. `Brand` (AccountContext) stays `'xcel'` — the
 * courses, personas and fixtures are XCEL's whichever skin is showing. What a
 * skin changes is exactly what the Atlas Development doc's multi-brand table
 * says changes per brand: the LOGO and the BRAND COLOURS. Neutrals, type scale,
 * spacing and layout are platform, and stay. Re-widening `Brand` instead would
 * mean restoring ~340 per-brand fixture entries across the product — the work
 * 431ec3e removed on 2026-09-08 — which was deliberately not done here.
 *
 * Mechanics: the skin rides the URL as `?skin=` (so a link can show one), and
 * `PlatformShell` mirrors it onto `<html data-atlas-brand>` while the Atlas
 * palette is on. tokens.css ("ATLAS BRAND SKINS") re-points the ramps per
 * value. `useAtlasSkin()` reads that attribute, so leaf components such as
 * `Logo` follow the skin without a provider.
 *
 * The palettes and logos are the brands' own from before 431ec3e.
 */
/**
 * ⚠ TWO KINDS OF SKIN SINCE 2026-10-08, and the distinction is load-bearing.
 *
 * A BRAND skin is a Colibri company: it re-points the ramps AND swaps the logo,
 * and `SKIN_LOGOS` in `Logo.tsx` is keyed by exactly these.
 *
 * A PALETTE skin is colours only — four of them arrived with no company behind
 * them, from palettes the designer supplied. There is no lockup to show, so the
 * page keeps whichever logo it had. Splitting the union rather than growing an
 * `Exclude<…>` list in `Logo.tsx` is what keeps that honest: a new brand skin
 * fails to compile until its logo is supplied, and a new palette one never
 * pretends to need one.
 */
export type AtlasBrandSkin = 'cre' | 'mckissock' | 'elite'
export type AtlasPaletteSkin = 'grasslands' | 'everglade' | 'harbor' | 'marigold'
export type AtlasSkin = 'global' | 'xcel' | AtlasBrandSkin | AtlasPaletteSkin

export const ATLAS_SKINS: readonly { skin: AtlasSkin; label: string }[] = [
  // GLOBAL (2026-09-30) — no brand: the Atlas experience in the Compass Design
  // System v5's own colours (steel, slate, terracotta, one white surface), for
  // an instance that is not any Colibri brand. Colours only — the file's fonts
  // and component styles are deliberately not taken. See tokens.css.
  { skin: 'global', label: 'Global' },
  { skin: 'xcel', label: 'XCEL (Insurance)' },
  { skin: 'cre', label: 'Colibri Real Estate' },
  { skin: 'mckissock', label: 'McKissock Learning' },
  { skin: 'elite', label: 'Elite Learning' },
  /* THE PALETTE THEMES (2026-10-08, the direct ask: "add 4 additional brand
     themes using the colors from these screenshots"). Colours only — see
     `AtlasPaletteSkin` above and tokens.css, "FOUR PALETTE THEMES".
     Named for what each palette IS, since none of them is a company: the
     source named Grasslands and Everglade itself, Harbor and Marigold are
     ours. */
  { skin: 'grasslands', label: 'Grasslands' },
  { skin: 'everglade', label: 'Everglade' },
  { skin: 'harbor', label: 'Harbor' },
  { skin: 'marigold', label: 'Marigold' },
]

export const ATLAS_SKIN_PARAM = 'skin'

/** The skin a link with no `?skin=` shows: GLOBAL since 2026-10-01 (the
 *  designer's request; it was XCEL). */
export const ATLAS_SKIN_DEFAULT: AtlasSkin = 'global'

/** `?skin=` → a known skin, else the default. Validated, not cast: a
 *  hand-edited link can name anything. */
export function atlasSkinFor(param: string | null): AtlasSkin {
  return ATLAS_SKINS.some((s) => s.skin === param) ? (param as AtlasSkin) : ATLAS_SKIN_DEFAULT
}

function readSkin(): AtlasSkin | null {
  if (typeof document === 'undefined') return null
  const v = document.documentElement.dataset.atlasBrand
  return v ? atlasSkinFor(v) : null
}

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => {}
  const mo = new MutationObserver(onChange)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-atlas-brand'] })
  return () => mo.disconnect()
}

/** The skin on `<html>`, or null when none is applied (off the Atlas version,
 *  or the Atlas palette flag is off). */
export function useAtlasSkin(): AtlasSkin | null {
  return useSyncExternalStore(subscribe, readSkin, () => null)
}
