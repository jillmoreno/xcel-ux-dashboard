/**
 * "Lifetime Member Details" — the value-realized half of the Membership hub
 * hero: a dark Total Saved bar over four learning stats.
 *
 * Extracted from `MemberHubHero` so the handoff preview can render the REAL
 * block instead of an older scorecard that had drifted away from it. The
 * preview's own caption promises it "stays in sync with the implementation";
 * that is only true if both surfaces import the same component, so this file
 * is the single implementation and neither side owns a copy.
 *
 * Its CSS moved to tokens.css under `.cre-hub-*`, because the original rules
 * were scoped to `.mx-root` inside MembershipStandalonePage's own <style>
 * block — unreachable from anywhere else, which is what made the drift
 * possible in the first place.
 */
export type HubStat = {
  /** The figure, pre-formatted (e.g. "425"). */
  n: string
  /** Label — rendered uppercase. */
  k: string
  /** Qualifier line, so a bare number never has to be interpreted. */
  s: string
}

export function MembershipHubDetails({
  savings,
  since,
  stats,
}: {
  /** Total saved, pre-formatted without the currency symbol (e.g. "1,180"). */
  savings: string
  /** Scope for the figure — a total with no window is a claim with no meaning. */
  since: string
  stats: HubStat[]
}) {
  return (
    <div className="cre-hub-details">
      <div className="cre-hub-savebar">
        <p className="amt">
          <span className="cur">$</span>
          {savings}
        </p>
        <span className="lbl">
          <span className="k">Total Saved</span>
          <span className="s">{since}</span>
        </span>
      </div>
      <div className="cre-hub-dstats">
        {stats.map((s) => (
          <div className="cre-hub-dstat" key={s.k}>
            <span className="n">{s.n}</span>
            <span className="k">{s.k}</span>
            <span className="s">{s.s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
