import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  RETIRED_HOSTS,
  rehostRetired,
  validateRecord,
  type BoardConfig,
} from '../../netlify/lib/linkBoard'

/**
 * THE RETIRED HOST — 2026-10-15.
 *
 * The demo project was deleted when the Hub became the one site, and a deleted
 * Netlify project does not redirect: `ux-demo-xceldashboard.netlify.app`, and
 * every branch alias under it, answers Netlify's own "Site not found" page.
 * What made this expensive rather than cosmetic is WHERE those addresses had
 * already been written down — Refinement rows, authored over weeks by people
 * who will not be editing them again. The board's whole job is to not lose
 * work, and it was handing out 404s for work that is still built.
 *
 * This file pins the fix from the two directions it can regress:
 *
 *  1. the SWAP — stored rows open, with no migration to run; and
 *  2. the SOURCES — nothing in the shipped app writes the dead host down
 *     again. That is the sweep at the bottom, and it is the half that
 *     actually failed: the retirement commit changed the hub's LABEL and left
 *     two constants pointing at the deleted project.
 */

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '../..')

const DEAD = 'ux-demo-xceldashboard.netlify.app'
const LIVE = 'ux-design-xceldashboard.netlify.app'

/** The Demo board's own config — `netlify/functions/demos.ts`, restated so a
 *  record goes through exactly the path a real Refinement row does. */
const DEMO: BoardConfig = {
  storeName: 'demos',
  idPrefix: 'demo',
  segment: 'demos',
  types: null,
  products: true,
  archivable: true,
  features: true,
}

describe('the map', () => {
  it('names the deleted project, pointing at the Hub', () => {
    expect(RETIRED_HOSTS[DEAD]).toBe(LIVE)
  })

  it('never maps a host to itself — an identity entry is a swap that does nothing', () => {
    for (const [dead, live] of Object.entries(RETIRED_HOSTS)) {
      expect(dead, 'a retired host must differ from its replacement').not.toBe(live)
    }
  })
})

describe('rehostRetired', () => {
  it('swaps the bare host, keeping the path and the query', () => {
    expect(rehostRetired(`https://${DEAD}/dashboard-rebrand?demo=1`)).toBe(
      `https://${LIVE}/dashboard-rebrand?demo=1`,
    )
  })

  it('swaps a BRANCH alias, keeping the branch', () => {
    // The case that matters most: the Hub builds every branch the demo site
    // did, so the same build is one hostname away.
    expect(rehostRetired(`https://feat-pace--${DEAD}/dashboard-rebrand?demo=1`)).toBe(
      `https://feat-pace--${LIVE}/dashboard-rebrand?demo=1`,
    )
  })

  it('keeps a deep path, a hash and a long branch slug', () => {
    expect(
      rehostRetired(`https://claude-gallant-feynman-aj0m0i--${DEAD}/prototypes/x.html#top`),
    ).toBe(`https://claude-gallant-feynman-aj0m0i--${LIVE}/prototypes/x.html#top`)
  })

  it('leaves the live host alone', () => {
    const live = `https://feat-x--${LIVE}/dashboard-rebrand?demo=1`
    expect(rehostRetired(live)).toBe(live)
  })

  it('leaves an unrelated host alone — this corrects a rename, it does not police links', () => {
    for (const url of [
      'https://www.figma.com/file/abc',
      'https://xcelusertesting.netlify.app/dashboard-rebrand',
      'https://ux-lms-dashboard.netlify.app/prototypes',
    ]) {
      expect(rehostRetired(url)).toBe(url)
    }
  })

  it('requires the `--` — a host that merely ENDS with the dead one is a different site', () => {
    const impostor = `https://not${DEAD}/x`
    expect(rehostRetired(impostor)).toBe(impostor)
  })

  it('hands back anything it cannot parse, unchanged', () => {
    expect(rehostRetired('not a url')).toBe('not a url')
    expect(rehostRetired('')).toBe('')
  })
})

