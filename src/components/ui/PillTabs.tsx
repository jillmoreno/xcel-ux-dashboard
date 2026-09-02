export type PillTabItem<T extends string> = {
  id: T
  label: string
}

type Props<T extends string> = {
  items: PillTabItem<T>[]
  active: T
  onChange: (id: T) => void
  /** Aria label for the tablist */
  label?: string
  /**
   * `compact` tightens the per-tab horizontal padding + font size so a longer
   * tab set fits in a constrained column (e.g. the rebrand shell's narrower
   * content area). Default keeps the roomy Figma spacing.
   */
  size?: 'default' | 'compact'
}

/**
 * Pill Tab Set — Figma file RGRnFD7BpWONzTCaDARDr0, node 4044:37725.
 * Tabs sit edge-to-edge on a white **fully-rounded** container. Active tab
 * fills with `--color-tab-active` (the shared content-tab active color = brand
 * primary-600) and uses white text; inactive tabs are flat on the
 * container with `--color-neutral-dark` text.
 *
 * Radius is `--radius-xl` (16px) on both the container and the active pill —
 * a softened rectangle, not a capsule. (It was briefly pinned to
 * `--radius-pill` on 2026-08-20 to make both true capsules; reverted 2026-08-21
 * per design.) Change it HERE, never per-page: this strip is shared by every
 * top filter in the app — My Courses status tabs, the Learning Paths landing,
 * Certificates, Study Calendar views, the classic dashboard's Continue
 * Learning tabs, Purchases → Gift Recipients, and the prototype landing +
 * feature-page tabs — so they all round the same way.
 *
 * Note the standalone chip rows are deliberately NOT this shape: the secondary
 * Profession / State / status chips (`StatusChip` in LearningPathsHome /
 * RecommendedFilters) are individually-outlined pills at ~25px tall, where a
 * 16px radius reads as a mistake. They stay `--radius-pill`.
 */
export function PillTabs<T extends string>({ items, active, onChange, label, size = 'default' }: Props<T>) {
  const compact = size === 'compact'
  return (
    <div
      role="tablist"
      aria-label={label}
      style={{
        display: 'inline-flex',
        alignItems: 'stretch',
        background: 'var(--color-neutral-50)',
        borderRadius: 'var(--radius-xl)',
      }}
    >
      {items.map((item) => {
        const isActive = item.id === active
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(item.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: compact ? '8px 14px' : '10px 24px',
              borderRadius: 'var(--radius-xl)',
              background: isActive ? 'var(--color-tab-active)' : 'transparent',
              // Active pill text stays white on the colored CTA fill via
              // `text-inverse` (pinned white in both themes). `neutral-50` flips
              // to navy in the rebrand dark theme → navy-on-magenta (#1).
              color: isActive ? 'var(--color-text-inverse)' : 'var(--color-neutral-dark)',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontSize: compact ? 14 : 16,
              fontWeight: 400,
              lineHeight: compact ? '20px' : '28px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
