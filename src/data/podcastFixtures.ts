// TODO(data): replace with real Recommended Podcasts API integration.
//
// Seed records for the My Podcasts > Browse Podcasts tab. All records use
// `delivery: 'podcast'`. No `status` / `progress` / `myStatus` — these are
// recommendations, not enrollments, so the compact card's status/progress
// slot defaults to Not Started / 0%. Visual treatment of "unenrolled
// recommendation" cards is a follow-up.

import type { ComponentType } from 'react'
import type { CourseCardData } from '@/components/courses/CourseCard'
import {
  Award,
  Briefcase,
  ChalkboardUser,
  CreditCard,
  Eye,
  FileText,
  Lock,
  Star,
  Users,
} from '@/icons'
import { imageForIndex } from '@/utils/courseImage'

type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean | 'true' | 'false'; style?: React.CSSProperties }>

export type PodcastChapter = {
  id: string
  number: number
  title: string
  durationMin: number
}

export type PodcastRecord = CourseCardData & {
  rating: number
  description?: string
  chapters: PodcastChapter[]
  topicId?: string
}

const CHAPTERS_BY_PODCAST: Record<string, PodcastChapter[]> = {
  'pc-modern-listing-agent': [
    { id: 'c1', number: 1, title: 'Setting up your listing process', durationMin: 14 },
    { id: 'c2', number: 2, title: 'Pricing strategy in a tight market', durationMin: 18 },
    { id: 'c3', number: 3, title: 'Marketing channels that still convert', durationMin: 16 },
    { id: 'c4', number: 4, title: 'Handling offers and counter-offers', durationMin: 12 },
  ],
  'pc-closing-conversations': [
    { id: 'c1', number: 1, title: 'Pre-closing checklists', durationMin: 22 },
    { id: 'c2', number: 2, title: 'Walking the buyer through closing', durationMin: 26 },
    { id: 'c3', number: 3, title: 'When closings go sideways', durationMin: 20 },
    { id: 'c4', number: 4, title: 'Post-close follow-up that earns referrals', durationMin: 18 },
    { id: 'c5', number: 5, title: 'Closing day documentation', durationMin: 14 },
  ],
  'pc-fair-housing-forward': [
    { id: 'c1', number: 1, title: 'The Fair Housing Act in plain language', durationMin: 20 },
    { id: 'c2', number: 2, title: 'Protected classes and recent rulings', durationMin: 24 },
    { id: 'c3', number: 3, title: 'Steering, redlining, and modern equivalents', durationMin: 22 },
    { id: 'c4', number: 4, title: 'Disparate impact in practice', durationMin: 18 },
    { id: 'c5', number: 5, title: 'Building a compliant brokerage', durationMin: 26 },
  ],
  'pc-buyer-psychology': [
    { id: 'c1', number: 1, title: 'How buyers make decisions under uncertainty', durationMin: 28 },
    { id: 'c2', number: 2, title: 'Loss aversion in real estate', durationMin: 24 },
    { id: 'c3', number: 3, title: 'Anchoring on list price', durationMin: 22 },
    { id: 'c4', number: 4, title: 'Coaching buyers through second thoughts', durationMin: 26 },
    { id: 'c5', number: 5, title: 'Closing the deal without pressure', durationMin: 20 },
  ],
  'pc-negotiation-stories': [
    { id: 'c1', number: 1, title: 'The seller who wouldn’t budge', durationMin: 18 },
    { id: 'c2', number: 2, title: 'Multiple-offer scenarios from the field', durationMin: 24 },
    { id: 'c3', number: 3, title: 'When inspection reports change everything', durationMin: 22 },
    { id: 'c4', number: 4, title: 'Negotiating across cultures', durationMin: 20 },
  ],
  'pc-tech-stack-top-producers': [
    { id: 'c1', number: 1, title: 'CRM hygiene for solo agents', durationMin: 14 },
    { id: 'c2', number: 2, title: 'Lead routing that actually works', durationMin: 16 },
    { id: 'c3', number: 3, title: 'AI tools worth the subscription', durationMin: 18 },
    { id: 'c4', number: 4, title: 'Building a referral loop in 30 days', durationMin: 12 },
  ],
  'pc-ethics-on-the-go': [
    { id: 'c1', number: 1, title: 'NAR Code of Ethics refresher', durationMin: 16 },
    { id: 'c2', number: 2, title: 'Disclosure obligations to all parties', durationMin: 14 },
    { id: 'c3', number: 3, title: 'Conflicts of interest in dual agency', durationMin: 18 },
    { id: 'c4', number: 4, title: 'Social media and professional conduct', durationMin: 12 },
  ],
  'pc-first-time-buyer-playbook': [
    { id: 'c1', number: 1, title: 'The pre-approval conversation', durationMin: 22 },
    { id: 'c2', number: 2, title: 'Touring with a first-time buyer', durationMin: 24 },
    { id: 'c3', number: 3, title: 'Explaining closing costs without scaring them off', durationMin: 18 },
    { id: 'c4', number: 4, title: 'After the keys: setting up referrals', durationMin: 16 },
  ],
  'pc-listing-photography': [
    { id: 'c1', number: 1, title: 'What makes a listing photo sell', durationMin: 14 },
    { id: 'c2', number: 2, title: 'Working with a photographer', durationMin: 12 },
    { id: 'c3', number: 3, title: 'Staging in a single afternoon', durationMin: 16 },
    { id: 'c4', number: 4, title: 'Video walkthroughs that aren’t boring', durationMin: 18 },
  ],
  'pc-market-cycles-decoded': [
    { id: 'c1', number: 1, title: 'Reading the macro signals', durationMin: 26 },
    { id: 'c2', number: 2, title: 'Local indicators that matter most', durationMin: 24 },
    { id: 'c3', number: 3, title: 'Positioning your business across cycles', durationMin: 28 },
    { id: 'c4', number: 4, title: 'When to lean in, when to wait', durationMin: 22 },
    { id: 'c5', number: 5, title: 'Talking to clients about uncertainty', durationMin: 20 },
  ],
}

