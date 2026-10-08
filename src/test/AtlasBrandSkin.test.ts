import { describe, expect, it } from 'vitest'
import { ATLAS_SKINS, atlasSkinFor } from '@/components/layout/atlasBrandSkin'
import { ATLAS_FONTS, atlasFontFor, atlasFontHref } from '@/components/layout/atlasFontSets'

describe('atlasSkinFor', () => {
  it('reads the five brand skins and four palettes, and falls back for anything else', () => {
    /* ⚠ FIVE BRANDS THEN FOUR PALETTES, in that order — 2026-10-08. The brands
       swap the logo as well as the colours; the palettes are colours only and
       have no lockup, which is why `SKIN_LOGOS` is keyed by `AtlasBrandSkin`
       rather than by this whole list. A palette appearing in that map, or a
       brand missing from it, is a compile error by design. */
    expect(ATLAS_SKINS.map((s) => s.skin)).toEqual([
      'global',
      'xcel',
      'cre',
      'mckissock',
      'elite',
      'grasslands',
      'everglade',
      'harbor',
      'marigold',
    ])
    for (const p of ['grasslands', 'everglade', 'harbor', 'marigold']) expect(atlasSkinFor(p)).toBe(p)
    expect(atlasSkinFor('global')).toBe('global')
    expect(atlasSkinFor('cre')).toBe('cre')
    expect(atlasSkinFor('mckissock')).toBe('mckissock')
    expect(atlasSkinFor('elite')).toBe('elite')
    expect(atlasSkinFor('xcel')).toBe('xcel')
    // Unknown or absent → Global, the default since 2026-10-01.
    for (const raw of [null, '', 'stc', 'CRE', 'fitzgerald']) expect(atlasSkinFor(raw)).toBe('global')
  })
})

describe('atlasFontFor', () => {
  it('lists the guide face plus six trial faces, and falls back to the guide face', () => {
    expect(ATLAS_FONTS).toHaveLength(7)
    expect(ATLAS_FONTS[0].font).toBe('dm-serif-display')
    expect(atlasFontFor('outfit')).toBe('outfit')
    for (const raw of [null, '', 'comic-sans', 'gloock', 'yeseva-one', 'albert-sans']) expect(atlasFontFor(raw)).toBe('dm-serif-display')
  })
  // Each trial face loads ONE weight — the trial's — which is what makes it
  // render at that weight whatever weight a heading asks for.
  it('loads the guide face from index.html and each trial face on demand', () => {
    expect(atlasFontHref('dm-serif-display')).toBeNull()
    expect(atlasFontHref('playfair-2')).toBe('https://fonts.googleapis.com/css2?family=Playfair:wght@700&display=swap')
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
    for (const raw of ['Grasslands', 'marigold ', 'harbour', 'everglades']) {
      expect(atlasSkinFor(raw)).toBe('global')
    }
  })
})
