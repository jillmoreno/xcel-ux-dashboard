#!/usr/bin/env node
/**
 * PROTECT THE DASHBOARD'S OWN MACHINERY — 2026-09-24.
 *
 * A PreToolUse hook. It runs before every Edit / Write / NotebookEdit and
 * refuses the ones that would change the UX Dashboard's framework, unless the
 * person running it is the dashboard's owner.
 *
 * WHY A HOOK AND NOT A `deny` RULE IN settings.json: a deny rule beats every
 * allow rule, including a personal one, so it would block Jillienne too — and
 * the only way round it would be turning the whole thing off by hand and
 * remembering to turn it back on. This asks WHO is running instead, so the
 * owner never sees it and a designer always does.
 *
 * ⚠ THIS IS A GUARDRAIL, NOT A SECURITY BOUNDARY. `git config user.email` is
 * one command to change, and this hook only sees Claude's file tools — a hand
 * edit in an IDE, or `sed -i` through Bash, goes straight past it. That is the
 * right level for the risk, which is a designer wandering into the wrong file,
 * not someone attacking the repo. `FrameworkProtection.test.ts` is the backstop
 * that catches the edits this cannot see.
 *
 * The protected list is CLAUDE.md's own "What you do not need to touch" table.
 * Keep the two together — the test asserts they match, so the lock and the
 * documentation cannot drift apart.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Paths only the dashboard owner should change. Prefix match, repo-relative. */
export const PROTECTED = [
  'src/pages/UxDashboardPage.tsx',
  'src/data/prototypeFeatures.ts',
  'src/data/archivedItems.ts',
  'src/data/gatewayMode.ts',
  'src/data/deployContext.ts',
  'netlify.toml',
  'scripts/public-redirects.mjs',
  'netlify/functions/',
  'netlify/lib/',
  '.claude/skills/',
  '.claude/hooks/',
  '.claude/settings.json',
  'public/contributing/',
  'public/about/',
]

/** Who may change them. Match on email — names are not unique. */
const OWNERS = ['jilliennemoreno@gmail.com', 'jill.moreno@scorebuilders.com']

/** What a designer should do instead, per protected path. Plain English: the
 *  people this speaks to are designers, not Claude Code users. */
const INSTEAD = {
  'src/pages/UxDashboardPage.tsx':
    'This is the project-list page itself — its sections, nav and rail. Your design work belongs in `src/components/` or `src/pages/` for the PRODUCT (the /dashboard-rebrand side), behind a feature flag.',
  'src/data/prototypeFeatures.ts':
    'This is the list of project rows. If you need a row added or a handoff written, ask Jillienne — or say "/dev-handoff-notes" and she will review it.',
  'netlify/functions/':
    'This is server code behind Refinement, Links and QA Notes. Adding a Refinement link does not need a code change — open Refinement on the full site and use "Add link", or say "/promote-to-refinement".',
  '.claude/skills/':
    'These are Jillienne’s skills. Run them, don’t edit them.',
}

function reasonFor(path) {
  const hit = PROTECTED.find((p) => path === p || path.startsWith(p))
  if (!hit) return null
  const extra =
    INSTEAD[hit] ??
    'This is part of the UX Dashboard’s own machinery rather than the product you are designing.'
  return (
    `BLOCKED: ${path} is not a file to change on a design branch.\n\n` +
    `${extra}\n\n` +
    'See "What you do not need to touch" in CLAUDE.md. If you are sure this ' +
    'change belongs here, ask Jillienne — she can make it, and a pull request ' +
    'that edits these files is usually a sign something was misunderstood.'
  )
}

/** Is `path` (repo-relative) one of the protected files? */
export function isProtected(path) {
  return PROTECTED.some((p) => path === p || path.startsWith(p))
}

/** Is whoever is running this the dashboard's owner? Exported so the backstop
 *  test applies the SAME rule as the hook — two copies would let the test fail
 *  for the one person allowed to make the change. */
export function isOwner() {
  return OWNERS.includes(currentEmail())
}

function currentEmail() {
  try {
    return execFileSync('git', ['config', 'user.email'], { encoding: 'utf8' }).trim().toLowerCase()
  } catch {
    return '' // no git identity → treat as "not the owner", i.e. fail closed
  }
}

function main() {
  let raw = ''
  try {
    raw = readFileSync(0, 'utf8')
  } catch {
    process.exit(0) // nothing to inspect — never block on our own failure
  }
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    process.exit(0)
  }
  const file = payload?.tool_input?.file_path ?? payload?.tool_input?.notebook_path
  if (typeof file !== 'string' || !file) process.exit(0)

  const cwd = payload?.cwd ?? process.cwd()
  const rel = file.startsWith(cwd) ? file.slice(cwd.length).replace(/^\//, '') : file
  const reason = reasonFor(rel)
  if (!reason) process.exit(0)

  if (isOwner()) process.exit(0)

  process.stderr.write(reason + '\n')
  process.exit(2) // 2 = block the tool call and show stderr to Claude
}

/* ⚠ ONLY WHEN RUN AS A HOOK, never on import. `main()` blocks reading stdin,
   so an unguarded call makes `import` hang forever — which is exactly what
   happened the first time the test tried to read `PROTECTED` from here. */
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main()
