import { describe, expect, it } from 'vitest'
import { ATLAS_SKINS, atlasSkinFor } from '@/components/layout/atlasBrandSkin'
import { ATLAS_FONTS, atlasFontFor, atlasFontHref } from '@/components/layout/atlasFontSets'

describe('atlasSkinFor', () => {
  it('reads the five skins and falls back to XCEL for anything else', () => {
    expect(ATLAS_SKINS.map((s) => s.skin)).toEqual(['global', 'xcel', 'cre', 'mckissock', 'elite'])
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
