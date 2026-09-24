import { CompassRubiRail } from '@/components/compass/CompassRubiRail'

/**
 * The adapter for the Compass Rubi right rail on the ONE page that shows it
 * today (2026-09-23): the Atlas/Compass version's Course page, beside the
 * course content and under the player controls bar. The copy is the design's
 * (Figma 49:3053). The rail itself is `components/compass/CompassRubiRail`.
 */
const RUBI_GREETING =
  "Ask me anything about this chapter — I'll keep it grounded in what you're studying."
const RUBI_SUGGESTIONS = ['Give an example', 'Explain simpler', 'Quiz me'] as const

export function AtlasCompassRubiRail({
  open,
  stickyTop,
  onClose,
}: {
  open: boolean
  stickyTop: number
  onClose: () => void
}) {
  return (
    <CompassRubiRail
      open={open}
      stickyTop={stickyTop}
      greeting={RUBI_GREETING}
      suggestions={RUBI_SUGGESTIONS}
      onClose={onClose}
    />
  )
}
