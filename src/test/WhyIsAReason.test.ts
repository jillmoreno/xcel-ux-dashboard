import { describe, it, expect } from 'vitest'
import { PROTOTYPE_FEATURES, type DevHandoffComponent } from '@/data/prototypeFeatures'

/**
 * A VARIANT'S `why` IS A REASON, NOT A CITATION.
 *
 * 2026-10-21, Jillienne: "explanations should never be as stupid as b/c jill
 * made a decisions on this day". One `why` on the course head had become a pair
 * of quoted asks with their dates — true, and useless: a developer cannot build
 * against it, and a reader cannot disagree with the design on its merits,
 * because "someone asked on a Tuesday" is unfalsifiable.
 *
 * ⚠ THIS DOES NOT POLICE CODE COMMENTS OR THE DECISIONS LOG. `AtlasHomeEricE2E`
 * is full of "(2026-10-14, Eric's request; 32 first, then 24)" and should be —
 * a maintainer staring at an odd number needs to know it was chosen rather than
 * computed. The decisions log names an `owner` for the same reason: that is who
 * to go and ask. Only `why` is held to this, because only `why` claims to be
 * the reason the thing exists.
 */

const PEOPLE = ['Jillienne', 'Jill', 'Eric', 'Anjani', 'Afsana', 'Cody']
const ISO_DATE = /\b20\d\d-\d\d-\d\d\b/

function handoffComponents(): DevHandoffComponent[] {
  return PROTOTYPE_FEATURES.flatMap((f) => [
    ...(f.devHandoff?.components ?? []),
    ...(f.devHandoff?.uiComponents ?? []),
  ])
}

describe('variant rationale', () => {
  it('never names a person', () => {
    const bad: string[] = []
    for (const c of handoffComponents()) {
      for (const v of c.variants) {
        if (!v.why) continue
        for (const who of PEOPLE) {
          if (v.why.includes(who)) {
            bad.push(`${c.id} → "${v.name}" cites ${who}: ${v.why.slice(0, 80)}…`)
          }
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('never dates itself', () => {
    // A date in a reason is almost always a decision log leaking in. The one
    // legitimate use — "this replaced X on <date>" — belongs in `detail`, where
    // it is a fact about the component rather than its justification.
    const bad: string[] = []
    for (const c of handoffComponents()) {
      for (const v of c.variants) {
        if (v.why && ISO_DATE.test(v.why)) {
          bad.push(`${c.id} → "${v.name}": ${v.why.slice(0, 80)}…`)
        }
      }
    }
    expect(bad, bad.join('\n')).toEqual([])
  })

  it('says something — a why is at least a clause, not a label', () => {
    const thin: string[] = []
    for (const c of handoffComponents()) {
      for (const v of c.variants) {
        if (v.why && v.why.trim().split(/\s+/).length < 5) {
          thin.push(`${c.id} → "${v.name}": ${v.why}`)
        }
      }
    }
    expect(thin, thin.join('\n')).toEqual([])
  })
})
