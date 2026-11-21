import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel, LinksPanel } from '@/components/prototype/LinksPanel'
import { accentsByHost, hostKey, linkThumbKind } from '@/components/prototype/linkRowThumb'
import { DEFAULT_PRODUCT, LINK_PRODUCTS, matchesProduct, type StoredLink } from '@/data/linkStore'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * 2026-11-21: Refinement became the DESIGN board and took Research's shape —
 * a compact 48px icon tile, no product tag or control. The pins for the big
 * tile per Refinement row, the product tag, the Both default and the three
 * product colours were removed; the old tests live on the `hub-advanced`
 * branch. The hue test stays on Design (the icon still carries it) and the
 * 160x110 tile is pinned where it is still drawn, Resources.
 *
 * The Refinement row's generated tile (2026-09-29).
 *
 * The tile stands in for a picture Refinement cannot have: its rows point at
 * branch deploys, which are a different origin behind their own Netlify
 * password, so the live miniature an Exploration row uses would render a
 * password box or a blank frame. See `GeneratedThumb.tsx`.
 *
 * Two things are pinned here, and they are the two that would break silently:
 *
 *  1. The tile is on Refinement and NOT on Resources. Both boards are the
 *     same component, so the only thing keeping them apart is one flag.
 *  2. The hue GROUPS BY HOST. That is a claim the UI makes to a reader — "these
 *     two rows are the same branch" — and a claim that quietly stops being true
 *     is worse than no claim, because nobody re-checks a colour.
 */

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'demo-001',
  title: 'Xcel Home',
  url: 'https://feat-pace--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
  note: '',
  addedBy: 'JM',
  type: '',
  product: 'both',
  addedDate: '2026-09-22',
  updatedAt: '',
  archivedAt: '',
  archivedBy: '',
  feature: '',
  typeOther: '',
  supersedes: '',
  ...over,
})

function mockEndpoint(rows: StoredLink[]) {
  const writes: { method: string; body: Record<string, unknown> }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: unknown, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (method !== 'GET') {
        writes.push({ method, body: init?.body ? JSON.parse(String(init.body)) : {} })
        return new Response(JSON.stringify({ link: rows[0] ?? null }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ links: rows }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }),
  )
  return { writes }
}

/** The tile is `aria-hidden` decoration with no text, so it cannot be found
 *  by role or name. Its fixed 160x110 box is what identifies it — the same
 *  box every section's row draws since 2026-11-01 (it was a 44px marker on
 *  Refinement alone until then). A Refinement row still cannot hold a live
 *  picture — see `GeneratedThumb.tsx` — so what fills the box is the
 *  generated tile: a glyph for the destination, a hue for the branch. */
const TILE_W = '160px'
const TILE_H = '110px'
/** The icon form (2026-11-20, `THUMB_ICON`) — what a compact row draws. */
const ICON = '48px'

function tiles(w = TILE_W, h = TILE_H): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('li span[aria-hidden]')).filter(
    (n) => n.style.width === w && n.style.height === h,
  )
}
const icons = () => tiles(ICON, ICON)

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

/* ── which board gets a picture ───────────────────────────────────────────── */

describe('every board draws the tile (2026-11-01)', () => {
  it('draws one icon-sized tile per Design row — the compact form, not the panel (2026-11-21)', async () => {
    mockEndpoint([row(), row({ id: 'demo-002', title: 'Learner Home' })])
    render(<DemoPanel />)
    await screen.findByText('Xcel Home')
    expect(icons()).toHaveLength(2)
    expect(tiles()).toHaveLength(0)
  })

  it('draws one on Resources too', async () => {
    // Until 2026-11-01 Resources drew none: a kind-glyph on a Figma link
    // whose kind this code cannot read said nothing. It draws the row's tile
    // now because every section's row does (Jillienne: "I want ALL of the
    // pages to follow this similar UI"), and an unreadable destination falls
    // to the `other` glyph rather than to an empty column.
    mockEndpoint([row({ id: 'link-001', type: 'brief', url: 'https://figma.com/file/x' })])
    render(<LinksPanel />)
    await screen.findByText('Xcel Home')
    expect(tiles()).toHaveLength(1)
  })
})

/* ── what the tile says ───────────────────────────────────────────────────── */

