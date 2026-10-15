import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoPanel } from '@/components/prototype/LinksPanel'
import {
  featureKey,
  groupByFeature,
  isSuperseded,
  knownFeatures,
  latestChunkFor,
  type StoredLink,
} from '@/data/linkStore'
import { validateRecord, type BoardConfig } from '../../netlify/lib/linkBoard'

/**
 * FEATURE REFINEMENT — 2026-10-15.
 *
 * Refinement's rows are CHUNKS of work and `feature` is what they are chunks
 * OF. The board groups on it so that three small branches read as one feature
 * with a history, which is the reason a designer would cut a fresh branch
 * rather than push to the same one for a fortnight.
 *
 * What is pinned here is the behaviour that makes that bargain hold, and each
 * of these was a decision rather than an implementation detail:
 *
 *  - grouping is case-insensitive, because the field is free text (a curated
 *    list was rejected: it would put Jillienne between a designer and a new
 *    branch);
 *  - a superseded chunk COLLAPSES and stays clickable — it is never hidden and
 *    never auto-archived, because the clickable history IS the reward;
 *  - supersession is derived from the newer chunk, so archiving that chunk
 *    brings the older one back;
 *  - the fields exist on Refinement's endpoint and NOWHERE else.
 *
 * Fixtures are built explicitly here rather than reaching for a named row on a
 * real board — the `ProgressFillTones` rule in `docs/testing.md`.
 */

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'demo-001',
  title: 'A chunk',
  url: 'https://feat-x--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
  note: '',
  addedBy: 'Anjani',
  type: '',
  product: 'both',
  addedDate: '2026-10-10',
  updatedAt: '2026-10-10T09:00:00.000Z',
  archivedAt: '',
  archivedBy: '',
  feature: '',
  supersedes: '',
  ...over,
})

const DEMO_CFG: BoardConfig = {
  storeName: 'demos',
  idPrefix: 'demo',
  segment: 'demos',
  types: null,
  products: true,
  archivable: true,
  features: true,
}

const LINKS_CFG: BoardConfig = {
  ...DEMO_CFG,
  idPrefix: 'link',
  segment: 'links',
  features: false,
}

