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
  isPublic: false,
  addedDate: '2026-09-22',
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

/** The icon box is `aria-hidden` decoration with no text, so it cannot be found
 *  by role or name. Its fixed 44px square is what identifies it — Exploration's
 *  tile is 160x110, and the difference is the point: a Refinement row can never
 *  hold a picture, so it gets a marker instead of a picture-shaped hole. */
const ICON_BOX = '44px'

function tiles(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('li span[aria-hidden]')).filter(
    (n) => n.style.width === ICON_BOX && n.style.height === ICON_BOX,
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

/* ── which board gets a picture ───────────────────────────────────────────── */

describe('the tile is Refinement-only', () => {
  it('draws one tile per Refinement row', async () => {
    mockEndpoint([row(), row({ id: 'demo-002', title: 'Learner Home' })])
    render(<DemoPanel />)
    await screen.findByText('Xcel Home')
    expect(tiles()).toHaveLength(2)
  })

  it('draws none on Resources', async () => {
    // Same component, same endpoint shape. If this ever starts passing tiles,
    // it is because someone made the flag unconditional — which would put a
    // kind-glyph on a Figma link whose kind this code cannot read.
    mockEndpoint([row({ id: 'link-001', type: 'brief', url: 'https://figma.com/file/x' })])
    render(<LinksPanel />)
    await screen.findByText('Xcel Home')
    expect(tiles()).toHaveLength(0)
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
    await waitFor(() => expect(tiles()).toHaveLength(3))
    const [one, two, three] = tiles().map((t) => t.style.background)
    expect(one).toBe(three)
    expect(one).not.toBe(two)
  })
})

/* ── the product tag ──────────────────────────────────────────────────────── */

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

  it('shows only the matching rows, and Both under either pill', async () => {
    const user = userEvent.setup()
    mockEndpoint([
      row({ id: 'demo-003', title: 'Only XCEL', product: 'xcel' }),
      row({ id: 'demo-002', title: 'Only Compass', product: 'compass' }),
      row({ id: 'demo-001', title: 'Shared work', product: 'both' }),
    ])
    render(<DemoPanel />)
    await screen.findByText('Only XCEL')

    await user.click(screen.getByRole('button', { name: 'XCEL' }))
    expect(screen.getByText('Only XCEL')).toBeInTheDocument()
    expect(screen.getByText('Shared work')).toBeInTheDocument()
    expect(screen.queryByText('Only Compass')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compass' }))
    expect(screen.getByText('Only Compass')).toBeInTheDocument()
    expect(screen.getByText('Shared work')).toBeInTheDocument()
    expect(screen.queryByText('Only XCEL')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByText('Only XCEL')).toBeInTheDocument()
    expect(screen.getByText('Only Compass')).toBeInTheDocument()
  })

  it('defaults a new row to Both, and saves what was picked', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /Add the first|Add link/ }))

    expect(screen.getByRole('radio', { name: 'Both' })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: 'XCEL' }))
    await user.type(screen.getByLabelText('Address'), 'https://feat-x--y.netlify.app/dashboard-rebrand')
    await user.type(screen.getByLabelText('Title'), 'A branch')
    await user.click(screen.getByRole('button', { name: 'Add link' }))

    await waitFor(() => expect(writes).toHaveLength(1))
    expect(writes[0].body).toMatchObject({ product: 'xcel' })
  })
})

/* ── the badges ───────────────────────────────────────────────────────────── */

