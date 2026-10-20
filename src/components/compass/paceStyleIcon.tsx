import { GaugeLight, GaugeSolid, GaugeThin } from '@/icons'
import type { StudyStyle } from '@/lib/studyPace'

/**
 * THE PACE'S GLYPH — 2026-10-20, Jillienne: "we need to incorporate a
 * different icon based on the Pacing."
 *
 * ⚠ THIS IS AN INTERIM, AND THE REASON IS A LICENCE RULE RATHER THAN A DESIGN
 * ONE. The icon that should carry this is one gauge with the NEEDLE in three
 * positions — `gauge-low` / `gauge` / `gauge-high`, Font Awesome Pro Light —
 * because the pace is a scale and the needle is the part of a gauge that means
 * "how much". Those two files are not vendored, and `.font-awesome.md` is
 * explicit that SVGs are "fetched from the Font Awesome API, never hand-drawn
 * or reconstructed" (`fa icons --name gauge-low ...`, which needs `fa login`).
 * Reconstructing them from the `gauge-thin` path would be inventing licensed
 * artwork, so it is not done here.
 *
 * WHAT IT DOES INSTEAD, and it is a real scale rather than a placeholder: the
 * three gauge WEIGHTS already vendored — Thin, Light, Solid — read as light to
 * heavy, which is the same axis the needle would carry. The silhouette does
 * not change between states, so the card does not jump, and swapping to needle
 * positions is this one map.
 *
 * TO FINISH IT:
 *   fa icons --json --version 7.3.1 --name gauge-low  --svg-format html --svg-family-style classic,light
 *   fa icons --json --version 7.3.1 --name gauge-high --svg-format html --svg-family-style classic,light
 * vendor both into `src/icons/`, register them in `src/icons/index.tsx` beside
 * `GaugeLight`, and change the three entries below. Nothing else moves.
 *
 * ⚠ THE NEEDLE MAPS TO NIGHTLY INTENSITY, not to thoroughness, and the two run
 * opposite ways — `PLANNER_PACES` puts Crammer at 150 minutes a night and
 * Thorough at 60. A gauge beside "about 13 hours / week" is read as how hard
 * each evening is, so Crammer is the heavy end. Mapping it the other way would
 * be defensible and would contradict the figure next to it.
 */
export function paceIconFor(style: StudyStyle, size = 33) {
  switch (style) {
    case 'crammer':
      return <GaugeSolid size={size} aria-hidden />
    case 'thorough':
      return <GaugeThin size={size} aria-hidden />
    default:
      return <GaugeLight size={size} aria-hidden />
  }
}
