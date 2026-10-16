/**
 * Links — the browser side of the authoring endpoint.
 *
 * Deliberately UNLIKE `qaNoteStore.ts` in one respect: there is no committed
 * seed and therefore no merge. The QA section ships an array in
 * `src/data/qaNotes.ts` that stored records override; the Links section ships
 * nothing, because its whole reason for existing is that a link can be added
 * without touching the repo. So the store is the list, full stop.
 *
 * The cost of that is real and worth stating plainly: Netlify Blobs is not
 * backed up, so this list lives in exactly one place. `toMarkdown` is the
 * mitigation, the same one `todoStore.ts` uses — one click to get the list
 * somewhere durable.
 *
 * A module of hooks and helpers with no component in it, so fast refresh keeps
 * working — same reason `todoStore.ts` sits beside `TodoPanel.tsx`.
 */

import { useCallback, useEffect, useState } from 'react'

/**
 * SHARED with the Demo board since 2026-09-18. Everything below the type
 * declarations is `createLinkBoard(config)`, and this module's named exports
 * are the LINKS instance of it — so every existing import keeps working, and
 * `demoStore.ts` is a second instance with a different endpoint, event and
 * label rather than a second copy of this file.
 */
export type LinkBoardConfig = {
  /** `/api/links` — the collection; `${base}/:id` is one record. */
  base: string
  /** Window event fired on every write, so a nav badge can re-read. */
  event: string
  /** `localStorage` key for the last `addedBy` this browser typed. Shared
   *  across boards on purpose — it is a fact about the person at the keyboard,
   *  not about the board. */
  lastAuthorKey: string
}

/**
 * Fired on every successful write, so the nav badge re-reads without the page
 * having to own the list.
 *
 * A plain `storage` event would not do it — that only fires for OTHER tabs, and
 * the badge and the panel are in the same one. Same mechanism and same reason as
 * `todoStore`'s `cgp.todo`.
 *
 * Dispatched from inside the write helpers rather than from the panel, so a
 * second caller cannot add a link and leave the badge behind. That is not
 * hypothetical: the badge shipped saying 2 with three links on screen, which is
 * the same defect `useQaNoteCount` still has one section down.
 */

/**
 * What kind of thing a link points at.
 *
 * INVENTED — an editorial taxonomy, not something XCEL publishes. Owner:
 * whoever is running the project. It is four because four covers what the list
 * actually holds (a brief, a Figma file, a deployed build, marketing pages) and
 * because the filter strip has to stay one line; a value nobody uses is a dead
 * pill. Add or rename here and the compiler lists the call sites.
 *
 * Shaped like `TODO_STAGES` — an `as const` list plus a `| ''` member for "not
 * set" — because it is the same kind of thing and the two should read alike.
 * `''` rather than an optional key so "never had one" and "had one and cleared
 * it" stay one state, the same rule `note` and `addedBy` follow.
 */
export const LINK_TYPES = [
  { id: 'brief', label: 'Brief' },
  { id: 'design', label: 'Design' },
  { id: 'prototype', label: 'Prototype' },
  { id: 'reference', label: 'Reference' },
] as const

export type LinkType = (typeof LINK_TYPES)[number]['id'] | ''

export function linkTypeLabel(type: LinkType): string {
  return LINK_TYPES.find((t) => t.id === type)?.label ?? ''
}

/**
 * Which product a Refinement row is about (2026-09-29).
 *
 * Refinement collects branches from two products that share this dashboard, and
 * the title alone does not say which — "Learner Home - Testing 1" could be
 * either. This is the filter people actually want.
 *
 * `both` is the DEFAULT and it is a real answer, not "unset": a lot of this
 * work (navigation, tokens, the shell) genuinely lands in both. That is why
 * there is no `''` member here the way `LINK_TYPES` has one — every row has a
 * product, and a record written before this field existed normalises to `both`,
 * which is true of it: it predates the distinction, so it claims neither.
 */
export const LINK_PRODUCTS = [
  // Labelled "Atlas" since 2026-10-15 (Jillienne, on the board): the product
  // is XCEL, but the work on this side of the line is the Atlas dashboard, and
  // that is the word the tag should say beside "Compass". The ID stays `xcel`
  // — it is what every stored record carries.
  { id: 'xcel', label: 'Atlas' },
  { id: 'compass', label: 'Compass' },
  { id: 'both', label: 'Both' },
] as const

