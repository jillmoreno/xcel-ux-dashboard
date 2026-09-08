export function WeekendToggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (next: boolean) => void
}) {
  // Switch-style toggle. Track is `--color-action` when on, neutral when off.
  const trackW = 32
  const trackH = 18
  const knob = trackH - 4
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--color-text-primary)',
      }}
    >
      <span>Hide weekends</span>
      <span
        aria-hidden
        style={{
          position: 'relative',
          width: trackW,
          height: trackH,
          background: checked ? 'var(--color-action)' : 'var(--color-neutral-300)',
          borderRadius: 'var(--radius-pill)',
          transition: 'background 160ms ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? trackW - knob - 2 : 2,
            width: knob,
            height: knob,
            background: 'var(--color-surface-card)',
            borderRadius: 'var(--radius-pill)',
            transition: 'left 160ms ease',
            boxShadow: '0 1px 2px rgb(0 0 0 / 0.15)',
          }}
        />
      </span>
    </button>
  )
}