const _PODCASTS_BASE: Omit<PodcastRecord, 'chapters'>[] = [
  {
    id: 'pc-modern-listing-agent',
    title: 'The Modern Listing Agent',
    hours: 1,
    state: 'GA',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.8,
    topicId: 'market-trends',
  },
  {
    id: 'pc-closing-conversations',
    title: 'Closing Conversations',
    hours: 2,
    state: 'FL',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.6,
    topicId: 'contracts',
  },
  {
    id: 'pc-fair-housing-forward',
    title: 'Fair Housing Forward',
    hours: 2,
    state: 'NC',
    delivery: 'podcast',
    badge: 'mandatory',
    rating: 4.9,
    topicId: 'fair-housing',
  },
  {
    id: 'pc-buyer-psychology',
    title: 'Buyer Psychology in a Shifting Market',
    hours: 3,
    state: 'TN',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.5,
    topicId: 'negotiation',
  },
  {
    id: 'pc-negotiation-stories',
    title: 'Negotiation Stories from the Field',
    hours: 2,
    state: 'VA',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.7,
    topicId: 'negotiation',
  },
  {
    id: 'pc-tech-stack-top-producers',
    title: 'Tech Stack for Top Producers',
    hours: 1,
    state: 'SC',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.4,
    topicId: 'market-trends',
  },
  {
    id: 'pc-ethics-on-the-go',
    title: 'Ethics on the Go',
    hours: 1,
    state: 'AL',
    delivery: 'podcast',
    badge: 'mandatory',
    rating: 4.8,
    topicId: 'ethics',
  },
  {
    id: 'pc-first-time-buyer-playbook',
    title: 'The First-Time Buyer Playbook',
    hours: 2,
    state: 'GA',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.3,
    topicId: 'agency',
  },
  {
    id: 'pc-listing-photography',
    title: 'Listing Photography That Sells',
    hours: 1,
    state: 'FL',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.6,
    topicId: 'market-trends',
  },
  {
    id: 'pc-market-cycles-decoded',
    title: 'Market Cycles Decoded',
    hours: 3,
    state: 'NC',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.5,
    topicId: 'market-trends',
  },
]

export const RECOMMENDED_PODCASTS: PodcastRecord[] = _PODCASTS_BASE.map((p, i) => ({
  ...p,
  imageUrl: imageForIndex(i),
  chapters: CHAPTERS_BY_PODCAST[p.id] ?? [],
}))

export type PodcastPlaylistStatus = 'in-progress' | 'not-started' | 'completed' | 'archived'

export type PodcastPlaylistRecord = PodcastRecord & {
  myStatus: PodcastPlaylistStatus
  /** ISO date (YYYY-MM-DD) the user saved this podcast to their playlist. */
  addedAt: string
  /** Optional credit expiration — shown in the Course Expiration column. */
  expiresAt?: string
}

