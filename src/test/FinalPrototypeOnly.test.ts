import { describe, it, expect } from 'vitest'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'

/**
 * A DEV HANDOFF DESCRIBES THE FINAL PROTOTYPE, AND NOTHING ELSE.
 *
 * ⚠ 2026-10-21, Jillienne, for the third time: "make sure you are only showing
 * the logic for the main final prototype, i dont want to have to go through
 * this again." The first two were "this handoff documentation should only be
 * covering the things on MAIN, the final prototype walkthrough" and "I keep
 * seeing things from different versions being shown while you are working.
 * THIS IS WRONG." Asking a third time is what makes this a test rather than a
 * note: the rule had been agreed twice and broken anyway, most recently by
 * documenting a card that only renders on the WIP chrome.
 *
 * What a developer builds from must be what `main` draws at `?demo=1`. A
 * handoff that also describes Eric's versions, the WIP chrome or the
 * End-to-End Demo is asking them to guess which half is theirs.
 *
 * ⚠ FILE PATHS ARE EXEMPT, and have to be. `location` and `sources` name real
 * modules, and the Home `main` renders genuinely lives in a file called
 * `AtlasHomeEricE2E.tsx` — banning the string there would force either a lie
 * or a rename. Everything a reader is meant to READ is in scope.
 */
const VERSION_TERMS =
  /\bWIP\b|\bEric\b|End-to-End Demo|\bE2E\b|Atlas White|\bV3\b|\bV2\b|Jill\/Atlas|onWhite/

/** Prose fields, walked generically so a new field cannot slip past unchecked. */
function prose(value: unknown, path: string, out: { path: string; text: string }[]): void {
  if (typeof value === 'string') {
    out.push({ path, text: value })
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => prose(v, `${path}[${i}]`, out))
    return
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Real module paths, and the person a question belongs to.
      if (k === 'location' || k === 'sources' || k === 'owner' || k === 'to') continue
      prose(v, `${path}.${k}`, out)
    }
  }
}

describe('dev handoffs describe the final prototype only', () => {
  const handoffs = PROTOTYPE_FEATURES.filter((f) => f.devHandoff)

  it('has handoffs to check', () => {
    expect(handoffs.length).toBeGreaterThan(0)
  })

  it('never names another dashboard version in anything a reader reads', () => {
    const offences: string[] = []
    for (const f of handoffs) {
      const found: { path: string; text: string }[] = []
      prose(f.devHandoff, `${f.id}.devHandoff`, found)
      prose(f.blurb, `${f.id}.blurb`, found)
      prose(f.tileBlurb, `${f.id}.tileBlurb`, found)
      prose(f.pages, `${f.id}.pages`, found)
      prose(f.featureFlags, `${f.id}.featureFlags`, found)
      for (const { path, text } of found) {
        const hit = VERSION_TERMS.exec(text)
        if (hit) offences.push(`${path}: "${hit[0]}" — ${text.slice(0, 90)}…`)
      }
    }
    expect(offences, offences.join('\n')).toEqual([])
  })
})
