/**
 * Per-section hero copy for the Dashboard Rebrand shell's section heroes
 * (`PlatformShell` → `MembershipSectionHero`). Keyed by `PlatformSection` ids;
 * each `title` MUST equal the rail label (`SECTION_TITLES` in PlatformShell)
 * so the hero heading never disagrees with the rail. Copy is a prototype
 * draft — refine with content/design.
 *
 * Two groups:
 *   - `SECTION_HERO_META` — the Explore-group sections that carry the gradient/
 *     plain brand band (white-or-black text via the hero-style flag): the five
 *     Membership sections + **Course Catalog** (Catalog sits in the Explore rail
 *     group, so it inherits the darker Explore hero rather than the light one).
 *   - `LIGHT_HERO_SECTION_META` — the two My Learning sections that carry the
 *     LIGHT brand-tint band (black text): Courses, Certificates.
 */

import type { Brand } from '@/context/AccountContext'

export type SectionHeroMeta = {
  /** Band heading — must match the rail label for this section. */
  title: string
  /** 2–3 line explanation of what the membership feature is. */
  description: string
  /** Search field placeholder + aria-label (prototype stub). */
  searchPlaceholder: string
}

/** The Explore-group sections that carry the brand (gradient/plain) hero — the
 *  five Membership sections plus Course Catalog (also an Explore-group item). */
export type BrandHeroSection =
  | 'm-whats-new'
  | 'm-learning-library'
  | 'm-exam-prep'
  | 'm-career-tools'
  | 'm-more'
  | 'catalog'
  | 'recommended'
  | 'podcasts'
  | 'support'

export const SECTION_HERO_META: Record<BrandHeroSection, SectionHeroMeta> = {
  'm-whats-new': {
    title: "What's New",
    description:
      "Everything your Elite Passport Lite unlocks, in one place. New courses, podcasts, exam prep, and AI career tools are added between renewals — start here to see what's new.",
    searchPlaceholder: 'Search membership benefits',
  },
  'm-learning-library': {
    title: 'Resource Library',
    description:
      'Browse the full CE library included with your membership — courses, video skills, and CE podcasts across your specialties, all counting toward license renewal.',
    searchPlaceholder: 'Search the library',
  },
  'm-exam-prep': {
    title: 'Exam & Cert Prep',
    description:
      'Certification and licensure exam prep included with your Passport — practice questions, review content, and readiness tracking to help you pass the first time.',
    searchPlaceholder: 'Search exam prep',
  },
  'm-career-tools': {
    title: 'Rubi AI Tools',
    description:
      'Advance your career with Rubi AI — interview simulators, a resume builder, and personalized career-path guidance, all included with membership.',
    searchPlaceholder: 'Search career tools',
  },
  'm-more': {
    title: 'Partner Offers',
    description:
      'Exclusive partner savings and extra perks that stretch your membership further — curated deals from trusted vendors to enhance your practice.',
    searchPlaceholder: 'Search partner offers',
  },
  catalog: {
    title: 'Browse Catalog',
    description:
      'Browse the full catalog of products available to you — filter by category, specialty, and credit type.',
    searchPlaceholder: 'Search the catalog',
  },
  recommended: {
    title: 'Recommended for You',
    description:
      'Personalized course, podcast, exam-prep, and career-tool picks based on your specialty, license, and recent activity.',
    searchPlaceholder: 'Search recommendations',
  },
  podcasts: {
    title: 'Podcasts',
    description:
      'Earn CE on the go — bite-size audio episodes included with your membership, with new episodes added between renewals.',
    searchPlaceholder: 'Search podcasts',
  },
  support: {
    // Rail label reads "Get Help"; the section hero + page title read
    // "Help & Support" (per the Elite screens).
    title: 'Help & Support',
    description:
      'Get help with your courses, answers to common questions, and ways to reach our support team.',
    searchPlaceholder: 'Search help',
  },
}

/** The two My Learning sections that carry the light brand-tint hero band
 *  (black text + horizontal title/search), matching the Resource Library
 *  layout without the dark gradient. */
export type LightHeroSection = 'courses' | 'certificates'

/**
 * Per-brand hero-copy overrides.
 *
 * `SECTION_HERO_META` above is written for a brand that SELLS A MEMBERSHIP —
 * most of its copy says so ("included with your Passport", "included with your
 * membership"). XCEL sells transactional course packages and has no membership
 * at all (`supportsMembership`), so on the sections it keeps that copy claims
 * something untrue about the product the reviewer is looking at.
 *
 * Only the sections a brand actually reaches need an entry. XCEL's rail drops
 * Membership and Partner Offers, so those are absent here rather than reworded.
 *
 * This is an override map rather than a brand-keyed rewrite of the whole table
 * because ONE brand differs on THREE strings — re-keying nine sections × six
 * brands would be ~50 entries, 47 of them copies.
 */
const SECTION_HERO_OVERRIDES: Partial<
  Record<Brand, Partial<Record<BrandHeroSection, SectionHeroMeta>>>
> = {
  xcel: {
    'm-exam-prep': {
      title: 'Exam & Cert Prep',
      description:
        'The 3-Part Training Program — pre-license education that meets your state requirement, a prep review course, then three exam simulators weighted to your state exam.',
      searchPlaceholder: 'Search exam prep',
    },
    'm-career-tools': {
      // Title matches XCEL's rail label (`careerToolsLabelFor`). As of
      // 2026-09-10 that is "Rubi AI Tools", the same string the DEFAULT above
      // uses — so this entry now overrides only the description, which is still
      // XCEL-specific (Rubi is an exam study aid here, not Elite's career
      // coach). The title is kept rather than dropped so the rule "the hero
      // heading equals the rail label" stays visible at this call site.
      title: 'Rubi AI Tools',
      description:
        'Study with Rubi™ — instant step-by-step explanations, practice questions generated on demand, and answers in your language, all built on XCEL’s own curriculum.',
      searchPlaceholder: 'Ask Rubi',
    },
    'm-learning-library': {
      title: 'Resource Library',
      description:
        'Review notes, state requirement charts, and the full flashcard deck — the reference side of the 3-Part Training Program, for every line of authority we license.',
      searchPlaceholder: 'Search the library',
    },
    podcasts: {
      title: 'Podcasts',
      // XCEL has no podcast product; the section is a placeholder. Say that
      // rather than inheriting "earn CE on the go … included with your
      // membership", which is wrong twice over.
      description: 'Audio content is not part of the XCEL catalog today.',
      searchPlaceholder: 'Search podcasts',
    },
  },
}

/** Hero copy for a section, honouring any per-brand override. */
export function sectionHeroMetaFor(
  brand: Brand,
  section: BrandHeroSection,
): SectionHeroMeta {
  return SECTION_HERO_OVERRIDES[brand]?.[section] ?? SECTION_HERO_META[section]
}

export const LIGHT_HERO_SECTION_META: Record<LightHeroSection, SectionHeroMeta> = {
  courses: {
    title: 'My Courses',
    description:
      'Pick up where you left off and track every course you’ve started — all your in-progress and completed CE in one place.',
    searchPlaceholder: 'Search your courses',
  },
  certificates: {
    title: 'Certificates',
    description:
      'Download and share the completion certificates you’ve earned — proof of the CE credit you’ve banked toward license renewal.',
    searchPlaceholder: 'Search your certificates',
  },
}
