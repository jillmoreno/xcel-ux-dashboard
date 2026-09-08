import type { ComponentType, CSSProperties } from 'react'
import {
  Award,
  CalendarPen,
  ClipboardList,
  FileText,
  MessageCircle,
  SignsPost,
} from '@/icons'

/**
 * Non-member upsell hero for the **Exam & Cert Prep** (`m-exam-prep`) and
 * **AI Career Tools** (`m-career-tools`) sections in the Dashboard Rebrand
 * shell. It's the SAME large navy membership band the Resource Library uses
 * for non-members ([`LearningLibraryHero`](./LearningLibraryHero.tsx) non-member
 * variant) — "MEMBERS ONLY" eyebrow + big "Unlock …" title + description + three
 * benefit tiles + an "Unlock with Membership" CTA — so all three benefit
 * sections upsell consistently.
 *
 * The body BELOW this hero is now the same `SectionContent` a member sees
 * (`renderBody` no longer swaps in the marketing-only `LockedBenefitPage` for
 * these two) — the only non-member difference is this larger upsell band on top.
 *
 * Elite-only copy stays inline, mirroring `LearningLibraryHero`; lift to a
 * per-brand selector if another brand ships these non-member heroes.
 */

type UpsellSection = 'm-exam-prep' | 'm-career-tools'

type Benefit = {
  title: string
  caption: string
  Icon: ComponentType<{ size?: number; style?: CSSProperties }>
}

type UpsellCopy = {
  title: string
  description: string
  benefits: Benefit[]
}

const COPY: Record<UpsellSection, UpsellCopy> = {
  'm-exam-prep': {
    title: 'Unlock Exam & Certification Prep',
    description:
      'Guided prep tracks, full-length practice exams, and readiness scoring built around your certification — everything you need to walk in ready.',
    benefits: [
      {
        title: 'Practice Exams',
        caption: 'Full-length practice exams with rationales',
        Icon: ClipboardList,
      },
      {
        title: 'Readiness Score',
        caption: 'Track your progress toward exam day',
        Icon: Award,
      },
      {
        title: 'Study Plan',
        caption: 'A personalized plan built around your exam date',
        Icon: CalendarPen,
      },
    ],
  },
  'm-career-tools': {
    title: 'Unlock AI Career Tools',
    description:
      'Practice interviews, build a standout resume, and map your next move with Rubi AI — personalized guidance to grow your nursing career.',
    benefits: [
      {
        title: 'Interview Practice',
        caption: 'Realistic interview simulations with feedback',
        Icon: MessageCircle,
      },
      {
        title: 'Resume Builder',
        caption: 'A standout resume tailored to nursing roles',
        Icon: FileText,
      },
      {
        title: 'Career Guidance',
        caption: 'Personalized next-move recommendations',
        Icon: SignsPost,
      },
    ],
  },
}

export function BenefitUpsellHero({
  section,
  onUnlock,
}: {
  section: UpsellSection
  /** "Unlock with Membership" CTA handler (routes to Explore Membership
   *  in-shell). */
  onUnlock?: () => void
}) {
  const copy = COPY[section]

  return (
    <header style={bandStyle}>
      <span style={eyebrowStyle}>Members only · Become a member today</span>

      <h1 style={titleStyle}>{copy.title}</h1>

      <p style={descriptionStyle}>{copy.description}</p>

      <div style={benefitsRowStyle}>
        {copy.benefits.map((b) => (
          <div key={b.title} style={benefitTileStyle}>
            <b.Icon size={20} style={{ color: 'var(--color-text-inverse)', opacity: 0.5 }} />
            <span style={benefitTitleStyle}>{b.title}</span>
            <span style={benefitCaptionStyle}>{b.caption}</span>
          </div>
        ))}
      </div>

      <button type="button" onClick={onUnlock} style={unlockButtonStyle}>
        Unlock with Membership
      </button>
    </header>
  )
}

/* ─── styles (mirror LearningLibraryHero's non-member band) ─────────────────── */

const bandStyle: CSSProperties = {
  // Full-bleed: cancel SectionShell's 24px-top / 40px-side gutter so the band
  // runs flush against the slim header + spans the content column, then add
  // 24px below to separate it from the section body.
  margin: '-24px -40px 24px',
  padding: '44px 48px 40px',
  background: 'linear-gradient(118deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.82)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 40,
  fontWeight: 700,
  lineHeight: 1.06,
  color: 'var(--color-text-inverse)',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: 795,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'rgb(255 255 255 / 0.85)',
}

const benefitsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'stretch',
  alignSelf: 'stretch',
  maxWidth: 1000,
  flexWrap: 'wrap',
}

const benefitTileStyle: CSSProperties = {
  flex: '1 1 0',
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 16px 18px',
  borderRadius: 12,
  background: 'rgb(255 255 255 / 0.06)',
  border: '1px solid rgb(255 255 255 / 0.14)',
}

const benefitTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.25,
  color: 'var(--color-text-inverse)',
}

const benefitCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.45,
  color: 'rgb(255 255 255 / 0.72)',
}

const unlockButtonStyle: CSSProperties = {
  height: 48,
  padding: '0 32px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}
