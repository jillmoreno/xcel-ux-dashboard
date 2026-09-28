import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * THE LO-FI SHELL VEIL — `lofi-shell`.
 *
 * Greys the content column of `/dashboard-rebrand` so the left nav is the only
 * surface left at full fidelity, for the conversation about navigation.
 *
 * ASSERTED AT THE STYLESHEET AND THE CATALOG, not through a render — the same
 * reason `TextTiers.test.tsx` gives: jsdom applies no author stylesheet, so a
 * mounted component would report the inline fallback for every one of these
 * declarations and pass whatever the CSS actually said. The degrade that
 * matters here is a rule escaping its scope, and only reading the file catches
 * it.
 *
 * THE LOAD-BEARING TEST IS `scoped to the veil class`. The veil is built from
 * `!important` declarations over a universal selector; the ONLY thing keeping
 * it off the rail and the header is that every rule sits under
 * `.cre-lofi-shell`, which is a sibling of both. A single rule that loses that
 * prefix greys the navigation — the one surface this variant exists to show —
 * and it would do it on the branch build, silently, wherever the flag is on.
 */
const CSS = readFileSync('src/styles/lofi-shell.css', 'utf8')
const SHELL = readFileSync('src/components/layout/PlatformShell.tsx', 'utf8')

function strip(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Split a selector list on its TOP-LEVEL commas only. Splitting on every
 *  comma tears `:is(img, picture, video)` into fragments that look like bare
 *  element selectors, which is a false alarm rather than an escaped rule. */
function splitSelectorList(list: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ''
  for (const ch of list) {
    if (ch === '(') depth += 1
    if (ch === ')') depth -= 1
    if (ch === ',' && depth === 0) {
      out.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  out.push(current.trim())
  return out.filter(Boolean)
}

/** Selectors only — strip comments, then take the text before each `{`. */
function selectors(css: string): string[] {
  return strip(css)
    .split('}')
    .map((block) => block.split('{')[0].trim())
    .filter(Boolean)
    .flatMap(splitSelectorList)
}

describe('lo-fi shell — catalog', () => {
  const flag = FEATURE_FLAGS.find((f) => f.key === 'lofi-shell')

  it('is in the catalog and scoped to the rebrand page', () => {
    expect(flag).toBeDefined()
    expect(flag!.page).toBe('dashboard-rebrand')
  })

  it('is a plain on/off flag, not a variant set', () => {
    // The veil is one treatment. A variant axis here would imply degrees of
    // lo-fi that the stylesheet does not implement.
    expect(flag!.variants).toBeUndefined()
  })

  it('DEFAULTS ON, which is what makes the branch build open in lo-fi', () => {
    // This is the line `promote-to-prototype` has to look at before any merge
    // to main: shipping it on would make the product's own dashboard a
    // wireframe for everyone.
    expect(flag!.defaultEnabled).toBe(true)
  })
})

describe('lo-fi shell — stylesheet', () => {
  it('scopes every rule to the veil class, so the nav can never be greyed', () => {
    const escaped = selectors(CSS).filter(
      (sel) => !sel.startsWith('.cre-lofi-shell'),
    )
    expect(escaped).toEqual([])
  })

  it('never changes a property that would move the layout', () => {
    // The whole premise is that the nav is judged beside a page of the RIGHT
    // weight: same heights, same scroll length. Only colour, text and imagery
    // may go. `min-height` is the one sizing property allowed, and only as the
    // floor that stops a text bar collapsing to a hairline.
    // The `::before` marker is EXEMPT, and is the one thing here that does add
    // height: it is a banner appended to the column, not a rule reshaping the
    // page beneath it. Everything else must leave the geometry alone.
    const declarations = strip(CSS)
      .split('}')
      .filter((block) => !block.split('{')[0].includes('::before'))
      .flatMap((block) => (block.split('{')[1] ?? '').split(';'))
      .map((d) => d.split(':')[0].trim())
      .filter(Boolean)

    const layoutProps = [
      'width',
      'height',
      'margin-top',
      'margin-bottom',
      'padding-top',
      'padding-bottom',
      'display',
      'position',
      'flex',
      'grid',
      'gap',
      'font-size',
      'line-height',
    ]
    const offenders = declarations.filter((d) => layoutProps.includes(d))
    expect(offenders).toEqual([])
  })
})

describe('lo-fi shell — call site', () => {
  it('applies the class only when the flag is on', () => {
    expect(SHELL).toContain("useFeatureFlag('lofi-shell').enabled")
    expect(SHELL).toContain("loFiShell ? 'cre-lofi-shell' : undefined")
  })

  it('puts the veil on the content column, NOT on the shell grid', () => {
    // The grid holds the rail AND the content. Moving the class up to it is the
    // single edit that would grey the navigation, and it would look like a
    // tidy-up.
    const gridLine = SHELL.split('\n').find((l) =>
      l.includes("className=\"cre-platform-shell-grid\""),
    )
    expect(gridLine).toBeDefined()
    expect(gridLine).not.toContain('cre-lofi-shell')
  })
})
