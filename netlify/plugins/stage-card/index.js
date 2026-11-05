/**
 * THE ON STAGE CARD, WRITTEN BY THE DEPLOY (2026-11-05).
 *
 * The To Do Board's **On Stage** column is the only record of what is waiting
 * on a release: the Hub runs on `main` and cannot read the stage build (other
 * origin, same password), so a Prototypes row cannot say "there is something
 * newer on stage". Until now that record was a prefilled form `/share-to-stage`
 * handed over for someone to click — which means it exists when the routine is
 * used and someone remembers, and not otherwise.
 *
 * This writes it instead, when the stage deploy GOES GREEN.
 *
 * ⚠ ON THE DEPLOY, NOT ON THE PUSH, and that is the whole reason this is a
 * build plugin rather than a GitHub action. The column means "you can open
 * this now". A card written when the commit lands would claim that while the
 * build is still running — and would still be claiming it if the build failed.
 *
 * ⚠ IT WRITES THE BLOBS STORE DIRECTLY, going around `/api/todo-board`. Not a
 * shortcut: Netlify's site password is enforced at the EDGE, so an automated
 * caller never reaches the function at all, whatever header it carries. The
 * store is reachable because a build has the same ambient credentials a
 * function does.
 *
 * ⚠ SO IT BYPASSES `validateCard`, WHICH OWNS THE RECORD'S SHAPE. The shape
 * below is a copy, and a copy can drift. `StageCard.test.ts` parses this file
 * and `netlify/functions/todo-board.ts` and fails if the two disagree — the
 * same guard `TodoBoard.test.tsx` already puts on the client/server pair.
 *
 * ⚠ IT CANNOT FAIL A DEPLOY. Everything is inside a try/catch that reports and
 * returns. A card is a convenience; the stage build is the thing people are
 * waiting for, and a nicety that can break it is not worth having.
 *
 * ⚠ WHAT IT CANNOT KNOW is the framing. It writes the branch, the commit
 * subject, who pushed, the scope and the time; it cannot write "staged for
 * Jeff's review". Edit the card on the board when the wording matters — this
 * is a reliable record with generic words, which beats a well-worded one that
 * is sometimes missing.
 */

import { getStore } from '@netlify/blobs'
import { execSync } from 'node:child_process'
import { COLUMN, STAGE_URL, STORE_NAME, cardRecord, existingCard, scopesFor, titleFor } from './card.js'

/**
 * ⚠ THIS FILE EXPORTS EVENT HANDLERS AND NOTHING ELSE. Netlify reads every
 * named export as an event name, so a helper exported from here is a build
 * failure ("Invalid event 'cardRecord'") — which is exactly how the first
 * version of this plugin took a stage deploy down. The pure parts are in
 * `card.js`; `StageCard.test.ts` pins this rule.
 */

const sh = (cmd) => {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

export const onSuccess = async ({ utils }) => {
  const branch = process.env.BRANCH
  if (branch !== 'stage') return

  try {
    const head = process.env.COMMIT_REF || 'HEAD'
    const since = process.env.CACHED_COMMIT_REF
    /* Everything that changed since the LAST SUCCESSFUL stage build, which is
       what "new on stage" means. With no cached ref (a first build, a cleared
       cache) fall back to the tip commit alone rather than guessing wider. */
    const paths = (
      since ? sh(`git diff --name-only ${since}..${head}`) : sh('git show --name-only --format= HEAD')
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const subject = sh('git log -1 --format=%s') || 'Staged'
    const author = (sh('git log -1 --format=%an') || '').split(' ')[0]
    const scopes = scopesFor(paths)
    /* A branch that changed only docs, tests or skills has no scope — it is
       still on stage, and still worth one card, tagged with none. */
    const wanted = scopes.length ? scopes : ['']

    const store = getStore({ name: STORE_NAME, consistency: 'strong' })
    const { blobs } = await store.list()
    const keys = blobs.map((b) => b.key).filter((k) => /^card-\d{3}$/.test(k))
    const cards = (await Promise.all(keys.map((k) => store.get(k, { type: 'json' })))).filter(Boolean)

    const today = new Date().toISOString().slice(0, 10)
    const written = []
    let nextId = keys.reduce((m, k) => Math.max(m, Number(k.slice(5))), 0)

    for (const scope of wanted) {
      const note = `${subject} · staged ${today}${author ? ` by ${author}` : ''} · ${STAGE_URL}/dashboard-rebrand?demo=1`
      const found = existingCard(cards, scope)
      const record = found
        ? { ...cardRecord({ ...found, note, scope, position: found.position, addedDate: found.addedDate, owner: found.owner }), id: found.id, title: found.title }
        : cardRecord({
            id: `card-${String(++nextId).padStart(3, '0')}`,
            scope,
            title: scope ? `${titleFor(scope)} — on stage` : 'On stage',
            note,
            position:
              Math.max(0, ...cards.filter((c) => c.column === COLUMN).map((c) => Number(c.position) || 0)) + 1,
            addedDate: today,
            owner: author,
          })
      await store.setJSON(record.id, record)
      written.push(`${record.id} (${scope || 'no scope'})`)
    }

    utils.status.show({
      title: 'On Stage card',
      summary: `Filed ${written.join(', ')}`,
      text: `${subject}\n${paths.length} files changed since ${since ? since.slice(0, 7) : 'the previous build'}`,
    })
  } catch (err) {
    /* ⚠ REPORT AND RETURN. Never `utils.build.failBuild` — see the note above. */
    utils.status.show({
      title: 'On Stage card',
      summary: 'Could not file the card (the deploy is unaffected)',
      text: String(err && err.message ? err.message : err),
    })
  }
}
