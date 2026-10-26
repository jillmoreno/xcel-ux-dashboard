/**
 * Variants & Copy decks — the stakeholder-facing view of a state machine.
 *
 * A deck shows every state a model can resolve, the surfaces each one feeds,
 * and THE EXACT STRINGS it produces — read out of the model at render time
 * rather than transcribed into a handoff field.
 *
 * WHY THIS EXISTS. The gateway's variant list was written by hand, and by
 * 2026-09-30 four of the six renewal-state descriptions no longer matched
 * `membershipRenewalState.ts`: the copy was revised on 2026-08-31 and the prose
 * beside it was not. Nobody was careless — that is simply what a second copy of
 * a string does over time. A deck cannot drift, because there is no second copy
 * to drift from.
 *
 * This module is METADATA ONLY — no JSX, so the feature gateway can ask "does
 * this component have a deck?" without pulling a page into its import graph.
 * The rows (surfaces + derived copy) are built in `VariantDeckPage`.
 */

export type VariantDeckMeta = {
  /** URL segment: /variants/<id>. Stable — it is a shared link. */
  id: string
  /** The walkthrough this deck belongs to, for the "back to the handoff" link. */
  featureId: string
  /** The `uiComponents` entry it documents. The gateway matches on this to
   *  decide whether to offer the deck link on a component's detail. */
  componentId: string
  title: string
  /** One sentence. This is the first thing a stakeholder reads. */
  blurb: string
  /** The function the strings are read from, named on the page so a reader can
   *  check them against the source themselves. */
  source: string
}

/**
 * EMPTY on the XCEL hub (carried from the Common LMS hub 2026-10-26). The LMS
 * registers one deck, `membership-renewal`, whose rows are built from its
 * membership renewal model; XCEL has no membership. A deck is a
 * `VariantDeckMeta` here plus a row builder registered in `DECK_ROWS` in
 * `src/pages/VariantDeckPage.tsx` — the page, the route and the gateway link
 * are all in place and show the moment one is added.
 */
export const VARIANT_DECKS: VariantDeckMeta[] = []

export function variantDeckById(id: string | undefined): VariantDeckMeta | undefined {
  return id ? VARIANT_DECKS.find((d) => d.id === id) : undefined
}

/** The deck documenting `componentId`, if one exists. Drives the gateway link. */
export function variantDeckForComponent(componentId: string): VariantDeckMeta | undefined {
  return VARIANT_DECKS.find((d) => d.componentId === componentId)
}
