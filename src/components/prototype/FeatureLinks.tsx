import { useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, Plus, X } from '@/icons'
import {
  getUserFeatureLinks,
  addUserFeatureLink,
  removeUserFeatureLink,
  featureLinkLabel,
  isLinkableHref,
  type FeatureLink,
} from './featureLinksUtil'

/**
 * "Links" row on the feature gateway — anything the feature points at that
 * lives elsewhere: research, decks, transcripts, write-ups, Figma files, a
 * deployed build. Deliberately NOT narrowed to one kind — the row exists so a
 * link can be added as needed, and naming it for one use is exactly what would
 * stop the next one being put here.
 *
 * Built as a sibling of `RelatedJiraTickets` on purpose: same pill chrome, same
 * inline add-and-persist behaviour, same two sources (a `links` config
 * array everyone sees, plus runtime links in localStorage). A row that looked
 * or behaved differently would imply a difference that isn't there.
 *
 * Two things it does that the ticket row does not, both because a research URL
 * is arbitrary where a Jira URL is not:
 *
 *  - IT CHECKS THE PROTOCOL. Every stored URL is rendered as an `href`, so a
 *    `javascript:` value would be click-to-run script. A failing one renders as
 *    plain text marked "not a linkable address" rather than disappearing — a
 *    typo you can see is a typo you can fix. (`RelatedJiraTickets` has no such
 *    guard; its URLs are pasted from one known host, but it is the same
 *    exposure and worth closing there too.)
 *  - IT TAKES AN OPTIONAL LABEL. A Jira URL carries its own name in the issue
 *    key; a research URL usually ends in a document id, so without a label the
 *    row would be a line of hostnames. Unlabelled falls back to the host.
 */
export function FeatureLinks({
  scopeKey,
  configLinks = [],
  compact = false,
}: {
  /** localStorage scope — the `featureId`. */
  scopeKey: string
  /** Shared baseline from `prototypeFeatures.ts`; not removable in the UI. */
  configLinks?: FeatureLink[]
  /** Sit in the gateway's metadata block rather than owning a standalone row.
   *  Drops the top margin and the "None linked yet" text — NOT the label, which
   *  always shows here; see the note at `hasNone`. */
  compact?: boolean
}) {
  const [userLinks, setUserLinks] = useState<FeatureLink[]>(() => getUserFeatureLinks(scopeKey))
  const [adding, setAdding] = useState(false)
  const [draftUrl, setDraftUrl] = useState('')
  const [draftLabel, setDraftLabel] = useState('')

  const configUrls = new Set(configLinks.map((l) => l.url))
  const rows = [
    ...configLinks.map((link) => ({ link, removable: false })),
    ...userLinks.filter((l) => !configUrls.has(l.url)).map((link) => ({ link, removable: true })),
  ]

  const submit = () => {
    const url = draftUrl.trim()
    if (!url) return
    setUserLinks(addUserFeatureLink(scopeKey, url, draftLabel))
    setDraftUrl('')
    setDraftLabel('')
    setAdding(false)
  }

  const cancel = () => {
    setAdding(false)
    setDraftUrl('')
    setDraftLabel('')
  }

  const hasNone = rows.length === 0
  // The LABEL ALWAYS SHOWS, unlike the ticket row's compact mode, and the
  // difference is that this row owns its line. "+ Add ticket" names its own
  // subject so it survives alone on a shared line; a lone "+ Add link" says
  // nothing about what the link is FOR, and a bare affordance on its own line
  // reads as a stray control rather than an empty Links row.

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: compact ? 0 : 16,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
        Links:
      </span>
      {hasNone && !adding && !compact && (
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>None linked yet</span>
      )}
      {rows.map(({ link, removable }) => {
        const label = featureLinkLabel(link)
        const linkable = isLinkableHref(link.url)
        return (
          <span key={link.url} style={pillStyle} title={link.url}>
            {linkable ? (
              <a href={link.url} target="_blank" rel="noreferrer" style={linkStyle}>
                <ArrowUpRightFromSquare size={11} aria-hidden />
                {label}
              </a>
            ) : (
              <span style={{ ...linkStyle, color: 'var(--color-text-secondary)' }}>
                {label}
                <span style={{ fontWeight: 400, fontStyle: 'italic' }}>
                  {' '}
                  — not a linkable address
                </span>
              </span>
            )}
            {removable && (
              <button
                type="button"
                onClick={() => setUserLinks(removeUserFeatureLink(scopeKey, link.url))}
                aria-label={`Remove ${label}`}
                style={removeStyle}
              >
                <X size={10} aria-hidden />
              </button>
            )}
          </span>
        )
      })}
      {adding ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <input
            autoFocus
            type="url"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              } else if (e.key === 'Escape') cancel()
            }}
            placeholder="Paste URL…"
            aria-label="Link URL"
            style={inputStyle}
          />
          <input
            type="text"
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              } else if (e.key === 'Escape') cancel()
            }}
            placeholder="Label (optional)"
            aria-label="Link label"
            style={{ ...inputStyle, width: 150 }}
          />
          <button type="button" onClick={submit} style={addStyle}>
            Add
          </button>
          <button type="button" onClick={cancel} style={cancelStyle}>
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={ctaStyle}>
          <Plus size={12} aria-hidden />
          Add link
        </button>
      )}
    </div>
  )
}

/* ─── styles — matched to RelatedJiraTickets so the two rows read as a set ── */

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 6px 3px 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-border-subtle)',
}

const linkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
}

const removeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-tertiary)',
  cursor: 'pointer',
}

const inputStyle: CSSProperties = {
  width: 230,
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
}

const addStyle: CSSProperties = {
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
}

const cancelStyle: CSSProperties = {
  padding: '4px 8px',
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-tertiary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px dashed var(--color-border-subtle)',
  background: 'transparent',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
