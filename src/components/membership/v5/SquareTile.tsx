import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  widgetCardRecessedStyle,
  widgetCardRuledStyle,
  widgetEyebrowStyle,
} from '@/components/learning/widgetStyles'

/*
 * EXTRACTED 2026-09-21 from `LearnerFocusedBand`, unchanged apart from the
 * `action` prop below. It moved because a SECOND caller arrived — the live
 * `StudyPaceTile` in the Testing dashboard version — and the alternative was
 * importing a helper out of an 1,800-line component file or, worse, rebuilding
 * the square. A tile treatment that exists twice is the drift `widgetStyles.ts`
 * was written to stop; this file is the same answer one level up.
 */

/**
 * One of the two square tiles that replaced the KPI row on the page surface —
 * Study Pace and Readiness. Added 2026-09-16.
 *
 * It is a CARD where `KpiDark` on this surface is deliberately bare, and the
 * reason the two differ is the reason the cells went bare in the first place:
 * three cells in a row were three boxes competing with the Study Journey card
 * beside them, and the numbers were the content. TWO tiles are not a row of
 * readings — each holds a heading, a figure and a sentence — so the box is
 * doing the work the vertical rules were doing before.
 *
 * The caption takes `KpiDark`'s exact treatment (10px / 700 / 0.1em / uppercase
 * on `--color-text-secondary`, icon at 13) rather than a near-copy: these sit
 * where those cells sat, and an eyebrow a pixel off from the one it replaced is
 * the drift this file keeps paying for.
 */
