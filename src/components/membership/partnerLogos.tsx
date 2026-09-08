import type { CSSProperties, FC } from 'react'

/**
 * Inline SVG logo components for partner offerings that ship with
 * licensed-looking marks. Today: NatMed + Prescriber Insights (both
 * trchealthcare brands per the partnership). Other partners fall
 * back to a typographic wordmark inside `<PartnerOfferingCard>`.
 *
 * The SVGs are simplified approximations of the trchealthcare brand
 * marks (a 4-petal flower for NatMed, a 6-point asterisk for
 * Prescriber Insights) plus the wordmark + "a trchealthcare brand"
 * tagline. They're hand-drawn here rather than imported as raster
 * assets so the surface stays editable + brand-token-friendly.
 *
 * Adding a new partner logo:
 *   1. Build a new `<FooLogo>` component below mirroring the
 *      width / height conventions (max 180px wide, 64px tall).
 *   2. Add the new key to `PARTNER_LOGOS`.
 *   3. Set `logoKey: 'foo'` on the fixture entry in
 *      `src/data/membership/partnerOfferingsFixtures.ts`.
 *
 * TODO(brand-assets): swap these for the partner's licensed SVG
 * artwork once the partnerships team confirms usage rights. Until
 * then the simplified versions read clearly at card scale and stay
 * accessible (logos carry `aria-label` for screen-reader naming).
 */

const wrapStyle: CSSProperties = {
  display: 'inline-block',
  maxWidth: '100%',
  height: 'auto',
}

/* ─── NatMed ───────────────────────────────────────────────────────── */

export const NatMedLogo: FC = () => {
  // Brand colors sampled from the supplied logo artwork:
  //   - Navy "Nat"       ≈ #14365E
  //   - Lighter "Med"    ≈ #5B89C0 (medium blue, lighter weight)
  //   - Green leaves     ≈ #88B04B
  //   - Gray pills       ≈ #97A2A2
  //   - Green underline  ≈ #88B04B (matches leaves)
  //   - Tagline accent   ≈ #5B89C0 (matches "Med")
  //   - Tagline neutral  ≈ #8597A6
  //
  // The icon is an 8-element radial flower: four gray "pills" at the
  // cardinal positions (N + S vertical, E + W horizontal) plus four
  // green leaves on the diagonals. Underneath the wordmark sits a
  // thin green divider line; below that the trchealthcare tagline.
  return (
    <svg
      role="img"
      aria-label="NatMed — a trchealthcare brand"
      viewBox="0 0 380 80"
      width={220}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(40, 40)">
        {/* Cardinal gray pills (pharmaceutical-capsule shapes). */}
        {/* N */}
        <rect x="-3" y="-26" width="6" height="18" rx="3" fill="#97A2A2" />
        {/* S */}
        <rect x="-3" y="8" width="6" height="18" rx="3" fill="#97A2A2" />
        {/* W */}
        <rect x="-26" y="-3" width="18" height="6" rx="3" fill="#97A2A2" />
        {/* E */}
        <rect x="8" y="-3" width="18" height="6" rx="3" fill="#97A2A2" />

        {/* Diagonal green leaves — rotated ellipses to give an almond
            silhouette pointing outward from the center. */}
        {/* NE */}
        <ellipse cx="13" cy="-13" rx="5.5" ry="9.5" fill="#88B04B" transform="rotate(45 13 -13)" />
        {/* NW */}
        <ellipse cx="-13" cy="-13" rx="5.5" ry="9.5" fill="#88B04B" transform="rotate(-45 -13 -13)" />
        {/* SE */}
        <ellipse cx="13" cy="13" rx="5.5" ry="9.5" fill="#88B04B" transform="rotate(-45 13 13)" />
        {/* SW */}
        <ellipse cx="-13" cy="13" rx="5.5" ry="9.5" fill="#88B04B" transform="rotate(45 -13 13)" />

        {/* Small seed at the center. */}
        <circle cx="0" cy="0" r="3.5" fill="#97A2A2" />
      </g>

      {/* Wordmark — "Nat" heavy + dark navy, "Med" lighter weight in
          medium blue. */}
      <text
        x="90"
        y="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="38"
        fontWeight="800"
        fill="#14365E"
        letterSpacing="-1"
      >
        Nat
        <tspan fontWeight="500" fill="#5B89C0">Med</tspan>
      </text>

      {/* Thin green divider — matches the leaf color and bridges the
          wordmark to the tagline. */}
      <line x1="90" y1="54" x2="370" y2="54" stroke="#88B04B" strokeWidth="1.5" />

      {/* Tagline — "a trchealthcare brand". `trc` is bold + blue
          (same blue as "Med"). */}
      <text
        x="180"
        y="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="400"
        fill="#8597A6"
      >
        a <tspan fontWeight="700" fill="#5B89C0">trc</tspan>
        healthcare brand
      </text>
    </svg>
  )
}

/* ─── Prescriber Insights ──────────────────────────────────────────── */

