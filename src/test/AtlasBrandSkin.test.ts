import { describe, expect, it } from 'vitest'
import { ATLAS_SKINS, atlasSkinFor } from '@/components/layout/atlasBrandSkin'
import { ATLAS_FONTS, atlasFontFor, atlasFontHref } from '@/components/layout/atlasFontSets'

describe('atlasSkinFor', () => {
  it('reads XCEL, XCEL Blue CTA, Atlas, the three brands and four palettes, and falls back to XCEL', () => {
    /* ⚠ ORDER IS THE PICKER'S — XCEL first and default (2026-10-06, Eric),
       XCEL Blue CTA beside it (2026-10-09, colours only, keeps the XCEL logo),
       then Atlas (`global`), the three Colibri brands that swap the logo as
       well, then the four palettes (2026-10-08, colours only, no lockup).
       `SKIN_LOGOS` is keyed by `AtlasBrandSkin` alone; a palette in that map,
       or a brand missing from it, is a compile error by design. */
    expect(ATLAS_SKINS.map((s) => s.skin)).toEqual([
      'xcel',
      'xcel-blue-cta',
      'global',
      'cre',
      'mckissock',
      'elite',
      'grasslands',
      'everglade',
      'harbor',
      'marigold',
    ])
    expect(atlasSkinFor('xcel-blue-cta')).toBe('xcel-blue-cta')
    for (const p of ['grasslands', 'everglade', 'harbor', 'marigold']) expect(atlasSkinFor(p)).toBe(p)
    expect(atlasSkinFor('global')).toBe('global')
    expect(atlasSkinFor('cre')).toBe('cre')
    expect(atlasSkinFor('mckissock')).toBe('mckissock')
    expect(atlasSkinFor('elite')).toBe('elite')
    expect(atlasSkinFor('xcel')).toBe('xcel')
    // Unknown or absent → XCEL, the default again since 2026-10-06.
    for (const raw of [null, '', 'stc', 'CRE', 'fitzgerald']) expect(atlasSkinFor(raw)).toBe('xcel')
  })
})

describe('atlasFontFor', () => {
  it('lists the guide face plus six trial faces, and falls back to the default, Playfair 2', () => {
    expect(ATLAS_FONTS).toHaveLength(7)
    expect(ATLAS_FONTS[0].font).toBe('dm-serif-display')
    expect(atlasFontFor('outfit')).toBe('outfit')
    for (const raw of [null, '', 'comic-sans', 'gloock', 'yeseva-one', 'albert-sans']) expect(atlasFontFor(raw)).toBe('playfair-2')
  })
  // Each trial face loads ONE weight — the trial's — which is what makes it
  // render at that weight whatever weight a heading asks for.
  it('loads the guide face from index.html and each trial face on demand', () => {
    expect(atlasFontHref('dm-serif-display')).toBeNull()
    expect(atlasFontHref('playfair-2')).toBe('https://fonts.googleapis.com/css2?family=Playfair:wght@300..900&display=swap')
  })
})

describe('the four palette themes', () => {
  /* 2026-10-08, the direct ask: "add 4 additional brand themes using the colors
     from these screenshots."

     ⚠ THE RAMPS ARE NOT TESTED HERE — they are CSS, and jsdom resolves no
     stylesheet, so an assertion about a hex would be asserting nothing. What is
     testable is the SHAPE: that every palette is reachable, and that none of
     them claims a logo it does not have. Both were verified in the browser:
     each drives `--color-compass-page-button` and the nav fill. */
  const PALETTES = ['grasslands', 'everglade', 'harbor', 'marigold'] as const

  it('each one resolves and carries a label of its own', () => {
    for (const p of PALETTES) {
      const entry = ATLAS_SKINS.find((s) => s.skin === p)
      expect(entry, `${p} is not in ATLAS_SKINS`).toBeTruthy()
      expect(entry!.label).not.toBe('')
      expect(atlasSkinFor(p)).toBe(p)
    }
  })

  it('⚠ a near-miss still falls back rather than rendering an unstyled page', () => {
    /* `data-atlas-brand` with a value tokens.css has no block for leaves every
       ramp at the platform default — a page that looks almost right and is not
       the theme anyone asked for. `atlasSkinFor` validating against the list is
       what stops a hand-edited link doing that. */
    // …to XCEL, the default again since 2026-10-06 (Eric; merged 2026-10-14).
    for (const raw of ['Grasslands', 'marigold ', 'harbour', 'everglades']) {
      expect(atlasSkinFor(raw)).toBe('xcel')
    }
  })
})
