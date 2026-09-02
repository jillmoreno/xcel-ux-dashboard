import { useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, Plus, X } from '@/icons'
import {
  getUserJiraTickets,
  addUserJiraTicket,
  removeUserJiraTicket,
  jiraTicketLabel,
} from './jiraTicketsUtil'

/**
 * "Related Jira Tickets" row — used on both the feature gateway
 * (`PrototypeFeaturePage`) and each component's handoff detail page
 * (`PrototypeHandoffDetailPage`).
 *
 * Two ticket sources for the row's OWN scope:
 *   - `configTickets` — the shared baseline in `prototypeFeatures.ts`
 *     (`feature.jiraTickets` / `component.jiraTickets`). Non-removable in the
 *     UI (managed in code).
 *   - Runtime tickets pasted via "+ Add ticket", persisted per browser in
 *     localStorage under `scopeKey` (removable with the ×).
 *
 * `inherited` is an extra, READ-ONLY list the feature gateway passes so tickets
 * added on any of its handoff pages also surface here (deduped against this
 * scope's own tickets). They're managed on their own handoff page, so they get
 * no × here — a `title` notes where they came from.
 */
type InheritedTicket = { url: string; from?: string }

export function RelatedJiraTickets({
  scopeKey,
  configTickets = [],
  inherited = [],
}: {
  /** localStorage scope — the `featureId` (gateway) or `${featureId}::${componentId}` (handoff page). */
  scopeKey: string
  configTickets?: string[]
  inherited?: InheritedTicket[]
}) {
  const [userTickets, setUserTickets] = useState<string[]>(() => getUserJiraTickets(scopeKey))
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  // This scope's own tickets: config (not removable) + runtime (removable).
  const own = [
    ...configTickets.map((url) => ({ url, removable: false })),
    ...userTickets.filter((u) => !configTickets.includes(u)).map((url) => ({ url, removable: true })),
  ]
  const ownUrls = new Set(own.map((t) => t.url))
  // Inherited (component) tickets, deduped against this scope's own.
  const inheritedRows = inherited.filter((t, i, arr) => {
    if (ownUrls.has(t.url)) return false
    return arr.findIndex((o) => o.url === t.url) === i
  })

  const submit = () => {
    const url = draft.trim()
    if (!url) return
    setUserTickets(addUserJiraTicket(scopeKey, url))
    setDraft('')
    setAdding(false)
  }

  const hasNone = own.length === 0 && inheritedRows.length === 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>
        Related Jira Tickets:
      </span>
      {hasNone && !adding && (
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>None linked yet</span>
      )}
      {own.map(({ url, removable }) => (
        <span key={url} style={pillStyle}>
          <a href={url} target="_blank" rel="noreferrer" style={linkStyle}>
            <ArrowUpRightFromSquare size={11} aria-hidden />
            {jiraTicketLabel(url)}
          </a>
          {removable && (
            <button
              type="button"
              onClick={() => setUserTickets(removeUserJiraTicket(scopeKey, url))}
              aria-label={`Remove ${jiraTicketLabel(url)}`}
              style={removeStyle}
            >
              <X size={10} aria-hidden />
            </button>
          )}
        </span>
      ))}
      {inheritedRows.map(({ url, from }) => (
        <span
          key={url}
          style={pillStyle}
          title={from ? `Added on the ${from} handoff page` : 'Added on a handoff page'}
        >
          <a href={url} target="_blank" rel="noreferrer" style={linkStyle}>
            <ArrowUpRightFromSquare size={11} aria-hidden />
            {jiraTicketLabel(url)}
          </a>
        </span>
      ))}
      {adding ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            autoFocus
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              } else if (e.key === 'Escape') {
                setAdding(false)
                setDraft('')
              }
            }}
            placeholder="Paste Jira URL…"
            aria-label="Jira ticket URL"
            style={inputStyle}
          />
          <button type="button" onClick={submit} style={addStyle}>
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false)
              setDraft('')
            }}
            style={cancelStyle}
          >
            Cancel
          </button>
        </span>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={ctaStyle}>
          <Plus size={12} aria-hidden />
          Add ticket
        </button>
      )}
    </div>
  )
}

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

const inputStyle: CSSProperties = {
  padding: '5px 10px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  minWidth: 220,
}

const addStyle: CSSProperties = {
  padding: '5px 12px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: 'var(--color-action)',
  color: 'var(--color-neutral-50)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const cancelStyle: CSSProperties = {
  padding: '5px 8px',
  border: 'none',
  background: 'transparent',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
