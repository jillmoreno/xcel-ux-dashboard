import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from '@/icons'

/**
 * Full-bleed breadcrumb bar for the membership section. The bar uses a
 * light wash that echoes the membership hero's blue→teal gradient (a
 * faint primary-100 → secondary-100), so sub-pages read as part of the
 * same family. Reusable — pass the trail; the last crumb is the current
 * page (no link).
 */
export type Crumb = { label: string; to?: string }

const crumbLinkStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-primary-700)',
  textDecoration: 'none',
}

const crumbCurrentStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  color: 'var(--color-primary-800)',
}

export function MembershipBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        width: '100%',
        background:
          'linear-gradient(135deg, var(--color-primary-100), var(--color-secondary-100))',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <ol
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          listStyle: 'none',
          flexWrap: 'wrap',
        }}
      >
        {items.map((crumb, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={crumb.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="cre-membership-crumb" style={crumbLinkStyle}>
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={crumbCurrentStyle}>
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight size={13} aria-hidden style={{ color: 'var(--color-text-tertiary)' }} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