export const PrescriberInsightsLogo: FC = () => {
  // Brand colors sampled from the supplied logo artwork:
  //   - Wordmark navy        ≈ #1F4E91 ("Prescriber" heavy)
  //   - Lighter wordmark     ≈ #1F4E91 ("Insights" — same navy,
  //                            rendered at a medium weight to match
  //                            the two-tone weight treatment)
  //   - Pill navy            ≈ #1F4E91 (vertical axis)
  //   - Pill medium blue     ≈ #5B89C0 (rotated 60°)
  //   - Pill light gray-blue ≈ #B6CCE6 (rotated 120°)
  //   - Divider color        ≈ #1F4E91 (navy, matches the wordmark)
  //   - Tagline accent       ≈ #1F4E91 ("trc" navy bold)
  //   - Tagline neutral      ≈ #8597A6
  //
  // The icon is a 6-petal burst built from THREE pharmaceutical-pill
  // capsules (rounded rects), each spanning the center and rotated
  // 60° from the previous one. That gives 6 visible "ends" with
  // opposing pairs sharing a color — matching the supplied artwork
  // (navy + medium blue + light gray-blue).
  return (
    <svg
      role="img"
      aria-label="Prescriber Insights — a trchealthcare brand"
      viewBox="0 0 480 80"
      width={260}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(40, 40)">
        {/* Axis 1 — vertical, navy. */}
        <rect x="-3.5" y="-26" width="7" height="52" rx="3.5" fill="#1F4E91" />
        {/* Axis 2 — rotated 60°, medium blue. */}
        <rect
          x="-3.5"
          y="-26"
          width="7"
          height="52"
          rx="3.5"
          fill="#5B89C0"
          transform="rotate(60)"
        />
        {/* Axis 3 — rotated 120°, light gray-blue. */}
        <rect
          x="-3.5"
          y="-26"
          width="7"
          height="52"
          rx="3.5"
          fill="#B6CCE6"
          transform="rotate(120)"
        />
      </g>

      {/* Wordmark — same navy throughout; "Prescriber" heavy and
          "Insights" medium weight. The two words sit side by side
          with a slight letter-space + a generous dx between them. */}
      <text
        x="86"
        y="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="34"
        fontWeight="800"
        fill="#1F4E91"
        letterSpacing="-1"
      >
        Prescriber
        <tspan fontWeight="500" dx="10">
          Insights
        </tspan>
      </text>

      {/* Thin navy divider below the wordmark. */}
      <line x1="86" y1="54" x2="470" y2="54" stroke="#1F4E91" strokeWidth="1.5" />

      {/* Tagline — "a trchealthcare brand" with `trc` accented navy
          to match the wordmark. */}
      <text
        x="225"
        y="72"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="400"
        fill="#8597A6"
      >
        a <tspan fontWeight="700" fill="#1F4E91">trc</tspan>
        healthcare brand
      </text>
    </svg>
  )
}

/* ─── Boojee ───────────────────────────────────────────────────────── */

export const BoojeeLogo: FC = () => {
  // Brand colors sampled from the supplied Boojee artwork:
  //   - Dark plum (wordmark + large circle)  ≈ #5C2960
  //   - Medium plum (middle circle)          ≈ #7C3F7E
  //   - Light plum (smallest circle)         ≈ #9D5C9F
  //   - Tagline plum                         ≈ #5C2960 (same as
  //                                            wordmark)
  //
  // The icon is the trailing trio of dots in the top-right — one
  // larger anchor circle plus two diminishing satellites — followed
  // by the lowercase "boojee" wordmark and the "wear your ID with
  // style" tagline below.
  return (
    <svg
      role="img"
      aria-label="Boojee — wear your ID with style"
      viewBox="0 0 200 90"
      width={160}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Trailing dots, top-right. Sizes diminish from large anchor
          to small terminal satellite, mirroring the artwork. */}
      <circle cx="118" cy="18" r="10" fill="#5C2960" />
      <circle cx="140" cy="12" r="6.5" fill="#7C3F7E" />
      <circle cx="156" cy="8" r="3.5" fill="#9D5C9F" />

      {/* Lowercase "boojee" wordmark. */}
      <text
        x="14"
        y="56"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="36"
        fontWeight="500"
        fill="#5C2960"
        letterSpacing="-1"
      >
        boojee
      </text>

      {/* Tagline "wear your ID with style". Letterspaced slightly so
          the words breathe under the wordmark — matches the airy
          treatment in the reference. */}
      <text
        x="22"
        y="76"
        fontFamily="Helvetica, Arial, sans-serif"
        fontSize="11"
        fontWeight="400"
        fill="#5C2960"
        letterSpacing="0.5"
      >
        wear your ID with style
      </text>
    </svg>
  )
}

/* ─── DocuSign ─────────────────────────────────────────────────────── */