describe('on the way in — a row cannot be written pointing at the dead site', () => {
  it('swaps the host as it stores the record', () => {
    const result = validateRecord(
      DEMO,
      { title: 'Nav exploration', url: `https://${DEAD}/dashboard-rebrand?demo=1`, addedBy: 'Jill' },
      'demo-006',
    )
    expect('errors' in result ? result.errors : []).toEqual([])
    expect('record' in result && result.record.url).toBe(`https://${LIVE}/dashboard-rebrand?demo=1`)
  })

  it('still rejects what it rejected before — the swap is not a way past the checks', () => {
    const result = validateRecord(DEMO, { title: 'X', url: 'javascript:alert(1)' }, 'demo-007')
    expect('errors' in result).toBe(true)
  })
})

describe('on the way out — the rows already in Blobs', () => {
  it('the collection and the single-record reads both go through `serveRecord`', () => {
    // The read path is inside the handler closure and needs a store to call,
    // so this pins the WIRING: both responses map the stored record rather
    // than returning it raw. Without this, the fix would work for rows saved
    // after today and for nothing else — which is the entire problem.
    const src = readFileSync(resolve(root, 'netlify/lib/linkBoard.ts'), 'utf8')
    expect(src).toContain('links.filter(Boolean).map(serveRecord)')
    expect(src).toContain('json({ link: serveRecord(found) })')
  })
})

describe('the sources that handed the dead host out', () => {
  it('the branch strip falls back to the Hub', () => {
    const src = readFileSync(resolve(root, 'netlify/functions/branches.ts'), 'utf8')
    const declared = /const DEFAULT_SITE_HOST = '([^']+)'/.exec(src)?.[1]
    expect(declared, 'branches.ts must declare DEFAULT_SITE_HOST').toBeTruthy()
    expect(declared).toBe(LIVE)
  })

  it('the prototype bar’s hub item opens the Hub', () => {
    const src = readFileSync(resolve(root, 'src/components/layout/PrototypeBar.tsx'), 'utf8')
    const declared = /const HUB_URL = '([^']+)'/.exec(src)?.[1]
    expect(declared, 'PrototypeBar.tsx must declare HUB_URL').toBeTruthy()
    expect(declared).toBe(`https://${LIVE}/`)
  })

  it('no shipped source writes the dead host inside a string', () => {
    // Prose may name it — the docs and this file's own comments are the
    // RECORD of the retirement, and `branchStore.ts` uses it as an example of
    // a host in a comment. What must not exist is a string LITERAL: that is
    // an address the app can hand someone.
    const offenders: string[] = []
    const skip = new Set(['node_modules', 'dist', '.git', 'test'])
    // The ONE file allowed to name it: `RETIRED_HOSTS` is the map, and the
    // dead host is its key. Everywhere else, the string is a live address.
    const theMap = resolve(root, 'netlify/lib/linkBoard.ts')

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        if (skip.has(entry)) continue
        const full = join(dir, entry)
        if (statSync(full).isDirectory()) {
          walk(full)
          continue
        }
        if (!/\.(ts|tsx|mjs)$/.test(entry)) continue
        if (full === theMap) continue
        for (const line of readFileSync(full, 'utf8').split('\n')) {
          // Comment lines are the record of the retirement — several files
          // name the dead host to say WHY they no longer use it, and that
          // warning is the thing most likely to stop this recurring. Only
          // code counts.
          const text = line.trim()
          if (text.startsWith('*') || text.startsWith('//') || text.startsWith('/*')) continue
          if (/['"`][^'"`]*ux-demo-xceldashboard\.netlify\.app/.test(line)) {
            offenders.push(`${full.slice(root.length + 1)}: ${text}`)
          }
        }
      }
    }
    walk(resolve(root, 'src'))
    walk(resolve(root, 'netlify'))
    walk(resolve(root, 'scripts'))

    expect(offenders, `these hand out a deleted Netlify project:\n${offenders.join('\n')}`).toEqual([])
  })
})