describe('linkThumbKind reads the destination', () => {
  it.each([
    ['https://x--y.netlify.app/prototypes/xcel-nudge.html', 'document'],
    ['https://x--y.netlify.app/review?ids=a,b', 'gallery'],
    ['https://x--y.netlify.app/dashboard-rebrand?demo=1', 'product'],
    ['https://www.figma.com/file/abc', 'other'],
    ['not a url at all', 'other'],
  ])('%s → %s', (url, kind) => {
    expect(linkThumbKind(url)).toBe(kind)
  })
})

describe('the hue groups by host', () => {
  const A = 'https://feat-a--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1'
  const A2 = 'https://feat-a--ux-design-xceldashboard.netlify.app/prototypes/x.html'
  const B = 'https://feat-b--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1'

  it('gives two rows on ONE branch the same hue, whatever the path', () => {
    const map = accentsByHost([A, A2])
    expect(map[hostKey(A)]).toBe(map[hostKey(A2)])
  })

  it('gives two DIFFERENT branches different hues', () => {
    // The reason this file exists. The first implementation hashed the host
    // into four buckets, and on the four real rows two different branches
    // collided — the UI then said "same work" about work that was not.
    const map = accentsByHost([A, B])
    expect(map[hostKey(A)]).not.toBe(map[hostKey(B)])
  })

  it('keeps the first four hosts distinct', () => {
    const urls = ['a', 'b', 'c', 'd'].map((s) => `https://${s}--x.netlify.app/dashboard-rebrand`)
    const map = accentsByHost(urls)
    expect(new Set(Object.values(map)).size).toBe(4)
  })

  it('renders the shared hue as a shared background', async () => {
    mockEndpoint([
      row({ id: 'demo-001', title: 'One', url: A }),
      row({ id: 'demo-002', title: 'Two', url: B }),
      row({ id: 'demo-003', title: 'Three', url: A2 }),
    ])
    render(<DemoPanel />)
    await waitFor(() => expect(icons()).toHaveLength(3))
    const [one, two, three] = icons().map((t) => t.style.background)
    expect(one).toBe(three)
    expect(one).not.toBe(two)
  })
})

/* ── the product field ────────────────────────────────────────────────────── */

/* The FIELD outlives the tag (2026-11-21): the Design endpoint still stores a
   product and a legacy row still normalises to Both, so the two copies of the
   list must still agree — but no board draws the tag or offers the control. */
