import { useState } from 'react'
import { Package, X } from '@/icons'
import { Sheet } from '@/components/ui/Sheet'
import { ARCHIVED_ITEMS, type ArchivedItem } from '@/data/archivedItems'
import { GeneratedThumb, THUMB_H, THUMB_W } from './GeneratedThumb'
import { HubImageThumb, HubRow } from './HubRow'
import { hubListStyle } from './hubRowStyles'

/**
 * The Archive section's body — the components and variants removed from the
 * project (`ARCHIVED_ITEMS`, see that file for the "unwire but keep the code
 * + log a row" convention). Clicking a row opens a right-side detail Sheet
 * with the full record: where it lived, the governing flag, the reason, and
 * how to restore it.
 *
 * ROWS, NOT A TABLE (2026-11-01). It was a three-column table — Item Name ·
 * Description · Date Removed — the one section on the Hub drawn as a grid.
 * Jillienne, on the Prototypes rows: "I want ALL of the pages to follow this
 * similar UI so its consistent." So each item is a `HubRow` now: its
 * screenshot (or the generated mark, in the archive's neutral hue) for the
 * thumbnail, its name and what it was, and three tags — when it was removed,
 * the flag that governed it, and where it lived. The row opens the same
 * Sheet it always did; the kebab offers the same thing, for the keyboard.
 *
 * The rows are on `--ux-*` tokens like every other panel's; the Sheet is
 * unchanged and still reads the brand tokens the `ARCHIVE_BRIDGE` wrapper at
 * the call site re-points, so that wrapper stays.
 */
export function ArchiveTable() {
  const [selected, setSelected] = useState<ArchivedItem | null>(null)

  if (ARCHIVED_ITEMS.length === 0) return <ArchiveEmpty />

  return (
    <>
      <div style={hubListStyle}>
        {ARCHIVED_ITEMS.map((item) => (
          <HubRow
            key={item.id}
            id={`archived-${item.id}`}
            thumb={
              item.screenshot ? (
                /* The same path the Sheet's screenshot resolves — BASE_URL in
                   front, so a branch build served under a prefix still finds
                   the file. */
                <HubImageThumb src={`${import.meta.env.BASE_URL}${item.screenshot}`} width={THUMB_W} height={THUMB_H} />
              ) : (
                <GeneratedThumb accent="neutral">
                  <Package size={34} />
                </GeneratedThumb>
              )
            }
            title={item.name}
            description={item.what}
            tags={[
              { key: 'removed', text: `Removed ${item.dateRemoved}` },
              ...(item.flag ? [{ key: 'flag', text: item.flag, title: `Governing flag: ${item.flag}` }] : []),
              { key: 'location', text: locationLabel(item.location), title: item.location },
            ]}
            onOpen={() => setSelected(item)}
            openLabel={`View details for ${item.name}`}
            actions={[{ id: 'details', label: 'View details', onSelect: () => setSelected(item) }]}
            menuLabel={`Actions for ${item.name}`}
          />
        ))}
      </div>

      <ArchiveDetailSheet item={selected} onClose={() => setSelected(null)} />
    </>
  )
}

/** The last path segment of where an item lived — `ProfilePage.tsx` rather
 *  than the whole `src/pages/ProfilePage.tsx — the card under …` sentence,
 *  which is the Sheet's to show in full. A location that is prose rather
 *  than a path (nothing with a slash in it) is shown as it is, clipped by
 *  the tag. */
function locationLabel(location: string): string {
  const head = location.split(/\s[—–-]\s/)[0].trim()
  if (!head.includes('/')) return head
  const parts = head.split('/')
  return parts[parts.length - 1] || head
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
