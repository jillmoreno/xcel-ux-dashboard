import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel, LinksPanel } from '@/components/prototype/LinksPanel'
import { isBranchOnBoard, titleFromBranch } from '@/data/branchStore'
import { selectBranchDeploys, slugifyBranch, REVIEW_PATH } from '../../netlify/lib/branchDeploys'
import type { StoredLink } from '@/data/linkStore'

/**
 * The automatic branch list (2026-09-21).
 *
 * What is pinned here is the distinction the feature turns on, because the
 * obvious simplification destroys it: a branch having a build is a FACT, and a
 * Refinement row is somebody ASKING to be reviewed. So the strip never writes,
 * its button opens the same Add form with `isPublic` false, and the review
 * gate is untouched.
 *
 * The rest is the two things that would silently go wrong: which deploys count
 * (a preview, a failed build or `main` in the list is a link that misleads or
 * 404s), and where the strip is allowed to appear (branch names on the public
 * build are a roadmap stakeholders were never shown).
 */

const here = dirname(fileURLToPath(import.meta.url))

const deploy = (over: Record<string, unknown> = {}) => ({
  context: 'branch-deploy',
  state: 'ready',
  branch: 'feat/streak',
  title: 'Add the streak card',
  committer: 'Sam',
  published_at: '2026-09-20T10:00:00.000Z',
  links: { branch: 'https://feat-streak--ux-demo-xceldashboard.netlify.app' },
  ...over,
})

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'demo-001',
  title: 'Something already up',
  url: 'https://feat-old--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
  note: 'Look here.',
  addedBy: 'Sam',
  type: '',
  isPublic: false,
  addedDate: '2026-09-18',
  ...over,
})

/** Both endpoints from one stub: the board on `/api/demos`, the strip on
 *  `/api/branches`. They are separate fetches and the panel renders both. */
function mockEndpoints({
  rows = [] as StoredLink[],
  branches = null as unknown,
  branchStatus = 200,
} = {}) {
  const writes: { method: string; url: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      if (url.includes('/api/branches')) {
        return json(branches ?? { configured: false, branches: [], reason: 'no-credentials' }, branchStatus)
      }
      if (method !== 'GET') {
        writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
        return json({ link: row() }, 201)
      }
      return json({ links: rows })
    }),
  )
  return { writes }
}

