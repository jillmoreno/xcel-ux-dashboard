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
  /** Whether the PUBLIC build shows this row. Only the Demo board's endpoint
   *  stores it (Links drops the field); everywhere else it normalises to
   *  `false`, so a consumer never has to ask which board a record came from. */
  isPublic: boolean
  /** `yyyy-mm-dd`, stamped server-side on create and carried through edits. */
  addedDate: string
}

/** The editable fields. `id` and `addedDate` are not among them — the server
 *  owns both, so a form cannot renumber a link or backdate it. `isPublic` is
 *  optional on the way IN because only one board has the control for it. */
export type LinkDraft = Pick<StoredLink, 'title' | 'url' | 'note' | 'addedBy' | 'type'> & {
  isPublic?: boolean
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
    // Strictly `true`, so a record from a board without the field — or an
    // older record from one with it — reads as team-only, never as public.
    isPublic: v.isPublic === true,
    addedDate: typeof v.addedDate === 'string' ? v.addedDate : '',
  }
}

/** Newest first, so a link just added is at the top where the author is
 *  looking. Ties break on id, which is monotonic, so the order is total. */
function sortLinks(links: StoredLink[]): StoredLink[] {
  return [...links].sort((a, b) =>
    a.addedDate === b.addedDate
      ? b.id.localeCompare(a.id)
      : b.addedDate.localeCompare(a.addedDate),
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
