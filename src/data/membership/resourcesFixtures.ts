import type { Brand } from '@/context/AccountContext'

/**
 * Free Content — the openly available reference material surfaced under the
 * Dashboard Rebrand shell's "Free Content" rail section (the Explore group).
 * Each item is a simple outbound link (blog, podcast, …) rendered as a card
 * that matches the Partner Offers grid.
 *
 * EVERYTHING on this page is free to members AND non-members — that is the
 * page's whole premise, and it is why nothing here carries a gate. There is no
 * `locked` treatment, no "Member Exclusive" pill, and no "Included with your
 * membership" hero eyebrow (see `MEMBERSHIP_EYEBROW_SECTIONS` in PlatformShell,
 * which deliberately excludes this section alongside Course Catalog and
 * Recommended for You). If a resource is ever member-only it does NOT belong on
 * this page — the Membership page's community band is the pattern for that; see
 * `communityFixtures.ts`.
 *
 * Shared across brands for now (the two McKissock resources the design calls
 * for), except Fitzgerald, which has its own NP set. TODO(data): swap for a
 * per-brand `/api/resources?brand=…` feed once the content team publishes real
 * per-brand resource sets.
 */

/**
 * Max length for a resource card description. The card clamps to 4 lines
 * visually (~135 chars at the 265px card width); this keeps authored copy
 * within that budget, and `ResourceCard` hard-truncates anything longer so an
 * over-length blurb can't blow past the clamp. Keep descriptions at or under
 * this — shorten the copy, don't rely on truncation.
 */
export const MAX_RESOURCE_DESCRIPTION_CHARS = 135

/** Icon plate glyph for a resource card. */
export type ResourceIcon = 'blog' | 'podcast' | 'facebook'

export type Resource = {
  id: string
  /** Card title. */
  title: string
  /** 1-2 sentence blurb. Clamps to 3 lines in the card. */
  description: string
  /** Icon rendered in the card's top plate. */
  icon: ResourceIcon
  /** Outbound URL — opens in a new tab. */
  href: string
  /** CTA label (e.g. "Read the blog"). */
  cta: string
  /** Copy for the dashboard promo band (`FreeContentBands`) instead of
   *  `description`. Falls back to `description` when unset.
   *
   *  It exists because the two surfaces need different things said. On the Free
   *  Content page the hero already announces "Free for everyone — no membership
   *  required", so a card repeating it per item is noise. The dashboard band has
   *  no such framing and sits directly under the PAID membership upsell band, so
   *  a learner scanning that column has no way to tell the two apart unless the
   *  band says so itself.
   *
   *  Convention: lead with the free claim, in the CTA's own verb ("Free to
   *  read" / "Free to listen"), then the description. Keep it inside
   *  `MAX_RESOURCE_DESCRIPTION_CHARS` — the band doesn't clamp, but a long
   *  second line unbalances a row of them. */
  promoDescription?: string
}

const RESOURCES: Resource[] = [
  {
    id: 'mckissock-blog',
    title: 'Blog',
    description:
      'Industry news, market trends, and practical career tips from the McKissock Learning blog.',
    promoDescription:
      'Free to read — no membership needed. Industry news, market trends, and practical career tips.',
    icon: 'blog',
    href: 'https://www.mckissock.com/blog',
    cta: 'Read the blog',
  },
  {
    id: 'mckissock-appraisal-podcast',
    title: 'Appraisal Podcast',
    description:
      'Conversations with appraisal experts on standards, market shifts, and growing your practice.',
    promoDescription:
      'Free to listen — no membership needed. Appraisal experts on standards, market shifts, and your practice.',
    icon: 'podcast',
    href: 'https://www.mckissock.com/appraisal/podcast/',
    cta: 'Listen now',
  },
]

// Fitzgerald (FHEA) — NP audience: the Resource Center + the two free
// certification Q&A podcasts (FNP / PMHNP). Titles match the "Resources"
// nav labels so the two stay in sync.
const FITZGERALD_RESOURCES: Resource[] = [
  {
    id: 'fhea-resource-center',
    title: 'Resource Center',
    description:
      'Clinical and professional articles written by NP experts to help you succeed in practice.',
    promoDescription:
      'Free to read — no membership needed. Clinical and professional articles written by NP experts.',
    icon: 'blog',
    href: 'https://www.fhea.com/resource-center/',
    cta: 'Read articles',
  },
  {
    id: 'fhea-fnp-podcast',
    title: 'FNP Q&A Podcasts',
    description:
      'NP Certification Q&A — Fitzgerald faculty break down exam questions to help family NP students pass their certification.',
    promoDescription:
      'Free to listen — no membership needed. Faculty break down exam questions for family NP certification.',
    icon: 'podcast',
    href: 'https://www.fhea.com/free-np-podcast/',
    cta: 'Listen now',
  },
  {
    id: 'fhea-pmhnp-podcast',
    title: 'PMHNP Q&A Podcasts',
    description:
      'PMHNP Certification Q&A — expert faculty dissect test questions for Psychiatric-Mental Health NP students.',
    promoDescription:
      'Free to listen — no membership needed. Faculty dissect test questions for PMHNP certification.',
    icon: 'podcast',
    href: 'https://www.fhea.com/free-pmhnp-podcast/',
    cta: 'Listen now',
  },
]

