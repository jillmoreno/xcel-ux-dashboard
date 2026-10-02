import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROTECTED, isOwner, isProtected } from '../../.claude/hooks/protect-framework.mjs'

/**
 * THE BACKSTOP FOR THE FRAMEWORK-PROTECTION HOOK — 2026-09-24.
 *
 * The hook (`.claude/hooks/protect-framework.mjs`) refuses edits to the
 * dashboard's own machinery from anyone but its owner. It only sees Claude's
 * file tools, so it cannot see a hand edit in an IDE, a `sed -i` through Bash,
 * or a session with the hook turned off. This runs in the suite designers
 * already run before pushing, and catches those.
 *
 * ⚠ IT IS A WARNING, NOT A GATE, and deliberately: it names the files and says
 * who to ask. The point is a designer discovering they wandered somewhere they
 * did not mean to, at the moment it is still cheap to undo.
 */

const root = resolve(__dirname, '../..')
const git = (args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim()

describe('the dashboard framework is protected', () => {
  it('lists the same files CLAUDE.md tells designers not to touch', () => {
    /* ⚠ THE COUPLING THAT ROTS. The lock and the documentation are two
       different files, and a path added to one and not the other means either
       a designer is warned off something that is not actually protected, or —
       worse — protected from something the docs never mentioned. Read the table
       back out of CLAUDE.md so they cannot drift apart. */
    const md = readFileSync(resolve(root, 'CLAUDE.md'), 'utf8')
    const start = md.indexOf('## What you do not need to touch')
    expect(start, 'the CLAUDE.md section was renamed or removed').toBeGreaterThan(-1)
    /* ⚠ BOUNDED AT THE NEXT HEADING. Slicing to end-of-file scooped every
       backticked token in the document — token names, npm packages, component
       names — and reported 27 "unprotected paths" that were never paths. */
    const end = md.indexOf('\n## ', start + 1)
    const section = md.slice(start, end === -1 ? undefined : end)
    /* ⚠ THE TABLE ROWS ONLY, not the whole section. The prose around the table
       also contains backticked filenames — the hook's own path, this test's
       name — and counting those reported files as "documented but unprotected"
       when they are neither. A row is `| \`path\` | description |`. */
    const documented = section
      .split('\n')
      .filter((line) => line.startsWith('|'))
      .map((line) => /^\|\s*`([\w./-]+)`/.exec(line)?.[1])
      .filter((t): t is string => Boolean(t))
    expect(documented.length, 'could not read the CLAUDE.md table').toBeGreaterThan(5)

    const missing = documented.filter(
      (d) => !PROTECTED.some((p) => p === d || p.startsWith(d) || d.startsWith(p)),
    )
    expect(
      missing,
      `CLAUDE.md warns designers off these, but the hook does not protect them: ${missing.join(', ')}`,
    ).toEqual([])
  })

  it('the hook is actually wired, not just present', () => {
    /* A hook file nobody calls is a file that looks like protection. */
    const settings = JSON.parse(readFileSync(resolve(root, '.claude/settings.json'), 'utf8'))
    const cmds = JSON.stringify(settings.hooks?.PreToolUse ?? [])
    expect(cmds, 'settings.json does not run the protection hook').toContain(
      'protect-framework.mjs',
    )
    expect(cmds, 'the hook must cover the file-writing tools').toContain('Write')
  })

  it('warns when the current branch changes a protected file', () => {
    /* Skipped on main — main is where these files legitimately change. */
    let branch: string
    try {
      branch = git(['rev-parse', '--abbrev-ref', 'HEAD'])
    } catch {
      return // no git (a tarball, a CI checkout without history) — nothing to compare
    }
    if (branch === 'main' || branch === 'HEAD') return
    /* ⚠ AND SKIPPED FOR THE OWNER, by the SAME rule the hook uses. These files
       are hers to change, and she changes them on branches like everything
       else — a guard that failed her own suite would be turned off within a
       day, and then it protects nobody. */
    if (isOwner()) return

    let changed: string[]
    try {
      changed = git(['diff', '--name-only', 'origin/main...HEAD']).split('\n').filter(Boolean)
    } catch {
      return // no origin/main to compare against
    }

    const touched = changed.filter(isProtected)
    expect(
      touched,
      `This branch changes the UX Dashboard's own machinery:\n  ${touched.join('\n  ')}\n\n` +
        'That is Jillienne\'s to change — see "What you do not need to touch" in CLAUDE.md. ' +
        'If it was deliberate, she needs to review it; if not, revert those files and your ' +
        'own work is unaffected.',
    ).toEqual([])
  })
})
