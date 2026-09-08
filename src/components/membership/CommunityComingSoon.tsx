// TODO(prompt-community): swap this placeholder for the real
// Community Posts feed — wins, war stories, and questions from the
// broader Colibri member community. Posting opens with Premium
// membership; the follow-up prompt should pick up here.

import { Users } from '@/icons'
import { EmptyState } from '@/components/ui/EmptyState'

export function CommunityComingSoon() {
  return (
    <EmptyState
      icon={<Users size={24} aria-hidden />}
      title="Community Posts are coming soon"
      description="Wins, war stories, and questions from the broader Colibri member community. Posting opens with your Premium membership."
      actionLabel="Back to Recommended"
      actionTo="/membership?tab=recommended"
    />
  )
}
