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
 * CRE, McKissock, Elite, and STC ship real licensed marks under /public/brand/.
 * Fitzgerald and XCEL have no artwork in the repo yet and fall back to the text
 * wordmark (`WORDMARK_LABEL`) — see the note on each entry.
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

const IMAGE_SOURCES: Partial<Record<Brand, Record<'default' | 'mark', ImageSource>>> = {
  // Empty: XCEL has no lockup in the repo yet, so every render falls through to
  // the text wordmark below. The image branch is kept rather than deleted —
  // see the TODO on WORDMARK_LABEL; dropping the assets in here is meant to be
  // the whole change.
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
  // TODO(brand): XCEL's real assets exist and are approved — the full-colour
  // lockup, a WHITE variation for dark/brand backgrounds (the `dark` source,
  // same mechanism Elite uses), and a standalone "White Knight" icon (the
  // `mark` source, which the guide also blesses as a watermark). They live in
  // the Logo Library at brand.colibrigroup.com/d/gViDk8vkfnm2/logo-library and
  // are not in this repo, so XCEL falls back to the text wordmark for now.
  // When wiring them: the minimum web size is 95px on WIDTH, which can fight
  // the 72px header that makes STC/Elite use `sizeBy: 'height'` — measure
  // before choosing. Clearspace = the height of "Insurance Training".
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
  if (imageSet) {
    const entry = imageSet[variant]
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

  // Fitzgerald + XCEL — text wordmarks until licensed artwork is wired.
  // (Elite and STC used to be here and now ship real marks above.)
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
