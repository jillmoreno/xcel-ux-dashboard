import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useTheme } from '@/context/ThemeContext'

/**
 * Shared "color wheel" for the Stacked Cards dashboard widgets. Each widget
 * exposes a per-widget flag (or, for the Current Learning Path, a secondary
 * axis on its width flag) whose value is one of these variants. `auto` is the
 * default: it resolves to `white` in light mode and `primary` in dark mode.
 */
export type WidgetColorVariant = 'auto' | 'white' | 'primary' | 'secondary' | 'none'

export type WidgetPalette = {
  /** Card background. */
  surface: string
  /** Full CSS `border` value (`'none'` for the surfaceless options). */
  border: string
  /** `true` for the dark bands (primary/secondary) — light-text treatment;
   *  consumers with their own accents (gauge, stat tiles) branch on this. */
  onDark: boolean
  eyebrow: string
  label: string
  value: string
  sub: string
  divider: string
}

// Dark band (primary/secondary): light text + translucent dividers/outline.
const LIGHT_ON_DARK = {
  onDark: true,
  eyebrow: 'rgb(255 255 255 / 0.7)',
  label: 'rgb(255 255 255 / 0.7)',
  value: 'var(--color-text-inverse)',
  sub: 'rgb(255 255 255 / 0.7)',
  divider: 'rgb(255 255 255 / 0.22)',
} as const
// Light surface / no surface (white/none): dark text on the neutral ramp.
const DARK_ON_LIGHT = {
  onDark: false,
  eyebrow: 'var(--color-text-secondary)',
  label: 'var(--color-text-secondary)',
  value: 'var(--color-neutral-darkest)',
  sub: 'var(--color-text-tertiary)',
  divider: 'var(--color-border-subtle)',
} as const

/** Resolved palettes (after `auto` is mapped to white/primary by theme). */
export const WIDGET_PALETTES: Record<string, WidgetPalette> = {
  white: { surface: 'var(--color-surface-card)', border: '1px solid var(--color-border-subtle)', ...DARK_ON_LIGHT },
  primary: { surface: 'var(--color-primary-800)', border: '1px solid rgb(255 255 255 / 0.22)', ...LIGHT_ON_DARK },
  secondary: { surface: 'var(--color-secondary-800)', border: '1px solid rgb(255 255 255 / 0.22)', ...LIGHT_ON_DARK },
  none: { surface: 'transparent', border: 'none', ...DARK_ON_LIGHT },
}

/** Map a raw flag value (possibly `auto`/undefined) to a concrete palette key.
 *  `auto` → `white` in light mode, `primary` in dark mode. */
export function resolveWidgetColor(variant: string | undefined, theme: string): string {
  const v = variant ?? 'auto'
  if (v === 'auto') return theme === 'dark' ? 'primary' : 'white'
  return v
}

/** Resolve a widget's color-wheel value (from `.variant` or `.secondaryVariant`)
 *  to a palette, honoring the theme-dependent `auto` default. */
export function useWidgetColor(variant: string | undefined): WidgetPalette {
  const { theme } = useTheme()
  return WIDGET_PALETTES[resolveWidgetColor(variant, theme)] ?? WIDGET_PALETTES.white
}

/** Convenience hook reading a per-widget color flag's primary variant. */
export function useWidgetColorFlag(flagKey: string): WidgetPalette {
  const variant = useFeatureFlag(flagKey).variant
  return useWidgetColor(variant)
}
