import { type CSSProperties } from 'react'

/**
 * Non-component shared bits for the learning-setup hero + wizard (kept out of
 * the component files so react-refresh stays happy). The wizard step list + the
 * quick-select tile styles.
 */
export const SETUP_STEPS = [
  { k: 'goal', label: 'Your goal' },
  { k: 'license', label: 'License' },
  { k: 'details', label: 'About you' },
  { k: 'courses', label: 'Interests' },
  { k: 'style', label: 'How you learn' },
] as const

/** Icon / choice tile (goal + modality). */
export function tileStyle(selected: boolean, mod = false): CSSProperties {
  return {
    position: 'relative',
    textAlign: 'left',
    background: selected
      ? 'linear-gradient(180deg, var(--color-cta-100), var(--color-surface-card))'
      : 'var(--color-surface-card)',
    border: `1.6px solid ${selected ? 'var(--color-cta-500)' : 'var(--color-border-subtle)'}`,
    borderRadius: 'var(--radius-md)',
    padding: mod ? 13 : 15,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: mod ? 9 : 8,
    alignItems: 'flex-start',
    transition: 'border-color 0.14s ease, box-shadow 0.14s ease',
    boxShadow: selected ? '0 1px 2px rgb(9 35 72 / 0.05)' : 'none',
    font: 'inherit',
    color: 'inherit',
  }
}

/** Goal-step icon treatments (see the `setup-goal-layout` flag). */
export type GoalIconTreatment = 'size' | 'accent' | 'forward'

/**
 * Outer button style for a Goal-step tile, given the icon treatment + whether
 * the tiles are stacked (≤3 goals, one per row) vs. the compact 2×2 grid.
 * Extends the base `tileStyle`; the per-treatment inner content is rendered by
 * `<GoalTile>` in the wizard.
 */
export function goalTileStyle(
  selected: boolean,
  treatment: GoalIconTreatment,
  stacked: boolean,
): CSSProperties {
  const base = tileStyle(selected)
  if (treatment === 'accent') {
    // Room for the left accent rail; keep the column layout.
    return { ...base, paddingLeft: 18, gap: 7 }
  }
  if (treatment === 'forward') {
    return stacked
      ? { ...base, flexDirection: 'row', alignItems: 'center', gap: 16 }
      : { ...base, alignItems: 'center', textAlign: 'center', gap: 10, padding: 18 }
  }
  // size + position
  return stacked
    ? { ...base, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' }
    : base
}

/** Goal-tile title — one step larger than the base tile title so it reads as the
 *  primary label (esp. in the compact 4-up grid). */
export const goalTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.2,
  color: 'var(--color-text-primary)',
}

export const goalCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: 1.35,
  color: 'var(--color-text-secondary)',
}

/** Compact center-aligned tile (license type). */
export function compactTileStyle(selected: boolean): CSSProperties {
  return {
    position: 'relative',
    background: selected
      ? 'linear-gradient(180deg, var(--color-cta-100), var(--color-surface-card))'
      : 'var(--color-surface-card)',
    border: `1.6px solid ${selected ? 'var(--color-cta-500)' : 'var(--color-border-subtle)'}`,
    borderRadius: 'var(--radius-md)',
    padding: 14,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-heading)',
    fontSize: 14,
    fontWeight: 800,
    color: 'var(--color-text-primary)',
  }
}

/** Interest pill (interest-pills variant) — outline when unselected, filled navy
 *  when selected (matches the survey "What are your interests?" chips). */
export function pillStyle(selected: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 'var(--radius-pill)',
    border: `1.5px solid ${selected ? 'transparent' : 'var(--color-border-subtle)'}`,
    background: selected ? 'var(--color-primary-700)' : 'var(--color-surface-card)',
    color: selected ? 'var(--color-text-inverse)' : 'var(--color-text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.14s ease, border-color 0.14s ease',
  }
}

/** Course shelf card (courses of interest). */
export function courseTileStyle(selected: boolean): CSSProperties {
  return {
    position: 'relative',
    textAlign: 'left',
    border: `1.6px solid ${selected ? 'var(--color-cta-500)' : 'var(--color-border-subtle)'}`,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: 'var(--color-surface-card)',
    cursor: 'pointer',
    padding: 0,
    transition: 'border-color 0.14s ease, box-shadow 0.14s ease',
    font: 'inherit',
    color: 'inherit',
    display: 'block',
  }
}