describe('product tagging', () => {
  it('the endpoint and the client agree on the product list', () => {
    // Same reasoning as `ALLOWED_TYPES` in `Links.test.tsx`: the endpoint
    // re-declares the values because it is a trust boundary, so a source-parsed
    // guard is what keeps the two copies from drifting.
    const fn = readFileSync(resolve(here, '../../netlify/lib/linkBoard.ts'), 'utf8')
    const declared = /const ALLOWED_PRODUCTS = \[([^\]]*)\]/.exec(fn)
    expect(declared, 'linkBoard.ts must declare ALLOWED_PRODUCTS').toBeTruthy()
    // …and the Refinement endpoint actually turns the field on, while Links
    // leaves it off — a Links record must not quietly acquire a product tag.
    expect(readFileSync(resolve(here, '../../netlify/functions/demos.ts'), 'utf8')).toMatch(
      /products: true/,
    )
    expect(readFileSync(resolve(here, '../../netlify/functions/links.ts'), 'utf8')).toMatch(
      /products: false/,
    )
    const serverside = [...declared![1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    expect(serverside).toEqual(LINK_PRODUCTS.map((x) => x.id))
  })

  it('reads a row written before the field existed as Both', () => {
    // The rows already in the store have no `product`. They must land under
    // every pill rather than vanish from all of them.
    expect(matchesProduct(DEFAULT_PRODUCT, 'xcel')).toBe(true)
    expect(matchesProduct(DEFAULT_PRODUCT, 'compass')).toBe(true)
    expect(matchesProduct(DEFAULT_PRODUCT, '')).toBe(true)
  })
})

/* ── the badges ───────────────────────────────────────────────────────────── */

describe('badges sit under the title', () => {
  it('renders the author as a tag, and no product (2026-11-21)', async () => {
    mockEndpoint([row({ title: 'A branch', addedBy: 'Anjani', product: 'compass' })])
    render(<DemoPanel />)
    const title = await screen.findByText('A branch')
    // The row's own container, so this asserts what THIS row carries and not
    // just that the strings exist somewhere on the page.
    const li = title.closest('li')!
    expect(within(li).getByText('Anjani')).toBeInTheDocument()
    expect(within(li).queryByText('Compass')).toBeNull()
  })

  it('renders no author badge when nobody signed it', async () => {
    mockEndpoint([row({ title: 'Unsigned', addedBy: '' })])
    render(<DemoPanel />)
    const li = (await screen.findByText('Unsigned')).closest('li')!
    // An empty badge reads as a name that failed to load.
    expect(li.textContent).not.toMatch(/·\s*$/)
    expect(within(li).queryByText('by')).not.toBeInTheDocument()
  })

  it('gives Resources the same tags, with the Type as its "what"', async () => {
    // One row shape for every board (2026-11-01): who, when, what. On
    // Resources "what" is the link's Type, and there is no product control
    // (nor, since 2026-11-21, on Design).
    mockEndpoint([row({ id: 'link-001', title: 'A brief', type: 'brief', addedBy: 'Jill', addedDate: '2026-09-10' })])
    render(<LinksPanel />)
    const li = (await screen.findByText('A brief')).closest('li')!
    expect(within(li).getByText('Jill').textContent).toBe('Added by Jill')
    expect(within(li).getByText('Added 2026-09-10')).toBeInTheDocument()
    expect(within(li).getByText('Brief')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Both' })).not.toBeInTheDocument()
  })
})

/* ── the row kebab ────────────────────────────────────────────────────────── */

describe('the row menu', () => {
  it('offers Edit, Share Link and Remove', async () => {
    const user = userEvent.setup()
    mockEndpoint([row({ title: 'A branch' })])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: 'Actions for A branch' }))
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Share Link' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Remove' })).toBeInTheDocument()
  })

  it('Share Link copies the row destination, not the dashboard', async () => {
    // Read back through user-event's OWN clipboard stub rather than installing
    // one: `userEvent.setup()` replaces `navigator.clipboard` itself, so a stub
    // installed here is silently overwritten and the assertion never fires.
    const user = userEvent.setup()
    const url = 'https://feat-a--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1'
    mockEndpoint([row({ title: 'A branch', url })])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: 'Actions for A branch' }))
    await user.click(screen.getByRole('menuitem', { name: 'Share Link' }))
    // The row is the pointer; what is worth pasting is what it points at.
    expect(await navigator.clipboard.readText()).toBe(url)
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
  })

  it('offers no Share Link for an address that cannot be linked', async () => {
    const user = userEvent.setup()
    // `safeHref` refuses it at render time; handing it over as a share would be
    // passing on something this build already declined to make clickable.
    mockEndpoint([row({ title: 'Bad address', url: 'javascript:alert(1)' })])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: 'Actions for Bad address' }))
    expect(screen.queryByRole('menuitem', { name: 'Share Link' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
  })

  it('puts the author at the top of the tag stack, as an outlined tag with the user icon', async () => {
    // 2026-10-15: the gateway's Prototypes rows wear the author this way and
    // the Refinement row now matches — a square-cornered outline, not the
    // pill that read as a status the person was IN, and the icon so the name
    // is read as "who" without the word.
    mockEndpoint([row({ title: 'A branch', addedBy: 'Anjani', product: 'compass', updatedAt: '2026-10-14T15:51:11Z' })])
    render(<DemoPanel />)
    const li = (await screen.findByText('A branch')).closest('li')!
    const name = within(li).getByText('Anjani')
    expect(name.style.borderRadius).toBe('4px')
    expect(name.style.background).toBe('transparent')
    expect(name.querySelector('svg')).not.toBeNull()
    // Order in the stack: who, when — and no "what" since 2026-11-21, when
    // the product tag came off the Design row.
    const stack = name.parentElement!
    const texts = [...stack.children].map((c) => c.textContent)
    expect(texts[0]).toContain('Anjani')
    expect(texts[1]).toMatch(/^Updated /)
    expect(texts).toHaveLength(2)
  })
})
