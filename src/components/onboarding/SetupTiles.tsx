import {
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

/**
 * Keyboard-operable quick-select tile group for the learning-setup wizard.
 * Renders a `radiogroup` (single-select goal / license type) or a checkbox
 * `group` (multi-select courses / modalities) of real `<button>`s with
 * `aria-checked`, roving tabindex, and arrow-key navigation within the group.
 * The caller supplies the per-tile inner content + selected styling.
 */
type TileGroupProps<T> = {
  ariaLabel: string
  /** `radio` = single-select (goal / license type); `checkbox` = multi-select. */
  role: 'radio' | 'checkbox'
  items: T[]
  keyFor: (item: T) => string
  isSelected: (item: T) => boolean
  onToggle: (item: T) => void
  /** Inner tile content (icon / label / check badge). */
  renderTile: (item: T, selected: boolean) => ReactNode
  /** Base button style for the tile, given its selected state. */
  styleFor: (selected: boolean) => CSSProperties
  /** CSS grid-template-columns for the tile grid (ignored when `wrap`). */
  columns?: string
  /** Lay the items out as an inline flex-wrap row (pills) instead of a grid. */
  wrap?: boolean
  /** Optional max-height + scroll (the course shelf). */
  maxHeight?: number
}

export function TileGroup<T>({
  ariaLabel,
  role,
  items,
  keyFor,
  isSelected,
  onToggle,
  renderTile,
  styleFor,
  columns,
  wrap = false,
  maxHeight,
}: TileGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  // Roving tabindex — the focused tile is the lone tab stop; arrow keys move it.
  // Seed to the first selected tile (or 0) so focus lands somewhere sensible.
  const initial = Math.max(0, items.findIndex(isSelected))
  const [focusIdx, setFocusIdx] = useState(initial)

  const move = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = items.length
    let next: number | null = null
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % n
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next == null) return
    e.preventDefault()
    setFocusIdx(next)
    refs.current[next]?.focus()
  }

  return (
    <div
      role={role === 'radio' ? 'radiogroup' : 'group'}
      aria-label={ariaLabel}
      style={{
        ...(wrap
          ? { display: 'flex', flexWrap: 'wrap', gap: 10 }
          : { display: 'grid', gridTemplateColumns: columns, gap: 12 }),
        ...(maxHeight ? { maxHeight, overflow: 'auto', paddingRight: 3 } : null),
      }}
    >
      {items.map((item, i) => {
        const selected = isSelected(item)
        return (
          <button
            key={keyFor(item)}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role={role}
            aria-checked={selected}
            tabIndex={i === focusIdx ? 0 : -1}
            onFocus={() => setFocusIdx(i)}
            onKeyDown={(e) => move(e, i)}
            onClick={() => onToggle(item)}
            className="cre-setup-focusable"
            style={styleFor(selected)}
          >
            {renderTile(item, selected)}
          </button>
        )
      })}
    </div>
  )
}

/* ─── selected-tile pieces ───────────────────────────────────────────── */

/** The magenta check badge shown on a selected tile (top-right). */
export function CheckBadge({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'var(--color-cta-500)',
        color: 'var(--color-text-inverse)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 800,
        boxShadow: dark ? '0 0 0 2px rgb(9 20 36 / 0.35)' : undefined,
        zIndex: 2,
      }}
    >
      ✓
    </span>
  )
}

/** The square icon plate on a goal / modality tile. */
export function IconPlate({ selected, children }: { selected: boolean; children: ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        width: 40,
        height: 40,
        borderRadius: 11,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: selected ? 'var(--color-cta-500)' : 'var(--color-secondary-100)',
        color: selected ? 'var(--color-text-inverse)' : 'var(--color-primary-700)',
      }}
    >
      {children}
    </span>
  )
}
