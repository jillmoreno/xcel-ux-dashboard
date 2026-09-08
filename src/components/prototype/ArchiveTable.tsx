import { useState } from 'react'
import { ChevronRight, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { ARCHIVED_ITEMS, type ArchivedItem } from '@/data/archivedItems'

/**
 * The Archive tab body (Design & Development → Archive). A compact table of
 * things removed from the project — three columns (Item Name · Description ·
 * Date Removed). Clicking a row opens a right-side detail Sheet with the full
 * record (where it lived, governing flag, reason, and how to restore).
 *
 * Data-driven off `ARCHIVED_ITEMS` (src/data/archivedItems.ts); see that file
 * for the "unwire but keep the code + log a row" convention. Styled entirely
 * via design tokens, and reuses the shared `ui/Sheet` drawer primitive.
 */
export function ArchiveTable() {
  const [selected, setSelected] = useState<ArchivedItem | null>(null)

  if (ARCHIVED_ITEMS.length === 0) return <ArchiveEmpty />

  return (
    <>
      <div
        style={{
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-xl)',
          background: 'var(--color-surface-card)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            lineHeight: '20px',
            color: 'var(--color-text-primary)',
          }}
        >
          <thead>
            <tr>
              <Th>Item Name</Th>
              <Th>Description</Th>
              <Th>Date Removed</Th>
              {/* trailing chevron column */}
              <Th aria-hidden style={{ width: 44 }} />
            </tr>
          </thead>
          <tbody>
            {ARCHIVED_ITEMS.map((item, i) => (
              <ArchiveRow
                key={item.id}
                item={item}
                first={i === 0}
                onOpen={() => setSelected(item)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <ArchiveDetailSheet item={selected} onClose={() => setSelected(null)} />
    </>
  )
}

/** One clickable row. The whole row acts as a button (keyboard + pointer) that
 *  opens the detail Sheet. */
function ArchiveRow({
  item,
  first,
  onOpen,
}: {
  item: ArchivedItem
  first: boolean
  onOpen: () => void
}) {
  const [hover, setHover] = useState(false)
  const cell: React.CSSProperties = {
    padding: '14px 16px',
    verticalAlign: 'top',
    borderTop: first ? 'none' : '1px solid var(--color-border-subtle)',
  }
  return (
    <tr
      role="button"
      tabIndex={0}
      aria-label={`View details for ${item.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        cursor: 'pointer',
        background: hover ? 'var(--color-neutral-50)' : 'transparent',
        outline: 'none',
        transition: 'background 100ms ease',
      }}
    >
      {/* Item Name */}
      <td style={{ ...cell, minWidth: 220, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        {item.name}
      </td>

      {/* Description — brief (clamped to two lines) */}
      <td style={{ ...cell, color: 'var(--color-text-secondary)' }}>
        <span
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.what}
        </span>
      </td>

      {/* Date Removed */}
      <td style={{ ...cell, whiteSpace: 'nowrap', color: 'var(--color-text-primary)' }}>
        {item.dateRemoved}
      </td>

      {/* Chevron affordance */}
      <td style={{ ...cell, textAlign: 'right', color: 'var(--color-text-tertiary)' }}>
        <ChevronRight size={16} aria-hidden />
      </td>
    </tr>
  )
}

/** The right-side detail drawer — the full record for the selected item. */
function ArchiveDetailSheet({ item, onClose }: { item: ArchivedItem | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title={item?.name ?? 'Archived item'} width={520}>
      {item && (
        <>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Archived · {item.dateRemoved}
              </p>
              <h2
                style={{
                  margin: '6px 0 0',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 500,
                  fontSize: 'var(--text-heading-2xl)',
                  lineHeight: 'var(--text-heading-2xl--line-height)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {item.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              style={{
                flexShrink: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-subtle)',
                background: 'var(--color-surface-card)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <Field label="Screenshot">
              <ArchiveScreenshot item={item} />
            </Field>

            <Field label="What it was">{item.what}</Field>

            <Field label="Where it lived" mono>
              {item.location}
            </Field>

            {item.flag && (
              <Field label="Governing flag">
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--color-cta-100)',
                    color: 'var(--color-cta-700)',
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                  }}
                >
                  {item.flag}
                </span>
              </Field>
            )}

            <Field label="Why it was removed">{item.reason}</Field>

            <Field label="How to restore" last>
              {item.restoreNote}
            </Field>
          </div>
        </>
      )}
    </Sheet>
  )
}

/** The screenshot slot in the detail drawer — the image of what the component
 *  looked like, or a placeholder prompting one to be added. Falls back to the
 *  placeholder if the image path 404s. */
function ArchiveScreenshot({ item }: { item: ArchivedItem }) {
  const [failed, setFailed] = useState(false)
  const src = item.screenshot ? `${import.meta.env.BASE_URL}${item.screenshot}` : null

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`Screenshot of ${item.name}`}
        onError={() => setFailed(true)}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}
      />
    )
  }

  return (
    <div
      style={{
        padding: '28px 20px',
        textAlign: 'center',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--color-border-subtle)',
        background: 'var(--color-neutral-50)',
        color: 'var(--color-text-tertiary)',
        fontSize: 13,
        lineHeight: '20px',
      }}
    >
      No screenshot yet. Add one at{' '}
      <code>{`public/archive/${item.id}.png`}</code> and set{' '}
      <code>screenshot: '{`archive/${item.id}.png`}'</code> on this item.
    </div>
  )
}

/** One labeled field in the detail drawer. */
function Field({
  label,
  children,
  mono = false,
  last = false,
}: {
  label: string
  children: React.ReactNode
  mono?: boolean
  last?: boolean
}) {
  return (
    <div style={{ marginBottom: last ? 0 : 20 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--color-text-tertiary)',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          lineHeight: '22px',
          color: 'var(--color-text-secondary)',
          ...(mono
            ? {
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                fontSize: 13,
                lineHeight: '20px',
                wordBreak: 'break-word',
              }
            : null),
        }}
      >
        {children}
      </div>
    </div>
  )
}

/** Shared header-cell chrome. */
function Th({
  children,
  style,
  ...rest
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      {...rest}
      style={{
        textAlign: 'left',
        padding: '12px 16px',
        background: 'var(--color-neutral-50)',
        borderBottom: '1px solid var(--color-border-subtle)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: 'var(--color-text-tertiary)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  )
}

/** Friendly placeholder when nothing has been archived yet. */
function ArchiveEmpty() {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        background: 'var(--color-surface-card)',
        border: '1px dashed var(--color-border-subtle)',
        borderRadius: 'var(--radius-xl)',
        color: 'var(--color-text-secondary)',
        fontSize: 14,
        lineHeight: '22px',
      }}
    >
      Nothing archived yet. When a component is removed, keep its file(s) in the repo and add a row
      to <code>src/data/archivedItems.ts</code> so it can be brought back.
    </div>
  )
}
