import { useMemo } from 'react'
import { X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { CourseRow } from '@/components/dashboard/JumpBackInCard'
import { useAccount } from '@/context/AccountContext'
import { myCoursesFor } from '@/data/myCoursesFixtures'

type Props = {
  open: boolean
  onClose: () => void
}

/**
 * Dashboard V3 — Jump Back In slide-over.
 *
 * Mirrors `LearningPathsPanel` (header layout: close button + 1px
 * divider + title + description; list body fills the rest), but lists
 * every in-progress course in the active brand's `myCoursesFor(brand)`
 * library. Each row reuses `CourseRow` from `JumpBackInCard` so the
 * panel's UI feels like an expansion of the dashboard tile rather than
 * a separate surface.
 *
 * Triggered by the Jump Back In tile's eyebrow "View All →" in V3.
 */
export function JumpBackInPanel({ open, onClose }: Props) {
  const { brand } = useAccount()
  const inProgress = useMemo(
    () => myCoursesFor(brand).filter((c) => c.myStatus === 'in-progress'),
    [brand],
  )

  return (
    <Sheet open={open} onClose={onClose} title="Jump Back In">
      {/* Shared right-sheet header pattern: Close top-left, title +
          description directly beneath, then a 1px divider before the
          panel body. */}
      <header
        style={{
          padding: '20px 24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            alignSelf: 'flex-start',
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-secondary-600)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <X size={16} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 24,
            lineHeight: '32px',
            color: 'var(--color-primary-700)',
          }}
        >
          Jump Back In
        </h2>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Pick up where you left off. Every course you've started but
          haven't finished is listed below.
        </p>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {inProgress.length === 0 ? (
        <p
          style={{
            padding: '24px 24px 24px',
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-secondary)',
          }}
        >
          You don't have any in-progress courses right now.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '12px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {inProgress.map((course) => (
            <li key={course.id}>
              <CourseRow item={course} />
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  )
}