async function loadPublicDemoPanel() {
  vi.resetModules()
  vi.stubEnv('VITE_GATEWAY_MODE', 'public')
  const mod = await import('@/components/prototype/LinksPanel')
  return mod.DemoPanel
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

/* ── which deploys count ──────────────────────────────────────────────────── */

describe('selectBranchDeploys', () => {
  const opts = { siteHost: 'ux-demo-xceldashboard.netlify.app' }

  it('keeps a ready branch deploy', () => {
    const out = selectBranchDeploys([deploy()], opts)
    expect(out).toHaveLength(1)
    expect(out[0].branch).toBe('feat/streak')
    expect(out[0].url).toBe('https://feat-streak--ux-demo-xceldashboard.netlify.app')
  })

  /* A reviewer needs a URL that OPENS. A building or failed deploy has none,
     which is the entire reason the deploy feed is the source rather than the
     branch list. */
  it('drops a deploy that is not ready', () => {
    expect(selectBranchDeploys([deploy({ state: 'building' })], opts)).toHaveLength(0)
    expect(selectBranchDeploys([deploy({ state: 'error' })], opts)).toHaveLength(0)
  })

  /* A deploy preview is a pull request's own build at a `deploy-preview-N--`
     address that dies when the PR closes. The branch alias survives and always
     points at the newest build, and it is the link this board is about. */
  it('drops deploy previews and production', () => {
    expect(selectBranchDeploys([deploy({ context: 'deploy-preview' })], opts)).toHaveLength(0)
    expect(selectBranchDeploys([deploy({ context: 'production' })], opts)).toHaveLength(0)
  })

  /* `main` IS Prototypes — it is not work in review. Dropped by NAME as well
     as by context, because a site can be configured to build it as a branch
     deploy too. */
  it('drops the production branch even when it arrives as a branch deploy', () => {
    const out = selectBranchDeploys([deploy({ branch: 'main' })], opts)
    expect(out).toHaveLength(0)
  })

  /* The feed is a history. Without this, a branch pushed five times is five
     rows and one person's work fills the strip. */
  it('keeps one row per branch, the newest build', () => {
    const out = selectBranchDeploys(
      [
        deploy({ published_at: '2026-09-18T10:00:00.000Z', title: 'older' }),
        deploy({ published_at: '2026-09-20T10:00:00.000Z', title: 'newer' }),
      ],
      opts,
    )
    expect(out).toHaveLength(1)
    expect(out[0].commit).toBe('newer')
  })

  it('sorts newest first', () => {
    const out = selectBranchDeploys(
      [
        deploy({ branch: 'feat/a', published_at: '2026-09-18T10:00:00.000Z', links: null }),
        deploy({ branch: 'feat/b', published_at: '2026-09-20T10:00:00.000Z', links: null }),
      ],
      opts,
    )
    expect(out.map((b) => b.branch)).toEqual(['feat/b', 'feat/a'])
  })

  /* Netlify's own answer is preferred; the slug rule is the safety net for a
     deploy that does not carry one, because a row with no address is worse
     than no row. */
  it('derives the address when Netlify does not supply one', () => {
    const out = selectBranchDeploys([deploy({ links: null, branch: 'Feat/Odd_Name' })], opts)
    expect(out[0].url).toBe('https://feat-odd-name--ux-demo-xceldashboard.netlify.app')
  })

  /* Same trust boundary the board has: this address is rendered as an href and
     can be handed to the Add form, and `javascript:` in an href executes in
     this origin. */
  it('refuses a non-http scheme from the API and falls back to the derived form', () => {
    const out = selectBranchDeploys(
      [deploy({ links: { branch: 'javascript:alert(1)' } })],
      opts,
    )
    expect(out[0].url).toBe('https://feat-streak--ux-demo-xceldashboard.netlify.app')
  })

  it('appends the review path, matching the promote-to-refinement skill', () => {
    expect(selectBranchDeploys([deploy()], opts)[0].reviewUrl).toBe(
      'https://feat-streak--ux-demo-xceldashboard.netlify.app' + REVIEW_PATH,
    )
    expect(REVIEW_PATH).toContain('demo=1')
  })

  it('survives a garbage feed', () => {
    expect(selectBranchDeploys(null, opts)).toEqual([])
    expect(selectBranchDeploys([null, 3, 'x', {}], opts)).toEqual([])
  })

  it('slugifies the way Netlify does', () => {
    expect(slugifyBranch('feat/Drop_The Band')).toBe('feat-drop-the-band')
    expect(slugifyBranch('--odd--')).toBe('odd')
  })
})

/* ── the strip in the panel ───────────────────────────────────────────────── */

describe('the Refinement branch strip', () => {
  const ok = {
    configured: true,
    branches: [
      {
        branch: 'feat/streak',
        slug: 'feat-streak',
        url: 'https://feat-streak--ux-demo-xceldashboard.netlify.app',
        reviewUrl: 'https://feat-streak--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
        updated: '2026-09-20',
        commit: 'Add the streak card',
        author: 'Sam',
      },
    ],
  }

  it('lists a branch with a build', async () => {
    mockEndpoints({ branches: ok })
    render(<DemoPanel />)
    expect(await screen.findByText('feat/streak')).toBeInTheDocument()
    expect(screen.getByText(/built 2026-09-20 · by Sam · Add the streak card/)).toBeInTheDocument()
  })

  /* The whole feature in one assertion: Add does not save, it OPENS THE FORM
     with the address and a draft title. The click is the gate — the same
     contract `promote-to-refinement` has, and for the same reason. */
  it('Add opens the form prefilled and writes nothing', async () => {
    const user = userEvent.setup()
    const { writes } = mockEndpoints({ branches: ok })
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /^Add$/ }))
    expect(await screen.findByLabelText('Address')).toHaveValue(
      'https://feat-streak--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
    )
    expect(screen.getByLabelText('Title')).toHaveValue('Streak')
    expect(writes).toHaveLength(0)
  })

  /* The note is the one field the strip COULD fill from the commit subject and
     the one it must not: "where to look" is what only the person who did the
     work knows, and a plausible wrong note reads as reviewed when nobody
     wrote it. */
  it('leaves the note empty and the public toggle off', async () => {
    const user = userEvent.setup()
    mockEndpoints({ branches: ok })
    render(<DemoPanel />)
    await user.click(await screen.findByRole('button', { name: /^Add$/ }))
    expect(await screen.findByLabelText(/Note/)).toHaveValue('')
    expect(screen.getByRole('checkbox', { name: /public/i })).not.toBeChecked()
  })

  /* A branch already up for review must not be offered again — and the strip
     says how many it dropped, so a designer who cannot find their branch can
     see why rather than guess. */
  it('drops a branch that is already on the board, and says so', async () => {
    mockEndpoints({
      rows: [row({ url: 'https://feat-streak--ux-demo-xceldashboard.netlify.app/anything' })],
      branches: ok,
    })
    render(<DemoPanel />)
    await waitFor(() => expect(screen.getByText(/already added/)).toBeInTheDocument())
    expect(screen.getByText('Every branch with a build is already on the board.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Add$/ })).not.toBeInTheDocument()
  })

  /* Silent when there is no endpoint, loud when there is one and it is
     misconfigured. A grey box above a healthy board every time someone runs
     `npm run dev` is noise that looks like a fault in the board. */
  it('says nothing at all when the endpoint is not there', async () => {
    mockEndpoints({ branches: { links: [] } }) // something else answered
    render(<DemoPanel />)
    // Wait for the board itself to settle, so the assertion is about the strip
    // being absent rather than about the panel not having rendered yet.
    await screen.findByRole('button', { name: /Add the first link/ })
    expect(screen.queryByText('Branch builds')).not.toBeInTheDocument()
  })

  it('names the env vars when it is deployed but not configured', async () => {
    mockEndpoints({ branches: { configured: false, branches: [], reason: 'no-credentials' } })
    render(<DemoPanel />)
    expect(await screen.findByText(/NETLIFY_API_TOKEN and NETLIFY_SITE_ID/)).toBeInTheDocument()
  })

  it('says the token may have expired when Netlify refuses', async () => {
    mockEndpoints({
      branches: { configured: true, branches: [], reason: 'netlify-401' },
      branchStatus: 502,
    })
    render(<DemoPanel />)
    expect(await screen.findByText(/token may have expired/)).toBeInTheDocument()
  })

  /* Branch names are internal. Two independent controls stop them reaching
     stakeholders; this is the one a reader of the client can see. */
  it('never renders on the public build', async () => {
    mockEndpoints({ branches: ok })
    const PublicDemo = await loadPublicDemoPanel()
    render(<PublicDemo />)
    await waitFor(() => expect(screen.queryByText('Branch builds')).not.toBeInTheDocument())
    expect(screen.queryByText('feat/streak')).not.toBeInTheDocument()
  })

  /* Other Links is not about branches. */
  it('does not render on Other Links', async () => {
    mockEndpoints({ branches: ok })
    render(<LinksPanel />)
    await waitFor(() => expect(screen.queryByText('Branch builds')).not.toBeInTheDocument())
  })
})

