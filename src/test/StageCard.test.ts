import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { cardRecord, existingCard, scopesFor } from '../../netlify/plugins/stage-card/card.js'

/**
 * THE ON STAGE CARD'S WRITER — `netlify/plugins/stage-card`, 2026-11-05.
 *
 * The plugin files the On Stage card when the stage deploy goes green, writing
 * the Blobs store DIRECTLY — it has to, because Netlify's site password is
 * enforced at the edge and an automated caller never reaches
 * `/api/todo-board` at all.
 *
 * ⚠ WHICH MEANS IT BYPASSES `validateCard`, the one place the card's shape is
 * decided. That is the risk this suite exists for: two writers of one record,
 * and only one of them is the trust boundary. The first case below parses BOTH
 * files and fails if they stop agreeing — the same guard `TodoBoard.test.tsx`
 * already puts on the client/server pair, for the same reason.
 */

const here = dirname(fileURLToPath(import.meta.url))
const fn = readFileSync(resolve(here, '../../netlify/functions/todo-board.ts'), 'utf8')
const plugin = readFileSync(resolve(here, '../../netlify/plugins/stage-card/index.js'), 'utf8')
const card = readFileSync(resolve(here, '../../netlify/plugins/stage-card/card.js'), 'utf8')

describe('the On Stage card writer', () => {
  it('⚠ writes exactly the fields the server would', () => {
    /* `validateCard` builds its record by assigning to `out`; every `out.x =`
       is a field a stored card carries. The plugin's record must have the same
       set — no more (a field the server drops) and no fewer (a field the board
       reads and would find missing).
       ⚠ NOT ANCHORED TO THE LINE START: half of them are assigned as
       `else out.title = title`, and a `^\s*out\.` regex silently misses every
       one — which made this case pass a false difference on its first run. */
    const serverFields = new Set(
      [...fn.matchAll(/\bout\.(\w+)\s*=[^=]/g)].map((m) => m[1]).concat('id'),
    )
    const mine = new Set(
      Object.keys(
        cardRecord({
          id: 'card-001',
          scope: 'compass',
          title: 'Compass — on stage',
          note: 'n',
          position: 1,
          addedDate: '2026-11-05',
          owner: 'Jill',
        }),
      ),
    )
    expect([...mine].sort()).toEqual([...serverFields].sort())
  })

  it('⚠ keeps the roster and the column in step with the server', () => {
    /* An owner is a label the server will accept, and the column has to be one
       the board draws. Both are re-declared in the plugin because it cannot
       import TypeScript; both are pinned here. */
    const roster = /SEED_PEOPLE = \[([^\]]+)\]/.exec(fn)?.[1] ?? ''
    const mineRoster = /ROSTER = \[([^\]]+)\]/.exec(card)?.[1] ?? ''
    expect(mineRoster.replace(/\s/g, '')).toBe(roster.replace(/\s/g, ''))
    expect(fn).toMatch(/COLUMNS = \[[^\]]*'stage'/)
    expect(card).toMatch(/COLUMN = 'stage'/)
  })

  it('⚠ never fails the build', () => {
    /* A card is a convenience; the stage build is what people are waiting for.
       The plugin must report and return, never `failBuild`. */
    /* The NAME appears in the file's own note explaining why it is not called,
       so this looks for the CALL. */
    expect(plugin).not.toMatch(/failBuild\s*\(/)
    expect(plugin).toMatch(/catch \(err\)/)
  })

  it('⚠ exports event handlers and nothing else', () => {
    /* THE MISTAKE THIS CASE EXISTS FOR, and it cost a stage deploy. Netlify
       reads every named export of a plugin as an EVENT NAME: exporting
       `cardRecord` from `index.js` failed the build with "Invalid event
       'cardRecord'" before the plugin ever ran — so a card-writing
       convenience took the whole deploy down, which is precisely what its own
       try/catch was written to prevent. The handlers live in `index.js`; the
       testable parts live in `card.js`. */
    const EVENTS = new Set([
      'onPreBuild',
      'onBuild',
      'onPostBuild',
      'onSuccess',
      'onError',
      'onEnd',
      'onDev',
      'onPreDev',
    ])
    const exported = [...plugin.matchAll(/^export (?:const|function|async function) (\w+)/gm)].map(
      (m) => m[1],
    )
    expect(exported.length).toBeGreaterThan(0)
    for (const name of exported) expect(EVENTS.has(name), `${name} is not a Netlify event`).toBe(true)
  })

  it('does nothing on any branch but stage', () => {
    expect(plugin).toMatch(/if \(branch !== 'stage'\) return/)
  })

  it('reads the scope from the changed paths, as the skills do', () => {
    expect(scopesFor(['src/components/learning/CompassJeffCourse.tsx'])).toEqual(['compass'])
    expect(scopesFor(['src/pages/endToEndDemo.tsx'])).toEqual(['invite'])
    expect(scopesFor(['src/data/adminFixtures.ts'])).toEqual(['admin'])
    /* ⚠ DOCS AND TESTS HAVE NO SCOPE, and that is not an error — the work is
       still on stage and still worth a card, tagged with none. */
    expect(scopesFor(['docs/gateway.md', 'README.md'])).toEqual([])
    /* ⚠ AND NEITHER DOES THIS PLUGIN'S OWN WORK. `src/test/StageCard.test.ts`
       matches `^src/`, so without an exclusion a change to the card writer
       files a card claiming the End-to-End surface is waiting. */
    expect(scopesFor(['netlify/plugins/stage-card/index.js', 'src/test/StageCard.test.ts', 'netlify.toml'])).toEqual([])
  })

  it('⚠ updates one card per scope rather than piling them up', () => {
    /* Three pushes of Compass work in a day are ONE thing waiting. Three cards
       saying so is noise that makes the column worth less than no column. */
    const cards = [
      { id: 'card-001', column: 'stage', scope: 'compass', archived: false },
      { id: 'card-002', column: 'todo', scope: 'compass', archived: false },
    ]
    expect(existingCard(cards, 'compass')?.id).toBe('card-001')
    expect(existingCard(cards, 'atlas')).toBeNull()
  })

  it('⚠ does not reopen an archived card', () => {
    /* Archiving it is someone saying that record is finished with. Reusing it
       would undo their decision silently. */
    const cards = [{ id: 'card-001', column: 'stage', scope: 'compass', archived: true }]
    expect(existingCard(cards, 'compass')).toBeNull()
  })

  it('is wired into the build, and only as a plugin', () => {
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toMatch(/\[\[plugins\]\]\s*\n\s*package = "\.\/netlify\/plugins\/stage-card"/)
  })
})
