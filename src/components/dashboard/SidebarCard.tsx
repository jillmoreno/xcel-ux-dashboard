import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'
import { useLoFi } from '@/context/LoFiContext'
import type { SidebarCard as SidebarCardData } from '@/data/dashboardFixtures'

export function SidebarCard({ data }: { data: SidebarCardData }) {
  const navigate = useNavigate()
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <Card style={{ padding: 20, gap: 12 }}>
        <LoFiWidgetBody rows={4} showCta ariaLabel="Lo-fi sidebar card" />
      </Card>
    )
  }
  return (
    <Card style={{ padding: 20, gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {data.eyebrow && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            {data.eyebrow}
          </span>
        )}
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 600,
            fontSize: 18,
            lineHeight: '24px',
            color: 'var(--color-text-primary)',
          }}
        >
          {data.title}
        </span>
      </div>
      {data.body && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--color-text-secondary)',
          }}
        >
          {data.body}
        </p>
      )}
      {data.items && data.items.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {data.items.map((item) => (
            <li
              key={item.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-sm)',
                background: item.featured
                  ? 'color-mix(in srgb, var(--color-primary-500) 10%, white)'
                  : 'transparent',
                border: item.featured
                  ? '1px solid var(--color-primary-300)'
                  : '1px solid var(--color-border-subtle)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text-primary)',
                }}
              >
                {item.label}
                {item.featured && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--color-primary-500)',
                      color: 'var(--color-text-inverse)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      lineHeight: '14px',
                    }}
                  >
                    Best
                  </span>
                )}
              </span>
              {item.caption && (
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {item.caption}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div style={{ marginTop: 'auto' }}>
        <Button
          variant={data.ctaVariant ?? 'primary'}
          size="sm"
          onClick={() => navigate(data.ctaHref)}
        >
          {data.ctaLabel}
        </Button>
      </div>
    </Card>
  )
}