export type LinkProduct = (typeof LINK_PRODUCTS)[number]['id']

export const DEFAULT_PRODUCT: LinkProduct = 'both'

export function linkProductLabel(product: LinkProduct): string {
  return LINK_PRODUCTS.find((x) => x.id === product)?.label ?? ''
}

/** Whether a row belongs under a filter pill. `both` matches XCEL and Compass
 *  alike — that is the whole point of the value, and the reason this is a
 *  function rather than an `===` at the call site. */
export function matchesProduct(row: LinkProduct, filter: LinkProduct | ''): boolean {
  if (!filter) return true
  if (row === 'both') return true
  return row === filter
}

/* ── the designers ────────────────────────────────────────────────────────── */

/**
 * The team roster — the Refinement board's filter pills and its Added by
 * choices (2026-10-15, Jillienne: "go with roster and match those options in
 * the Added By field"). A FIXED list rather than whatever names happen to be
 * on the board, so the pills never drift with a typo and a designer with no
 * row yet still has a pill. The same five people `PROTOTYPE_SCOPES` names as
 * owners, in the order the scopes list them.
 *
 * ⚠ "Jill", not "Jillienne", since 2026-10-16 — her own rows on the board were
 * already signed that way, `git config user.name` on her machine is "Jill
 * Moreno", and the To Do Board's roster seeds from this list, so the one
 * spelling has to be the one she actually uses. `matchesDesigner` CONTAINS,
 * so rows signed either way still land under the pill; it was the other
 * direction that was broken, a "Jillienne" pill catching none of her "Jill"
 * rows. `PROTOTYPE_SCOPES` still says "Jillienne" — that is design authority
 * on a surface, a different list for a different job.
 */
export const DESIGNERS = ['Jill', 'Anjani', 'Eric', 'Afsana', 'Cody'] as const

export type Designer = (typeof DESIGNERS)[number]

/** Whether a row's typed author is this designer. Case-insensitive and a
 *  CONTAINS match, so the free-text names on records written before Added by
 *  became a choice — "eric w", "Afsana & Eric" — land under the right pill
 *  (and a shared row under both). '' is All. */
export function matchesDesigner(addedBy: string, filter: Designer | ''): boolean {
  if (!filter) return true
  return addedBy.toLowerCase().includes(filter.toLowerCase())
}

/* ── the features ───────────────────────────────────────────────── */

/**
 * FEATURE REFINEMENT — 2026-10-15, Jillienne.
 *
 * A Refinement row is one CHUNK of work: a branch, built, put up to be looked
 * at. `feature` is what the chunk is part of, and it is the axis the board
 * groups on — so three small branches on the study streak card read as one
 * feature with a history, instead of three rows nobody can tell apart.
 *
 * FREE TEXT, with the features already on the board offered as suggestions.
 * A curated list was the alternative and was rejected on 2026-10-15: every new
 * piece of work would wait on Jillienne to add a value, and that is friction at
 * exactly the moment the point is to make cutting a fresh branch cheap. The
 * cost is that "Streak card" and "streak card" could become two groups, which
 * `featureKey` is the mitigation for — grouping is case- and space-insensitive,
 * and the label shown is the one the newest chunk typed.
 *
 * '' is a real state and the one every record written before today is in: an
 * ungrouped row, which renders exactly as a row does now. There is no backfill
 * and no migration — the board is mixed on purpose while the habit forms.
 */
export const MAX_FEATURE = 80

/** The grouping key. Case- and whitespace-insensitive, so "Streak card" and
 *  "streak  Card" are one feature. Returns '' for an ungrouped row. */