const _PLAYLIST_BASE: Omit<PodcastPlaylistRecord, 'imageUrl' | 'chapters'>[] = [
  {
    id: 'pc-fair-housing-forward',
    title: 'Fair Housing Forward',
    hours: 2,
    state: 'NC',
    delivery: 'podcast',
    badge: 'mandatory',
    rating: 4.9,
    myStatus: 'in-progress',
    status: 'in-progress',
    progress: 60,
    addedAt: '2026-04-22',
    expiresAt: '2026-12-15',
  },
  {
    id: 'pc-ethics-on-the-go',
    title: 'Ethics on the Go',
    hours: 1,
    state: 'AL',
    delivery: 'podcast',
    badge: 'mandatory',
    rating: 4.8,
    myStatus: 'in-progress',
    status: 'in-progress',
    progress: 25,
    addedAt: '2026-05-02',
    expiresAt: '2027-02-10',
  },
  {
    id: 'pc-negotiation-stories',
    title: 'Negotiation Stories from the Field',
    hours: 2,
    state: 'VA',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.7,
    myStatus: 'not-started',
    addedAt: '2026-05-05',
    expiresAt: '2027-05-05',
  },
  {
    id: 'pc-tech-stack-top-producers',
    title: 'Tech Stack for Top Producers',
    hours: 1,
    state: 'SC',
    delivery: 'podcast',
    badge: 'elective',
    rating: 4.4,
    myStatus: 'completed',
    status: 'completed',
    progress: 100,
    addedAt: '2026-03-12',
  },
]

export const MY_PODCAST_PLAYLIST: PodcastPlaylistRecord[] = _PLAYLIST_BASE.map((p, i) => ({
  ...p,
  imageUrl: imageForIndex(i),
  chapters: CHAPTERS_BY_PODCAST[p.id] ?? [],
}))

export type PodcastTopic = {
  id: string
  title: string
  episodes: number
  hours: number
  /** Two CSS variables forming the diagonal gradient (start → end). */
  gradient: [string, string]
  icon: IconComponent
}

export const BROWSE_TOPICS: PodcastTopic[] = [
  {
    id: 'ethics',
    title: 'Ethics & Conduct',
    episodes: 143,
    hours: 89,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Award,
  },
  {
    id: 'fair-housing',
    title: 'Fair Housing',
    episodes: 62,
    hours: 41,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Users,
  },
  {
    id: 'contracts',
    title: 'Contracts & Forms',
    episodes: 118,
    hours: 72,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: FileText,
  },
  {
    id: 'agency',
    title: 'Agency & Fiduciary',
    episodes: 54,
    hours: 33,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Briefcase,
  },
  {
    id: 'finance',
    title: 'Finance & Lending',
    episodes: 81,
    hours: 49,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: CreditCard,
  },
  {
    id: 'disclosure',
    title: 'Disclosure',
    episodes: 47,
    hours: 28,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Eye,
  },
  {
    id: 'risk',
    title: 'Risk Management',
    episodes: 39,
    hours: 26,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Lock,
  },
  {
    id: 'market-trends',
    title: '2026 Market Trends',
    episodes: 24,
    hours: 14,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: Star,
  },
  {
    id: 'negotiation',
    title: 'Negotiation Skills',
    episodes: 67,
    hours: 39,
    gradient: ['var(--podcast-tile-from)', 'var(--podcast-tile-to)'],
    icon: ChalkboardUser,
  },
]

export type ContinueListeningEntry = {
  id: string
  episodeTitle: string
  podcastTitle: string
  /** Episode number — omitted when the card represents a whole show (e.g. a
   * playlist entry) rather than a single episode. */
  episodeNumber?: number
  durationHr: number
  /** Topic or credit-type label shown after the duration (e.g. "Ethics", "Mandatory"). */
  contextLabel: string
  progressPct: number
  description: string
  /** Mirrors `CourseCardData['badge']` — these entries are built from podcast
   *  records, so narrowing here would reject a value the source can hold. */
  badge: 'mandatory' | 'elective' | 'non-credit'
  state: string
  /** Listen status — drives tile-header color, progress bar palette, and
   * label ("Not Started" / "XX%" / "Complete"). Defaults to 'in-progress'
   * for back-compat with the Continue Listening queue. */
  myStatus?: 'in-progress' | 'not-started' | 'completed'
}

export type FeaturedBundle = {
  id: string
  title: string
  description: string
  bundleLabel: string
  ceHours: number
  episodes: number
  state: string
  progressPct: number
}

