/**
 * Related Jira tickets for a prototype feature. Two sources:
 *   - The feature's `jiraTickets` config array (shared baseline, in
 *     `prototypeFeatures.ts`) — the source of truth for everyone.
 *   - Reviewer-added tickets pasted at runtime, persisted per feature in
 *     `localStorage` (per browser, like the Done / unlock state) so a reviewer
 *     can attach a link without a code edit.
 *
 * The gateway header merges the two (config first, then the browser-added
 * ones); only the browser-added tickets are removable in the UI.
 */

const KEY = 'cgp.prototypeJira'

type Store = Record<string, string[]>

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {}
  } catch {
    return {}
  }
}

function write(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // Ignore quota / private-mode errors — the list just won't persist.
  }
}

/** Reviewer-added tickets for a feature (localStorage). */
export function getUserJiraTickets(featureId: string): string[] {
  return read()[featureId] ?? []
}

/** Add a ticket URL (de-duped) and return the feature's updated list. */
export function addUserJiraTicket(featureId: string, url: string): string[] {
  const store = read()
  const list = store[featureId] ?? []
  if (!list.includes(url)) store[featureId] = [...list, url]
  write(store)
  return store[featureId] ?? list
}

/** Remove a ticket URL and return the feature's updated list. */
export function removeUserJiraTicket(featureId: string, url: string): string[] {
  const store = read()
  store[featureId] = (store[featureId] ?? []).filter((u) => u !== url)
  write(store)
  return store[featureId]
}

/** Best-effort short label for a Jira URL — the `KEY-123` issue key if present,
 *  else the last path segment, else the host, else the raw string. */
export function jiraTicketLabel(url: string): string {
  const key = url.match(/[A-Z][A-Z0-9]+-\d+/)
  if (key) return key[0]
  try {
    const u = new URL(url)
    const seg = u.pathname.split('/').filter(Boolean).pop()
    return seg || u.hostname
  } catch {
    return url
  }
}
