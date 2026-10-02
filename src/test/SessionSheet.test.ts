import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TESTABLE_CTAS } from '@/data/testableCtas'

/**
 * THE SESSION SHEET STAYS COUPLED TO THE CATALOG.
 *
 * ⚠ `scripts/session-sheet.mjs` READS `testableCtas.ts` BY REGEX, because the
 * catalog is TypeScript and the generator is a plain node script. That is a
 * coupling that rots silently: reformat the catalog, and the sheet quietly
 * lists fewer controls — or none — while still publishing successfully. A
 * moderator then hands a colleague a document that omits a control, and they
 * go looking for a button that is not there.
 *
 * So the count is asserted from BOTH sides. The script refuses to write an
 * empty sheet; this refuses to let it write a short one.
 */

function run(args: string[]): { out: string; html: string } {
  const dir = mkdtempSync(join(tmpdir(), 'sheet-'))
  const file = join(dir, 'sheet.html')
  const out = execFileSync('node', ['scripts/session-sheet.mjs', '--out', file, ...args], {
    encoding: 'utf8',
  })
  return { out, html: readFileSync(file, 'utf8') }
}

describe('the session sheet generator', () => {
  it('lists every control in the catalog, and no phantom ones', () => {
    const { html, out } = run([])
    for (const cta of TESTABLE_CTAS) {
      expect(html, `${cta.id} missing from the sheet`).toContain(`value="${cta.id}"`)
    }
    /* ⚠ THE COUNT, NOT JUST THE PRESENCE. Every id being findable would still
       pass if the regex picked up extras from a comment — and this catalog
       DOES carry removed rows in comments (`header.logo`,
       `home.study-pace-adjust`), which is exactly the shape that would slip
       through. */
    expect(out).toContain(`${TESTABLE_CTAS.length} controls`)
    expect(html).toContain(`${TESTABLE_CTAS.length} controls in the catalog`)
    for (const retired of ['header.logo', 'home.study-pace-adjust']) {
      expect(html, `${retired} is retired and must not be offered`).not.toContain(
        `value="${retired}"`,
      )
    }
  })

  it('pre-ticks the session it was given, and nothing else', () => {
    const { html } = run(['--dead', 'nav.courses,home.resume'])
    expect(html).toContain('value="nav.courses" checked')
    expect(html).toContain('value="home.resume" checked')
    expect(html).toContain('value="nav.support">')
  })

  it('builds the participant and moderator links from the same session', () => {
    /* The moderator link is the participant one plus `?test=0` — the same
       rigging with the demo bar back, for setting a persona before handing the
       laptop over. If the two ever describe different sessions, the setup a
       moderator checks is not the one the participant gets. */
    const { out } = run(['--persona', 'progress-on-track', '--dead', 'nav.courses'])
    const participant = /participant\s+(\S+)/.exec(out)![1]
    const moderator = /moderator\s+(\S+)/.exec(out)![1]
    expect(participant).toContain('ff=dashboard-progress-state:progress-on-track')
    expect(participant).toContain('dead=nav.courses')
    expect(moderator).toContain('test=0')
    expect(moderator).toContain('ff=dashboard-progress-state:progress-on-track')
    expect(moderator).toContain('dead=nav.courses')
    expect(participant).not.toContain('test=')
  })

  it('says nothing rather than something wrong about an unknown id', () => {
    /* An id the app does not know leaves that control LIVE, and the only
       warning at run time is a console message nobody is watching. Better to
       fail here, where someone is reading the output. */
    expect(() => run(['--dead', 'home.nope'])).toThrow()
  })

  it('carries the build it was frozen from', () => {
    /* The whole reason the sheet is a document rather than a link: a second
       moderator opens it and knows which commit they are running. */
    const { html } = run(['--sha', 'abc1234', '--tag', 'session-2026-09-24-pace'])
    expect(html).toContain('abc1234')
    expect(html).toContain('session-2026-09-24-pace')
  })
})
