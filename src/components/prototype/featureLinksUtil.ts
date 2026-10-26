/**
 * Links for a prototype feature — anything it points at that lives elsewhere:
 * research, decks, transcripts, write-ups, Figma files, a deployed build. Two
 * sources, mirroring `jiraTicketsUtil`:
 *   - the feature's `links` config array (shared baseline, in
 *     `prototypeFeatures.ts`), which everyone sees;
 *   - links added at runtime, persisted per feature in `localStorage`, so one
 *     can be attached without a code edit.
 *
 * Deliberately NOT the `links` nav section's server-side store. That list is
 * the site's shared address book and is scoped to the whole dashboard; this is
 * scoped to ONE feature and belongs beside its Jira row. Two different scopes,
 * and folding a per-feature link into a global list is how it stops being
 * findable from the feature.
 */

const KEY = 'cgp.prototypeLinks'

export type FeatureLink = { url: string; label?: string }

type Store = Record<string, FeatureLink[]>

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

/**
 * ONLY http(s) may reach an `href`. Every stored URL is rendered as a link, so
 * this is a security boundary, not tidying: without it a stored
 * `javascript:…` becomes a click-to-run script for anyone opening the page.
 * The same rule the Links section applies at both of its boundaries.
 *
 * A failing value is NOT silently dropped — the row renders it as plain text
 * marked "not a linkable address", so a typo is visible and fixable rather
 * than vanishing and looking like a save that failed.
 */
export function isLinkableHref(url: string): boolean {
  try {
    const p = new URL(url, window.location.origin).protocol
    return p === 'http:' || p === 'https:'
  } catch {
    return false
  }
}

/** Runtime-added research links for a feature (localStorage). */
export function getUserFeatureLinks(featureId: string): FeatureLink[] {
  const list = read()[featureId]
  return Array.isArray(list) ? list.filter((l) => l && typeof l.url === 'string') : []
}

/** Add a link (de-duped on URL) and return the feature's updated list. */
export function addUserFeatureLink(featureId: string, url: string, label?: string): FeatureLink[] {
  const store = read()
  const list = store[featureId] ?? []
  if (!list.some((l) => l.url === url)) {
    store[featureId] = [...list, label?.trim() ? { url, label: label.trim() } : { url }]
  }
  write(store)
  return store[featureId] ?? list
}

/** Remove a link and return the feature's updated list. */
export function removeUserFeatureLink(featureId: string, url: string): FeatureLink[] {
  const store = read()
  store[featureId] = (store[featureId] ?? []).filter((l) => l.url !== url)
  write(store)
  return store[featureId]
}

/**
 * Best-effort short label — an authored one wins, else the host with `www.`
 * dropped, since these URLs often end in a document id that reads as noise ("1aB2c3"). Falls back to the raw string.
 */
export function featureLinkLabel(link: FeatureLink): string {
  if (link.label?.trim()) return link.label.trim()
  try {
    return new URL(link.url).hostname.replace(/^www\./, '')
  } catch {
    return link.url
  }
}