export function featureKey(feature: string): string {
  return feature.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Every feature on the board, most recently touched first — the Add form's
 * suggestions.
 *
 * Deduplicated by `featureKey` and labelled with the spelling of the row that
 * comes first, which (given the board sorts newest first) is the most recent
 * one. So a designer who corrects a capitalisation sees their correction
 * offered from then on, rather than the original typo winning forever.
 *
 * Reads ARCHIVED rows too: a feature does not stop being a word the team uses
 * because its last chunk was archived, and leaving it out would invite a
 * near-miss spelling the next time someone picks the work back up.
 */
export function knownFeatures(links: StoredLink[]): string[] {
  const seen = new Map<string, string>()
  for (const l of links) {
    const key = featureKey(l.feature)
    if (key && !seen.has(key)) seen.set(key, l.feature.trim())
  }
  return [...seen.values()]
}

/**
 * Whether `link` has been replaced by a later chunk — some other LIVE row
 * pointing at it with `supersedes`.
 *
 * Derived from the board rather than stored on the superseded row, so the
 * relation has exactly one writer: the newer chunk says what it replaces, and
 * nothing has to reach back and stamp a row it does not own. The consequence
 * worth knowing: ARCHIVE the newer chunk and the older one comes back out of
 * the collapsed list, which is the honest reading — the thing that replaced it
 * is no longer on the board.
 */
export function isSuperseded(link: StoredLink, all: StoredLink[]): boolean {
  return all.some((other) => isLive(other) && other.supersedes === link.id)
}

/**
 * The board, arranged for rendering: a list of GROUPS (a feature and its
 * chunks, newest first) and SINGLES (a row with no feature), ordered together
 * by how recently each was touched.
 *
 * Interleaved rather than "all the groups, then the ungrouped" on purpose. The
 * board is mixed while the habit forms, and a trailing bucket of everything
 * written before today would read as a backlog to clear — these are just rows,
 * and they should stay where their date puts them.
 *
 * `all` is the UNFILTERED index and is what decides whether a chunk is
 * superseded; `rows` is what the filters left. A chunk stays in the collapsed
 * half of its group when a search is on, because whether it was replaced is a
 * fact about the work, not about what is currently on screen.
 */
export type FeatureGroup = {
  kind: 'group'
  /** The grouping key — stable, lowercased. */
  key: string
  /** What to print: the newest chunk's own spelling. */
  label: string
  /** Not superseded — the chunks that are still the current answer. */
  current: StoredLink[]
  /** Superseded by a later chunk. Collapsed behind a toggle, never hidden. */
  earlier: StoredLink[]
}

export type FeatureSingle = { kind: 'single'; key: string; link: StoredLink }

export type BoardItem = FeatureGroup | FeatureSingle

/** The sort key `sortLinks` uses, so an item orders by the same clock its rows
 *  do. */
function rowKey(l: StoredLink): string {
  return l.updatedAt || l.addedDate
}

export function groupByFeature(rows: StoredLink[], all: StoredLink[]): BoardItem[] {
  const groups = new Map<string, FeatureGroup>()
  const items: BoardItem[] = []

  for (const link of rows) {
    const key = featureKey(link.feature)
    if (!key) {
      items.push({ kind: 'single', key: link.id, link })
      continue
    }
    let group = groups.get(key)
    if (!group) {
      // `rows` arrives newest-first, so the first chunk seen is the newest and
      // its spelling is the label — the same rule `knownFeatures` follows.
      group = { kind: 'group', key, label: link.feature.trim(), current: [], earlier: [] }
      groups.set(key, group)
      items.push(group)
    }
    if (isSuperseded(link, all)) group.earlier.push(link)
    else group.current.push(link)
  }

  // Already in order: `rows` is newest-first and each item was pushed when its
  // newest row was seen. Sorting again would be a second, subtly different
  // answer to a question already settled.
  return items
}

/** The newest chunk of this feature by this author, or null — what the form
 *  offers as "Replaces". Excludes `exclude` (the row being edited), so a row
 *  cannot be offered the chance to replace itself. */
export function latestChunkFor(
  links: StoredLink[],
  feature: string,
  addedBy: string,
  exclude?: string,
): StoredLink | null {
  const key = featureKey(feature)
  if (!key) return null
  const who = addedBy.trim().toLowerCase()
  const mine = links.filter(
    (l) =>
      isLive(l) &&
      l.id !== exclude &&
      featureKey(l.feature) === key &&
      // No author typed yet → every chunk of the feature is a candidate, which
      // is the useful answer while the form is still being filled in. With one
      // typed, match it loosely in both directions for the same reason
      // `matchesDesigner` does: the board carries "eric w" and "Afsana & Eric"
      // as well as roster names.
      (!who ||
        !l.addedBy.trim() ||
        l.addedBy.toLowerCase().includes(who) ||
        who.includes(l.addedBy.trim().toLowerCase())),
  )
  if (!mine.length) return null
  return [...mine].sort((a, b) => rowKey(b).localeCompare(rowKey(a)))[0]
}

/** A row that is on the board, as opposed to in its archive. */
export function isLive(link: StoredLink): boolean {
  return !link.archivedAt
}

export type StoredLink = {
  /** `link-007`, allocated server-side. */
  id: string
  title: string
  /** Always a full absolute address. See `safeHref` before rendering it. */
  url: string
  /** '' when there is none — an absent note and a cleared one are one state. */
  note: string
  /** Who put it here. '' when unset, same rule as `note`. A typed LABEL, not an
   *  identity: nothing authenticates this endpoint, so a name the server claimed
   *  to know would be a guess dressed as a fact. */
  addedBy: string
  /** What kind of thing it points at. '' when unset — optional, so the records
   *  written before this field existed stay valid without a backfill. */
  type: LinkType
  /** Which product this row is about. Only the Demo board's endpoint stores it
   *  (Links drops the field); everywhere else it normalises to `both`. */
  product: LinkProduct
  /** `yyyy-mm-dd`, stamped server-side on create and carried through edits. */
  addedDate: string
  /** ISO timestamp of the last SAVE, stamped server-side on every write
   *  (2026-10-14). '' on a record written before the field existed — those
   *  rows show no "Updated" rather than a guess. Shown on Refinement only. */
  updatedAt: string
  /** ISO timestamp of when the row was ARCHIVED — hidden from the board, not
   *  deleted (2026-10-15, Jillienne). '' means it is live, which is every row
   *  on every board but Refinement, the only one with the control. Stamped
   *  server-side the first time a record is archived and cleared when it is
   *  unarchived; see `isLive`. */
  archivedAt: string
  /** Who archived it — a typed label like `addedBy`, '' when live. */
  archivedBy: string
  /** What this chunk is PART OF — the grouping axis (2026-10-15). Free text,
   *  '' when ungrouped, which is every record written before the field
   *  existed. See the features block above. */
  feature: string
  /** The id of the chunk this one REPLACES, or '' — written by the newer
   *  chunk, never by the older one. See `isSuperseded`. */
  supersedes: string
}

/** The editable fields. `id`, `addedDate` and `updatedAt` are not among them —
 *  the server owns all three, so a form cannot renumber a link, backdate it,
 *  or claim it was just saved. `isPublic` is
 *  optional on the way IN because only one board has the control for it. */
export type LinkDraft = Pick<StoredLink, 'title' | 'url' | 'note' | 'addedBy' | 'type'> & {
  /** Optional on the way IN because only one board has the control for it. */
  product?: LinkProduct
  /** The archive state, Refinement only. `archived` is the intent; the server
   *  owns the stamp and keeps the one the client echoes back (`archivedAt`)
   *  while a record stays archived, so editing an archived row does not
   *  re-date or un-archive it. See `archiveLink`. */
  archived?: boolean
  archivedAt?: string
  archivedBy?: string
  /** Refinement only, both of them — the boards without the controls drop the
   *  fields on the way in, so a Resources row cannot quietly acquire a feature
   *  nothing on that board can show or edit. */
  feature?: string
  supersedes?: string
}

export type LinkIndex = {
  /** False when there is no endpoint to talk to — plain `npm run dev`, or a
   *  deploy without the function. The page then says so rather than offering an
   *  Add button that cannot work. */
  available: boolean
  /** True until the first request settles. Separate from `available` because
   *  "not loaded yet" and "no endpoint" are different facts and the empty state
   *  says different things about them — with one flag the page tells the reader
   *  to go run `netlify dev` for the tick before the fetch resolves. */
  loading: boolean
  links: StoredLink[]
}

export const EMPTY_LINK_INDEX: LinkIndex = { available: false, loading: true, links: [] }

const UNAVAILABLE: LinkIndex = { available: false, loading: false, links: [] }

/* ── rendering a stored URL ───────────────────────────────────────────────── */

const ALLOWED_PROTOCOLS = ['http:', 'https:']

/**
 * The href to render, or null if the stored value is not safe to put in one.
 *
 * The endpoint already allow-lists http/https, so in normal operation this
 * never returns null. It exists because the check that matters is the one at
 * the point of USE: a record written by an older or laxer version of the
 * endpoint, or restored from somewhere else, must not become live code just
 * because it is in the store. `javascript:` in an href executes in this
 * origin — that is the whole risk, and it is why this is an allow-list rather
 * than a list of schemes to strip.
 */
export function safeHref(url: string): string | null {
  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsed.protocol) ? parsed.toString() : null
  } catch {
    return null
  }
}

