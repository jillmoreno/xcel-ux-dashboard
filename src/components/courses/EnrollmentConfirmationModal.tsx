import type { ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'

/**
 * Enrollment confirmation modal.
 *
 * Visual layout sourced from Figma node `17:13606` (CRE → Enrollment
 * Agreement). The same shell is reused for both in-person (seat reservation)
 * and webinar (materials shipping) variants — the consumer supplies the icon,
 * lead copy, and detail rows that fit the variant.
 */
export type EnrollmentRow = {
  label: string
  lines: string[]
  /** Optional right-aligned action slot (e.g. an "Edit" text-link). */
  action?: ReactNode
}

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  /** Heading + accessible name. Default: "Reserve Your Seat". */
  title?: string
  /** Icon node rendered inside the 86×86 tinted circular badge. */
  icon: ReactNode
  /** Lead copy block (paragraphs above the detail rows). 16/28 sizing applied here. Optional. */
  lead?: ReactNode
  /** Label / value rows shown beneath the lead copy at 14/22. */
  rows: EnrollmentRow[]
  /** Confirm button label. Default: "Enroll in Course". */
  ctaLabel?: string
}

const ROW_LABEL_WIDTH = 121

export function EnrollmentConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = 'Reserve Your Seat',
  icon,
  lead,
  rows,
  ctaLabel = 'Enroll in Course',
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} hideChrome transparentBackdrop width={505}>
      <div
        style={{
          padding: '34px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 86,
            height: 86,
            borderRadius: 'var(--radius-pill)',
            background: 'color-mix(in srgb, var(--color-primary-100) 50%, transparent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-500)',
          }}
        >
          {icon}
        </div>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: 22,
            lineHeight: '30px',
            color: 'var(--color-neutral-darkest)',
            textAlign: 'center',
          }}
        >
          {title}
        </h2>
        <div style={{ width: 425, maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              fontFamily: 'var(--font-body)',
              color: 'var(--color-neutral-darkest)',
            }}
          >
            {lead && <div style={{ fontSize: 16, lineHeight: '28px' }}>{lead}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, fontSize: 14, lineHeight: '22px' }}>
              {rows.map((row, i) => (
                <DetailRow key={i} label={row.label} lines={row.lines} action={row.action} />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              width: '100%',
              minHeight: 52,
              padding: '12px 32px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-action)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 16,
              lineHeight: '28px',
              cursor: 'pointer',
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function DetailRow({ label, lines, action }: { label: string; lines: string[]; action?: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <span style={{ width: ROW_LABEL_WIDTH, flexShrink: 0, fontWeight: 400 }}>{label}</span>
      <div style={{ flex: 1, fontWeight: 600, minWidth: 0 }}>
        {lines.map((line, i) => (
          <p key={i} style={{ margin: 0 }}>
            {line}
          </p>
        ))}
      </div>
      {action && <div style={{ flexShrink: 0, marginLeft: 8 }}>{action}</div>}
    </div>
  )
}
