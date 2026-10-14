import type { Brand } from '@/context/AccountContext'

/**
 * Help & Support fixtures — per-brand data for the "Get Help" section rendered
 * in the Dashboard Rebrand shell (`?section=support`). Covers all four demo
 * brands. Copy + numbers are prototype placeholders sourced from the Elite
 * screens; swap the non-Elite values with the real per-brand support details.
 *
 * TODO(data): confirm phone numbers, chat topics, issue types, and FAQ URLs
 * with each brand's support team before production.
 */

/** A "Give Us a Call" phone line — a label + the number to dial. */
export type SupportPhoneLine = {
  label: string
  number: string
}

/** Everything the Help & Support surface needs for one brand. */
export type SupportConfig = {
  /** Title shown in the Live Chat widget header (e.g. "Elite Chat"). */
  chatName: string
  /** External FAQ page — "Open FAQs" opens this in a new tab. */
  faqUrl: string
  /** External Contact page — "Contact Us" opens this in a new tab.
   *
   *  ⚠ IT REPLACED A SHEET, 2026-10-07 (the direct ask). The card used to open
   *  `ContactUsSheet`, which lists `phoneLines` — and XCEL's is EMPTY, with a
   *  TODO below saying the number is unknown and deliberately not invented. So
   *  the only brand in the union was opening a slide-over with nothing in it.
   *  The site's own contact page has the real routes. */
  contactUrl: string
  /** Customer Support form — the "What kind of issue…" dropdown options. */
  issueTypes: string[]
  /** Live Chat — the "What would you like to chat about?" radio options. */
  chatTopics: string[]
  /** Contact Us — the "Give Us a Call" phone lines. */
  phoneLines: SupportPhoneLine[]
}

/** Shared issue types + chat topics — the same taxonomy the Elite screens use;
 *  reused across brands until each brand supplies its own. */
const DEFAULT_ISSUE_TYPES = [
  'Certificates / State Reporting',
  'Technical issue or website help',
  'Refunds and course swaps',
  'Question about a course',
  'Billing or payment',
  'All other questions',
]

const DEFAULT_CHAT_TOPICS = [
  'Certificates/State Reporting',
  'Technical Issues and website help',
  'Refunds and course swaps',
  'Questions about a class',
  'All other questions',
]

const SUPPORT_BY_BRAND: Record<Brand, SupportConfig> = {
  xcel: {
    chatName: 'XCEL Chat',
    // CONFIRMED 2026-09-09. The guessed `/faqs/` (the sibling brands' shape)
    // 404s: XCEL has NO standalone FAQ page. `/faq` exists only as a redirect
    // to Customer Support, so this points at the destination directly rather
    // than depending on a redirect the site is free to drop.
    //
    // ⚠ THIS NOTE SAID "the FAQ card and Contact Us now lead to the same
    // page" — true while Contact Us opened a sheet of phone numbers and the
    // closest public page was Customer Support. Contact Us has its own URL as
    // of 2026-10-07 (`contactUrl`), so the two cards are two destinations
    // again and the redundancy the note warned about is gone.
    //
    // TODO(data): the support phone number is still unknown — it is not in the
    // brand file, and the line is deliberately omitted rather than invented.
    faqUrl: 'https://www.xcelsolutions.com/customer-support',
    // SUPPLIED 2026-10-07, the direct ask — not guessed from the sibling
    // brands' URL shape the way the FAQ path was before it was checked.
    contactUrl: 'https://www.xcelsolutions.com/contact-us',
    issueTypes: DEFAULT_ISSUE_TYPES,
    chatTopics: DEFAULT_CHAT_TOPICS,
    phoneLines: [],
  },
}

export function supportConfigFor(brand: Brand): SupportConfig {
  return SUPPORT_BY_BRAND[brand]
}
