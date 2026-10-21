import { describe, it, expect } from 'vitest'
import { PROTOTYPE_FEATURES, type DevHandoffComponent } from '@/data/prototypeFeatures'
import {
  atlasRegisteredVariantKeys,
  atlasFullWidthIds,
} from '@/components/prototype/atlasHandoffPreviewsRegistry'

/**
 * THE VARIANT LISTS CANNOT DRIFT APART.
 *
 * A component's variants used to be described in three independent places —
 * `variants`, `uiUxLogic.variants`, and a set of hand-written captions inside
 * the preview galleries — and nothing compared them. They had already come
 * apart by the time anyone looked (2026-10-20):
 *
 *  - The Readiness gallery rendered the FOUR bands the component actually has
 *    (Beginner · Developing · Proficient · Ready, 2026-10-16) while the
 *    handoff notes still described the FIVE levels those bands replaced
 *    (Novice · Advanced Beginner · Competent · Proficient · Exam Ready). A
 *    developer building from the notes would have built the retired scale.
 *  - The pace ring's gallery showed an "Exam booked" state the notes did not
 *    name at all.
 *  - `DevHandoffNotesBody` suppressed `variants` entirely whenever
 *    `uiUxLogic.variants` existed, so Course Progress's "bare (combined
 *    panel)" variant and every `when` trigger in that list rendered nowhere.
 *
 * There is one list now, and the live renders are keyed by its `name`. These
 * tests are what keeps that true: a renamed variant, or a render keyed to a
 * name nobody authored, fails here rather than quietly showing the wrong
 * thing.
 */

function allHandoffComponents(): { featureId: string; component: DevHandoffComponent }[] {
  return PROTOTYPE_FEATURES.flatMap((f) => [
    ...(f.devHandoff?.components ?? []),
    ...(f.devHandoff?.uiComponents ?? []),
  ].map((component) => ({ featureId: f.id, component })))
}

describe('dev-handoff variants', () => {
  it('every registered live render is keyed to a variant that exists', () => {
    const byId = new Map(allHandoffComponents().map(({ component }) => [component.id, component]))
    const orphans: string[] = []

    for (const [componentId, keys] of Object.entries(atlasRegisteredVariantKeys())) {
      const component = byId.get(componentId)
      if (!component) {
        orphans.push(`${componentId} — no handoff component with that id`)
        continue
      }
      // States AND options — one render map covers both, because a reader
      // asking "what does the combined panel look like" wants a picture for
      // the same reason they want one of Expired. Names are unique across the
      // two by construction; the duplicate check below is what holds that.
      const names = new Set([
        ...component.variants.map((v) => v.name),
        ...(component.options ?? []).map((o) => o.name),
      ])
      for (const key of keys) {
        if (!names.has(key)) {
          orphans.push(
            `${componentId} → "${key}" matches no variant. Authored: ${[...names]
              .map((n) => `"${n}"`)
              .join(', ')}`,
          )
        }
      }
    }

    expect(orphans, orphans.join('\n')).toEqual([])
  })

  it('no component reuses a name across its states and options', () => {
    // They share one render map, so a collision silently gives two different
    // rows the same picture.
    const dupes: string[] = []
    for (const { component } of allHandoffComponents()) {
      const seen = new Set<string>()
      for (const name of [
        ...component.variants.map((v) => v.name),
        ...(component.options ?? []).map((o) => o.name),
      ]) {
        if (seen.has(name)) dupes.push(`${component.id} → "${name}"`)
        seen.add(name)
      }
    }
    expect(dupes, dupes.join('\n')).toEqual([])
  })

  it('every full-width id is a component that exists', () => {
    // `FULL_WIDTH` widens a component's rows to the full width. A stale id
    // there changes nothing visible, so it would sit wrong indefinitely.
    const known = new Set(allHandoffComponents().map(({ component }) => component.id))
    const unknown = atlasFullWidthIds().filter((id) => !known.has(id))
    expect(unknown, unknown.join('\n')).toEqual([])
  })

  it('every variant names the condition that produces it', () => {
    // `when` is the field a developer reads to know when they will see this
    // state. An empty one makes the variant a picture with no trigger — which
    // is exactly what the migrated `uiUxLogic.variants` entries were, since
    // none of them set it.
    const missing: string[] = []
    for (const { component } of allHandoffComponents()) {
      for (const v of component.variants) {
        if (!v.when.trim()) missing.push(`${component.id} → "${v.name}"`)
      }
    }
    expect(missing, missing.join('\n')).toEqual([])
  })

  it('the retired five-level Readiness scale is gone from the handoff', () => {
    // The specific drift that prompted all of this. Named rather than left to
    // the generic checks above, because the notes and the component agreed on
    // the SHAPE of the data the whole time — six entries either way — and only
    // disagreed on what the levels were called.
    const retired = ['Novice', 'Advanced Beginner', 'Competent', 'Exam Ready']
    const hits: string[] = []
    for (const { component } of allHandoffComponents()) {
      if (component.id !== 'atlas-home-readiness-panel') continue
      for (const v of component.variants) {
        const text = `${v.name} ${v.when} ${v.detail ?? ''}`
        for (const word of retired) {
          // The summary is allowed to say the five were REPLACED; a variant
          // name is not allowed to still be one of them.
          if (v.name.includes(word)) hits.push(`variant "${v.name}" still uses "${word}"`)
          else if (text.includes(word) && !text.includes('replaced')) {
            hits.push(`"${v.name}" mentions retired level "${word}"`)
          }
        }
      }
    }
    expect(hits, hits.join('\n')).toEqual([])
  })
})
