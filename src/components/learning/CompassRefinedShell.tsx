import { CompassRefinedRail, CompassRefinedPending } from './CompassRefinedChrome'
import { CompassRefinedReadiness } from './CompassRefinedReadiness'
import { CompassReadinessRefined, type RefinedHeroStyle } from './CompassReadinessRefined'
import { CompassRefinedLearn } from './CompassRefinedLearn'
import { CompassRefinedOverview } from './CompassRefinedOverview'
import { CompassRefinedPractice } from './CompassRefinedPractice'
import { CompassRefinedPrep } from './CompassRefinedPrep'
import { CompassRefinedPlanner } from './CompassRefinedPlanner'
import { CompassRefinedFlashcards } from './CompassRefinedFlashcards'
import { CompassRefinedSimulator } from './CompassRefinedSimulator'
import { CompassRefinedFlashcardTopic } from './CompassRefinedFlashcardTopic'
import { CompassRefinedExamSession } from './CompassRefinedExamSession'
import { CompassRefinedQuestionSet } from './CompassRefinedQuestionSet'
import { CompassRefinedCardStudy } from './CompassRefinedCardStudy'
import { CompassJeffCourse } from './CompassJeffCourse'
import { refinedSourceFor } from './compassRefinedPages'
import type { JeffMvpPage } from '@/data/compassJeffMvpFixtures'
/* ⚠ HIS STYLESHEET, BECAUSE MOST SLOTS ARE STILL HIS. It leaves when the
   last slot does; a forked page brings its own and uses none of it. */
import './compassRefined.css'

/**
 * THE REFINED COMPASS — its own shell, 2026-11-10.
 *
 * ⚠ IT RENDERS IDENTICALLY TO JEFF'S THE DAY IT LANDS, and that is the whole
 * design of this change. Every slot in `REFINED_PAGE_SOURCE` starts at
 * `jeff` except Readiness, which was already Refined's, so this is a pure
 * refactor: `CompassRefinedShell.test.tsx` pins that the two shells draw the
 * same pages until a slot is deliberately flipped.
 *
 * ⚠ WHY IT EXISTS AT ALL, when a shell that draws another shell's pages looks
 * like indirection for its own sake. Before this, Refined WAS
 * `CompassJeffMvpShell` with one prop set — so there was no file a Refined
 * page could be edited in. Jillienne's ask on 2026-11-10 was to select a
 * component on the Refined version and change it "without affecting Jeffs",
 * and that is not a change to a component: it is the absence of a seam. This
 * is the seam.
 *
 * ⚠ IT IS NOT A COPY OF HIS SHELL. The takeover rules, the rail and every
 * page come from his modules until a slot says otherwise — forking the shell
 * wholesale would have duplicated his two takeover decisions (the simulated
 * exam and the lesson render without the rail) into a second place to keep in
 * step, which is the cost the fork rule asks you to weigh, not a cost to pay
 * by default.
 *
 * ⚠ THE `crf` CLASS IS A MARKER, NOT AN OVERRIDE HOOK, and it has no rules
 * of its own. It was briefly the hook for Refined-only CSS written against
 * his classes (`.crf .cjm-head { … }`); that approach went the same day,
 * when the styles were decided to FREEZE on fork instead — a forked page
 * takes its own prefix and its own stylesheet on house Compass tokens, the
 * way `CompassReadinessRefined` already does, so there is nothing of his
 * left to override. See `compassRefinedPages.ts` for the rule and why.
 *
 * What the class is still for: saying in the DOM which shell drew the page,
 * which is what the inert-refactor test strips before comparing the two.
 */
export function CompassRefinedShell({
  page,
  onSelectPage,
  readinessHero,
}: {
  page: JeffMvpPage
  onSelectPage: (p: JeffMvpPage) => void
  /** `compass-refined-readiness-hero`, read by `CompassLearningPage` and
   *  passed down so this shell stays a plain function of its props. */
  readinessHero?: RefinedHeroStyle
}) {
  /* ⚠ THE TWO TAKEOVERS ARE HIS DECISIONS AND ARE READ FIRST, before the rail
     is drawn — the simulated exam is imitating a Pearson VUE test centre and
     the lesson is a full-window player, so neither may render beside a
     Compass rail. Refined inherits both until it says otherwise, which is
     what the slot map is for. */
  if (page === 'course') {
    return (
      <div className="crf crf-shell">
        <CompassJeffCourse onExit={() => onSelectPage('learn')} />
      </div>
    )
  }
  if (page === 'exam-session') {
    return (
      <div className="crf crf-shell">
        <CompassRefinedExamSession onSelectPage={onSelectPage} />
      </div>
    )
  }

  return (
    <div className="crf crf-shell">
      <CompassRefinedRail page={page} onSelectPage={onSelectPage} />
      <RefinedPage page={page} onSelectPage={onSelectPage} readinessHero={readinessHero} />
    </div>
  )
}

/**
 * ONE SLOT, RESOLVED.
 *
 * ⚠ THE SOURCE IS READ PER PAGE, not once for the shell. "Refined" is a
 * composition — four rail rows have a real choice between the two designers
 * and the rest have one source — so a single whose-version switch at the top
 * would be the thing this change exists to replace.
 */
function RefinedPage({
  page,
  onSelectPage,
  readinessHero,
}: {
  page: JeffMvpPage
  onSelectPage: (p: JeffMvpPage) => void
  readinessHero?: RefinedHeroStyle
}) {
  const source = refinedSourceFor(page)

  if (page === 'readiness') {
    /* The one slot that is Refined's today. His page stays reachable from
       here, so a flip back is a map edit rather than a revert. */
    return source === 'refined' ? (
      <CompassReadinessRefined hero={readinessHero} onSelectPage={onSelectPage} />
    ) : (
      <CompassRefinedReadiness onSelectPage={onSelectPage} />
    )
  }

  /* ⚠ EVERY OTHER SLOT IS HIS, and the exhaustive branch below is deliberate
     rather than a lookup table: when a page forks, the diff shows one arm
     added next to the component it replaces, which is where a reader looks
     for "what did Refined change here?". */
  switch (page) {
    case 'learn':
      return <CompassRefinedLearn onSelectPage={onSelectPage} />
    case 'overview':
      return <CompassRefinedOverview onSelectPage={onSelectPage} />
    case 'practice':
      return <CompassRefinedPractice onSelectPage={onSelectPage} />
    case 'prep-review':
      return <CompassRefinedPrep />
    case 'study-planner':
      return <CompassRefinedPlanner />
    case 'flashcards':
      return <CompassRefinedFlashcards onSelectPage={onSelectPage} />
    case 'exam-simulator':
      return <CompassRefinedSimulator onSelectPage={onSelectPage} />
    case 'flashcard-topic':
      return <CompassRefinedFlashcardTopic onSelectPage={onSelectPage} />
    case 'practice-session':
      return <CompassRefinedQuestionSet onSelectPage={onSelectPage} />
    case 'flashcard-study':
      return <CompassRefinedCardStudy onSelectPage={onSelectPage} />
    default:
      return <CompassRefinedPending page={page} />
  }
}
