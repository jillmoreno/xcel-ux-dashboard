import { useState } from 'react'
import { BookOpenRegular, Library, RubiLogo, Thumbtack } from '@/icons'
import {
  JEFF_MVP_QUESTION_SET as QS,
  JEFF_MVP_QUESTION_SET_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

/**
 * A PRACTICE QUESTION SET — 2026-11-09, the eleventh page ported. Reached
 * from a Practice row, or from the Readiness page's weakest sub-topic.
 *
 * ⚠ IT ASKS HOW SURE YOU ARE BEFORE IT WILL TAKE THE ANSWER. Picking an
 * option reveals "How sure are you?", and Submit stays disabled until both
 * are set. That is not a flourish: it is where the confidence on the Practice
 * and Flashcards pages COMES FROM. Those pages filter by a confidence the
 * learner declared here, rather than one inferred from their scores, and
 * skipping this step would leave both filters measuring nothing.
 *
 * ⚠ AND THE CONFIDENCE IS ANSWERED BACK. Wrong while "Very confident" adds
 * his `calib` line — "You were sure on this one, so it's worth a closer
 * look." Collected and used, not collected and filed.
 *
 * ⚠ THE EXPLANATION IS BEHIND A TOGGLE, not open on submit — the same
 * ask-before-telling shape his guided review uses.
 */
export function CompassJeffMvpQuestionSet({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)
  const [sure, setSure] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [explain, setExplain] = useState(false)
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  const canSubmit = picked !== null && sure !== null

  return (
    <div className="cjm-page">
      <CompassJeffMvpColumn>
        {/* ⚠ HIS CRUMB IS THE LINK ALONE — no separator, no current item. The
            page title is the h1 below it, once. Repeating it in the crumb
            says the same words twice in four lines. */}
        <nav className="cjm-crumb" aria-label="Breadcrumb">
          <button type="button" className="cjm-crumb__link" onClick={go('practice')}>
            {COPY.crumbRoot}
          </button>
        </nav>

        <header className="cjm-qs__head">
          <span className="cjm-qs__tile" aria-hidden>
            <Library size={20} />
          </span>
          <div style={{ minWidth: 0 }}>
            <h1 className="cjm-qs__title cjm-serif">{COPY.title}</h1>
            <p className="cjm-qs__meta">{COPY.meta}</p>
          </div>
          <div className="cjm-qs__headright">
            <button type="button" className="cjm-btn">
              {COPY.confidenceLabel}
            </button>
            <span className="cjm-qs__pos">{COPY.progressFmt(QS.pos, QS.total)}</span>
          </div>
        </header>

        <p className="cjm-qs__qline">{COPY.questionFmt(QS.pos, QS.total, COPY.setName)}</p>
        <p className="cjm-qs__stem">{QS.stem}</p>

        <div className="cjm-qs__opts" role="group" aria-label={QS.stem}>
          {QS.opts.map((o) => (
            <button
              key={o.key}
              type="button"
              aria-pressed={picked === o.key}
              className={`cjm-qs__opt${picked === o.key ? ' is-on' : ''}${
                submitted && o.key === QS.answerKey ? ' is-right' : ''
              }`}
              onClick={() => !submitted && setPicked(o.key)}
            >
              <span className="cjm-qs__key">{o.key}</span>
              {o.text}
            </button>
          ))}
        </div>

        {/* ⚠ ONLY AFTER AN OPTION IS PICKED — his `showSure`. Asking before
            there is an answer to be sure about would be asking about nothing. */}
        {picked && !submitted ? (
          <div className="cjm-qs__sure">
            <p className="cjm-qs__sureq">{COPY.sureQuestion}</p>
            <div className="cjm-qs__sureopts">
              {QS.sure.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  aria-pressed={sure === s.label}
                  className={sure === s.label ? 'cjm-btn cjm-btn--primary' : 'cjm-btn'}
                  onClick={() => setSure(s.label)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!submitted ? (
          <button
            type="button"
            className="cjm-cta cjm-qs__submit"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            onClick={() => setSubmitted(true)}
          >
            {COPY.submit}
          </button>
        ) : (
          <div className="cjm-qs__after">
            <p className="cjm-qs__fb">{QS.feedback}</p>
            <p className="cjm-qs__felt">
              {COPY.youFelt} <b>{sure}</b>
            </p>
            {explain ? (
              <div className="cjm-qs__explain">
                <p className="cjm-eyebrow">{COPY.explanationHeading}</p>
                <p className="cjm-card__text">{QS.why}</p>
              </div>
            ) : null}
            {/* ⚠ ASK RUBI IS ALWAYS THERE AFTER SUBMIT, not only once the
                explanation is open — it is the way OUT of the explanation,
                not a part of it. Nesting it inside the panel hid it in the
                state where a stuck learner most wants it. */}
            <div className="cjm-qs__actions">
              <button type="button" className="cjm-btn">
                <RubiLogo size={13} aria-hidden />
                {COPY.askRubi}
              </button>
              <button type="button" className="cjm-btn" onClick={() => setExplain(!explain)}>
                {explain ? QS.explainHide : QS.explainShow}
              </button>
              <button type="button" className="cjm-btn" onClick={go('learn')}>
                <BookOpenRegular size={13} aria-hidden />
                {COPY.reviewInCourse}
              </button>
              <button type="button" className="cjm-cta">
                {QS.nextLabel}
              </button>
            </div>
          </div>
        )}
      </CompassJeffMvpColumn>

      <WorkspaceRail />
    </div>
  )
}

/**
 * The three-tab workspace rail his session pages carry down the right edge —
 * Rubi, Notes, Bookmarks, each with a count.
 *
 * ⚠ IT IS THE COUNTS THAT MATTER HERE. The panel behind it is the Workspace,
 * which is Anjani's surface in this repo (`CompassWorkspace`) and a large
 * thing of its own; what his session pages show is the closed rail. Porting
 * the rail without the panel is the honest half — it is what a reviewer sees
 * on arrival, and it does not pretend to a drawer that is not built.
 */
export function WorkspaceRail() {
  const icon = (tab: string) => (tab === 'rubi' ? RubiLogo : tab === 'notes' ? BookOpenRegular : Thumbtack)
  return (
    <aside className="cjm-wsrail" aria-label="Workspace">
      {QS.railTabs.map((t) => {
        const Icon = icon(t.tab)
        return (
          <button key={t.tab} type="button" className="cjm-wsrail__tab" aria-label={t.aria}>
            <Icon size={16} aria-hidden />
            <span className="cjm-wsrail__count">{t.count}</span>
          </button>
        )
      })}
    </aside>
  )
}
