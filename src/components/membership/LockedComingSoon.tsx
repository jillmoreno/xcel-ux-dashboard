import { Library, MessageCircle, Users } from '@/icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { LockedPreview } from './LockedPreview'

/**
 * Non-member placeholder for the three tabs that have no real content
 * yet (Library / Forums / Community). Renders a marketing-tilted
 * `<EmptyState>` inside the same `<LockedPreview>` shell the
 * Recommended tab uses, so the gating affordance stays consistent
 * across all four tabs.
 *
 * Member-side counterparts: the Library tab now ships a full
 * `<LibraryPanel>`; Forums + Community still surface their
 * `*ComingSoon.tsx` placeholders pending follow-up prompts. This
 * component is the conversion-tilted twin: every CTA points at
 * `/membership/plans`.
 */
type Props = {
  tab: 'library' | 'forums' | 'community'
}

type Variant = {
  icon: React.ReactNode
  title: string
  description: string
  pillLabel: string
}

const VARIANTS: Record<Props['tab'], Variant> = {
  library: {
    icon: <Library size={24} aria-hidden />,
    title: 'A library that grows with you',
    description:
      'Hundreds of CE courses, paths, podcasts, and resources — all included with membership.',
    pillLabel: '445+ assets unlock with membership',
  },
  forums: {
    icon: <MessageCircle size={24} aria-hidden />,
    title: 'Get answers from instructors',
    description:
      'Premium members can post directly in course forums and get answers from the people who wrote the curriculum.',
    pillLabel: 'Ask instructors directly — join to post',
  },
  community: {
    icon: <Users size={24} aria-hidden />,
    title: 'Join the conversation',
    description:
      '40,000+ Colibri members share wins, scripts, and hard-won lessons every week.',
    pillLabel: '40,000+ members are talking — join the conversation',
  },
}

export function LockedComingSoon({ tab }: Props) {
  const variant = VARIANTS[tab]
  return (
    <LockedPreview pillLabel={variant.pillLabel}>
      <EmptyState
        icon={variant.icon}
        title={variant.title}
        description={variant.description}
        actionLabel="Become a member"
        actionTo="/membership/plans"
      />
    </LockedPreview>
  )
}
