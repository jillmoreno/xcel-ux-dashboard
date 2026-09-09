import { useContext } from 'react'
import { AccountContext, type Brand } from '@/context/AccountContext'

/**
 * Multi-brand logo. Reads the active brand from AccountContext (or accepts
 * an explicit `brand` prop — used inside the Switch Account panel where we
 * preview the target brand's mark, not the active one).
 *
 *  - 'default' variant — horizontal mark + wordmark.
 *  - 'mark' variant — square mark only, used inside the cert viewer.
 *
 * **XCEL ships the real lockup as of 2026-09-09** (`/brand/xcel-logo.webp`).
 * It rendered the text wordmark until then; the wordmark is still the fallback
 * for any variant with no artwork — see `IMAGE_SOURCES` and `WORDMARK_LABEL`.
 *
 * KNOWN GAP — the DARK header. The lockup is full-colour: charcoal wordmark
 * (#3a3a3a) over a red knight (#9a1b1e), which measures 11.37:1 and 8.24:1 on
 * white and **1.33:1 and 1.84:1** on the rebrand shell's dark header
 * (#152833). It is effectively invisible there.
 *
 * That is NOT a regression this introduced — the text wordmark it replaced sat
 * on `--color-brand`, which is #2d5872 in dark, i.e. **1.99:1** on the same
 * header. Dark mode has never had a legible logo; the lockup makes an existing
 * hole marginally deeper rather than digging a new one, which is why it is
 * recorded here instead of being papered over.
 *
 * The fix is the WHITE variation the brand library ships, dropped in as the
 * `dark` source below — the mechanism is already built and needs no code. Do
 * NOT recolour the full-colour file to approximate it: that is authoring brand
 * artwork, and an official white lockup already exists.
 */
type LogoProps = {
  variant?: 'default' | 'mark'
  /** Height in px. Width auto-scales for the image variant; the text
   *  wordmark variant scales font-size against this. */
  height?: number
  className?: string
  /** Override brand. Defaults to the active brand from AccountContext. */
  brand?: Brand
}

type ImageSource = {
  src: string
  alt: string
  nativeWidth: number
  nativeHeight: number
  /**
   * Defaults to `'creWidth'` — render at the same width as CRE's lockup so
   * taller-aspect logos like McKissock visually balance with CRE. Set to
   * `'height'` for compact-aspect logos (like STC's 2.29:1) where width-
   * matching makes them blow out fixed-height surfaces like the 72px header.
   */
  sizeBy?: 'creWidth' | 'height'
  /**
   * Optional white/light lockup for dark surfaces. When present, the Logo
   * renders BOTH this and the default mark and CSS swaps them on the applied
   * `[data-theme='dark']` (set only by the Dashboard Rebrand shell), so the
   * swap tracks the *rendered* theme — not the global preference, which may be
   * `dark` while a non-rebrand page still renders light.
   */
  dark?: { src: string; nativeWidth: number; nativeHeight: number }
}

const IMAGE_SOURCES: Partial<
  Record<Brand, Partial<Record<'default' | 'mark', ImageSource>>>
> = {
  xcel: {
    // The approved 2024 lockup, `XCEL24_Logo_RGB_45px-2x` from the Colibri
    // Logo Library — the @2x export of the 45px web size, so 248×91 here is
    // twice the intended render. Only the ratio is read (see `dims`).
    //
    // A RASTER webp, not an SVG, because that is the export that exists. It is
    // 2.3KB and crisp to ~124px wide, which covers every call site; the vector
    // is worth swapping in if the lockup ever needs to go large.
    //
    // NOTE the `mark` variant is deliberately absent. It is the standalone
    // "White Knight" icon, a different piece of artwork that is not in the
    // repo — and the record is Partial precisely so the lockup could land
    // without one. A `variant="mark"` render falls through to the text
    // wordmark; nothing in this repo asks for it today.
    default: {
      src: '/brand/xcel-logo.webp',
      alt: 'XCEL Insurance Training by Colibri',
      nativeWidth: 248,
      nativeHeight: 91,
      // `height`, NOT `creWidth` — this is exactly the case the `sizeBy` doc
      // warns about. At the header's 52px, width-matching CRE would render
      // this 304×112, three-and-a-half times the 72px header's own height.
      // Sizing by height gives 142×52, which also clears the brand guide's
      // 95px minimum WIDTH. See the note on the mobile height in `Header`.
      sizeBy: 'height',
    },
  },
}