/* ── helpers ──────────────────────────────────────────────────────────────── */

describe('helpers', () => {
  it('matches a branch to a board row on the host, not the whole URL', () => {
    // The strip offers the review path; a designer may have added the root, a
    // deeper path, or a different query. What makes them one review is the
    // branch, and the host is where the branch's name lives.
    expect(
      isBranchOnBoard('feat-streak', ['https://feat-streak--site.netlify.app/anything?x=1']),
    ).toBe(true)
    expect(isBranchOnBoard('feat-streak', ['https://other--site.netlify.app/'])).toBe(false)
    // A NOTE that happens to mention the branch is not a match — only the host.
    expect(isBranchOnBoard('feat-streak', ['https://example.com/feat-streak'])).toBe(false)
    expect(isBranchOnBoard('feat-streak', ['not a url'])).toBe(false)
    expect(isBranchOnBoard('', ['https://feat-streak--site.netlify.app/'])).toBe(false)
  })

  it('drafts a title from the branch, not the commit subject', () => {
    expect(titleFromBranch('feat/drop-the-renewal-band')).toBe('Drop the renewal band')
    expect(titleFromBranch('fix/local-dev-server-npm-path')).toBe('Local dev server npm path')
    expect(titleFromBranch('streak')).toBe('Streak')
  })
})

/* ── the two controls that keep branch names off the public build ─────────── */

describe('the public-build guard', () => {
  const fn = readFileSync(resolve(here, '../../netlify/functions/branches.ts'), 'utf8')

  /* Control 2. Control 1 is "the public project has no token", which would be
     switched off silently the day someone sets the Blobs vars there to share a
     store — a reasonable thing to do. This one does not care. */
  it('the endpoint refuses outright when the build is public', () => {
    expect(fn).toMatch(/VITE_GATEWAY_MODE/)
    expect(fn).toMatch(/=== 'public'/)
    // Refused, not "returns an empty list" — an empty list is indistinguishable
    // from "no branches" and would hide the fact that this is not for here.
    expect(fn).toMatch(/404/)
  })

  it('writes nothing — it is a read-only endpoint', () => {
    expect(fn).toMatch(/req\.method !== 'GET'/)
    expect(fn).not.toMatch(/setJSON|store\.delete/)
  })

  /* Never echo Netlify's body: on an auth failure it can name the account. */
  it('does not echo the upstream body', () => {
    expect(fn).not.toMatch(/await res\.text\(\)/)
  })

  it('is routed in netlify.toml', () => {
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toMatch(/from = "\/api\/branches"/)
  })
})
