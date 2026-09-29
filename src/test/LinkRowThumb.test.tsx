import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DemoPanel, LinksPanel } from '@/components/prototype/LinksPanel'
import { accentsByHost, hostKey, linkThumbKind } from '@/components/prototype/linkRowThumb'
import type { StoredLink } from '@/data/linkStore'

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
 *  1. The tile is on Refinement and NOT on Other Links. Both boards are the
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
  isPublic: false,
  addedDate: '2026-09-22',
  ...over,
})

function mockEndpoint(rows: StoredLink[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ links: rows }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    ),
  )
}

/** The tile is `aria-hidden` decoration with no text, so it cannot be found by
 *  role or name. Its fixed 160px width is what identifies it. */
function tiles(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('li span[aria-hidden]')).filter(
    (n) => n.style.width === '160px',
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

  it('draws none on Other Links', async () => {
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
