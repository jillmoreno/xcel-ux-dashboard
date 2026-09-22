import type { CSSProperties } from 'react'

/**
 * Shared chrome for the QE Focused version's right-column widgets.
 *
 * Created 2026-09-16 when the resume block came out of `StudyJourneyWidget` as
 * its own card: two stacked cards in one column have to agree on their surface
 * and their label style, and three copies of a card shell is how they stop
 * agreeing. The same reason `DELIVERY_LABEL` moved to `utils/courseDelivery`
 * rather than being copied into the new file.
 */

/**
 * RECESSED variant of the card below — a flat grey fill, no border, no shadow.
 * `JumpBackInWidget` uses it (2026-09-16, to a supplied reference); the Study
 * Journey keeps the raised white card.
 *
 * **It lives beside its sibling rather than inside the component**, which is the
 * whole point of this file: the two cards sit in one column, and the way they
 * stop agreeing is a second card shell defined somewhere else. Divergence is
 * fine — they are different KINDS of block, one action against one course
 * versus the shape of the whole programme — but it has to be a divergence
 * anyone can see in one place.
 *
 * **`--color-neutral-100`, and the near-miss is worth recording.**
 * `--color-primary-100` is the closer match to the reference (a cool blue-grey,
 * rgb(233 238 242) against the neutral's rgb(236 236 236)) and it is a TRAP: it
 * does not invert with the theme. It stays near-white under
 * `[data-theme='dark']`, so the card would have rendered near-white with
 * near-white text — title **1.05:1**, meta **1.38:1**. Caught by measuring the
 * token in both themes before writing it, not after. The neutral inverts to a
 * navy and holds its relationship to the page in both.
 *
 * SLIGHTLY DARKER, WITH A NAVY TINT — 2026-09-17, the direct ask. It was flat
 * `--color-neutral-100`; it is now 5% of `--color-primary-500` mixed into that,
 * which lands at rgb(226 229 230) in light and reads 1.16:1 against the page
 * grey (1.08:1 before). Dark inverts to rgb(14 44 86), 1.22:1.
 *
 * **THE TINT IS SET BY THE TYPE ON IT, NOT BY TASTE, AND THAT IS THE PART NOT
 * TO LOSE.** The eyebrow and the chapter line are 10–11px, so they need 4.5:1,
 * and both sit on `--color-text-secondary`. Measured down the ramp:
 *
 *   - 10% into `-200` → rgb(200 204 207): eyebrow **3.83:1**. Fails.
 *   -  6% into `-200` → rgb(207 209 211): **3.75:1**. Fails.
 *   -  9% into `-100` → rgb(219 223 225): **4.27:1**. Fails.
 *   -  5% into `-100` → rgb(226 229 230): **4.53:1**. Passes, barely.
 *
 * So 5% is a ceiling, not a preference. Darkening this fill any further means
 * moving that text to `--color-text-primary` first — the card cannot get
 * moodier on its own.
 *
 * Mixed from the **500**, never `--color-primary-100`: that token does not
 * invert (it stays near-white under `[data-theme='dark']`), which is the
 * documented trap that once put a 1.05:1 title on this very card.
 *
 * No border (the direct ask) and no shadow either: a shadow under a flat
 * recessed fill reads as a raised card that has lost its edge.
 */
/**
 * THE RULED CARD — 2026-09-21, the direct asks on the pacing card, then
 * "apply that same update to the Learning with Compass widget".
 *
 * A white card with a hairline, a 6px brand rule down the left edge, and the
 * top-left / bottom-right corners squared. The diagonal corner pattern is the
 * course art's own (`0 md 0 md` in the header band above), so the column reads
 * as one family rather than as three ideas about corners.
 *
 * ⚠ FOUR BORDER LONGHANDS, NOT `border` + `borderLeft`. That pairing renders as
 * a LEFT RULE AND NOTHING ELSE, and it looks correct in the source: a `border`
 * shorthand carrying a `var()` cannot be expanded into longhands by the CSSOM,
 * so setting `border-left` afterwards invalidates it and the other three
 * resolve to empty. Written out, each side is its own declaration and nothing
 * overrides anything. This shipped wrong for one build.
 *
 * ⚠ `--color-primary-400` for the rule, NOT `-500`. `-500` measures ~2.2:1
 * against the dark charcoal page — under the 3:1 a 6px bar needs to read as an
 * element rather than a smudge. `-400` is one of the ramp's few symmetric stops
 * here, which is what lets this take no theme swap; the same property that made
 * `--color-text-tertiary` the right fill for the runway strip.
 *
 * `--color-surface-card` rather than a literal white: it is white in light and
 * the brand navy on the dark canvas, which is the whole reason the token
 * exists.
 */
export const widgetCardRuledStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--color-neutral-300)',
  borderRight: '1px solid var(--color-neutral-300)',
  borderBottom: '1px solid var(--color-neutral-300)',
  borderLeft: '6px solid var(--color-primary-400)',
  borderRadius: '0 var(--radius-lg) 0 var(--radius-lg)',
  padding: 16,
  minWidth: 0,
}

export const widgetCardRecessedStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'color-mix(in srgb, var(--color-primary-500) 5%, var(--color-neutral-100))',
  borderRadius: 'var(--radius-lg)',
  /* 16, matching the Study Pace and Readiness tiles directly below this card
     in the same column (2026-09-17, the direct ask). It was 24/26, which set
     this card's eyebrow 10px inside theirs — three stacked blocks whose labels
     start on three different verticals read as a misalignment rather than a
     rhythm. */
  padding: 16,
  minWidth: 0,
}

