import { CompassRefinedJourney } from './CompassRefinedJourney'
import type { FocusOptions } from './compassRefinedFocusModel'
import { CompassRefinedPrepPage } from './CompassRefinedPrepPage'
import { seriesOf } from './compassReadinessModel'
import './compassRefinedJourney.css'

/**
 * THE READINESS PROTOTYPE'S OVERVIEW — which of his two pages a stage draws.
 *
 * ⚠ THE STAGE PICKS THE PAGE, as it does in his own prototype: a `p` stage is
 * "Your exam prep", a `q` or `u` stage is "Your learning journey". They are
 * not two skins of one page — they are the two answers to whether Readiness
 * is a phase after the course or a signal running beside it, which is the
 * decision this port exists to let people make.
 */
export function CompassRefinedStageOverview({
  stage = 'p2',
  focus,
}: {
  stage?: string
  /** The first widget's open decisions — see `FocusOptions`. */
  focus?: FocusOptions
}) {
  const series = seriesOf(stage)
  if (series === 'prep') return <CompassRefinedPrepPage stage={stage} />
  return <CompassRefinedJourney stage={stage} focus={focus} />
}
