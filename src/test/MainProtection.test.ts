import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { verdict } from '../../.claude/hooks/protect-main.mjs'

/**
 * MAIN IS JILLIENNE'S — 2026-10-29. The hook refuses, for anyone but her, the
 * git commands that write to main or stand on it. This pins which commands
 * those are, in both directions: the designers' daily commands must stay
 * allowed, or the hook gets turned off within a day and protects nobody.
 * The LOCK is GitHub's branch protection on main plus .github/CODEOWNERS;
 * this is the explanation a designer hears first.
 */
const root = resolve(__dirname, '../..')

describe('the main-protection hook', () => {
  it('is wired on Bash, and CODEOWNERS names the owner', () => {
    const settings = JSON.parse(readFileSync(resolve(root, '.claude/settings.json'), 'utf8'))
    const bash = (settings.hooks?.PreToolUse ?? []).find((h: { matcher?: string }) => h.matcher === 'Bash')
    expect(JSON.stringify(bash ?? {}), 'settings.json does not run protect-main on Bash').toContain('protect-main.mjs')
    expect(existsSync(resolve(root, '.github/CODEOWNERS'))).toBe(true)
    expect(readFileSync(resolve(root, '.github/CODEOWNERS'), 'utf8')).toMatch(/^\*\s+@jillmoreno/m)
  })

  it('refuses every way of writing to main or standing on it', () => {
    const blocked = [
      ['git push origin main', 'feat/x'],
      ['git push -u origin main', 'feat/x'],
      ['git push origin HEAD:main', 'feat/x'],
      ['git push origin feat/x:main', 'feat/x'],
      ['git push --force-with-lease origin main', 'feat/x'],
      ['git push origin :main', 'feat/x'],
      ['git push', 'main'],
      ['git push -u origin feat/x && git push origin main', 'feat/x'],
      ['git switch main', 'feat/x'],
      ['git checkout main', 'feat/x'],
      ['git switch -q main', 'feat/x'],
      ['git merge --ff-only origin/feat/x', 'main'],
      ['git commit -m "x"', 'main'],
      ['git rebase origin/feat/x', 'main'],
      ['cd /Users/jill.moreno/xcel-main && git merge --ff-only origin/feat/x', 'main'],
      ['gh pr merge 12 --squash', 'feat/x'],
    ] as const
    for (const [cmd, branch] of blocked) {
      expect(verdict(cmd, branch), `should block: ${cmd} (on ${branch})`).toMatch(/^BLOCKED/)
    }
  })

  it('allows the designers’ daily commands', () => {
    const allowed = [
      ['git push -u origin feat/study-streak', 'feat/study-streak'],
      ['git push --force-with-lease origin feat/study-streak', 'feat/study-streak'],
      ['git push', 'feat/study-streak'],
      ['git fetch origin', 'feat/study-streak'],
      ['git rebase origin/main', 'feat/study-streak'],
      ['git switch -c feat/next origin/main', 'feat/study-streak'],
      ['git checkout -b feat/next main', 'feat/study-streak'],
      ['git checkout main -- src/file.tsx', 'feat/study-streak'],
      ['git diff origin/main...HEAD --stat', 'feat/study-streak'],
      ['git log --oneline main..HEAD', 'feat/study-streak'],
      ['git commit -m "feat: thing"', 'feat/study-streak'],
      ['git merge origin/main', 'feat/study-streak'],
      ['npx vitest run', 'feat/study-streak'],
      ['gh pr create --base main --title x', 'feat/study-streak'],
      ['git status --short', 'main'],
      ['git rev-parse --abbrev-ref HEAD', 'main'],
    ] as const
    for (const [cmd, branch] of allowed) {
      expect(verdict(cmd, branch), `should allow: ${cmd} (on ${branch})`).toBeNull()
    }
  })

  it('says whose step it is, in plain words', () => {
    expect(verdict('git push origin main', 'feat/x')).toContain('Jillienne’s step')
    expect(verdict('git push origin main', 'feat/x')).toContain('/share-branch')
  })
})
