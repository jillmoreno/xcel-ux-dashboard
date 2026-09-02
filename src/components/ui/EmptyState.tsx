import { BookOpen } from '@/icons'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

type Props = {
  title: string
  description?: string
  actionLabel?: string
  actionTo?: string
  icon?: ReactNode
}

export function EmptyState({ title, description, actionLabel, actionTo, icon }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '64px 24px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
        textAlign: 'center',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
          height: 56,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-700)',
        }}
      >
        {icon ?? <BookOpen size={24} aria-hidden />}
      </span>
      <h3
        style={{
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
          fontSize: 'var(--text-heading-2xl)',
          lineHeight: 'var(--text-heading-2xl--line-height)',
          margin: 0,
          color: 'var(--color-text-primary)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            maxWidth: 480,
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: '22px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 40,
            padding: '0 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-action)',
            color: 'var(--color-text-inverse)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            marginTop: 8,
          }}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
