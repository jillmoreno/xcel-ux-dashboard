import type { CSSProperties } from 'react'
import { Grid, Layout } from '@/icons'

export type ViewMode = 'card' | 'table'

type Props = {
  value: ViewMode
  onChange: (next: ViewMode) => void
  /** Optional aria-label for the segmented control wrapper. */
  label?: string
  /** Modes to render as visibly disabled — greyed out, no click. Used when
   *  a mode is contextually unavailable (e.g. the dashboard's "Table" mode
   *  below the 1440px viewport threshold where the table can't fit). */
  disabledModes?: ViewMode[]
  /** Tooltip applied to every disabled button. One string for the group
   *  keeps the API simple — callers that need per-button copy can wrap. */
  disabledTitle?: string
}

export function ViewToggle({
  value,
  onChange,
  label = 'View',
  disabledModes,
  disabledTitle,
}: Props) {
  const isDisabled = (mode: ViewMode) => disabledModes?.includes(mode) ?? false
  return (
    <div
      role="group"
      aria-label={label}
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 2,
        background: 'var(--color-neutral-100)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <ToggleButton
        active={value === 'card'}
        ariaLabel="Card view"
        onClick={() => onChange('card')}
        disabled={isDisabled('card')}
        title={isDisabled('card') ? disabledTitle : undefined}
      >
        <Grid size={16} aria-hidden />
      </ToggleButton>
      <ToggleButton
        active={value === 'table'}
        ariaLabel="Table view"
        onClick={() => onChange('table')}
        disabled={isDisabled('table')}
        title={isDisabled('table') ? disabledTitle : undefined}
      >
        <Layout size={16} aria-hidden />
      </ToggleButton>
    </div>
  )
}

function ToggleButton({
  active,
  ariaLabel,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean
  ariaLabel: string
  onClick: () => void
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: active ? '1px solid var(--color-border-subtle)' : '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--color-surface-card)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    // Disabled buttons keep their layout role but dim uniformly + flip
    // the cursor to communicate "not interactive at this screen size".
    // Native `disabled` already blocks the click + announces to AT, so
    // this is purely visual reinforcement.
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    padding: 0,
  }
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      title={title}
      onClick={onClick}
      style={baseStyle}
    >
      {children}
    </button>
  )
}
