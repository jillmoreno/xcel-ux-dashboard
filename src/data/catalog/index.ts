import type { Brand } from '@/context/AccountContext'
import { creBundle } from './cre'
import { mckissockBundle } from './mckissock'
import { eliteBundle } from './elite'
import { fitzgeraldBundle } from './fitzgerald'
import { stcBundle } from './stc'
import { xcelBundle } from './xcel'
import type { CatalogBundle } from './types'

export * from './types'
export { creBundle, mckissockBundle, eliteBundle, fitzgeraldBundle, stcBundle, xcelBundle }

const BUNDLES: Record<Brand, CatalogBundle> = {
  cre: creBundle,
  mckissock: mckissockBundle,
  elite: eliteBundle,
  fitzgerald: fitzgeraldBundle,
  stc: stcBundle,
  xcel: xcelBundle,
}

export function getCatalogFixtures(brand: Brand): CatalogBundle {
  return BUNDLES[brand]
}
