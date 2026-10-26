import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isProtected } from '../../.claude/hooks/protect-framework.mjs'
import { HANDOFF_FEATURES, HANDOFF_IDS, validateHandoff } from '@/data/handoffFeatures'
import skeleton from './fixtures/handoffSkeleton'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'
import { featureStatusChipFor, featureStatusKeyOf } from '@/components/prototype/devHandoffStatusUtil'

/**
 * THE HANDOFF FOLDER IS THE DESIGNERS' OWN — 2026-10-26.
 *
 * `/dev-handoff-notes` writes one file per feature into `src/data/handoffs/`,
 * and `handoffFeatures.ts` merges the folder into `PROTOTYPE_FEATURES`. This
 * pins the three things that make that safe: the folder is NOT protected (or
 * the routine is back to being one a designer cannot finish), every file in
 * it is a row the board actually shows, and no file imports a VALUE from
 * `prototypeFeatures.ts` — the glob is eager, so that import is a
 * ReferenceError on first load that no editor warns about.
 *
 * It holds with ZERO files in the folder, deliberately: the wiring is what is
 * pinned, and the first real handoff is checked the day it is written.
 */

const root = resolve(__dirname, '../..')
const dir = resolve(root, 'src/data/handoffs')
const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.ts')) : []

describe('the dev-handoff folder', () => {
  it('is not one of the protected paths, and the rows file still is', () => {
    expect(isProtected('src/data/handoffs/xcel-anything.ts')).toBe(false)
    expect(isProtected('src/data/handoffFeatures.ts')).toBe(false)
    expect(isProtected('src/data/prototypeFeatures.ts')).toBe(true)
  })

  it('is merged into PROTOTYPE_FEATURES, and ships its README', () => {
    const src = readFileSync(resolve(root, 'src/data/prototypeFeatures.ts'), 'utf8')
    expect(src, 'prototypeFeatures.ts no longer spreads the folder in').toContain('...HANDOFF_FEATURES')
    expect(existsSync(resolve(dir, 'README.md')), 'the folder README is what a designer reads').toBe(true)
  })

  it('lists every file in the folder, and nothing else', () => {
    const fromDisk = files.map((f) => f.replace(/\.ts$/, '')).sort()
    expect([...HANDOFF_IDS].sort()).toEqual(fromDisk)
    expect(HANDOFF_FEATURES.map((f) => f.id).sort()).toEqual(fromDisk)
  })

  it('every folder row is a Development row the board can show', () => {
    for (const f of HANDOFF_FEATURES) {
      expect(f.category, f.id).toBe('dev-handoff')
      // The smoke test's "every Development row carries an authored devStatus"
      // rule, applied here because the smoke test exempts folder rows.
      expect(f.devStatus, `${f.id} needs an authored devStatus`).toBeTruthy()
      // And a dev-handoff row never resolves to the `none` key, whose chip
      // reads the bare word "Ready" — the status is the designer's to set,
      // but an unread page must say something deliberate.
      const key = featureStatusKeyOf(f, false, false, null)
      expect(featureStatusChipFor(key).label, `${f.id} reaches developers as Ready`).not.toBe('Ready')
      expect(PROTOTYPE_FEATURES.find((p) => p.id === f.id), `${f.id} is not in PROTOTYPE_FEATURES`).toBe(f)
    }
    // No id collides with a hand-authored row.
    const ids = PROTOTYPE_FEATURES.map((f) => f.id)
    expect(new Set(ids).size, 'a folder row reuses a hand-authored id').toBe(ids.length)
  })

  it('the README skeleton compiles, validates, and is what the fixture holds', () => {
    // A designer copies the README's block. The fixture is that block as a
    // type-checked module, so a field the type drops fails `tsc` here rather
    // than on the designer's first run.
    expect(validateHandoff('xcel-study-streak.ts', { default: skeleton }).id).toBe('xcel-study-streak')
    expect(skeleton.kind).toBe('guided')
    expect(skeleton.devStatus).toBe('not-ready')
    const readme = readFileSync(resolve(dir, 'README.md'), 'utf8')
    const block = /```ts\n([\s\S]*?)```/.exec(readme)?.[1]
    expect(block, 'the README lost its ```ts skeleton').toBeTruthy()
    const fixture = readFileSync(resolve(__dirname, 'fixtures/handoffSkeleton.ts'), 'utf8')
      .split('\n')
      .filter((l) => !l.startsWith('//'))
      .join('\n')
      .replace("from '../../data/prototypeFeatures'", "from '../prototypeFeatures'")
    expect(fixture, 'README skeleton and fixtures/handoffSkeleton.ts have drifted').toBe(block)
  })

  it('refuses the ways a file goes wrong, by name', () => {
    const good = { ...skeleton }
    expect(() => validateHandoff('other-name.ts', { default: good })).toThrow(/file name says 'other-name'/)
    expect(() => validateHandoff('xcel-study-streak.ts', { default: { ...good, category: 'exploration' } })).toThrow(/handoffs only/)
    expect(() => validateHandoff('xcel-study-streak.ts', { default: { ...good, to: '/dashboard-rebrand' } })).toThrow(/put the preview route in `pages`/)
    expect(() => validateHandoff('xcel-study-streak.ts', { default: { ...good, kind: 'explore' } })).toThrow(/opens its gateway/)
    expect(() => validateHandoff('xcel-study-streak.ts', {})).toThrow(/no default export/)
  })

  it('no folder file imports a value from prototypeFeatures.ts', () => {
    for (const file of files) {
      const src = readFileSync(resolve(dir, file), 'utf8')
      const valueImport = /^\s*import\s+(?!type\b)[^;]*?from\s+['"](?:\.\.\/prototypeFeatures|@\/data\/prototypeFeatures)['"]/m
      expect(valueImport.test(src), `${file}: use \`import type\` from prototypeFeatures — a value import breaks first load`).toBe(false)
    }
  })
})
