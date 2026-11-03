import type { PillTabItem } from '@/components/ui/PillTabs'
import { ATLAS_FILTER_PILL, ATLAS_FILTER_PILL_ON } from './atlasAccountTableStyles'

/**
 * THE ADMIN TABLE HEADER'S FILTER PILLS, for the learner's account pages
 * (2026-11-03, Eric's request) — the same tablist contract as `PillTabs`,
 * drawn as Atlas Admin's Invites filters: separate capsules, 8 apart, the
 * selected one in Brand. No per-pill counts; the total stays beside the strip.
 */
export function AtlasFilterPills<T extends string>({
  items,
  active,
  onChange,
  label,
}: {
  items: PillTabItem<T>[]
  active: T
  onChange: (id: T) => void
  label?: string
}) {
  return (
    <div role="tablist" aria-label={label} style={{ display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
      {items.map((item) => {
        const on = item.id === active
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(item.id)}
            style={on ? ATLAS_FILTER_PILL_ON : ATLAS_FILTER_PILL}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