/**
 * NO CARD — the widget sits on the page grey (2026-09-16, the direct ask:
 * "remove the background white and stroke").
 *
 * It was a raised white card: `--color-surface-card`, a 1px
 * `--color-border-subtle` edge and a soft shadow, inherited from the outer
 * section back when this was the right half of a joined band.
 *
 * **The shadow went with them, and that is not scope creep.** A shadow under a
 * surface that has neither fill nor edge does not read as "less card" — it
 * reads as a card that failed to paint. The three are one treatment.
 *
 * **The horizontal padding went too**, for the reason the Current Learning
 * Progress block records when it made the same move: a bare block should line
 * up with the column it is in rather than stay inset by a gutter belonging to
 * a card it no longer has. What is left is 4px of top padding, so the eyebrow
 * clears the block above it by the same hair the progress block's does.
 *
 * `widgetRuleStyle` below is UNAFFECTED — it divides this block's own two
 * halves (the journey from Get Licensed) and is not card chrome.
 */
export const widgetCardStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '4px 0 0',
  minWidth: 0,
}

/**
 * FRAMED — a white card, for the TESTING version (2026-09-21, the direct ask:
 * "add a frame, white background around this content", then "remove stroke").
 *
 * **It reverses `widgetCardStyle` above, deliberately**, and the note there is
 * kept rather than rewritten: the card was removed on 2026-09-16 when the
 * journey was one of two stacked blocks on the page grey and a raised card put
 * chrome around chrome. On Testing that column holds this and nothing else,
 * with the left column's blocks sitting bare on the grey — so a frame here
 * distinguishes the two columns rather than competing with a neighbour. Same
 * component, different composition, opposite answer.
 *
 * **FILL ONLY — no stroke and no shadow** (the stroke went 2026-09-21, hours
 * after it landed: "remove stroke").
 *
 * It shipped for those hours as fill + a 1px `--color-border-subtle` edge. What
 * is left is the white surface alone, which is the same treatment
 * `widgetCardRecessedStyle` opposite it already has — a card defined by its
 * fill, with nothing drawn round it. The two columns now differ by SURFACE
 * rather than by one having an outline.
 *
 * **NO SHADOW IN ITS PLACE**, and this is the part to hold. Removing an edge
 * and adding a shadow is not removing chrome, it is swapping one kind for
 * another — and it would make this a RAISED card, a different claim about the
 * column's depth from the flat recess opposite. The removal note above states
 * the rule this follows: fill, edge and shadow are ONE treatment, so the fill
 * is allowed to be the whole of it.
 *
 * **THE COST, stated rather than discovered:** the card is now carried by a
 * 1.09:1 (light) / 1.11:1 (dark) fill against the page and nothing else. That
 * is deliberately subtle and it matches the recessed tile's 1.16:1, so the page
 * is consistent — but there is no longer a second cue. If the card needs to
 * read harder, the honest lever is the FILL, not a re-added outline.
 *
 * **The horizontal padding stays**, and it belongs to the FILL rather than to
 * the departed edge: a bare block lines up with its column, a filled one needs
 * its own gutter or the content sits on the boundary. 20 rather than the recessed card's 16 — that
 * one is sized to line its eyebrow up with the tiles stacked beneath it in the
 * SAME column, and this card has no such neighbour; 20 is the value a card this
 * tall wants before the rule that divides its two halves reaches the edge.
 *
 * `--color-surface-card` rather than a literal white: it inverts with the
 * theme, which `#fff` would not — the trap `widgetCardRecessedStyle` records
 * from the other direction with `--color-primary-100`.
 */
export const widgetCardFramedStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-surface-card)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  minWidth: 0,
}

/**
 * Section label. Matched to the Current Learning Progress block's eyebrow and
 * to "Get Licensed", so every label on this version reads at one level of
 * hierarchy — the rule CLAUDE.md records for the three eyebrows on the Today's
 * Tasks card.
 *
 * `textTransform: uppercase` means the casing of the string passed in does not
 * reach the screen; the strings stay sentence-case so they read as English in
 * the source.
 */
/**
 * The eyebrow every widget in this column wears.
 *
 * MATCHED TO THE STUDY JOURNEY's on 2026-09-17 (the direct ask) — 10/600 at
 * 0.18em on the tertiary ink, down from 12/700 at 0.08em on the secondary. The
 * wide tracking is what makes a small uppercase line read as a document's label
 * rather than as a heading that shrank.
 *
 * It is ONE constant that both read rather than two that happen to agree:
 * `StudyJourneyRail`'s `syllabusEyebrowStyle` is this, re-exported. The two
 * cards sit side by side in one column, which is exactly where two copies drift
 * — the reason `widgetStyles.ts` exists at all.
 */
export const widgetEyebrowStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  /* NO COLOUR — `.cre-eyebrow-ink` owns it (tokens.css). The navy needs a light
     stop on a dark ground, which a theme selector supplies and `CSSProperties`
     cannot; and an inline value here would beat that rule while looking
     correct. Every consumer must set the class. */
}

/** Hairline rule between a widget's own sections. */
export const widgetRuleStyle: CSSProperties = {
  height: 1,
  background: 'var(--color-border-subtle)',
}
