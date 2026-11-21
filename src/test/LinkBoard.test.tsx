/**
 * The shared link board — `LinkBoardPanel`, the panel behind Design, Research
 * and PRDs — authored on the page, not in the repo.
 *
 * ⚠ THIS WAS `Links.test.tsx` until 2026-11-21: Resources (section id
 * `links`) went with the advanced Hub (`resources-section` in
 * `archivedItems.ts`), and these cases are the ones that were really about the
 * SHARED panel rather than that board. They render `ResearchPanel` — the
 * board whose shape is closest to what Resources was (free-text Added by, no
 * designer pills) — and `PrdsPanel` where the case is about the Type
 * taxonomy, which Research switched off on 2026-11-20 and PRDs still asks.
 *
 * Three groups of assertions, and the FIRST is the one that matters most:
 *
 * 1. Every stored URL is rendered as an `<a href>`, so an unsafe scheme in the
 *    store is code execution in this origin. The guard is an allow-list at BOTH
 *    boundaries — the endpoint on the way in, `safeHref` at render — and these
 *    tests pin both, including a source-level check that the endpoint's list has
 *    not quietly become a blocklist. Following `smoke-desktop.mjs`, the check
 *    parses the real declared value out of the file rather than a copy of it
 *    that can drift.
 * 2. The draft check and the display helpers in `linkStore.ts`.
 * 3. The panel hides its composer when there is no endpoint, rather than
 *    offering an Add button that fails on click.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PrdsPanel, ResearchPanel } from '@/components/prototype/LinksPanel'
import {
  LINK_TYPES,
  draftProblems,
  hostOf,
  safeHref,
  toMarkdown,
  type StoredLink,
} from '@/data/linkStore'
import { listPrds } from '@/data/prdStore'

/* ── helpers ──────────────────────────────────────────────────────────────── */

const link = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'link-001',
  title: 'FinServ Learner Brief',
  url: 'https://example.com/brief',
  note: '',
  addedBy: '',
  type: '',
  product: 'both',
  addedDate: '2026-09-10',
  updatedAt: '',
  archivedAt: '',
  archivedBy: '',
  feature: '',
  typeOther: '',
  supersedes: '',
  ...over,
})

/** The form is behind a CTA now, so every authoring test has to open it. */
async function openComposer(user: ReturnType<typeof userEvent.setup>, name = /Add (the first )?link/) {
  await waitFor(() => expect(screen.getByRole('button', { name })).toBeInTheDocument())
  await user.click(screen.getByRole('button', { name }))
  await waitFor(() => expect(screen.getByLabelText('Address')).toBeInTheDocument())
}

/** A fetch that answers the collection endpoint — whichever board asks — and
 *  records writes. */
function mockEndpoint(links: StoredLink[]) {
  const writes: { method: string; url: string; body: unknown }[] = []
  const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? 'GET'
    if (method !== 'GET') {
      writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
      return new Response(JSON.stringify({ link: link() }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ links }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { writes, fetchMock }
}

/** No endpoint at all — what plain `npm run dev` looks like. */
function mockNoEndpoint() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    }),
  )
}

/** A misrouted request: the SPA fallback answers with index.html and a 200.
 *  This is why `listLinks` checks the content type before parsing. */
function mockSpaFallback() {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response('<!doctype html><title>app</title>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
    ),
  )
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/* ── 1. the scheme allow-list ─────────────────────────────────────────────── */