export function SquareTile({
  caption,
  icon,
  children,
  to,
  action,
  square = true,
  surface = 'recessed',
}: {
  /**
   * The eyebrow's text.
   *
   * ⚠ IT IS NOT ALWAYS "Study Pace". The `presets` card writes its own —
   * "Recommended Study Pace", becoming "Your Study Pace" the moment the learner
   * adjusts anything — so tests that find a tile by its caption match a regex
   * rather than the literal; see `paceTile()` in `TestingVersion.test.tsx`.
   *
   * A `ReactNode` rather than a `string` since 2026-09-21. The redesign left it
   * a plain string at every call site again, but the type stays widened: a
   * caption with element children is a thing this eyebrow can hold, and
   * narrowing it back would be a change that only looks like a tidy.
   */
  caption: ReactNode
  icon?: ReactNode
  children: ReactNode
  /**
   * A control on the tile's floor, to the LEFT of `Details →`. Added 2026-09-21
   * for the live Study Pace tile, whose only control is Adjust.
   *
   * It shares the link's row rather than sitting above it, because the tile is
   * a fixed square: a second floor would take a line of height from the content
   * on every tile, including the ones that have no action.
   */
  action?: ReactNode
  /**
   * Where the tile's bottom-right "Details →" goes. Omitted → no link.
   *
   * A REAL in-shell address, never an invented one: both tiles point at rail
   * sections that exist (`?section=study-plan`, `?section=readiness`), which is
   * the rule the Resources section had to learn after shipping four dead slugs.
   * The Readiness tile is a lo-fi stub and its DESTINATION is still the real
   * Readiness page — the placeholder is this tile, not the section.
   */
  to?: string
  /**
   * Hold a 1:1 aspect ratio. Default on — it is what makes the PAIR read as a
   * pair.
   *
   * Off for the Testing version's solo Study Pace tile, where the Readiness
   * half is dropped and this one takes the whole row: a square at ~506px is a
   * 506px box holding two lines. The tile then sizes to its content, which is
   * what a full-width card should do anyway.
   *
   * A prop rather than a second component: the two arrangements differ in
   * exactly this one declaration, and a `WideTile` beside this would be the
   * near-copy `widgetStyles.ts` exists to prevent.
   */
  square?: boolean
  /**
   * The tile's shell. `recessed` (default) is the tinted fill every tile has
   * carried since 2026-09-17. `ruled` is the pacing card's — no fill, a
   * hairline, and a 6px brand rule down the left edge, with the top-left and
   * bottom-right corners squared.
   *
   * A PROP, so the Readiness stub beside it and Testing 2's square are
   * untouched: they are the same component and must stay the same tile.
   */
  surface?: 'recessed' | 'ruled'
}) {
  return (
    <div
      style={{
        // Square at any column width; grows rather than clipping if the content
        // ever needs more than the width allows.
        ...(square ? { aspectRatio: '1 / 1' } : null),
        minWidth: 0,
        /* THE JUMP BACK IN CARD'S SURFACE — 2026-09-17, the direct ask. It was
           a white card with a hairline border; it is the same tinted recess as
           the card directly above it, with no stroke.

           `widgetCardRecessedStyle` is the owner of that fill, and these read it
           rather than restating the `color-mix` — three cards in one column
           agreeing by coincidence is exactly how they stop agreeing, which is
           why `widgetStyles.ts` exists. The mix is also load-bearing: its own
           note records that 5% is a CEILING set by the 10px type on it, not a
           preference.

           No border, for the reason the card above has none: a stroke round a
           flat recessed fill reads as a card that has lost its edge rather than
           as a card with one. */
        /* TWO SURFACES — 2026-09-21, the direct ask on the pacing card:
           "remove background, add light stroke, add 6px left line on container,
           adjust so top left of container radius is 0, and bottom right of
           container radius is 0".

           `ruled` READS `widgetCardRuledStyle`, which owns the white fill, the
           hairline, the 6px rule and the squared corners — and owns them
           because the Jump Back In card takes the same treatment. Two cards
           restating one shell is the drift `widgetStyles.ts` exists to stop,
           and its note carries the reasoning (including why the borders are
           four longhands and not `border` + `borderLeft`).

           A prop rather than a second component, for the reason `square` is
           one: the arrangements differ in exactly these declarations. */
        ...(surface === 'ruled'
          ? {
              background: widgetCardRuledStyle.background,
              borderTop: widgetCardRuledStyle.borderTop,
              borderRight: widgetCardRuledStyle.borderRight,
              borderBottom: widgetCardRuledStyle.borderBottom,
              /* NO 6px LEFT RULE HERE — 2026-09-21, the direct ask ("remove
                 the thicker left stroke here on this component"), pointed at
                 the pacing card specifically. The Jump Back In card above it
                 keeps its rule; this one takes the same hairline on all four
                 sides.

                 ⚠ THE HAIRLINE'S OWN NOTE IS NOW LOAD-BEARING FOR THIS CARD.
                 `--color-primary-100` at ~1.1:1 was safe while the 6px rule
                 bounded the card and the tint merely finished the shape. With
                 the rule gone, what separates this card from the page is its
                 WHITE FILL against the page grey, not its stroke. That reads,
                 and it is the asked-for look — but it means the card is a fill
                 with a tint round it rather than a bordered box, and a future
                 change that moves this card onto a white surface would leave
                 it with no edge at all. */
              borderLeft: widgetCardRuledStyle.borderTop,
              borderRadius: widgetCardRuledStyle.borderRadius,
            }
          : {
              background: widgetCardRecessedStyle.background,
              borderRadius: 'var(--radius-lg)',
            }),
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {/* THE SHARED WIDGET EYEBROW (2026-09-17, the direct ask to match). It
          was a near-copy — 10/700 at 0.1em — beside the real one a few pixels
          up the column, which is the drift `widgetStyles.ts` exists to stop.
          `.cre-eyebrow-ink` carries the navy, and the constant deliberately
          sets no colour so that class can own it. */}
      <span
        className="cre-eyebrow-ink"
        style={{ ...widgetEyebrowStyle, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        {icon}
        {caption}
      </span>
      {children}
      {/* BOTTOM-RIGHT, in the header band's own link style (2026-09-17, the
          direct ask). `margin-top: auto` rather than a spacer: the tile is a
          fixed square, so the link sits on its floor whatever the content above
          it does.

          `.cre-cta-ink` with NO inline colour — the CTA ramp is a FILL colour
          on XCEL and cta-500 as TEXT is 1.84:1 on the dark page, so the class
          swaps to the light stop under `[data-theme='dark']` and an inline
          value would beat it while looking correct.

          Same LABEL as the band's, deliberately: three links of one shape doing
          one kind of thing ("show me the detail behind this") read as a set, and
          naming each after its own destination would make the shared treatment
          look accidental. */}
      {to || action ? (
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: action ? 'space-between' : 'flex-end',
            gap: 10,
          }}
        >
          {action}
          {to ? (
            <Link
              to={to}
              className="cre-link-action cre-cta-ink"
              style={{
                textDecoration: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              Details →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
