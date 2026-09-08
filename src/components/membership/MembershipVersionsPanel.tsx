import { HelpCircle, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { Tooltip } from '@/components/ui/Tooltip'
import {
  MEMBERSHIP_VERSIONS,
  type MembershipVersion,
  type MembershipVersionId,
} from '@/data/membershipVersions'

type Props = {
  open: boolean
  onClose: () => void
  activeVersionId: MembershipVersionId
  onSelectVersion: (id: MembershipVersionId) => void
  /** The version a fresh /membership visit lands on. */
  defaultVersionId: MembershipVersionId
  /** Persist a new default version (from the per-row "Set as default"). */
  onSetDefault: (id: MembershipVersionId) => void
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map((s) => parseInt(s, 10))
  return DATE_FORMATTER.format(new Date(y, m - 1, d))
}

/**
 * Membership landing-page version switcher — modeled file-for-file on
 * `DashboardVersionsPanel`. Lists `MEMBERSHIP_VERSIONS`, marks the active
 * one, and lets the reviewer set either as their default.
 */
export function MembershipVersionsPanel({
  open,
  onClose,
  activeVersionId,
  onSelectVersion,
  defaultVersionId,
  onSetDefault,
}: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Membership Versions" width={460} side="left">
      <div
        style={{
          padding: '20px 24px 12px',
          display: 'flex',
          flexDirection: 'column',
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
      </div>
      <div
        aria-hidden
        style={{ height: 1, background: 'var(--color-border-subtle)' }}
      />
      <header
        style={{
          padding: '16px 24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
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
          Membership Versions
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
          Pick an iteration to preview. Future design changes can be applied to a specific version
          below.
        </p>
      </header>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: '8px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          overflowY: 'auto',
          flex: 1,
        }}
      >
        {[...MEMBERSHIP_VERSIONS].reverse().map((version) => {
          const isDefault = version.id === defaultVersionId
          return (
            <li
              key={version.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <VersionRow
                version={version}
                active={version.id === activeVersionId}
                isDefault={isDefault}
                onSelect={() => {
                  onSelectVersion(version.id)
                  onClose()
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {isDefault ? (
                  <span style={defaultNoteStyle}>Current default</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetDefault(version.id)}
                    style={setDefaultButtonStyle}
                  >
                    Set as default
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </Sheet>
  )
}

function VersionRow({
  version,
  active,
  isDefault,
  onSelect,
}: {
  version: MembershipVersion
  active: boolean
  isDefault: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--color-surface-card)',
        border: active
          ? '2px solid var(--color-neutral-darkest)'
          : '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: active ? '11px 13px' : '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        cursor: 'pointer',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 15,
          lineHeight: '22px',
          color: 'var(--color-text-primary)',
        }}
      >
        <span>
          {version.id.toUpperCase()} — {version.name}
        </span>
        <Tooltip content={version.description}>
          <span
            role="button"
            tabIndex={0}
            aria-label={`About ${version.name}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              border: 'none',
              background: 'none',
              color: 'var(--color-text-tertiary)',
              cursor: 'help',
              lineHeight: 0,
              flexShrink: 0,
            }}
          >
            <HelpCircle size={14} aria-hidden />
          </span>
        </Tooltip>
        {isDefault && <span style={defaultBadgeStyle}>Default</span>}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          lineHeight: '20px',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span>Added · {formatDate(version.date)}</span>
      </div>
    </button>
  )
}

const defaultBadgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '1px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-700)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as const

const setDefaultButtonStyle = {
  background: 'transparent',
  border: 'none',
  padding: '2px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-action)',
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
} as const

const defaultNoteStyle = {
  padding: '2px 4px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
} as const