export const DocuSignLogo: FC = () => {
  // Simplified DocuSign lockup: the purple app-icon tile (electric-indigo
  // rounded square + a white document with a folded corner) with the coral
  // loop peeking top-right, followed by the lowercase "docusign" wordmark.
  //   - Indigo    ≈ #4C00FF
  //   - Coral      ≈ #FB5C64
  //   - Doc fold   ≈ #D9CCFF (tint of the indigo)
  //   - Wordmark   ≈ #0B0B0B
  return (
    <svg
      role="img"
      aria-label="DocuSign for Real Estate"
      viewBox="0 0 252 84"
      width={200}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(4, 13)">
        {/* Coral loop peeking behind the tile, top-right. */}
        <circle cx="45" cy="15" r="17" fill="#FB5C64" />
        {/* Indigo rounded-square app tile. */}
        <rect x="1" y="13" width="46" height="46" rx="10" fill="#4C00FF" />
        {/* White document with a folded corner. */}
        <path
          d="M14 23 h15 l9 9 v18 a2.5 2.5 0 0 1 -2.5 2.5 h-21 a2.5 2.5 0 0 1 -2.5 -2.5 v-24.5 a2.5 2.5 0 0 1 2.5 -2.5 Z"
          fill="#ffffff"
        />
        <path d="M29 23 v9 h9 Z" fill="#D9CCFF" />
      </g>
      <text
        x="82"
        y="52"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill="#0B0B0B"
        letterSpacing="-1.5"
      >
        docusign
      </text>
    </svg>
  )
}

/* ─── Zillow Premier Agent ─────────────────────────────────────────── */

export const ZillowPremierLogo: FC = () => {
  // Simplified Zillow lockup: the blue house mark with a white "Z" cut,
  // the "Zillow" wordmark, and a small "Premier Agent" sub-line.
  //   - Zillow blue ≈ #1277E1
  return (
    <svg
      role="img"
      aria-label="Zillow Premier Agent"
      viewBox="0 0 268 90"
      width={200}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* House mark. */}
      <g transform="translate(6, 12)">
        <path d="M33 1 L65 23 V64 H1 V23 Z" fill="#1277E1" />
        {/* White "Z" cut. */}
        <path
          d="M18 27 H49 V36 L32 53 H49 V62 H18 V53 L35 36 H18 Z"
          fill="#ffffff"
        />
      </g>
      {/* Wordmark + sub-line. */}
      <text
        x="86"
        y="44"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="34"
        fontWeight="700"
        fill="#1277E1"
        letterSpacing="-0.5"
      >
        Zillow
      </text>
      <text
        x="87"
        y="66"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="15"
        fontWeight="600"
        fill="#5A6672"
        letterSpacing="0.5"
      >
        Premier Agent
      </text>
    </svg>
  )
}

/* ─── Houzz Pro ────────────────────────────────────────────────────── */

export const HouzzProLogo: FC = () => {
  // Simplified Houzz Pro lockup: the green "h" house mark + the "houzz"
  // wordmark and a gray "PRO".
  //   - Houzz green ≈ #4DBC15
  //   - Wordmark    ≈ #0B0B0B
  //   - "PRO" gray  ≈ #8A8F98
  return (
    <svg
      role="img"
      aria-label="Houzz Pro"
      viewBox="0 0 288 80"
      width={210}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Green blocky "h" mark. */}
      <g transform="translate(6, 14)" fill="#4DBC15">
        <rect x="0" y="0" width="13" height="52" rx="1.5" />
        <rect x="13" y="21" width="15" height="11" />
        <rect x="27" y="26" width="13" height="26" rx="1.5" />
      </g>
      {/* Wordmark. */}
      <text
        x="60"
        y="52"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill="#0B0B0B"
        letterSpacing="-1"
      >
        houzz
      </text>
      <text
        x="196"
        y="52"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="36"
        fontWeight="400"
        fill="#8A8F98"
        letterSpacing="1"
      >
        PRO
      </text>
    </svg>
  )
}

/* ─── SupraWeb Lockbox ─────────────────────────────────────────────── */

export const SupraLogo: FC = () => {
  // Simplified Supra lockup: the blue open-arc "(" wrapping the "Supra"
  // wordmark.
  //   - Supra blue ≈ #1C4E9E
  //   - Wordmark   ≈ #0B0B0B
  return (
    <svg
      role="img"
      aria-label="SupraWeb Lockbox"
      viewBox="0 0 208 80"
      width={170}
      style={wrapStyle}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue open arc. */}
      <path
        d="M52 10 a32 32 0 1 0 0 60"
        fill="none"
        stroke="#1C4E9E"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <text
        x="40"
        y="53"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="40"
        fontWeight="700"
        fill="#0B0B0B"
        letterSpacing="-1"
      >
        Supra
      </text>
    </svg>
  )
}

/* ─── registry ─────────────────────────────────────────────────────── */

export type PartnerLogoKey =
  | 'natmed'
  | 'prescriber-insights'
  | 'boojee'
  | 'docusign'
  | 'zillow-premier'
  | 'houzz-pro'
  | 'supra'

export const PARTNER_LOGOS: Record<PartnerLogoKey, FC> = {
  natmed: NatMedLogo,
  'prescriber-insights': PrescriberInsightsLogo,
  boojee: BoojeeLogo,
  docusign: DocuSignLogo,
  'zillow-premier': ZillowPremierLogo,
  'houzz-pro': HouzzProLogo,
  supra: SupraLogo,
}
