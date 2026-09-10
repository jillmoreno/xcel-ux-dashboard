/**
 * Types for `ReadinessScoreGauge`. Split out because the component file is
 * long and these are imported by consumers and tests; the rest of this repo
 * keeps types inline, so this is the exception rather than a new convention.
 */

export type ReadinessStatus = 'onTrack' | 'atRisk' | 'offTrack'

export type StatusBand = {
  status: ReadinessStatus
  /** Chip label, e.g. 'AT RISK'. Rendered as authored. */
  label: string
  /** A score at or above this value enters this band. Absolute, same scale as
   *  `score` — NOT a percentage of the range, so it survives a custom
   *  `min`/`max`. */
  min: number
}

export type ReadinessScoreGaugeProps = {
  /** Current score. `null` renders the no-score state. */
  score: number | null
  /** Score required to pass. Drives the tick position AND the band split. */
  passingScore: number
  /** Scale bounds. */
  min?: number
  max?: number
  /** Eyebrow text; rendered uppercase via CSS so the prop stays readable. */
  label?: string
  /** Sub-label formatter. Default: `${passingScore} to pass`. */
  formatSubLabel?: (passingScore: number, score: number | null) => string
  /** Status bands, evaluated highest `min` first. Defaults derive from
   *  `passingScore` — see `defaultBands`. */
  bands?: StatusBand[]
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  animate?: boolean
  className?: string
}