/** `docs.google.com` — the bit of a URL worth showing beside a title. Falls
 *  back to the raw string rather than throwing, so an unparseable stored value
 *  still renders as text even though `safeHref` will refuse to link it. */
export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}

/* ── validation, client side ──────────────────────────────────────────────── */

/**
 * What the form checks before it bothers the network.
 *
 * NOT the authority — the endpoint validates independently and its answer is
 * the one that counts. This exists so a typo is reported instantly instead of
 * after a round trip, and the two are kept deliberately in step: same required
 * fields, same protocol allow-list.
 */
export function draftProblems(draft: LinkDraft): string[] {
  const errors: string[] = []
  if (!draft.title.trim()) errors.push('Give the link a title.')
  const url = draft.url.trim()
  if (!url) {
    errors.push('Paste the address.')
  } else if (!safeHref(url)) {
    errors.push('That needs to be a full address starting with http:// or https://.')
  }
  return errors
}

/* ── the wire ─────────────────────────────────────────────────────────────── */

function isLink(v: unknown): v is StoredLink {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'string' && typeof o.title === 'string' && typeof o.url === 'string'
}

/**
 * The last `addedBy` this browser used, so it does not have to be retyped for
 * every record.
 *
 * `localStorage`, per browser, and that is the right scope for it: it is a
 * convenience about the person at this keyboard, not a fact about the record —
 * the fact is on the record, which is shared. Failing silently is fine; the
 * field is optional and an empty prefill costs nothing.
 */
