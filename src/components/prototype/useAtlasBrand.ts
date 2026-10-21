import { useContext } from 'react'
import { AccountContext } from '@/context/AccountContext'

/**
 * The demo brand, without requiring an `AccountProvider`.
 *
 * ⚠ `useAccount` THROWS outside a provider, and these previews are no longer
 * confined to the handoff page — the landing page's project rows draw them too,
 * and some suites mount that page without one. The brand is a single value used
 * to match a CSS attribute selector; a thrown error is a wildly
 * disproportionate failure for not knowing it. `Brand` is a one-member union,
 * so the fallback cannot drift from the real value without a compile error.
 */
export function useAtlasBrand(): { brand: string } {
  return { brand: useContext(AccountContext)?.brand ?? 'xcel' }
}
