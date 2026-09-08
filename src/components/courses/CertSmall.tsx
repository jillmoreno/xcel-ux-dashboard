import { Award, MoreVertical } from '@/icons'

export type CertSmallData = {
  id: string
  title: string
  hours: number
  tier: 'mandatory' | 'elective' | 'designated-mandatory'
}

const TIER_LABEL: Record<CertSmallData['tier'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
  'designated-mandatory': 'Designated Mandatory',
}

export function CertSmall({
  data,
  compact = false,
}: {
  data: CertSmallData
  /** Compact mode — title 12/16 type, drops the meta line (hours +
   *  tier) and the kebab menu so the card shrinks vertically. Used
   *  in the Jump Back In tile's Recent Certificates section, where
   *  there's only room for the icon + title. Default keeps the
   *  Learning Path certificates tab's full treatment. */
  compact?: boolean
}) {
  const titleFontSize = compact ? 12 : 14
  const titleLineHeight = compact ? '16px' : '18px'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        // Was a hardcoded `width: 330`. Now fluid so the same component
        // can render inside the narrow Jump Back In tile (~265px) and
        // the Learning Path certificates grid (where each 1fr cell
        // caps the card at 330px).
        width: '100%',
        maxWidth: 330,
        // Compact mode drops the meta line + kebab so the row can
        // shrink to just icon + title height; the full treatment
        // keeps the 80px minimum it had before.
        minHeight: compact ? undefined : 80,
        padding: compact ? '8px 12px' : '12px 12px 12px 16px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-neutral-extra-light)',
        borderRadius: 'var(--radius-md)',
        // Hover lift — brighten the border to the brand ramp + a faint
        // primary wash, matching the sibling `CourseRow` rows so the
        // Jump Back In stack reads as one consistent set.
        transition: 'border-color 160ms ease, background 160ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-primary-300)'
        e.currentTarget.style.background =
          'color-mix(in srgb, var(--color-primary-500) 4%, white)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-neutral-extra-light)'
        e.currentTarget.style.background = 'var(--color-surface-card)'
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-700)',
          flexShrink: 0,
        }}
      >
        <Award size={22} aria-hidden />
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: 2 }}>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: titleFontSize,
            lineHeight: titleLineHeight,
            color: 'var(--color-text-primary)',
          }}
        >
          {data.title}
        </p>
        {!compact && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            <span>{data.hours} Hours</span>
            <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
            <span>{TIER_LABEL[data.tier]}</span>
          </div>
        )}
      </div>
      {!compact && (
        <button
          type="button"
          aria-label={`More actions for ${data.title}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-pill)',
            background: 'transparent',
            border: 'none',
            color: 'var(--color-secondary-500)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <MoreVertical size={16} aria-hidden />
        </button>
      )}
    </div>
  )
}