/**
 * XCEL Solutions (insurance licensing) — four genuinely free, outbound
 * destinations. All reading material: XCEL has NO podcast product, so nothing
 * here uses the `podcast` glyph.
 *
 * Nothing membership-gated belongs in this list. XCEL has no membership at all,
 * so the rule is trivially satisfied here — but it is the same rule that broke
 * the old External Resources page when one gated item sat beside two open ones.
 *
 * TODO(data): the four hrefs are the site's own sections but the exact slugs are
 * unconfirmed (same footing as the other brands' `faqUrl`s). Confirm with the
 * content team before this ships anywhere a reviewer might click through.
 */
const XCEL_RESOURCES: Resource[] = [
  {
    id: 'xcel-resource-center',
    title: 'Resource Center',
    description:
      'Study guides, state licensing requirements, and exam-day walkthroughs for every line of authority XCEL covers.',
    promoDescription:
      'Free to read — no purchase needed. Study guides, state requirements, and exam-day walkthroughs.',
    icon: 'blog',
    href: 'https://www.xcelsolutions.com/resource-center/',
    cta: 'Browse resources',
  },
  {
    id: 'xcel-whats-new',
    title: "What's New",
    description:
      'Product releases, state rule changes, and exam updates as they happen — so nothing on your test is a surprise.',
    promoDescription:
      'Free to read — no purchase needed. Product releases, state rule changes, and exam updates.',
    icon: 'blog',
    href: 'https://www.xcelsolutions.com/whats-new/',
    cta: 'Read the blog',
  },
  {
    id: 'xcel-career-guide',
    title: '2026 Insurance Career Guide',
    description:
      'What the job actually looks like once you are licensed: the roles, the routes into them, and what each one asks of you.',
    promoDescription:
      'Free to read — no purchase needed. The roles a licence opens up, and the routes into them.',
    icon: 'blog',
    href: 'https://www.xcelsolutions.com/career-guide/',
    cta: 'Read the guide',
  },
  {
    id: 'xcel-salary-guide',
    title: '2026 Insurance Salary Guide',
    description:
      'What insurance professionals earn by role, line of authority, and region — the numbers behind the career decision.',
    promoDescription:
      'Free to read — no purchase needed. What insurance professionals earn by role, line, and region.',
    icon: 'blog',
    href: 'https://www.xcelsolutions.com/salary-guide/',
    cta: 'See the numbers',
  },
]

// Every brand surfaces the same base resource set today except Fitzgerald,
// which has its own NP set. Kept brand-keyed so a per-brand feed can replace it
// without touching consumers. (McKissock's Facebook Appraisal Community used to
// append here; it is membership-only, so it moved to the Membership page —
// see `communityFixtures.ts`.)
const RESOURCES_BY_BRAND: Record<Brand, Resource[]> = {
  cre: RESOURCES,
  mckissock: RESOURCES,
  elite: RESOURCES,
  fitzgerald: FITZGERALD_RESOURCES,
  stc: RESOURCES,
  xcel: XCEL_RESOURCES,
}

export function resourcesFor(brand: Brand): Resource[] {
  return RESOURCES_BY_BRAND[brand]
}

/** Brand-keyed hero copy for the Free Content section. Every brand keeps the
 *  generic default except Fitzgerald, whose copy is re-themed for the NP
 *  audience (Resource Center + certification podcasts). The hero band is the
 *  only place this copy renders — the panel no longer shows an intro line.
 *
 *  Copy rule: say plainly that it is free and needs no membership. The page's
 *  whole job is to be the one surface a non-member can use, so hedging that
 *  ("explore our resources") wastes the only sentence that does real work. */
export type ResourcesCopy = {
  /** Section-hero subtitle (the band under the title). */
  heroDescription: string
}

const DEFAULT_RESOURCES_COPY: ResourcesCopy = {
  heroDescription:
    'Free for everyone — no membership required. Our blog and podcast, updated with the latest industry news, market trends, and practical career guidance.',
}

const RESOURCES_COPY_BY_BRAND: Record<Brand, ResourcesCopy> = {
  cre: DEFAULT_RESOURCES_COPY,
  mckissock: DEFAULT_RESOURCES_COPY,
  elite: DEFAULT_RESOURCES_COPY,
  stc: DEFAULT_RESOURCES_COPY,
  fitzgerald: {
    heroDescription:
      'Free for everyone — no membership required. Our Resource Center and certification Q&A podcasts, written and hosted by NP faculty to support your practice and your exam prep.',
  },
  // XCEL has no membership, so "no membership required" would be answering a
  // question nobody asked. The claim that does work here is that these are free
  // and separate from anything you buy.
  xcel: {
    heroDescription:
      'Free for everyone — nothing to buy. Our Resource Center, product blog, and the 2026 Career and Salary Guides, covering every line of authority we license.',
  },
}

export function resourcesCopyFor(brand: Brand): ResourcesCopy {
  return RESOURCES_COPY_BY_BRAND[brand]
}