function mockEndpoint(rows: StoredLink[]) {
  const writes: { method: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const method = init?.method ?? 'GET'
      if (String(input).includes('/api/branches')) {
        return new Response(JSON.stringify({ branches: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (method !== 'GET') {
        writes.push({
          method,
          body: init?.body ? JSON.parse(String(init.body)) : null,
        })
        return new Response(JSON.stringify({ link: rows[0] }), {
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

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

/* ── the grouping key ─────────────────────────────────────────────────────── */

describe('featureKey', () => {
  it('reads case and spacing differences as ONE feature', () => {
    // The whole mitigation for free text. "Streak card" typed twice, slightly
    // differently, must not become two groups nobody can reconcile.
    expect(featureKey('Study streak card')).toBe(featureKey('study  Streak Card'))
    expect(featureKey('  Trimmed  ')).toBe('trimmed')
  })

  it('reads an ungrouped row as ungrouped rather than as a feature called ""', () => {
    expect(featureKey('')).toBe('')
    expect(featureKey('   ')).toBe('')
  })
})

describe('knownFeatures', () => {
  it('offers each feature once, spelled the way the newest chunk spells it', () => {
    // Newest first is the order the board hands over, so a corrected
    // capitalisation is what gets suggested from then on.
    const features = knownFeatures([
      row({ id: 'demo-003', feature: 'Study streak card' }),
      row({ id: 'demo-002', feature: 'study streak CARD' }),
      row({ id: 'demo-001', feature: 'Week planner' }),
    ])
    expect(features).toEqual(['Study streak card', 'Week planner'])
  })

  it('still offers a feature whose last chunk was archived', () => {
    // A word the team uses does not stop being one because the work paused —
    // and leaving it out would invite a near-miss spelling next time.
    expect(
      knownFeatures([
        row({
          feature: 'Week planner',
          archivedAt: '2026-10-14T10:00:00.000Z',
        }),
      ]),
    ).toEqual(['Week planner'])
  })
})

/* ── supersession ─────────────────────────────────────────────────────────── */

describe('isSuperseded', () => {
  const first = row({ id: 'demo-001', feature: 'Streak' })
  const second = row({
    id: 'demo-002',
    feature: 'Streak',
    supersedes: 'demo-001',
  })

  it('is decided by the NEWER chunk, which is the only writer of the relation', () => {
    expect(isSuperseded(first, [first, second])).toBe(true)
    expect(isSuperseded(second, [first, second])).toBe(false)
  })

  it('brings the older chunk back when the newer one is archived', () => {
    // The honest reading: the thing that replaced it is no longer on the board.
    const archived = { ...second, archivedAt: '2026-10-15T09:00:00.000Z' }
    expect(isSuperseded(first, [first, archived])).toBe(false)
  })

  it('treats a dangling id as superseding nothing', () => {
    // The endpoint deliberately does not refuse a write whose target was
    // deleted by someone else — so the board has to cope with one.
    const orphan = row({ id: 'demo-009', supersedes: 'demo-404' })
    expect(isSuperseded(first, [first, orphan])).toBe(false)
  })
})

/* ── the arranged board ───────────────────────────────────────────────────── */

describe('groupByFeature', () => {
  const newest = row({
    id: 'demo-003',
    feature: 'Streak',
    updatedAt: '2026-10-15T12:00:00.000Z',
  })
  const middle = row({
    id: 'demo-002',
    feature: 'Streak',
    updatedAt: '2026-10-12T12:00:00.000Z',
    supersedes: 'demo-001',
  })
  const oldest = row({
    id: 'demo-001',
    feature: 'Streak',
    updatedAt: '2026-10-10T12:00:00.000Z',
  })
  const loose = row({
    id: 'demo-004',
    feature: '',
    updatedAt: '2026-10-13T12:00:00.000Z',
  })
  const all = [newest, loose, middle, oldest]

  it('splits a group into what is current and what a later chunk replaced', () => {
    const [group] = groupByFeature([newest, middle, oldest], all) as [
      Extract<ReturnType<typeof groupByFeature>[number], { kind: 'group' }>,
    ]
    expect(group.kind).toBe('group')
    expect(group.current.map((l) => l.id)).toEqual(['demo-003', 'demo-002'])
    expect(group.earlier.map((l) => l.id)).toEqual(['demo-001'])
  })

  it('leaves an ungrouped row where its date puts it, rather than in a trailing bucket', () => {
    // The board is mixed while the habit forms. A bucket of everything written
    // before today would read as a backlog to clear; these are just rows.
    const items = groupByFeature([newest, loose, middle, oldest], all)
    expect(items.map((i) => i.kind)).toEqual(['group', 'single'])
  })

  it('labels the group with the newest chunk’s own spelling', () => {
    const items = groupByFeature(
      [
        row({ id: 'demo-003', feature: 'Streak card' }),
        row({ id: 'demo-001', feature: 'STREAK CARD' }),
      ],
      all,
    )
    expect(items[0].kind === 'group' && items[0].label).toBe('Streak card')
  })

  it('keeps a superseded chunk collapsed even when a filter is hiding its replacement', () => {
    // Whether a chunk was replaced is a fact about the work, not about what is
    // currently on screen — so it is judged against the unfiltered index.
    const items = groupByFeature([oldest], all)
    expect(items[0].kind === 'group' && items[0].earlier.map((l) => l.id)).toEqual(['demo-001'])
  })
})

describe('latestChunkFor', () => {
  const mine = row({
    id: 'demo-002',
    feature: 'Streak',
    addedBy: 'Anjani',
    updatedAt: '2026-10-14T12:00:00.000Z',
  })
  const older = row({
    id: 'demo-001',
    feature: 'Streak',
    addedBy: 'Anjani',
    updatedAt: '2026-10-10T12:00:00.000Z',
  })
  const theirs = row({
    id: 'demo-003',
    feature: 'Streak',
    addedBy: 'Eric',
    updatedAt: '2026-10-15T12:00:00.000Z',
  })

  it('offers the author their OWN newest chunk as the default', () => {
    expect(latestChunkFor([older, mine, theirs], 'Streak', 'Anjani')?.id).toBe('demo-002')
  })

  it('matches a free-text author loosely, the way the designer pills do', () => {
    expect(
      latestChunkFor(
        [row({ id: 'demo-007', feature: 'Streak', addedBy: 'Afsana & Eric' })],
        'Streak',
        'Eric',
      )?.id,
    ).toBe('demo-007')
  })

  it('offers nothing for a feature nobody has a chunk of', () => {
    expect(latestChunkFor([mine], 'Week planner', 'Anjani')).toBeNull()
    expect(latestChunkFor([mine], '', 'Anjani')).toBeNull()
  })

  it('never offers the row being edited the chance to replace itself', () => {
    expect(latestChunkFor([mine, older], 'Streak', 'Anjani', 'demo-002')?.id).toBe('demo-001')
  })
})

/* ── the endpoint ─────────────────────────────────────────────────────────── */

describe('the Refinement endpoint', () => {
  const ok = (r: ReturnType<typeof validateRecord>) => {
    if ('errors' in r) throw new Error(r.errors.join(' '))
    return r.record
  }
  const base = { title: 'A chunk', url: 'https://example.com/x' }

  it('stores the feature and what the chunk replaces', () => {
    const rec = ok(
      validateRecord(
        DEMO_CFG,
        { ...base, feature: ' Streak card ', supersedes: 'demo-001' },
        'demo-002',
      ),
    )
    expect(rec.feature).toBe('Streak card')
    expect(rec.supersedes).toBe('demo-001')
  })

  it('does not police the WORDING — free text is the decision', () => {
    // A value nobody has used before is the normal case: it is a new feature.
    expect(
      ok(
        validateRecord(DEMO_CFG, { ...base, feature: 'Something nobody typed before' }, 'demo-002'),
      ).feature,
    ).toBe('Something nobody typed before')
  })

  it('refuses a row that supersedes itself', () => {
    // Only reachable by hand — the form excludes the row being edited — but it
    // would collapse into its own group and never come back.
    const r = validateRecord(DEMO_CFG, { ...base, supersedes: 'demo-002' }, 'demo-002')
    expect('errors' in r && r.errors.join(' ')).toMatch(/cannot be the row itself/)
  })

  it('refuses a supersedes that is not an id on this board', () => {
    const r = validateRecord(DEMO_CFG, { ...base, supersedes: 'https://evil.example' }, 'demo-002')
    expect('errors' in r && r.errors.join(' ')).toMatch(/id of a row on this board/)
  })

  it('accepts an id whose row was deleted by someone else', () => {
    // Refusing would mean a designer cannot save because of something another
    // person did; a dangling id simply supersedes nothing.
    expect(
      ok(validateRecord(DEMO_CFG, { ...base, supersedes: 'demo-404' }, 'demo-002')).supersedes,
    ).toBe('demo-404')
  })

  it('caps the feature at a length that keeps the group header one line', () => {
    const r = validateRecord(DEMO_CFG, { ...base, feature: 'x'.repeat(81) }, 'demo-002')
    expect('errors' in r && r.errors.join(' ')).toMatch(/feature is longer/)
  })

  it('DROPS both fields on every other board', () => {
    // Same rule as `product` and the archive: a Links record must not acquire
    // a grouping that board has no control for and no way to show.
    const rec = ok(
      validateRecord(LINKS_CFG, { ...base, feature: 'Streak', supersedes: 'link-001' }, 'link-002'),
    )
    expect(rec).not.toHaveProperty('feature')
    expect(rec).not.toHaveProperty('supersedes')
  })
})

/* ── the board on screen ──────────────────────────────────────────────────── */

describe('the Refinement board', () => {
  it('draws one header over the chunks of a feature, and folds what was replaced', async () => {
    mockEndpoint([
      row({
        id: 'demo-002',
        title: 'Streak card v2',
        feature: 'Study streak card',
        updatedAt: '2026-10-15T12:00:00.000Z',
        supersedes: 'demo-001',
      }),
      row({
        id: 'demo-001',
        title: 'Streak card',
        feature: 'study streak CARD',
        updatedAt: '2026-10-10T12:00:00.000Z',
      }),
    ])
    render(<DemoPanel />)

    expect(await screen.findByText('Study streak card')).toBeInTheDocument()
    expect(screen.getByText('Streak card v2')).toBeInTheDocument()
    // Folded, not removed — and the count says how much history is behind it.
    expect(screen.queryByText('Streak card')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '1 earlier chunk' })).toBeInTheDocument()
  })

  it('opens the earlier chunks, which stay clickable — the reward for small branches', async () => {
    const user = userEvent.setup()
    mockEndpoint([
      row({
        id: 'demo-002',
        title: 'Streak card v2',
        feature: 'Streak',
        updatedAt: '2026-10-15T12:00:00.000Z',
        supersedes: 'demo-001',
      }),
      row({
        id: 'demo-001',
        title: 'Streak card',
        feature: 'Streak',
        updatedAt: '2026-10-10T12:00:00.000Z',
      }),
    ])
    render(<DemoPanel />)

    await user.click(await screen.findByRole('button', { name: '1 earlier chunk' }))
    // A link, not a tombstone: the older branch build still opens.
    const earlier = screen.getByText('Streak card')
    expect(earlier.closest('a')).toHaveAttribute('href')
    expect(screen.getByRole('button', { name: 'Hide earlier' })).toBeInTheDocument()
  })

  it('leaves a row with no feature exactly as it was — no header, no group', async () => {
    mockEndpoint([row({ id: 'demo-001', title: 'An older row', feature: '' })])
    render(<DemoPanel />)

    expect(await screen.findByText('An older row')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /earlier chunk/ })).not.toBeInTheDocument()
  })

  it('prefills Replaces with the author’s newest chunk of the feature they typed', async () => {
    const user = userEvent.setup()
    mockEndpoint([
      row({
        id: 'demo-001',
        title: 'Streak card',
        feature: 'Streak',
        addedBy: 'Anjani',
      }),
    ])
    render(<DemoPanel />)

    await user.click(await screen.findByRole('button', { name: /Add link/ }))
    const dialog = screen.getByRole('dialog')
    await user.selectOptions(within(dialog).getByLabelText(/Added by/), 'Anjani')
    await user.type(within(dialog).getByLabelText(/Feature/), 'Streak')

    // The default is the thing that usually happens: this branch carries on
    // from the last one.
    await waitFor(() => expect(within(dialog).getByLabelText('Replaces')).toHaveValue('demo-001'))
    // And saying they sit side by side is one click — which is a real answer,
    // not an escape hatch: two treatments of one surface is what Refinement is
    // for.
    await user.selectOptions(within(dialog).getByLabelText('Replaces'), '')
    expect(within(dialog).getByLabelText('Replaces')).toHaveValue('')
  })

  it('sends the feature and the supersession to the endpoint', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoint([
      row({
        id: 'demo-001',
        title: 'Streak card',
        feature: 'Streak',
        addedBy: 'Anjani',
      }),
    ])
    render(<DemoPanel />)

    await user.click(await screen.findByRole('button', { name: /Add link/ }))
    const dialog = screen.getByRole('dialog')
    await user.type(
      within(dialog).getByLabelText(/Address/),
      'https://feat-y--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
    )
    await user.type(within(dialog).getByLabelText(/Title/), 'Streak card v2')
    await user.selectOptions(within(dialog).getByLabelText(/Added by/), 'Anjani')
    await user.type(within(dialog).getByLabelText(/Feature/), 'Streak')
    await user.click(within(dialog).getByRole('button', { name: /Save|Add/ }))

    await waitFor(() => expect(writes.length).toBe(1))
    expect(writes[0].body).toMatchObject({
      feature: 'Streak',
      supersedes: 'demo-001',
    })
  })
})
