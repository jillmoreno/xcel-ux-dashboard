#!/usr/bin/env node
/**
 * MAIN IS JILLIENNE'S — 2026-10-29, her ask: "if they ever typed 'ship to
 * main' or 'push to main' they wouldn't be able to".
 *
 * A PreToolUse hook on Bash. Whatever a designer says in words, Claude ends up
 * running one of a handful of git commands to do it — a push aimed at main, a
 * switch onto main, a merge or commit while standing on main, a pull-request
 * merge — and this refuses those before they run, for anyone who is not the
 * dashboard's owner, with a message in plain words saying whose step it is.
 *
 * ⚠ THIS IS THE EXPLANATION, NOT THE LOCK. Like protect-framework.mjs it only
 * sees commands Claude runs: a hand-typed terminal bypasses it. The LOCK is on
 * GitHub — main's branch-protection rule (pull request required, code-owner
 * review required, admins exempt) with .github/CODEOWNERS naming Jillienne —
 * which refuses a designer's push to main whatever tool sent it. This hook
 * exists so the designer hears "that is Jill's" from Claude immediately, in
 * their own language, rather than a GitHub error after the fact.
 *
 * Deliberately NOT blocked: `git rebase origin/main` (keeping a branch current
 * is the designers' daily habit), `git fetch`, `git diff main`, `git log main`,
 * `git checkout main -- <file>` (restoring one file), and branching FROM main
 * (`git switch -c feat/x origin/main`). Reading main is fine; standing on it
 * or writing to it is not.
 *
 * `MainProtection.test.ts` pins the verdicts and that the hook is wired.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { isOwner } from './protect-framework.mjs'

const INSTEAD =
  'Shipping to main is Jillienne’s step — see "Ship to main" in the day-to-day guide. ' +
  'Your work reaches the team from YOUR BRANCH: say "/share-branch" to put it on Refinement, ' +
  'and tell Jill when it is ready to ship. If you are standing on main by accident, say ' +
  '"switch back to my feature branch".'

/** Does `command` write to main, or move onto it? `currentBranch` is where the
 *  shell stands, because `git push` with no refspec and `git commit` only touch
 *  main when you are on it. Returns the reason, or null when the command is fine. */
export function verdict(command, currentBranch) {
  const cmd = String(command ?? '')
  // One shell line can carry several commands; judge each.
  const parts = cmd.split(/\s*(?:&&|\|\||;|\|)\s*/)
  for (const raw of parts) {
    const p = raw.trim()
    if (!/\bgit\b|\bgh\b/.test(p)) continue
    // A push whose refspec names main — `origin main`, `HEAD:main`, `feat:main`,
    // `:main` (a delete), `--delete origin main`.
    if (/\bgit\s+push\b/.test(p) && /(?:^|[\s:])main(?:\s|$)/.test(p)) {
      return `BLOCKED: that pushes to main (${p}).\n\n${INSTEAD}`
    }
    // A bare push while standing on main pushes main.
    if (/\bgit\s+push\b/.test(p) && currentBranch === 'main') {
      return `BLOCKED: you are on main, so that pushes main (${p}).\n\n${INSTEAD}`
    }
    // Moving onto main. `git checkout main -- file` restores a file and is fine.
    if (/\bgit\s+(?:switch|checkout)\s+(?:-[-\w]+\s+)*main(?:\s|$)/.test(p) && !/\s--\s/.test(p)) {
      return `BLOCKED: that moves you onto main (${p}).\n\n${INSTEAD}`
    }
    // Writing history while standing on main.
    if (currentBranch === 'main' && /\bgit\s+(?:commit|merge|rebase|cherry-pick|reset|am|revert)\b/.test(p)) {
      return `BLOCKED: you are on main, and that would change it (${p}).\n\n${INSTEAD}`
    }
    // Merging a pull request lands it on main.
    if (/\bgh\s+pr\s+merge\b/.test(p)) {
      return `BLOCKED: that merges a pull request into main (${p}).\n\n${INSTEAD}`
    }
  }
  return null
}

function currentBranch() {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

function main() {
  let raw = ''
  try {
    raw = readFileSync(0, 'utf8')
  } catch {
    process.exit(0)
  }
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    process.exit(0)
  }
  const command = payload?.tool_input?.command
  if (typeof command !== 'string' || !command) process.exit(0)
  if (isOwner()) process.exit(0)
  const reason = verdict(command, currentBranch())
  if (!reason) process.exit(0)
  process.stderr.write(reason + '\n')
  process.exit(2)
}

/* Only when run as a hook, never on import — `main()` blocks on stdin. */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
