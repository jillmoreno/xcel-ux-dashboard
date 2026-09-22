import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { widgetCardRecessedStyle, widgetEyebrowStyle } from '@/components/learning/widgetStyles'

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
}: {
  caption: string
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
}) {
  return (
    <div
      style={{
        // Square at any column width; grows rather than clipping if the content
        // ever needs more than the width allows.
        aspectRatio: '1 / 1',
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
        background: widgetCardRecessedStyle.background,
        borderRadius: 'var(--radius-lg)',
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
