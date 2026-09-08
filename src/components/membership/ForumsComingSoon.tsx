// TODO(prompt-forums): swap this placeholder for the real Course
// Forums tab — likely an active-threads feed scoped to the courses
// the learner is currently enrolled in, with instructor-moderated
// post affordances. Follow-up prompt picks up here.

import { MessageCircle } from '@/icons'
import { EmptyState } from '@/components/ui/EmptyState'

export function ForumsComingSoon() {
  return (
    <EmptyState
      icon={<MessageCircle size={24} aria-hidden />}
      title="Course Forums are coming soon"
      description="Ask questions, share insights, and get answers from instructors and peers — all scoped to the courses you're enrolled in."
      actionLabel="Back to Recommended"
      actionTo="/membership?tab=recommended"
    />
  )
}
