/**
 * THE HANDOFF FOLDER — 2026-10-26, Jillienne: "allow the designers to use the
 * dev handoff skill that will create their own feature card in the development
 * section to edit and hand off."
 *
 * Until today a dev handoff was a row in `PROTOTYPE_FEATURES`, and that file
 * is one the protection hook keeps for Jillienne — so `/dev-handoff-notes`
 * was a routine a designer could start and not finish. The row's own data was
 * never the thing that needed protecting; the Prototypes rows beside it were.
 *
 * So a handoff is now ONE FILE PER FEATURE in `src/data/handoffs/`, each
 * `export default`-ing a `PrototypeFeature` with `category: 'dev-handoff'`.
 * This module globs the folder and `prototypeFeatures.ts` spreads the result
 * into `PROTOTYPE_FEATURES`, so every consumer — the Development board, the
 * gateway, the Markdown export, the status resolver — sees a folder row and a
 * hand-authored row as the same thing. Nothing downstream knows the folder
 * exists.
 *
 * THREE RULES, enforced here at load so a wrong file fails the suite rather
 * than quietly vanishing from the board (`HandoffFolder.test.ts` pins them):
 *
 *   1. THE FILE NAME IS THE ID. `handoffs/xcel-study-streak.ts` is the row
 *      `xcel-study-streak`. One place to look, and two designers writing two
 *      handoffs never touch the same file — the collision the demo bar taught
 *      us about on 2026-10-05.
 *   2. `category: 'dev-handoff'`, always. The folder is for handoffs; a
 *      prototype or exploration row is a `PROTOTYPE_SCOPES` decision and
 *      stays in `prototypeFeatures.ts`.
 *   3. `import type` ONLY from `prototypeFeatures.ts`. The glob is eager, so a
 *      handoff module evaluates BEFORE `prototypeFeatures.ts` finishes — a
 *      value import from there (`PROTOTYPE_BASE`, say) is a temporal-dead-zone
 *      ReferenceError on the first page load, and nothing in the editor warns
 *      you. Type imports are erased and safe.
 *
 * The four Atlas Home rows of 2026-10-19 predate the folder and stay in
 * `prototypeFeatures.ts`; moving one is a cut-and-paste into a file named
 * after its id plus a line out of the smoke test's `EXPECTED_PLACEMENT`.
 */
import type { PrototypeFeature } from './prototypeFeatures'

const modules = import.meta.glob<{ default?: unknown }>('./handoffs/*.ts', { eager: true })

function fail(file: string, problem: string): never {
  throw new Error(
    `src/data/handoffs/${file}: ${problem}. A handoff file \`export default\`s one ` +
      `PrototypeFeature whose \`id\` is the file name and whose \`category\` is 'dev-handoff' ` +
      `— see src/data/handoffs/README.md, or say "/dev-handoff-notes".`,
  )
}

/**
 * One file's module → its row, or a thrown error naming the file. Exported so
 * `HandoffFolder.test.ts` can run the README's own skeleton through it.
 */
export function validateHandoff(file: string, mod: { default?: unknown }): PrototypeFeature {
  const expectedId = file.replace(/\.ts$/, '')
  const row = mod.default
  if (!row || typeof row !== 'object' || typeof (row as PrototypeFeature).id !== 'string') {
    fail(file, 'has no default export, or it is not a feature row')
  }
  const feature = row as PrototypeFeature
  if (feature.id !== expectedId) {
    fail(file, `its id is '${feature.id}' but the file name says '${expectedId}'`)
  }
  if (feature.category !== 'dev-handoff') {
    fail(file, `its category is '${feature.category}', and the folder holds handoffs only`)
  }
  /* ⚠ THE GUIDED-ROW TRAP (`a guided row opens its own gateway` in the smoke
     test): a row's href resolves `externalUrl ?? to ?? '/prototype/<id>'`, so
     a handoff carrying either never reaches its own page — `xcel-course-entry`
     shipped that way on 2026-09-24 and its Development row opened the product
     instead of the notes. The live preview goes in `pages`. */
  if (feature.kind !== 'guided') {
    fail(file, `its kind is '${feature.kind}' — a handoff is 'guided', so it opens its gateway`)
  }
  if (feature.to || feature.externalUrl) {
    fail(file, 'carries a `to` or `externalUrl`, which would open somewhere other than its gateway — put the preview route in `pages`')
  }
  return feature
}

/** Every handoff authored in the folder, in file-name order. */
export const HANDOFF_FEATURES: PrototypeFeature[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, mod]) => validateHandoff(path.slice(path.lastIndexOf('/') + 1), mod))

/** The ids above, for the tests that account for hand-authored rows only. */
export const HANDOFF_IDS: ReadonlySet<string> = new Set(HANDOFF_FEATURES.map((f) => f.id))
