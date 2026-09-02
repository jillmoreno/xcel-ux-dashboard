/**
 * The UX Dashboard's brand-token → palette bridge.
 *
 * The gateway page has its own `--ux-*` colour schemes rather than a brand's, so
 * a component styled on brand tokens draws the product's navy inside a green
 * page. These six mappings re-point the tokens such a component actually uses at
 * the palette. The archive table has needed them since it landed; QA Notes needs
 * them in two places, which is why they now live in a module of their own rather
 * than as a const inside the page.
 *
 * Applied as an inline style on a wrapper, so it reaches everything beneath it in
 * the DOM — including a portaled overlay, PROVIDED the `--ux-*` values it refers
 * to are in scope there. In-page that is automatic. For a portal to
 * `document.body` it is not, which is what `mirrorPaletteToRoot` is for.
 */
import type { CSSProperties } from 'react'

export const UX_TOKEN_BRIDGE = {
  '--color-surface-card': 'var(--ux-card)',
  '--color-neutral-50': 'var(--ux-bg)',
  '--color-border-subtle': 'var(--ux-border)',
  '--color-text-primary': 'var(--ux-text)',
  '--color-text-secondary': 'var(--ux-text-2)',
  '--color-text-tertiary': 'var(--ux-text-3)',
} as CSSProperties

/**
 * Mirror the active palette onto `document.documentElement`, returning a cleanup
 * that removes exactly what it set.
 *
 * The page applies its palette as inline custom properties on its own shell div,
 * which is right for everything rendered inside it. An overlay that portals to
 * `document.body` is not inside it, so `--ux-card` resolves to nothing there and
 * the bridge above silently falls back to the brand tokens — which is how the QA
 * detail sheet ended up as a light panel over a dark gateway (or, on a browser
 * with a stale `data-theme` from a rebrand visit, a brand-olive one).
 *
 * Mirroring rather than moving: the shell keeps its own inline copy, so in-page
 * rendering is unchanged and this only adds a scope the portal can reach. The
 * cleanup matters — a palette left on the root would outlive the page and leak
 * into every other route, which is the same class of bug as the stale
 * `data-theme` that hid this one.
 */
export function mirrorPaletteToRoot(vars: Record<string, string>): () => void {
  const root = document.documentElement
  const keys = Object.keys(vars).filter((k) => k.startsWith('--'))
  for (const k of keys) root.style.setProperty(k, vars[k])
  return () => {
    for (const k of keys) root.style.removeProperty(k)
  }
}