export const FEATURED_BUNDLES: FeaturedBundle[] = [
  {
    id: 'fb-tx-18hr',
    title: 'Texas 18-Hour Renewal · Done in Drives',
    description:
      'All required hours bundled into commute-length episodes. Includes Legal Update I & II, Ethics, and Broker Responsibility.',
    bundleLabel: '6-PART BUNDLE',
    ceHours: 18,
    episodes: 18,
    state: 'TX',
    progressPct: 80,
  },
  {
    id: 'fb-fair-housing-mastery',
    title: 'Fair Housing Mastery',
    description:
      'Five-episode deep dive on the FHA, ADA, and source-of-income protections. Earn the Fair Housing Pro badge.',
    bundleLabel: 'BUNDLE · BADGE',
    ceHours: 4.5,
    episodes: 5,
    state: 'All',
    progressPct: 70,
  },
  {
    id: 'fb-ai-for-realtors',
    title: 'AI for Realtors — Practical & Ethical',
    description:
      "Lead gen, listing copy, and virtual staging — and how to disclose AI use to your clients without losing trust.",
    bundleLabel: 'NEW BUNDLE',
    ceHours: 6,
    episodes: 8,
    state: 'All',
    progressPct: 30,
  },
  {
    id: 'fb-new-agent-top-1',
    title: 'From New Agent to Top 1%',
    description:
      'Habits, systems, and ethics from agents closing 100+ deals/year. Includes 6 hours of elective CE.',
    bundleLabel: 'BUNDLE',
    ceHours: 8,
    episodes: 12,
    state: 'All',
    progressPct: 25,
  },
]

export type TopPodcastEntry = {
  id: string
  rank: number
  title: string
  hours: number
  state: string
  badge: 'mandatory' | 'elective'
  rating: number
  creditHours: number
  creditTopic: string
  description: string
  /** Solid CSS variable for the rank tile background. */
  color: string
}

export const TOP_PODCASTS: TopPodcastEntry[] = [
  {
    id: 'tp-ethics-hour',
    rank: 1,
    title: 'The Ethics Hour',
    hours: 1,
    state: 'NC',
    badge: 'mandatory',
    rating: 4.9,
    creditHours: 1.0,
    creditTopic: 'Ethics',
    description:
      'Short-form ethics cases drawn from real disciplinary actions. Each episode walks through what went wrong, what the agent should have done, and how to spot the warning signs early.',
    color: 'var(--color-primary-700)',
  },
  {
    id: 'tp-fair-housing-forward',
    rank: 2,
    title: 'Fair Housing Forward',
    hours: 2,
    state: 'AL',
    badge: 'mandatory',
    rating: 4.8,
    creditHours: 2.0,
    creditTopic: 'Mandatory',
    description:
      'Plain-language episodes on the FHA, protected classes, recent rulings, and source-of-income protections. Built for agents who want to stay compliant without slogging through a 90-minute webinar.',
    color: 'var(--color-secondary-700)',
  },
  {
    id: 'tp-contract-confidential',
    rank: 3,
    title: 'Contract Confidential',
    hours: 1,
    state: 'VA',
    badge: 'mandatory',
    rating: 4.7,
    creditHours: 1.0,
    creditTopic: 'Mandatory',
    description:
      'Inside look at contract clauses that bite. Real escrow stories, addendum traps, and how top agents protect their buyers and sellers when offers get complicated.',
    color: 'var(--color-tertiary-700)',
  },
  {
    id: 'tp-buyer-psychology',
    rank: 4,
    title: 'Buyer Psychology in a Shifting Market',
    hours: 3,
    state: 'TN',
    badge: 'elective',
    rating: 4.6,
    creditHours: 3.0,
    creditTopic: 'Elective',
    description:
      'How buyers actually make decisions under uncertainty — loss aversion, anchoring, and the tactics that move them from browsing to closing without pressure.',
    color: 'var(--color-primary-600)',
  },
  {
    id: 'tp-disclosure-done-right',
    rank: 5,
    title: 'Disclosure Done Right',
    hours: 2,
    state: 'SC',
    badge: 'mandatory',
    rating: 4.6,
    creditHours: 2.0,
    creditTopic: 'Mandatory',
    description:
      'Material facts, latent defects, and the disclosures that protect you from post-close lawsuits. Includes recent case studies on mold, lead paint, and undisclosed property history.',
    color: 'var(--color-secondary-800)',
  },
  {
    id: 'tp-modern-listing-agent',
    rank: 6,
    title: 'The Modern Listing Agent',
    hours: 1,
    state: 'GA',
    badge: 'elective',
    rating: 4.5,
    creditHours: 1.0,
    creditTopic: 'Elective',
    description:
      'The listing process from sign-up to sold sign — pricing strategy, marketing channels that still convert, handling offers, and what to do when the market shifts mid-listing.',
    color: 'var(--color-tertiary-800)',
  },
  {
    id: 'tp-risk-and-reward',
    rank: 7,
    title: 'Risk and Reward',
    hours: 2,
    state: 'FL',
    badge: 'elective',
    rating: 4.5,
    creditHours: 2.0,
    creditTopic: 'Risk',
    description:
      'Risk management for solo agents and small teams — E&O insurance, paper trails, social media liability, and how to recognize the engagements that are more trouble than they\'re worth.',
    color: 'var(--color-primary-800)',
  },
  {
    id: 'tp-agency-essentials',
    rank: 8,
    title: 'Agency Essentials',
    hours: 1,
    state: 'NC',
    badge: 'mandatory',
    rating: 4.4,
    creditHours: 1.0,
    creditTopic: 'Agency',
    description:
      'Single agency, dual agency, transaction brokerage — what each one means in practice, how to explain it to clients without losing the deal, and where the fiduciary lines really sit.',
    color: 'var(--color-secondary-600)',
  },
  {
    id: 'tp-closing-conversations-top',
    rank: 9,
    title: 'Closing Conversations',
    hours: 2,
    state: 'FL',
    badge: 'elective',
    rating: 4.4,
    creditHours: 2.0,
    creditTopic: 'Elective',
    description:
      'Pre-closing checklists, walking buyers through closing day, handling deals that go sideways, and the post-close follow-up that earns referrals year after year.',
    color: 'var(--color-tertiary-600)',
  },
  {
    id: 'tp-negotiation-stories-top',
    rank: 10,
    title: 'Negotiation Stories from the Field',
    hours: 2,
    state: 'VA',
    badge: 'elective',
    rating: 4.3,
    creditHours: 2.0,
    creditTopic: 'Elective',
    description:
      'Real negotiation stories from working agents — multiple-offer situations, inspection re-trades, cultural differences, and the moments where the right phrasing saved (or sank) a deal.',
    color: 'var(--color-primary-900)',
  },
]

