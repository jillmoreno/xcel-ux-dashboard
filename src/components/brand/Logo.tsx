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
  cre: {
    default: {
      src: '/brand/colibri-real-estate.svg',
      alt: 'Colibri Real Estate',
      nativeWidth: 233.75,
      nativeHeight: 40,
    },
    mark: {
      src: '/brand/colibri-mark.png',
      alt: 'Colibri Real Estate',
      nativeWidth: 165,
      nativeHeight: 143,
    },
  },
  // Sourced from Figma file Y6ooCQHBLhHGbK0cBY4O9O, node 30:7342.
  // Olive hummingbird + gray "McKissock Learning" wordmark, intrinsic
  // 1775×586 PNG.
  mckissock: {
    default: {
      src: '/brand/mckissock-learning.png',
      alt: 'McKissock Learning',
      nativeWidth: 1775,
      nativeHeight: 586,
    },
    // No mark-only variant in Figma yet — reuse the horizontal lockup as
    // a temporary stand-in. Replace when a square mark ships.
    mark: {
      src: '/brand/mckissock-learning.png',
      alt: 'McKissock Learning',
      nativeWidth: 1775,
      nativeHeight: 586,
    },
  },
  // Sourced from Figma file uFVpmgm9q9394Wl3Wiypbq, node 8003:1402.
  // Navy horse mark + "STC Securities Training by Colibri" wordmark in
  // navy, intrinsic 416×182 PNG (Figma reports 207.717×91 — exported at 2x).
  stc: {
    default: {
      src: '/brand/stc.png',
      alt: 'STC — Securities Training by Colibri',
      nativeWidth: 416,
      nativeHeight: 182,
      sizeBy: 'height',
    },
    mark: {
      src: '/brand/stc.png',
      alt: 'STC — Securities Training by Colibri',
      nativeWidth: 416,
      nativeHeight: 182,
      sizeBy: 'height',
    },
  },
  // Sourced from Figma Colibri Design System (U6vAvmQhpyPiVZ8V3dXPX4), node
  // 3799:1517 — the "Elite Learning Byline" color lockup (hummingbird + "Elite
  // Learning" wordmark + "by Colibri Healthcare" byline). Exported SVG with the
  // Figma frame artifacts stripped, intrinsic 229×72. Compact 3.17:1 aspect →
  // sized by height so it doesn't overflow the 72px header. No square mark in
  // the file yet — the mark variant reuses the lockup as a stand-in.
  elite: {
    default: {
      src: '/brand/elite-learning.svg',
      alt: 'Elite Learning',
      nativeWidth: 229,
      nativeHeight: 72,
      sizeBy: 'height',
      // White byline lockup for dark mode (Figma node 3799:1515 — the white
      // twin of the color 3799:1517 lockup, same 229×72) — shown only when
      // `[data-theme='dark']` is applied (the rebrand shell).
      dark: { src: '/brand/elite-learning-white.svg', nativeWidth: 229, nativeHeight: 72 },
    },
    mark: {
      src: '/brand/elite-learning.svg',
      alt: 'Elite Learning',
      nativeWidth: 229,
      nativeHeight: 72,
      sizeBy: 'height',
    },
  },
}

const WORDMARK_LABEL: Record<Brand, string> = {
  cre: 'Colibri Real Estate',
  mckissock: 'McKissock Learning',
  elite: 'Elite Learning',
  stc: 'STC',
  // No licensed FHEA mark wired yet — renders the text wordmark fallback.
  fitzgerald: 'Fitzgerald',
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
  const brand = brandProp ?? account?.brand ?? 'cre'

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
      const cre = IMAGE_SOURCES.cre!.default
      const w = Math.round((cre.nativeWidth / cre.nativeHeight) * height)
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
        letterSpacing: brand === 'stc' ? '0.04em' : 'normal',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
