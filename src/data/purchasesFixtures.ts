import type { Brand } from '@/context/AccountContext'
import type { PostalAddress } from './accountProfileFixtures'

/**
 * Purchase history for the account area's My Purchases section.
 *
 * ⚠ PRICES ARE THE CATALOG'S, NOT NEW NUMBERS. Every `amount` below is lifted
 * from `PACKAGES` / `PRODUCTS` in `src/data/catalog/xcel.ts` (Life & Health
 * Premier 279, Prep Review 59, Flashcards 29, P&C Standard 169, Exam Cram 39).
 * Two files quoting different prices for one product is the defect this note
 * exists to prevent — change the catalog, then change these to match.
 *
 * THE BILLED-TO ADDRESS IS NOT HERE, deliberately. It comes from
 * `profileFor(brand, isMember).personal` at render time, so editing the billing
 * address on the Profile page moves the receipts too. A second copy here would
 * drift the moment someone used the edit panel.
 */

/** What kind of order this was. Drives the pill on the card. */
export type PurchaseKind = 'purchase' | 'refund'

export type PurchaseLineItem = {
  label: string
  /**
   * Money in dollars, or `'included'` for a line the package covers at no extra
   * charge (the certificate/bundled-component case — it renders as "Included"
   * rather than "$0.00", which reads as a failed charge).
   */
  amount: number | 'included'
}

export type PurchaseRecord = {
  id: string
  /** Order date, ISO `YYYY-MM-DD`. Drives the month grouping and the sort. */
  orderDate: string
  orderNumber: string
  kind: PurchaseKind
  lineItems: PurchaseLineItem[]
  /** Sum of the priced line items, before tax and discount. */
  subtotal: number
  tax: number
  /** Positive number; rendered parenthesised and negative. 0 ⇒ row hidden. */
  discount: number
  total: number
}

/**
 * The seller block on every receipt.
 *
 * ⚠ THE ADDRESS IS INVENTED. XCEL Solutions is a real company and this is not
 * its real registered address — it is a placeholder shaped like one so the
 * receipt layout has something to lay out. Do NOT quote it anywhere, and
 * replace it before this is shown to anyone outside the team.
 * TODO(data): confirm the real remit-to address.
 */
export const SOLD_BY_INVENTED = {
  name: 'XCEL Solutions, LLC',
  line1: '3410 Corporate Center Drive',
  cityState: 'Charlotte, NC',
  postal: '28216',
} satisfies { name: string } & PostalAddress

/**
 * Alicia's orders, newest first.
 *
 * FOUR ORDERS ACROSS THREE MONTHS, and the spread is the point rather than the
 * volume: the section groups by month and collapses every group but the newest,
 * so one order per month would never exercise the "(2)" count and a single
 * month would never exercise the collapse at all. Her account opens in February
 * 2026 (`memberSinceMonthYear` on the XCEL `DemoUser`), so nothing predates it.
 *
 * Each order also carries a different receipt SHAPE, so the layout gets tested
 * rather than repeated:
 *   - the newest has a discount row and bundled "Included" lines,
 *   - one is a plain single-line purchase with tax,
 *   - one has several priced lines,
 *   - one is a refund, which is the only negative total.
 */
const XCEL_PURCHASES: PurchaseRecord[] = [
  {
    id: 'xcel-ord-1042',
    orderDate: '2026-09-14',
    orderNumber: 'XCL-2026-1042',
    kind: 'purchase',
    // Expanding into a second line of authority — Standard, not Premier, so
    // the two packages on this account differ and the receipt is not a copy.
    lineItems: [
      { label: 'Property & Casualty Standard Package', amount: 169 },
      { label: 'Property & Casualty Pre-License Course — FL', amount: 'included' },
      { label: 'Prep Review Course', amount: 'included' },
    ],
    subtotal: 169,
    tax: 0,
    discount: 25,
    total: 144,
  },
  {
    id: 'xcel-ord-0913',
    orderDate: '2026-04-02',
    orderNumber: 'XCL-2026-0913',
    kind: 'purchase',
    lineItems: [
      { label: 'Exam Cram', amount: 39 },
      { label: '800+ Flashcards', amount: 29 },
    ],
    subtotal: 68,
    tax: 4.76,
    discount: 0,
    total: 72.76,
  },
  {
    id: 'xcel-ord-0688',
    orderDate: '2026-02-19',
    orderNumber: 'XCL-2026-0688',
    kind: 'refund',
    // A refund keeps the shape of the order it reverses; the pill and the sign
    // are what differ. Refunding the Livestream she could not attend.
    lineItems: [{ label: 'Livestream Exam Review — Life & Health', amount: -89 }],
    subtotal: -89,
    tax: 0,
    discount: 0,
    total: -89,
  },
  {
    id: 'xcel-ord-0671',
    orderDate: '2026-02-11',
    orderNumber: 'XCL-2026-0671',
    kind: 'purchase',
    // The founding purchase — the package the whole Study Journey runs on.
    lineItems: [
      { label: 'Life & Health Premier Package', amount: 279 },
      { label: 'Life & Health Pre-License Course — FL', amount: 'included' },
      { label: 'Prep Review Course', amount: 'included' },
      { label: 'Exam Simulators (3)', amount: 'included' },
      { label: 'Livestream Exam Review — Life & Health', amount: 89 },
    ],
    subtotal: 368,
    tax: 25.76,
    discount: 0,
    total: 393.76,
  },
]

const BY_BRAND: Partial<Record<Brand, PurchaseRecord[]>> = {
  xcel: XCEL_PURCHASES,
}

/** Orders for a brand, newest first. `[]` ⇒ the section shows its empty state. */
export function purchasesFor(brand: Brand): PurchaseRecord[] {
  return [...(BY_BRAND[brand] ?? [])].sort((a, b) => b.orderDate.localeCompare(a.orderDate))
}

export type PurchaseMonthGroup = {
  /** `YYYY-MM`, for keys and sorting. */
  key: string
  /** "September, 2026" — the heading. */
  label: string
  records: PurchaseRecord[]
}

/**
 * Group orders into months, newest month first.
 *
 * ⚠ PARSED AS A LOCAL DATE, NOT VIA `new Date(iso)`. `new Date('2026-02-11')`
 * is parsed as UTC MIDNIGHT and then rendered in the viewer's zone, so anyone
 * west of Greenwich sees 10 February — an order can land in the previous month,
 * and the group it sits under would silently disagree with the date printed on
 * the card. Splitting the string keeps both on the date as authored.
 */
export function groupPurchasesByMonth(records: PurchaseRecord[]): PurchaseMonthGroup[] {
  const groups = new Map<string, PurchaseRecord[]>()
  for (const r of records) {
    const key = r.orderDate.slice(0, 7)
    const list = groups.get(key)
    if (list) list.push(r)
    else groups.set(key, [r])
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, list]) => ({ key, label: monthLabel(key), records: list }))
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function monthLabel(key: string): string {
  const [year, month] = key.split('-')
  return `${MONTH_NAMES[Number(month) - 1]}, ${year}`
}

/** `2026-02-11` → `02-11-26`, the compact form the receipt card prints. */
export function formatOrderDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${month}-${day}-${year.slice(2)}`
}

/** `393.76` → `$393.76`; negatives as `-$89.00`, which is how a refund reads. */
export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}