describe('a stored URL cannot become script', () => {
  it('safeHref allows only http and https', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a')
    expect(safeHref('http://example.com/a')).toBe('http://example.com/a')

    // The whole reason this function exists. An href is an execution context.
    expect(safeHref('javascript:alert(1)')).toBeNull()
    expect(safeHref('JavaScript:alert(1)')).toBeNull()
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeNull()
    expect(safeHref('vbscript:msgbox(1)')).toBeNull()
    // Not dangerous, but not a destination a reviewer can be sent to either.
    expect(safeHref('file:///etc/passwd')).toBeNull()
    expect(safeHref('not a url')).toBeNull()
    expect(safeHref('')).toBeNull()
  })

  it('renders an unsafe stored URL as TEXT, with no anchor', async () => {
    // Defence in depth: the endpoint rejects this on the way in, so reaching
    // this state means a record predates the check or arrived another way. It
    // must still not link — and it must still be VISIBLE, so it can be found
    // and fixed rather than silently disappearing from the list.
    mockEndpoint([link({ url: 'javascript:alert(1)', title: 'Sketchy' })])
    render(<ResearchPanel />)

    await waitFor(() => expect(screen.getByText('Sketchy')).toBeInTheDocument())
    expect(screen.queryByRole('link', { name: /Sketchy/ })).not.toBeInTheDocument()
    expect(screen.getByText(/not a linkable address/)).toBeInTheDocument()
  })

  it('the endpoint declares the same allow-list, and it is a list of ALLOWED schemes', () => {
    // Parsed out of the real file rather than duplicated here, so this tracks
    // the endpoint instead of a copy that can drift. A blocklist would pass a
    // naive "does it mention javascript" check while being one novel scheme
    // away from wrong, so what is asserted is the SHAPE: an allow-list naming
    // exactly the two protocols `safeHref` accepts.
    // The handler is shared by every board since 2026-09-18, so the
    // declaration lives in `netlify/lib/linkBoard.ts`; each board's function
    // is a config. Asserting on the shared file is what guards all of them.
    const src = readFileSync(path.resolve(__dirname, '../../netlify/lib/linkBoard.ts'), 'utf8')
    const declared = /const ALLOWED_PROTOCOLS = \[([^\]]*)\]/.exec(src)
    expect(declared, 'linkBoard.ts must declare ALLOWED_PROTOCOLS').toBeTruthy()
    const protocols = [...declared![1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(protocols).toEqual(['http:', 'https:'])

    // And it is applied by INCLUSION, not by excluding known-bad schemes.
    expect(src).toMatch(/ALLOWED_PROTOCOLS\.includes\(/)
  })
})

/* ── the draft check ──────────────────────────────────────────────────────── */

describe('draftProblems', () => {
  it('requires a title and a full address', () => {
    expect(draftProblems({ title: '', url: '', note: '', addedBy: '', type: '' })).toEqual([
      'Give the link a title.',
      'Paste the address.',
    ])
    expect(draftProblems({ title: '  ', url: 'https://a.example', note: '', addedBy: '', type: '' })).toEqual([
      'Give the link a title.',
    ])
    // A bare host is the most likely paste, and the message says what is wrong.
    expect(draftProblems({ title: 'A', url: 'example.com', note: '', addedBy: '', type: '' })).toEqual([
      'That needs to be a full address starting with http:// or https://.',
    ])
    expect(draftProblems({ title: 'A', url: 'javascript:alert(1)', note: '', addedBy: '', type: '' })).toHaveLength(1)
    expect(draftProblems({ title: 'A', url: 'https://a.example', note: '', addedBy: '', type: '' })).toEqual([])
  })
})

describe('display helpers', () => {
  it('hostOf strips www and falls back to the raw value', () => {
    expect(hostOf('https://www.xcelsolutions.com/resources')).toBe('xcelsolutions.com')
    expect(hostOf('https://docs.google.com/a/b')).toBe('docs.google.com')
    // Falls back rather than throwing, so an unparseable value still renders.
    expect(hostOf('nonsense')).toBe('nonsense')
  })

  it('toMarkdown is the way out of a store nothing backs up', () => {
    expect(
      toMarkdown([
        link({ id: 'link-001', title: 'Brief', url: 'https://a.example' }),
        link({ id: 'link-002', title: 'Board', url: 'https://b.example', note: 'Sprint 4' }),
      ]),
    ).toBe('- [Brief](https://a.example)\n- [Board](https://b.example) — Sprint 4')
  })
})

/* ── 3. the panel ─────────────────────────────────────────────────────────── */

describe('LinkBoardPanel', () => {
  it('lists stored links, and each one opens in a new tab', async () => {
    mockEndpoint([
      link({ id: 'link-001', title: 'Wireframe Brief', url: 'https://a.example/brief' }),
      link({ id: 'link-002', title: 'Figma — Alerts', url: 'https://b.example/file', note: 'Node 4:287' }),
    ])
    render(<ResearchPanel />)

    const first = await screen.findByRole('link', { name: /Wireframe Brief/ })
    expect(first).toHaveAttribute('href', 'https://a.example/brief')
    expect(first).toHaveAttribute('target', '_blank')
    // Without noreferrer the opened page gets a handle on this one.
    expect(first).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: /Figma — Alerts/ })).toBeInTheDocument()
    expect(screen.getByText('Node 4:287')).toBeInTheDocument()
  })

  it('posts a new link to the endpoint', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<ResearchPanel />)

    await openComposer(user)
    await user.type(screen.getByLabelText('Address'), 'https://xcelsolutions.com/resources')
    await user.type(screen.getByLabelText('Title'), 'Resource Center')
    await user.type(screen.getByLabelText(/Added by/), 'Jill')
    await user.click(screen.getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].method).toBe('POST')
    expect(writes[0].url).toBe('/api/research')
    expect(writes[0].body).toMatchObject({
      title: 'Resource Center',
      url: 'https://xcelsolutions.com/resources',
      addedBy: 'Jill',
    })
  })

  it('reports a bad address WITHOUT a round trip', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<ResearchPanel />)

    await openComposer(user)
    await user.type(screen.getByLabelText('Address'), 'example.com')
    await user.type(screen.getByLabelText('Title'), 'Bare host')
    await user.click(screen.getByRole('button', { name: 'Add link' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/full address/)
    expect(writes).toHaveLength(0)
    // …and the dialog stays open, holding what was typed. Closing it on a
    // validation failure would throw away the paste it is complaining about.
    expect(screen.getByLabelText('Address')).toHaveValue('example.com')
  })

  it('hides the composer when there is no endpoint, and says why', async () => {
    // The alternative — an Add button that throws on click — is the defect this
    // asserts against. `available` and `loading` are separate flags so this
    // message is not claimed for the tick before the fetch settles.
    mockNoEndpoint()
    render(<ResearchPanel />)

    expect(await screen.findByText(/authoring endpoint is not reachable/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add (the first )?link/ })).not.toBeInTheDocument()
  })

  it('treats an HTML answer as no endpoint rather than parsing it', async () => {
    // The SPA fallback returns index.html with a 200 for an unknown path, so a
    // misrouted request looks like a success. Parsing it throws, which reads as
    // a broken page instead of a missing backend.
    mockSpaFallback()
    render(<ResearchPanel />)

    expect(await screen.findByText(/authoring endpoint is not reachable/)).toBeInTheDocument()
  })

  it('keeps the form behind a CTA rather than on the page', async () => {
    // The form was an always-visible composer above the list, and that put four
    // fields of chrome permanently above the thing you came to read. Adding a
    // link is the occasional act here; reading the list is the constant one.
    const user = userEvent.setup()
    mockEndpoint([link()])
    render(<ResearchPanel />)

    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByLabelText('Address')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add link' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByLabelText('Address')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('types a WHOLE value into a field, not just its first character', async () => {
    /*
     * `Modal`'s focus effect is keyed on `[open, onClose]` and focuses the
     * dialog when it runs, so an unstable `onClose` re-runs it on every
     * keystroke and pulls focus off the field. The first build did exactly
     * that — one character per input, the rest dropped — with a clean tsc and a
     * modal that rendered perfectly. Only typing into it showed anything wrong,
     * which is why this asserts the field VALUE rather than that the modal
     * opened.
     */
    const user = userEvent.setup()
    mockEndpoint([])
    render(<ResearchPanel />)

    await openComposer(user)
    await user.type(screen.getByLabelText('Address'), 'https://example.com/a/long/path')
    expect(screen.getByLabelText('Address')).toHaveValue('https://example.com/a/long/path')
  })

  it('shows who added a link, and leaves no stray separator when nobody did', async () => {
    mockEndpoint([
      link({ id: 'link-002', title: 'With author', addedBy: 'Jill', addedDate: '2026-09-10' }),
      link({ id: 'link-001', title: 'Without author', addedBy: '', addedDate: '2026-09-09' }),
    ])
    render(<ResearchPanel />)

    // THE ROW'S TAGS (2026-11-01) — who added it and when, as the outlined
    // tags every section's row wears, rather than a meta line under the title.
    const withAuthor = (await screen.findByText('With author')).closest<HTMLElement>('[data-row]')!
    expect(within(withAuthor).getByText('Jill').textContent).toBe('Added by Jill')
    expect(within(withAuthor).getByText('Added 2026-09-10')).toBeInTheDocument()
    // No author → no author tag at all, rather than an empty one — an empty
    // tag reads as a name that failed to load.
    const without = screen.getByText('Without author').closest<HTMLElement>('[data-row]')!
    expect(within(without).getByText('Added 2026-09-09')).toBeInTheDocument()
    expect(within(without).queryByText(/Added by/)).toBeNull()
  })

  it('prefills Added by from this browser, but never reassigns on edit', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([
      link({ id: 'link-001', title: 'Someone elses', addedBy: 'Dana' }),
    ])
    localStorage.setItem('cgp.links.lastAuthor', 'Jill')
    render(<ResearchPanel />)

    // Adding: this browser's last author, so a name is typed once not per link.
    await openComposer(user, /^Add link$/)
    expect(screen.getByLabelText(/Added by/)).toHaveValue('Jill')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    // Editing: the RECORD's own author. Editing someone else's link must not
    // quietly reassign it to whoever is at this keyboard.
    // Edit lives in the row's kebab now (2026-11-01), with every other board's.
    await user.click(screen.getByRole('button', { name: 'Actions for Someone elses' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Edit' }))
    expect(screen.getByLabelText(/Added by/)).toHaveValue('Dana')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].method).toBe('PUT')
    expect(writes[0].body).toMatchObject({ addedBy: 'Dana' })
  })

  it('puts the most recently added link on top', async () => {
    // Asserted on the RENDERED order rather than on `sortLinks`, because the
    // order is the thing that was asked for. Same-day links tie-break on id,
    // which is monotonic — so a second link added today still lands above the
    // first rather than in an arbitrary spot.
    mockEndpoint([
      link({ id: 'link-001', title: 'Oldest', addedDate: '2026-09-01' }),
      link({ id: 'link-003', title: 'Newest — same day', addedDate: '2026-09-10' }),
      link({ id: 'link-002', title: 'Middle — same day', addedDate: '2026-09-10' }),
    ])
    render(<ResearchPanel />)

    await waitFor(() => expect(screen.getByText('3 links')).toBeInTheDocument())
    // Strip only the visually-hidden affordance text, not every em dash — the
    // titles here deliberately contain one.
    const titles = [...document.querySelectorAll('.cre-uxlinks-title')]
      .map((a) => a.textContent?.replace(/\s*— opens in a new tab$/, '').trim())
    expect(titles).toEqual(['Newest — same day', 'Middle — same day', 'Oldest'])
  })

  it('sorts a row by when it was last SAVED, so an edit brings it to the top', async () => {
    // 2026-10-14, Jillienne: "most recent at the top". The oldest-added row
    // was edited after the others were added, so it leads; the row with no
    // stamp (written before the field) sorts by its added day.
    mockEndpoint([
      link({ id: 'link-001', title: 'Oldest, edited today', addedDate: '2026-09-01', updatedAt: '2026-10-14T18:00:00Z' }),
      link({ id: 'link-002', title: 'Added later, never edited', addedDate: '2026-10-10', updatedAt: '' }),
      link({ id: 'link-003', title: 'Added later, saved once', addedDate: '2026-10-12', updatedAt: '2026-10-12T09:00:00Z' }),
    ])
    render(<ResearchPanel />)
    await waitFor(() => expect(screen.getByText('3 links')).toBeInTheDocument())
    const titles = [...document.querySelectorAll('.cre-uxlinks-title')]
      .map((a) => a.textContent?.replace(/\s*— opens in a new tab$/, '').trim())
    expect(titles).toEqual(['Oldest, edited today', 'Added later, saved once', 'Added later, never edited'])
  })

  it('carries the hover/focus classes, and they beat the inline styles', async () => {
    /*
     * jsdom has no `:hover`, so this asserts the two halves that CAN be checked
     * and that together are the whole mechanism: the elements carry the hooks,
     * and the rules that fight an inline style say `!important`.
     *
     * That second half is not theoretical. The underline rule shipped WITHOUT
     * `!important` and did nothing — the anchor's inline `text-decoration: none`
     * won the cascade. The row still tinted on hover, so it looked right; only
     * reading the computed `text-decoration-line` in a browser caught it.
     * A test that merely asserted the class was present would have passed.
     */
    mockEndpoint([link()])
    const { container } = render(<ResearchPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())

    expect(container.querySelectorAll('.cre-uxlinks-row')).toHaveLength(1)
    expect(container.querySelectorAll('.cre-uxlinks-title')).toHaveLength(1)
    // Edit + Remove are in the row's kebab since 2026-11-01 — one trigger, no
    // bare icon buttons on the row.
    expect(container.querySelectorAll('.cre-uxlinks-action')).toHaveLength(0)
    expect(screen.getAllByRole('button', { name: /^Actions for / })).toHaveLength(1)

    const css = readFileSync(path.resolve(__dirname, '../styles/tokens.css'), 'utf8')
    const ruleFor = (selector: string) => {
      const at = css.indexOf(selector)
      expect(at, `tokens.css must declare ${selector}`).toBeGreaterThan(-1)
      return css.slice(at, css.indexOf('}', at))
    }

    // Fights the anchor's inline `text-decoration: none`.
    expect(ruleFor('.cre-uxlinks-title:hover')).toMatch(/text-decoration:\s*underline\s*!important/)
    // Fights the shared button style's inline `color` and `border`.
    const action = ruleFor('.cre-uxlinks-action:hover')
    expect(action).toMatch(/color:[^;]*!important/)
    expect(action).toMatch(/border-color:[^;]*!important/)

    // The keyboard twin. A pointer-only hover would leave a keyboard user with
    // no "this row" feedback at all while tabbing the list.
    expect(css).toMatch(/\.cre-uxlinks-row:hover,\s*\n\s*\.cre-uxlinks-row:focus-within/)
    // The row tint is the page's own row-hover surface, not a second one.
    expect(ruleFor('.cre-uxlinks-row:hover')).toMatch(/background:\s*var\(--ux-bg\)/)

    // …and none of this borrows `.cre-link-action`, which is an established
    // product-wide class (40+ call sites) for text CTAs with a ::after
    // underline. These are bordered icon buttons. The first build used that
    // name, which meant a second `.cre-link-action:hover` block setting
    // `color` and `border-color` with `!important` — reaching every one of
    // those call sites. The generic name looked obviously right.
    expect(container.querySelector('.cre-link-action')).toBeNull()
    // Scoped to THIS panel's block rather than counting file-wide, so the
    // assertion is about what Links added and survives edits to the shared
    // class's own rules.
    const ownBlock = css.slice(css.indexOf('/* Links panel — the row under'))
    // Matched at column 0 so this is about SELECTORS — the block's own comment
    // names the class it is deliberately avoiding, and that prose is the point.
    expect(ownBlock).not.toMatch(/^\.cre-link-action/m)
  })

  it('stores a type, shows it as a chip, and filters on it', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([
      link({ id: 'link-003', title: 'The brief', type: 'brief' }),
      link({ id: 'link-002', title: 'The Figma', type: 'design' }),
      link({ id: 'link-001', title: 'Untyped thing', type: '' }),
    ])
    const { container } = render(<PrdsPanel />)

    await waitFor(() => expect(screen.getByText('3 links')).toBeInTheDocument())
    // The chips, scoped to the list — the labels also appear as filter pills,
    // which is the point of asserting them separately.
    const chips = () =>
      [...container.querySelectorAll('ul span')].map((el) => el.textContent?.trim())
    expect(chips()).toContain('Brief')
    expect(chips()).toContain('Design')
    expect(screen.getByRole('button', { name: 'Brief' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Design' })).toBeInTheDocument()

    // Filtering narrows the list, and the untyped row is not swept in.
    await user.click(screen.getByRole('button', { name: 'Design' }))
    expect(screen.getByText('The Figma')).toBeInTheDocument()
    expect(screen.queryByText('The brief')).not.toBeInTheDocument()
    expect(screen.queryByText('Untyped thing')).not.toBeInTheDocument()

    // Clicking the active pill clears it, same as the project sections' pills.
    await user.click(screen.getByRole('button', { name: 'Design' }))
    expect(screen.getByText('The brief')).toBeInTheDocument()

    // And a type reaches the endpoint on create.
    await user.click(screen.getByRole('button', { name: 'Add link' }))
    await waitFor(() => expect(screen.getByLabelText('Address')).toBeInTheDocument())
    await user.type(screen.getByLabelText('Address'), 'https://a.example/p')
    await user.type(screen.getByLabelText('Title'), 'A build')
    await user.selectOptions(screen.getByLabelText(/Type/), 'prototype')
    // Scoped to the dialog: with links on screen the toolbar CTA is also named
    // "Add link", which is fine on screen (the modal traps focus) but ambiguous
    // to a query.
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].body).toMatchObject({ type: 'prototype' })
  })

  it('hides the type filter until there is more than one type to choose', async () => {
    // A single pill filters nothing, and "All" beside one option is chrome —
    // the same rule the project sections' status pills follow.
    mockEndpoint([link({ id: 'link-001', type: 'brief' }), link({ id: 'link-002', type: 'brief' })])
    render(<PrdsPanel />)
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    expect(screen.queryByRole('group', { name: 'Filter by type' })).not.toBeInTheDocument()

    vi.unstubAllGlobals()
    mockEndpoint([link({ id: 'link-001', type: 'brief' }), link({ id: 'link-002', type: 'design' })])
    render(<PrdsPanel />)
    await waitFor(() =>
      expect(screen.getAllByRole('group', { name: 'Filter by type' })[0]).toBeInTheDocument(),
    )
  })

  it('is optional, and an unknown stored type degrades to untyped', async () => {
    // No backfill was needed for the records written before the field existed,
    // which is the whole reason it is optional — and a value this build has no
    // label for must not render a chip saying nothing.
    mockEndpoint([
      link({ id: 'link-002', title: 'Legacy row' }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deliberately off-contract
      { ...link({ id: 'link-001', title: 'Bogus type' }), type: 'wat' } as any,
    ])
    // Asserted at the STORE, not through the DOM. Rendering an unknown type
    // produces an EMPTY chip — `linkTypeLabel` has no label for it — so a
    // queryByText('wat') passes whether or not the degrade works, which is
    // how the first version of this test passed against a broken `normalise`.
    // The layer where the degrade happens is the layer to test.
    const index = await listPrds()
    expect(index.links.map((l) => l.type)).toEqual(['', ''])

    render(<PrdsPanel />)
    await waitFor(() => expect(screen.getByText('2 links')).toBeInTheDocument())
    // Both rows still render — an unrecognised value must not drop the link.
    expect(screen.getByText('Legacy row')).toBeInTheDocument()
    expect(screen.getByText('Bogus type')).toBeInTheDocument()
    // …and no filter strip appears for a type nothing legitimately carries.
    expect(screen.queryByRole('group', { name: 'Filter by type' })).not.toBeInTheDocument()
  })

  it('the endpoint and the client agree on the taxonomy', () => {
    // The endpoint re-declares the list on purpose — it is a trust boundary,
    // and `LINK_TYPES` is a compile-time claim about code we wrote. Same
    // reasoning as `ALLOWED_PROTOCOLS`, so it gets the same source-parsed
    // guard rather than an import that would erase the boundary.
    const fn = readFileSync(path.resolve(__dirname, '../../netlify/lib/linkBoard.ts'), 'utf8')
    const declared = /const ALLOWED_TYPES = \[([^\]]*)\]/.exec(fn)
    expect(declared, 'linkBoard.ts must declare ALLOWED_TYPES').toBeTruthy()
    // …and the boards with a taxonomy actually pass it, so a config cannot
    // quietly drop it and let any string through. (Links' own function went
    // with the advanced Hub, 2026-11-21; Research and PRDs carry its shape.)
    for (const board of ['research', 'prds']) {
      const cfg = readFileSync(path.resolve(__dirname, `../../netlify/functions/${board}.ts`), 'utf8')
      expect(cfg, `${board}.ts must pass ALLOWED_TYPES`).toMatch(/types: ALLOWED_TYPES/)
    }
    const serverside = [...declared![1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(serverside).toEqual(LINK_TYPES.map((t) => t.id))
  })

  it('shows the search field on every board, at any length', async () => {
    /* ⚠ THIS CASE USED TO ASSERT THE OPPOSITE — no search until six rows
       (`SEARCH_THRESHOLD`). 2026-11-20, Jillienne: "make the search field
       consistent on all pages". The threshold was well meant and it made the
       four boards look like four different pages, and it moved the whole
       toolbar the moment someone added a sixth row. A control that comes and
       goes is harder to learn than one that is sometimes unnecessary. */
    mockEndpoint([link()])
    render(<ResearchPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.getByLabelText('Search links')).toBeInTheDocument()
  })

  it('the toolbar reads left to right: search, count, then Add on the right', async () => {
    // 2026-11-20. Add led the toolbar, which put the page's one WRITE action
    // where the eye starts, before anyone had read the board.
    mockEndpoint([link()])
    render(<ResearchPanel />)
    const add = await screen.findByRole('button', { name: /Add link/i })
    expect(add.style.marginLeft).toBe('auto')
    const search = screen.getByLabelText('Search links')
    expect(search.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('copies ONE row as markdown from its kebab, with its own confirmation', async () => {
    /* 2026-11-20, replacing the toolbar button. `toMarkdown` takes a list, so
       a single-item array is the whole implementation — a row pasted into a
       ticket looks exactly like its line in a full export. */
    const user = userEvent.setup()
    const writes: string[] = []
    // `navigator.clipboard` is getter-only in jsdom, so it is defined rather
    // than assigned.
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t: string) => void writes.push(t) },
    })
    mockEndpoint([link({ title: 'A study' })])
    render(<ResearchPanel />)
    await screen.findByText('A study')

    await user.click(screen.getByRole('button', { name: /Actions for A study/i }))
    await user.click(await screen.findByRole('menuitem', { name: /Copy as markdown/i }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0]).toContain('A study')
    expect(writes[0]).toMatch(/^- \[/)
    // ⚠ Its OWN confirmation. "Link copied" over a markdown copy would be a
    // quiet lie, and both items write to the clipboard now.
    expect(await screen.findByText('Markdown copied')).toBeInTheDocument()
  })

  it('offers no Copy as markdown button', async () => {
    /* Removed 2026-11-20 — a second button competing with Add, for an export
       nobody on these boards was using. ⚠ `toMarkdown` itself is KEPT and
       still tested above: it is the only way out of a store nothing backs up,
       and deleting the button is not a reason to lose the function. */
    mockEndpoint([link()])
    render(<ResearchPanel />)
    await waitFor(() => expect(screen.getByText('1 link')).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /Copy as markdown/i })).not.toBeInTheDocument()
  })
})

/* "Resources — no Updated stamp on the row" stood here: a Resources-only
   fact (every surviving board shows the stamp), gone with the section. */