describe('badges sit under the title', () => {
  it('renders visibility, product and author as badges', async () => {
    mockEndpoint([row({ title: 'A branch', addedBy: 'Anjani', product: 'compass' })])
    render(<DemoPanel />)
    const title = await screen.findByText('A branch')
    // The row's own container, so this asserts the ORDER on screen and not just
    // that the three strings exist somewhere on the page.
    const li = title.closest('li')!
    const text = li.textContent ?? ''
    expect(text.indexOf('A branch')).toBeLessThan(text.indexOf('UX Only'))
    expect(text).toContain('Compass')
    expect(text).toContain('Anjani')
  })

  it('gives the visibility badge a different treatment from the product tag', async () => {
    mockEndpoint([row({ title: 'A branch', product: 'compass' })])
    render(<DemoPanel />)
    const li = (await screen.findByText('A branch')).closest('li')!
    const vis = within(li).getByText('UX Only')
    const prod = within(li).getByText('Compass')
    // The first attempt tinted both from the palette's hues and they collapsed
    // to the same fill in the dark theme — `--ux-hue-blue` and `--ux-accent`
    // are the same hex in one palette, and `--ux-chip` is accent-derived. This
    // asserts the difference is fill-vs-no-fill, which no palette can undo.
    expect(vis.style.background).not.toBe(prod.style.background)
    expect(vis.style.background).toBe('transparent')
    expect(prod.style.background).not.toBe('transparent')
  })

  it('gives XCEL, Compass and Both three different colours', async () => {
    mockEndpoint([
      row({ id: 'demo-003', title: 'One', product: 'xcel' }),
      row({ id: 'demo-002', title: 'Two', product: 'compass' }),
      row({ id: 'demo-001', title: 'Three', product: 'both' }),
    ])
    render(<DemoPanel />)
    await screen.findByText('One')
    // Scoped to each ROW: the filter pills above the list carry the same words,
    // and an unscoped query finds those instead.
    const badge = (title: string, label: string) =>
      within(screen.getByText(title).closest('li')!).getByText(label)
    const pairs: [string, string][] = [
      ['One', 'XCEL'],
      ['Two', 'Compass'],
      ['Three', 'Both'],
    ]
    const fills = pairs.map(([t, l]) => badge(t, l).style.background)
    const borders = pairs.map(([t, l]) => badge(t, l).style.border)
    // Three distinct hues, not one chip three times. Both halves matter: the
    // fill has to stay pale for the label to clear 4.5:1 in BOTH themes, so the
    // border is where most of the hue difference lives (measured: fill ΔE 6–19,
    // border ΔE 15–42).
    expect(new Set(fills).size).toBe(3)
    expect(new Set(borders).size).toBe(3)
  })

  it('renders no author badge when nobody signed it', async () => {
    mockEndpoint([row({ title: 'Unsigned', addedBy: '' })])
    render(<DemoPanel />)
    const li = (await screen.findByText('Unsigned')).closest('li')!
    // An empty badge reads as a name that failed to load.
    expect(li.textContent).not.toMatch(/·\s*$/)
    expect(within(li).queryByText('by')).not.toBeInTheDocument()
  })

  it('leaves Resources on its meta line', async () => {
    // Links has one fact where Refinement has three, and its suite pins the
    // meta line's exact shape — including the no-author case.
    mockEndpoint([row({ id: 'link-001', title: 'A brief', addedBy: 'Jill', addedDate: '2026-09-10' })])
    render(<LinksPanel />)
    expect(await screen.findByText(/added 2026-09-10 · by Jill/)).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Both' })).not.toBeInTheDocument()
  })
})

/* ── the switch ───────────────────────────────────────────────────────────── */

describe('the public toggle is a switch', () => {
  it('exposes switch semantics, not a checkbox', async () => {
    const user = userEvent.setup()
    mockEndpoint([])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /Add the first|Add link/ }))

    const sw = screen.getByRole('switch', { name: 'Show on public site' })
    expect(sw).not.toBeChecked()
    // A styled `<div>` would pass a screenshot and fail here.
    await user.click(sw)
    expect(sw).toBeChecked()
  })

  it('is off for a new row', async () => {
    const user = userEvent.setup()
    mockEndpoint([])
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /Add the first|Add link/ }))
    // A row is UX-only until someone decides otherwise, never the reverse.
    expect(screen.getByRole('switch', { name: 'Show on public site' })).not.toBeChecked()
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

  it('puts the author beside the menu, with no pill around the name', async () => {
    mockEndpoint([row({ title: 'A branch', addedBy: 'Anjani' })])
    render(<DemoPanel />)
    const li = (await screen.findByText('A branch')).closest('li')!
    const name = within(li).getByText('Anjani')
    // A pill around a name reads as a status the person is IN.
    expect(name.style.borderRadius).toBe('')
    expect(name.style.background).toBe('')
  })
})