function readLastAuthorFrom(key: string): string {
  try {
    return localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function rememberLastAuthorIn(key: string, name: string): void {
  try {
    const trimmed = name.trim()
    if (trimmed) localStorage.setItem(key, trimmed)
    else localStorage.removeItem(key)
  } catch {
    /* private mode — the prefill just does not persist */
  }
}

/** Normalise rather than trust: a record from an older version of the endpoint
 *  should degrade to a usable row instead of throwing the whole page. */
function normalise(v: StoredLink): StoredLink {
  return {
    id: v.id,
    title: v.title,
    url: v.url,
    note: typeof v.note === 'string' ? v.note : '',
    // Absent on every record written before the field existed, which is exactly
    // the case `normalise` is here for — those rows read as "no author", not as
    // a broken page.
    addedBy: typeof v.addedBy === 'string' ? v.addedBy : '',
    // Anything unrecognised degrades to untyped rather than rendering a chip
    // for a value this build has no label for — the same "normalise, do not
    // trust" rule the rest of this function follows.
    type: LINK_TYPES.some((t) => t.id === v.type) ? (v.type as LinkType) : '',
    // Unrecognised or absent → `both`. Unlike `type`, there is no "unset" to
    // fall back to, and `both` is the honest reading of a row that predates the
    // field: it was written when the distinction did not exist, so it claims
    // neither product. It also FAILS OPEN for the filter — a row lands under
    // every pill rather than disappearing from all of them, which is the right
    // direction for a list whose whole job is not losing work.
    product: LINK_PRODUCTS.some((x) => x.id === v.product)
      ? (v.product as LinkProduct)
      : DEFAULT_PRODUCT,
    // `isPublic` is no longer read (2026-10-15, the public site retired); a
    // record that still carries it is simply a row, like every other.
    addedDate: typeof v.addedDate === 'string' ? v.addedDate : '',
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '',
    // Absent on every record written before the archive existed, and on every
    // board but Refinement — both read as live, which is what they are.
    archivedAt: typeof v.archivedAt === 'string' ? v.archivedAt : '',
    archivedBy: typeof v.archivedBy === 'string' ? v.archivedBy : '',
    // Absent on every record written before Feature Refinement, and on every
    // board but Refinement. Both read as an ungrouped row, which is what they
    // are — there is no backfill, by design.
    feature: typeof v.feature === 'string' ? v.feature : '',
    supersedes: typeof v.supersedes === 'string' ? v.supersedes : '',
  }
}

/** Most recently SAVED first (2026-10-14, Jillienne: "most recent at the
 *  top"), so a row just added or just edited is where the author is looking.
 *  A row written before `updatedAt` existed has no stamp and sorts by the day
 *  it was added instead — the two keys compare as strings because both begin
 *  `yyyy-mm-dd`, and a stamped row on a given day sorts above an unstamped
 *  one from that day, which is the honest order. Ties break on id, which is
 *  monotonic, so the order is total. */
function sortLinks(links: StoredLink[]): StoredLink[] {
  const key = (l: StoredLink) => l.updatedAt || l.addedDate
  return [...links].sort((a, b) =>
    key(a) === key(b) ? b.id.localeCompare(a.id) : key(b).localeCompare(key(a)),
  )
}

async function problems(res: Response, fallback: string): Promise<string[]> {
  try {
    const body = (await res.json()) as { errors?: string[]; error?: string }
    if (Array.isArray(body.errors) && body.errors.length) return body.errors
    if (body.error) return [body.error]
  } catch {
    /* not JSON — fall through */
  }
  return [fallback]
}

/** Thrown by every write so the form can list what the server objected to. */
export class LinkWriteError extends Error {
  readonly errors: string[]
  constructor(errors: string[]) {
    super(errors.join(' '))
    this.name = 'LinkWriteError'
    this.errors = errors
  }
}

/**
 * The list as markdown, for getting it out of a store nothing backs up.
 *
 * The To Do panel's mitigation, applied to the same problem. There is no
 * "paste it back into a data file" path here because there is no data file —
 * that is the trade this section made deliberately — so the way out is a
 * document, not a code snapshot.
 */
export function toMarkdown(links: StoredLink[]): string {
  return links
    .map((l) => {
      const head = `- [${l.title}](${l.url})`
      const tail = [
        linkTypeLabel(l.type),
        l.note.trim(),
        l.addedBy.trim() && `added by ${l.addedBy.trim()}`,
      ]
        .filter(Boolean)
        .join(' · ')
      return tail ? `${head} — ${tail}` : head
    })
    .join('\n')
}


/* ── the board ────────────────────────────────────────────────────────────── */

/** Everything a panel needs to read and write one board. */
export type LinkBoard = ReturnType<typeof createLinkBoard>

/**
 * Build the client for one endpoint. Every write fires `cfg.event` from INSIDE
 * these helpers rather than from the panel, so a second caller cannot add a
 * record and leave the nav badge behind — that is not hypothetical: the Links
 * badge shipped saying 2 with three links on screen. A plain `storage` event
 * would not do it — that only fires for OTHER tabs.
 */
export function createLinkBoard(cfg: LinkBoardConfig) {
  function announce(): void {
    window.dispatchEvent(new Event(cfg.event))
  }

  async function listLinks(): Promise<LinkIndex> {
    try {
      const res = await fetch(cfg.base, { headers: { accept: 'application/json' } })
      if (!res.ok) return UNAVAILABLE
      // A misrouted request returns index.html with a 200, which would throw on
      // parse rather than reporting "no backend". Check before parsing.
      if (!(res.headers.get('content-type') ?? '').includes('application/json')) return UNAVAILABLE
      const body = (await res.json()) as { links?: unknown }
      const raw = Array.isArray(body.links) ? body.links : []
      return { available: true, loading: false, links: sortLinks(raw.filter(isLink).map(normalise)) }
    } catch {
      return UNAVAILABLE
    }
  }

  async function createLink(draft: LinkDraft): Promise<StoredLink> {
    const res = await fetch(cfg.base, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (!res.ok) throw new LinkWriteError(await problems(res, `Could not save (${res.status}).`))
    const body = (await res.json()) as { link: StoredLink }
    announce()
    return body.link
  }

  async function saveLink(id: string, draft: LinkDraft): Promise<StoredLink> {
    const res = await fetch(`${cfg.base}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(draft),
    })
    if (!res.ok) throw new LinkWriteError(await problems(res, `Could not save (${res.status}).`))
    const body = (await res.json()) as { link: StoredLink }
    announce()
    return body.link
  }

  /**
   * Archive or unarchive a row (2026-10-15). A SAVE of the record with the flag
   * flipped rather than a verb of its own on the endpoint, so the server owns
   * the stamp the way it owns `updatedAt`, and a board without the control
   * simply drops the fields. `by` is the label for who did it — the browser's
   * last author, the same source the Add form prefills from.
   */
  async function archiveLink(link: StoredLink, archived: boolean, by: string): Promise<StoredLink> {
    return saveLink(link.id, {
      title: link.title,
      url: link.url,
      note: link.note,
      addedBy: link.addedBy,
      type: link.type,
      product: link.product,
      archived,
      archivedBy: archived ? by : '',
    })
  }

  async function deleteLink(id: string): Promise<void> {
    const res = await fetch(`${cfg.base}/${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (!res.ok) throw new LinkWriteError(await problems(res, `Could not delete (${res.status}).`))
    announce()
  }

  /* ── hooks ── */

  /**
   * The list, plus a refresh.
   *
   * Every write re-reads the collection rather than patching local state. That is
   * a deliberate choice over the optimistic version: the endpoint owns the id and
   * the date, and it is shared — another reviewer may have added a link since the
   * page loaded. Re-reading is how the page stays true to a store more than one
   * person can write to.
   */
  function useLinks() {
    const [index, setIndex] = useState<LinkIndex>(EMPTY_LINK_INDEX)

    const refresh = useCallback(async () => {
      const next = await listLinks()
      setIndex(next)
      return next
    }, [])

    useEffect(() => {
      let live = true
      void listLinks().then((next) => {
        if (live) setIndex(next)
      })
      return () => {
        live = false
      }
    }, [])

    return { index, refresh }
  }

  /**
   * How many links there are, for the nav badge.
   *
   * A live count for the same reason To Do's and QA Notes' are: a number that
   * cannot change is only correct until someone adds something. Seeds at 0 rather
   * than at a committed length, because there is no committed set to seed from.
   */
  function useLinkCount(filter?: (l: StoredLink) => boolean): number {
    const [count, setCount] = useState(0)
    useEffect(() => {
      let live = true
      const read = () => {
        void listLinks().then((index) => {
          // `filter` lets the public build's Demo badge count only the rows it
          // shows — a badge saying 5 over a list of 2 reads as a load failure.
          if (live) setCount(filter ? index.links.filter(filter).length : index.links.length)
        })
      }
      read()
      // Re-read on every write, wherever it came from. Without this the badge is
      // correct only until the first link is added — see `cfg.event`.
      window.addEventListener(cfg.event, read)
      return () => {
        live = false
        window.removeEventListener(cfg.event, read)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- the filter is a pure predicate on the row; callers pass a stable one
    }, [])
    return count
  }

  return {
    config: cfg,
    listLinks,
    createLink,
    saveLink,
    archiveLink,
    deleteLink,
    useLinks,
    useLinkCount,
    readLastAuthor: () => readLastAuthorFrom(cfg.lastAuthorKey),
    rememberLastAuthor: (name: string) => rememberLastAuthorIn(cfg.lastAuthorKey, name),
  }
}

/* ── the Links instance ───────────────────────────────────────────────────── */

export const LINKS_BOARD = createLinkBoard({
  base: '/api/links',
  event: 'cgp.links',
  lastAuthorKey: 'cgp.links.lastAuthor',
})

export const {
  listLinks,
  createLink,
  saveLink,
  deleteLink,
  useLinks,
  useLinkCount,
  readLastAuthor,
  rememberLastAuthor,
} = LINKS_BOARD
