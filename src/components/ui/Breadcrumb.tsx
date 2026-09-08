import { Link } from 'react-router-dom'
import { Fragment } from 'react'

type Crumb = { label: string; to?: string }

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: 'var(--color-text-primary)',
        }}
      >
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <Fragment key={`${item.label}-${i}`}>
              <li>
                {item.to && !isLast ? (
                  // Neutral dark crumbs (no brand-action color); clickable links
                  // keep the dark text, the current crumb reads slightly heavier.
                  <Link to={item.to} style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {item.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: isLast ? 600 : 500 }}>
                    {item.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden style={{ color: 'var(--color-text-tertiary)' }}>
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
