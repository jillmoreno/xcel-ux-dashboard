import type { CSSProperties } from 'react'

/**
 * XCEL'S PUBLIC FOOTER — extracted from `InvitedProductDetailPageV2` on
 * 2026-10-22, verbatim, when the guest journey grew two more pages that end in
 * the same footer.
 *
 * ⚠ EXTRACTED, NOT REBUILT. Every style below is the one that page already
 * carried, at the same numbers (the design's 240 gutter, the 284 main band, the
 * 61 legal bar). Three pages drawing three hand-copied footers is how a product
 * ends up with three slightly different ones, and this footer is the last thing
 * on every page of the guest walk.
 *
 * ⚠ V1 IS UNTOUCHED. `InvitedProductDetailPage` keeps its own inline copy —
 * it is the released build, and reaching into it to share a component with a
 * fork is exactly what the fork exists to avoid.
 */
export function XcelFooter() {
  return (
    <footer style={FOOTER}>
      <div style={FOOTER_MAIN}>
        <div style={FOOTER_BRAND}>
          <img src="/brand/xcel-logo.webp" alt="XCEL Insurance Training by Colibri" style={FOOTER_LOGO} />
          <ul style={SOCIAL}>
            <li>
              <img src="/brand/e2e-linkedin.svg" alt="XCEL on LinkedIn" width={24} height={24} style={{ display: 'block' }} />
            </li>
            <li>
              <img src="/brand/e2e-facebook.svg" alt="XCEL on Facebook" width={24} height={24} style={{ display: 'block' }} />
            </li>
          </ul>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title} style={{ ...FOOTER_COLUMN, width: col.width }}>
            <p style={FOOTER_HEADING}>{col.title}</p>
            <ul style={FOOTER_LINKS}>
              {col.links.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div style={LEGAL_BAR}>
        <ul style={LEGAL_LINKS}>
          <li style={{ color: 'color-mix(in srgb, var(--color-fixed-light) 70%, transparent)' }}>© 2026 XCEL Solutions</li>
          {['Terms of Service', 'Privacy Policy', 'Refund Policy', 'Cookie Policy', 'Manage Cookies'].map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </footer>
  )
}

/* The design's columns, at its widths (each column's left edge to the next). */
const FOOTER_COLUMNS: { title: string; width: number | string; links: string[] }[] = [
  { title: 'Training', width: 246.27, links: ['Get License', 'Continuing Education', 'Study Tools & Reviews', 'Securities Courses'] },
  { title: 'Resources', width: 214.14, links: ['Resource Center', 'State Requirements', 'Salary Guide'] },
  { title: 'Company', width: 214.14, links: ['About XCEL', 'Careers', 'Why Choose XCEL', 'Become a Partner'] },
  { title: 'Support', width: 'auto', links: ['Customer Support', 'Contact Us'] },
]

const FOOTER: CSSProperties = {
  borderTop: '2px solid var(--color-e2e-footer-rule)',
  background: 'var(--color-fixed-light)',
}

const FOOTER_MAIN: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  height: 284,
  boxSizing: 'border-box',
  padding: '40px 240px 0',
}

const FOOTER_BRAND: CSSProperties = {
  width: 354.14,
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const FOOTER_LOGO: CSSProperties = { display: 'block', width: 214.14, height: 78.57, objectFit: 'contain' }

const SOCIAL: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: 15 }

const FOOTER_COLUMN: CSSProperties = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 21,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 18,
  lineHeight: '27px',
  color: 'var(--color-text-primary)',
}

const FOOTER_HEADING: CSSProperties = { margin: 0, fontWeight: 800, textTransform: 'uppercase' }

const FOOTER_LINKS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  whiteSpace: 'nowrap',
}

const LEGAL_BAR: CSSProperties = {
  height: 61,
  boxSizing: 'border-box',
  padding: '20px 184px 0',
  background: 'var(--color-e2e-footer-bar)',
}

const LEGAL_LINKS: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  gap: 50,
  fontFamily: 'var(--font-e2e-avenir)',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-fixed-light)',
  whiteSpace: 'nowrap',
}
