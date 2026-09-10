import type { ReactNode } from 'react'

type Props = {
  icon?: ReactNode
  children: ReactNode
  /** Tone — semantic alias mapped to CRE tokens. */
  tone?: 'member' | 'completed' | 'in-progress' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
}

const TONES: Record<NonNullable<Props['tone']>, { bg: string; fg: string }> = {
  // Brand-themed tones.
  member: { bg: 'var(--color-secondary-200)', fg: 'var(--color-secondary-800)' },
  // "Completed" uses functional success green so progress reads consistently
  // across brands. "In Progress" sits on brand primary to celebrate active
  // learning in the active brand's voice.
  completed: { bg: 'var(--color-success-100)', fg: 'var(--color-success-800)' },
  'in-progress': { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-800)' },
  // Functional/system tones — sourced from Nectar's functional ramps, not brand colors.
  success: { bg: 'var(--color-success-100)', fg: 'var(--color-success-800)' },
  info: { bg: 'var(--color-info-100)', fg: 'var(--color-info-800)' },
  warning: { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-800)' },
  // Added 2026-09-09 for the Readiness gauge's OFF TRACK chip. The ramp
  // already existed and every other functional tone was here — `error` was the
  // gap, which is why that chip would otherwise have been hand-rolled.
  error: { bg: 'var(--color-error-100)', fg: 'var(--color-error-800)' },
  neutral: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-darkest)' },
}

export function StatusBadge({ icon, children, tone = 'neutral' }: Props) {
  const { bg, fg } = TONES[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 28,
        padding: '0 10px',
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color: fg,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {icon}
      {children}
    </span>
  )
}