/**
 * Width-reference aspect ratio for `sizeBy: 'creWidth'`.
 *
 * The LMS sized width-matched lockups against CRE's own (233.75 × 40), so a
 * taller-aspect mark rendered at the same WIDTH as CRE rather than the same
 * height. CRE's entry is gone with the other five brands, but the ratio it
 * supplied was the layout constant — inlining it keeps a future XCEL lockup
 * sizing exactly as it would have, instead of silently changing scale the day
 * the asset lands. Rename the `sizeBy` value if that reference ever moves.
 */
const REFERENCE_LOCKUP_ASPECT = 233.75 / 40

const WORDMARK_LABEL: Record<Brand, string> = {
  // The full-colour lockup landed 2026-09-09, so this is now the FALLBACK
  // rather than what XCEL renders — reached only by a variant with no artwork
  // (today: `mark`).
  //
  // TODO(brand): two of the three approved assets are still missing, both in
  // the Logo Library at brand.colibrigroup.com/d/gViDk8vkfnm2/logo-library:
  //   - the WHITE variation, which goes in as the `dark` source and is what
  //     fixes the dark header (see the file header's KNOWN GAP);
  //   - the standalone "White Knight" icon, which goes in as `mark` and which
  //     the guide also blesses as a watermark.
  // The 95px minimum WIDTH from that guide is already load-bearing — it is why
  // `MOBILE_LOGO_HEIGHT` in Header is 35 and not 34. Clearspace = the height
  // of "Insurance Training".
  xcel: 'XCEL',
}

export function Logo({ variant = 'default', height = 40, className, brand: brandProp }: LogoProps) {
  // Logo is a leaf consumer rendered in many contexts (Header, modals,
  // cert viewer prints). Read context directly so isolated tests that
  // mount Logo without an AccountProvider fall back to CRE rather than
  // throw. App code always has the provider; only test mounts skip it.
  const account = useContext(AccountContext)
  const brand = brandProp ?? account?.brand ?? 'xcel'

  const imageSet = IMAGE_SOURCES[brand]
  const entry = imageSet?.[variant]
  // A brand may ship the lockup and not the square mark (XCEL does). Falling
  // through to the text wordmark for the missing variant is deliberate — the
  // alternative, pointing `mark` at the lockup, would silently render a wide
  // horizontal logo everywhere a square one was asked for.
  if (entry) {
    const { src, alt, sizeBy = 'creWidth', dark } = entry
    // Rendered px for a given native size, honoring `sizeBy`:
    //  - 'height' → honor `height` literally (compact lockups like STC/Elite);
    //  - 'creWidth' → match CRE's rendered width so taller-aspect marks
    //    (McKissock) don't shrink next to CRE in the same surface.
    const dims = (nw: number, nh: number) => {
      const aspect = nw / nh
      if (sizeBy === 'height') return { w: Math.round(aspect * height), h: height }
      const w = Math.round(REFERENCE_LOCKUP_ASPECT * height)
      return { w, h: Math.round(w / aspect) }
    }
    const light = dims(entry.nativeWidth, entry.nativeHeight)

    // Brands with a dark lockup (Elite) render both; CSS swaps them on the
    // applied `[data-theme='dark']`. `cre-logo--light` carries inline
    // display:block (whitespace-free) and is hidden in dark; `cre-logo--dark`
    // is hidden by default and shown in dark.
    if (dark) {
      const d = dims(dark.nativeWidth, dark.nativeHeight)
      const cls = (mod: string) => (className ? `${mod} ${className}` : mod)
      return (
        <>
          <img
            src={src}
            alt={alt}
            width={light.w}
            height={light.h}
            className={cls('cre-logo--light')}
            style={{ display: 'block' }}
          />
          <img
            src={dark.src}
            alt={alt}
            width={d.w}
            height={d.h}
            className={cls('cre-logo--dark')}
          />
        </>
      )
    }

    return (
      <img
        src={src}
        alt={alt}
        width={light.w}
        height={light.h}
        className={className}
        style={{ display: 'block' }}
      />
    )
  }

  // Text wordmark — the fallback for a variant with no artwork. XCEL's
  // `default` ships a real lockup above; only `mark` reaches this now.
  const label = WORDMARK_LABEL[brand]
  // Scale the type roughly to the requested height. 0.6 keeps the line
  // height shorter than the bounding box so the wordmark visually centers.
  const fontSize = Math.round(height * 0.6)
  return (
    <span
      className={className}
      aria-label={label}
      role="img"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height,
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        color: 'var(--color-brand)',
        letterSpacing: 'normal',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
