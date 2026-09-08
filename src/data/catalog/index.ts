import type { Brand } from '@/context/AccountContext'
import { xcelBundle } from './xcel'
import type { CatalogBundle } from './types'

export * from './types'
export { xcelBundle }

const BUNDLES: Record<Brand, CatalogBundle> = {
  xcel: xcelBundle,
}

export function getCatalogFixtures(brand: Brand): CatalogBundle {
  return BUNDLES[brand]
}