export const CONTINUE_LISTENING: ContinueListeningEntry[] = [
  {
    id: 'cl-dual-agency',
    episodeTitle: "Dual Agency: When Disclosure Isn't Enough",
    podcastTitle: 'The Ethics Hour',
    episodeNumber: 42,
    durationHr: 1.0,
    contextLabel: 'Ethics',
    progressPct: 38,
    description:
      "A real-world dual-agency case where written disclosure didn't go far enough — and what the agent should have done to keep both parties whole.",
    badge: 'mandatory',
    state: 'NC',
  },
  {
    id: 'cl-protected-classes',
    episodeTitle: 'The 7 Protected Classes Most Agents Get Wrong',
    podcastTitle: 'Fair Housing Forward',
    episodeNumber: 18,
    durationHr: 0.75,
    contextLabel: 'Mandatory',
    progressPct: 62,
    description:
      'A plain-language walkthrough of the federally protected classes — including the ones that most often trip up working agents in everyday transactions.',
    badge: 'mandatory',
    state: 'AL',
  },
  {
    id: 'cl-earnest-money',
    episodeTitle: 'Earnest Money Disputes: Who Gets the Check?',
    podcastTitle: 'Contract Confidential',
    episodeNumber: 71,
    durationHr: 1.0,
    contextLabel: 'Mandatory',
    progressPct: 14,
    description:
      'How earnest-money disputes actually play out, the contract clauses that decide them, and the conversations that prevent escalation in the first place.',
    badge: 'elective',
    state: 'VA',
  },
  {
    id: 'cl-latent-defect',
    episodeTitle: 'Mold, Lead, and the Latent Defect Trap',
    podcastTitle: 'Disclosure Done Right',
    episodeNumber: 23,
    durationHr: 0.75,
    contextLabel: 'Mandatory',
    progressPct: 80,
    description:
      'The disclosure obligations around mold, lead paint, and other latent defects — including the post-close cases that have set the standard.',
    badge: 'mandatory',
    state: 'SC',
  },
]
