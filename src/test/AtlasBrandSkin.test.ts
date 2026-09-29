import { describe, expect, it } from 'vitest'
import { ATLAS_SKINS, atlasSkinFor } from '@/components/layout/atlasBrandSkin'

describe('atlasSkinFor', () => {
  it('reads the four skins and falls back to XCEL for anything else', () => {
    expect(ATLAS_SKINS.map((s) => s.skin)).toEqual(['xcel', 'cre', 'mckissock', 'elite'])
    expect(atlasSkinFor('cre')).toBe('cre')
    expect(atlasSkinFor('mckissock')).toBe('mckissock')
    expect(atlasSkinFor('elite')).toBe('elite')
    for (const raw of [null, '', 'stc', 'CRE', 'fitzgerald']) expect(atlasSkinFor(raw)).toBe('xcel')
  })
})
