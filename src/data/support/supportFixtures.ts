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
    // TODO(data): confirm XCEL FAQ URL and support phone number — neither is
    // in the brand file, so the URL follows the sibling brands' shape and the
    // phone line is deliberately omitted rather than invented.
    faqUrl: 'https://www.xcelsolutions.com/faqs/',
    issueTypes: DEFAULT_ISSUE_TYPES,
    chatTopics: DEFAULT_CHAT_TOPICS,
    phoneLines: [],
  },
}

export function supportConfigFor(brand: Brand): SupportConfig {
  return SUPPORT_BY_BRAND[brand]
}
