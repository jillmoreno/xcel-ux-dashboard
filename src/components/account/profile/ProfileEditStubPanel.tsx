import { Sheet } from '@/components/ui/Sheet'
import { X } from '@/icons'

/**
 * Generic "edit" slide-over for the Profile cards whose editing flow isn't built
 * yet (Account Details, Personal Information, Membership Plan, Interests). It's
 * an intentional **blank placeholder** — same right-anchored panel pattern as
 * `CourseDetailsPanel` (close top-left, title, divider, empty scroll body). The
 * Motivational Statement card uses the real `MotivationalStatementPanel`, not
 * this stub.
 */
export function ProfileEditStubPanel({
  open,
  onClose,
  title,
}: {
  open: boolean
  onClose: () => void
  title: string
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <header style={{ padding: '20px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          aria-label={`Close ${title} panel`}
          onClick={onClose}
          className="cre-sheet-close"
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: '20px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <X size={14} aria-hidden />
          Close
        </button>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 22,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h2>
      </header>
      <div aria-hidden style={{ height: 1, background: 'var(--color-border-subtle)' }} />

      {/* Body — intentionally blank (edit form is a follow-up). */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Editing isn&rsquo;t wired up in this prototype yet.
        </p>
      </div>
    </Sheet>
  )
}
