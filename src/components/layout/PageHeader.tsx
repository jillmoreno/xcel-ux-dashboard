import type { ReactNode } from 'react'

type Props = {
  title: string
  /** Optional sub-line rendered under the title (e.g. record count). */
  description?: ReactNode
  /** Optional right-side slot (e.g. search input, primary button, or a group). */
  right?: ReactNode
  /** When true, the title `<h1>` is suppressed (the description + right slot
   *  still render). Used by the Dashboard Rebrand shell, which owns a single
   *  rail-matched section title — see `PlatformShell`. */
  hideTitle?: boolean
  /**
   * Put the right slot on its OWN ROW, left-aligned under the title block,
   * rather than opposite it. 2026-10-02, the direct choice on the breadcrumb
   * header ("move them below the title").
   *
   * ⚠ IT GOES LEFT, NOT RIGHT. Keeping `space-between` and dropping to a
   * column would leave search and the view toggle hugging the far edge under a
   * flush-left title, which reads as two unrelated rows. Stacked means aligned.
   */
  stack?: boolean
}

/**
 * Shared page header — title on the left, optional sub-line under it, optional
 * right-side slot. Used by Course Catalog, My Courses, Certificates, and
 * Dashboard so the top of every primary page has the same layout shape.
 */
export function PageHeader({
  title,
  description,
  right,
  hideTitle = false,
  stack = false,
}: Props) {
  // Nothing to render once the title is hidden and there's no sub-line or
  // right slot — skip the row entirely so it leaves no empty margin.
  if (hideTitle && description == null && right == null) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 24,
        marginBottom: 8,
        flexWrap: 'wrap',
        ...(stack
          ? { flexDirection: 'column', alignItems: 'stretch', gap: 16 }
          : null),
      }}
    >
      {/* ⚠ RENDERED EVEN WHEN EMPTY in the ROW layout, and it has to be: it is
          the `space-between` spacer that holds the right slot against the right
          edge. Stacked, there is nothing to space, so an empty box would only
          add its gap. */}
      {(!stack || !hideTitle || description != null) && (
      <div>
        {!hideTitle && (
          <h1
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 500,
              fontSize: 'var(--text-heading-3xl)',
              lineHeight: 'var(--text-heading-3xl--line-height)',
              margin: 0,
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h1>
        )}
        {description != null && (
          <div style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-secondary)' }}>{description}</div>
        )}
      </div>
      )}
      {right != null && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            ...(stack ? { flexWrap: 'wrap' } : null),
          }}
        >
          {right}
        </div>
      )}
    </div>
  )
}
