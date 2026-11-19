import { useState } from 'react'
import { ArrowLeft, Check, Flag, RubiLogo, X } from '@/icons'
import {
  JEFF_MVP_EXAM_SESSION as EX,
  JEFF_MVP_EXAM_SESSION_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import './compassRefined.css'

type Screen = 'intro' | 'terms' | 'tut' | 'exam' | 'done' | 'results' | 'review'

/**
 * THE SIMULATED EXAM — 2026-11-09, the eleventh page ported and the one that
 * deliberately stops looking like Compass.
 *
 * Nine screens: intro, terms, three tutorial pages, the exam, done, results,
 * guided review. It is a rehearsal of a Pearson VUE sitting, so it borrows
 * that chrome — its own dark bar, its own green question list, its own timer
 * — and drops the Compass rail entirely. That contrast IS the design: the
 * point of a simulator is that test day does not feel like the app you
 * revised in.
 *
 * ⚠ IT TAKES OVER THE WHOLE SURFACE, rail included. Every other page of his
 * MVP renders beside the Compass rail; this one must not, or the illusion it
 * is built to create breaks on the first screen. The shell renders it outside
 * the rail for that reason.
 *
 * ⚠ THE RESULTS ARE HELD BACK ON PURPOSE. Finishing lands on a screen that
 * says the score is withheld "just like the real wait", behind a Reveal link.
 * Collapsing that into the results screen would remove the one beat the
 * simulation is imitating.
 *
 * ⚠ THE REVIEW ASKS BEFORE IT EXPLAINS. Each question opens with a prompt —
 * "Could you explain to a client why the other three don't fit?" — and the
 * explanation stays behind "Walk me through it". Showing both at once turns a
 * tutor into a mark scheme.
 *
 * ⚠ THE PREVIEW IS DETERMINISTIC: his "Skip to results" fills a fixed
 * nineteen-answer array, scoring 6/19. That is what makes the results and
 * review screens checkable against his render at all.
 */
export function CompassRefinedExamSession({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [screen, setScreen] = useState<Screen>('intro')
  const [agree, setAgree] = useState(false)
  const [tutPage, setTutPage] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const exit = () => onSelectPage?.('exam-simulator')

  return (
    <div className="cjm crf-vx">
      {/* His vendor bar, on every screen. */}
      <header className="crf-vx__bar">
        <button type="button" className="crf-vx__exit" onClick={exit}>
          <X size={13} aria-hidden />
          {COPY.exitLabel}
        </button>
        <span className="crf-vx__title">{COPY.shellTitle}</span>
        <span className="crf-vx__provider">{EX.providerName}</span>
      </header>

      {screen === 'intro' ? (
        <Intro onBegin={() => setScreen('terms')} />
      ) : screen === 'terms' ? (
        <Terms agree={agree} setAgree={setAgree} onContinue={() => setScreen('tut')} />
      ) : screen === 'tut' ? (
        <Tutorial
          page={tutPage}
          onBack={() => (tutPage === 0 ? setScreen('terms') : setTutPage(tutPage - 1))}
          onNext={() => (tutPage === 2 ? setScreen('exam') : setTutPage(tutPage + 1))}
        />
      ) : screen === 'exam' ? (
        <Exam onSkip={() => setScreen('done')} onFinish={() => setScreen('done')} />
      ) : screen === 'done' ? (
        <Done onReveal={() => setScreen('results')} />
      ) : screen === 'results' ? (
        <Results onReview={() => setScreen('review')} onDone={exit} />
      ) : (
        <Review
          revealed={revealed}
          onReveal={() => setRevealed(true)}
          onBack={() => setScreen('results')}
          onDone={exit}
        />
      )}
    </div>
  )
}

/* ---------------- intro ---------------- */

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="crf-vx__page">
      <div className="crf-vx__intro">
        <div className="crf-vx__intromain">
          <p className="crf-eyebrow">{COPY.introEyebrow}</p>
          <h1 className="crf-h1">{COPY.introTitle}</h1>
          <p className="crf-lead">{COPY.introLead}</p>

          <h2 className="crf-vx__h2">{COPY.treatHeading}</h2>
          <ul className="crf-vx__bullets">
            {COPY.treatBullets.map((b) => (
              <li key={b}>
                <Check size={14} aria-hidden />
                {b}
              </li>
            ))}
          </ul>

          <h2 className="crf-vx__h2">{COPY.expectHeading}</h2>
          <p className="crf-vx__note">{COPY.blueprintNote}</p>
          <ul className="crf-vx__blueprint">
            {EX.blueprint.map((b) => (
              <li key={b.name}>
                <span className="crf-vx__bpname">{b.name}</span>
                <span className="crf-vx__bptrack" aria-hidden>
                  <span className="crf-vx__bpfill" style={{ width: b.w }} />
                </span>
                <span className="crf-vx__bppct">{b.pct}%</span>
              </li>
            ))}
          </ul>
          <ul className="crf-vx__bullets">
            {COPY.expectBullets.map((b) => (
              <li key={b}>
                <Check size={14} aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <aside className="crf-vx__glance">
          <p className="crf-eyebrow">{COPY.glanceHeading}</p>
          <dl>
            {COPY.glance.map((g) => (
              <div key={g.label}>
                <dt>{g.label}</dt>
                <dd>{g.value}</dd>
              </div>
            ))}
          </dl>
          <button type="button" className="crf-cta" onClick={onBegin}>
            {COPY.beginExam}
          </button>
          {/* ⚠ HIS OWN DISCLAIMER: the glance says 100 questions and the
              simulator serves 19. He says so rather than hiding it. */}
          <p className="crf-vx__proto">{COPY.prototypeNote}</p>
        </aside>
      </div>
    </div>
  )
}

/* ---------------- terms ---------------- */

function Terms({
  agree,
  setAgree,
  onContinue,
}: {
  agree: boolean
  setAgree: (v: boolean) => void
  onContinue: () => void
}) {
  return (
    <div className="crf-vx__page">
      <div className="crf-vx__dialog" role="dialog" aria-label={COPY.termsTitle}>
        <h1 className="crf-vx__h1">{COPY.termsTitle}</h1>
        <p className="crf-vx__note">{COPY.termsLead}</p>
        <div className="crf-vx__nda" role="region" aria-label={COPY.ndaHeading} tabIndex={0}>
          <h2 className="crf-vx__h2">{COPY.ndaHeading}</h2>
          {COPY.ndaParas.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {/* ⚠ A BUTTON WITH role="checkbox", as his is — not an input. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={agree}
          className="crf-vx__agree"
          onClick={() => setAgree(!agree)}
        >
          <span className={agree ? 'crf-vx__box is-on' : 'crf-vx__box'} aria-hidden>
            {agree ? <Check size={12} /> : null}
          </span>
          {COPY.agreeLabel}
        </button>
        <div className="crf-vx__dialogfoot">
          <button type="button" className="crf-cta" disabled={!agree} aria-disabled={!agree} onClick={onContinue}>
            {COPY.continueLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- the vendor shell ---------------- */

function VendorShell({
  top,
  sub,
  timer,
  children,
  nav,
  foot,
}: {
  top: string
  sub: string
  timer: { label: string; text: string }
  children: React.ReactNode
  nav: React.ReactNode
  foot: React.ReactNode
}) {
  return (
    <div className="crf-vx__shell">
      <div className="crf-vx__shellbar">
        <span className="crf-vx__shelltop">{top}</span>
        <span className="crf-vx__shellsub">{sub}</span>
        <span className="crf-vx__timer">
          <span>{timer.label}</span>
          <b>{timer.text}</b>
        </span>
        <button type="button" className="crf-vx__finish">
          {COPY.finishTest}
        </button>
      </div>
      <div className="crf-vx__body">
        <aside className="crf-vx__nav">
          <p className="crf-vx__navtest">{COPY.testLine}</p>
          <p className="crf-vx__navcand">{COPY.candidate}</p>
          {nav}
        </aside>
        <main className="crf-vx__main">{children}</main>
      </div>
      <div className="crf-vx__foot">{foot}</div>
    </div>
  )
}

function Tutorial({ page, onBack, onNext }: { page: number; onBack: () => void; onNext: () => void }) {
  const t = EX.tutorial[page]
  return (
    <VendorShell
      top={t.top}
      sub="Section: Introduction"
      timer={EX.timerIntro}
      nav={
        <ol className="crf-vx__pages">
          {EX.tutorial.map((p, i) => (
            <li key={p.title} className={i === page ? 'is-on' : undefined}>
              Page {i + 1}
            </li>
          ))}
        </ol>
      }
      foot={
        <>
          <button type="button" className="crf-vx__navbtn" onClick={onBack}>
            {COPY.back}
          </button>
          <button type="button" className="crf-vx__navbtn" onClick={onNext}>
            {page === 2 ? COPY.startTest : COPY.next}
          </button>
        </>
      }
    >
      <h2 className="crf-vx__h2">{t.title}</h2>
      {t.paras.map((p) => (
        <p key={p} className="crf-vx__para">
          {p}
        </p>
      ))}
      {/* ⚠ EACH PAGE SHOWS THE CONTROL IT IS DESCRIBING, in the body — the
          nav buttons, then the clock, then the flag. The footer below is a
          plain Back / Next throughout. A tutorial that tells you about a
          button without showing it is just prose. */}
      {page === 0 ? (
        <p className="crf-vx__demo">
          <span className="crf-vx__navbtn">{COPY.demoBackArrow}</span>
          <span className="crf-vx__navbtn">{COPY.demoNextArrow}</span>
        </p>
      ) : page === 1 ? (
        <p className="crf-vx__demo crf-vx__demo--timer">
          <span>{EX.timerExam.label}</span>
          <b>{EX.timerExam.text}</b>
        </p>
      ) : (
        <p className="crf-vx__flagdemo">
          <Flag size={13} aria-hidden />
          {COPY.flagged} <span>{COPY.flaggedSample}</span>
        </p>
      )}
    </VendorShell>
  )
}

function Exam({ onSkip, onFinish }: { onSkip: () => void; onFinish: () => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [flagged, setFlagged] = useState(false)
  return (
    <VendorShell
      top={EX.exam.top}
      sub={EX.exam.sub}
      timer={EX.timerExam}
      nav={
        <ol className="crf-vx__qlist">
          {EX.exam.nav.map((q, i) => (
            <li key={q.num} className={i === 0 ? 'is-on' : undefined}>
              {q.word} {q.num}
            </li>
          ))}
        </ol>
      }
      foot={
        <>
          <span className="crf-vx__counts">
            {COPY.answeredFmt(picked ? 1 : 0, EX.exam.qTotal, flagged ? 1 : 0)}
          </span>
          <button type="button" className="crf-vx__skip" onClick={onSkip}>
            {COPY.skipPreview}
          </button>
          <button type="button" className="crf-vx__navbtn" disabled>
            {COPY.back}
          </button>
          <button type="button" className="crf-vx__navbtn" onClick={onFinish}>
            {COPY.next}
          </button>
        </>
      }
    >
      <p className="crf-vx__qnum">Question {EX.exam.qNum}</p>
      <button
        type="button"
        aria-pressed={flagged}
        className={flagged ? 'crf-vx__flag is-on' : 'crf-vx__flag'}
        onClick={() => setFlagged(!flagged)}
      >
        <Flag size={13} aria-hidden />
        {EX.exam.flagText}
      </button>
      <p className="crf-vx__stem">{EX.exam.stem}</p>
      <ul className="crf-vx__opts">
        {EX.exam.opts.map((o) => (
          <li key={o.letter}>
            <button
              type="button"
              role="radio"
              aria-checked={picked === o.letter}
              className={picked === o.letter ? 'crf-vx__opt is-on' : 'crf-vx__opt'}
              onClick={() => setPicked(o.letter)}
            >
              <span className="crf-vx__letter">{o.letter}</span>
              {o.text}
            </button>
          </li>
        ))}
      </ul>
    </VendorShell>
  )
}

/* ---------------- done, results, review ---------------- */

function Done({ onReveal }: { onReveal: () => void }) {
  return (
    <div className="crf-vx__page">
      <div className="crf-vx__dialog">
        <h1 className="crf-vx__h1">{COPY.doneTitle}</h1>
        {COPY.doneParas.map((p) => (
          <p key={p} className="crf-vx__para">
            {p}
          </p>
        ))}
        <button type="button" className="crf-link crf-link--flush" onClick={onReveal}>
          {COPY.reveal}
        </button>
      </div>
    </div>
  )
}

function Results({ onReview, onDone }: { onReview: () => void; onDone: () => void }) {
  const r = EX.results
  return (
    <div className="crf-vx__page">
      <div className="crf-vx__results">
        <div className="crf-vx__score">
          <div style={{ position: 'relative', width: 148, height: 148 }}>
            <svg viewBox="0 0 148 148" width="148" height="148" role="img" aria-label={`${r.pct}%`}>
              <g transform="rotate(-90 74 74)">
                <circle cx="74" cy="74" r="62" fill="none" stroke="var(--cjm-ring-cool)" strokeWidth="11" />
                <circle
                  cx="74"
                  cy="74"
                  r="62"
                  fill="none"
                  stroke={`var(--cjm-${r.ringTone})`}
                  strokeWidth="11"
                  strokeDasharray={r.ringDash}
                  strokeLinecap="round"
                />
              </g>
            </svg>
            <span className="crf-vx__scoremid" aria-hidden>
              <b>{r.pct}%</b>
              <span>
                {r.right}/{r.total}
              </span>
            </span>
          </div>
          <span
            className="crf-pill"
            style={{
              background: `var(--cjm-${r.statusBg})`,
              border: `1px solid var(--cjm-${r.statusBorder})`,
              color: `var(--cjm-${r.statusInk})`,
            }}
          >
            {r.statusLabel}
          </span>
        </div>
        <div className="crf-vx__resultsbody">
          <h1 className="crf-vx__h1">{r.statusHead}</h1>
          <p className="crf-vx__para">{r.statusText}</p>

          <p className="crf-eyebrow">{COPY.byTopic}</p>
          <ul className="crf-vx__topics">
            {r.topics.map((t) => (
              <li key={t.name}>
                <span className="crf-vx__topicname">{t.name}</span>
                <span className="crf-vx__topictrack" aria-hidden>
                  <span
                    className="crf-vx__topicfill"
                    style={{ width: t.w, background: `var(--cjm-${t.tone})` }}
                  />
                </span>
                <span className="crf-vx__topicnum">
                  {t.right}/{t.n} · {t.pct}%
                </span>
              </li>
            ))}
          </ul>

          <div className="crf-vx__rubi">
            <p className="crf-eyebrow crf-eyebrow--rubi">
              <RubiLogo size={13} aria-hidden />
              {COPY.rubiTipHeading}
            </p>
            <p className="crf-vx__para">{r.rubiTip}</p>
          </div>

          <p className="crf-vx__note">{COPY.feedbackQuestion}</p>
          <div className="crf-vx__fb">
            {r.feedback.map((f) => (
              <button key={f} type="button" className="crf-btn">
                {f}
              </button>
            ))}
          </div>

          <div className="crf-vx__resultsfoot">
            <button type="button" className="crf-btn">
              {COPY.retake}
            </button>
            <button type="button" className="crf-btn" onClick={onDone}>
              {COPY.donePreviewing}
            </button>
            <button type="button" className="crf-cta" onClick={onReview}>
              {COPY.reviewWithRubi}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Review({
  revealed,
  onReveal,
  onBack,
  onDone,
}: {
  revealed: boolean
  onReveal: () => void
  onBack: () => void
  onDone: () => void
}) {
  const v = EX.review
  const r = EX.results
  return (
    <div className="crf-vx__page">
      <div className="crf-vx__results">
        <aside className="crf-vx__reviewside">
          <h1 className="crf-vx__h1">{COPY.reviewTitle}</h1>
          <p className="crf-vx__para">{COPY.reviewLead}</p>
          <p className="crf-vx__pos">
            {v.pos}/{v.count}
          </p>
          <p className="crf-eyebrow">{COPY.reviewByTopicFmt(r.right, r.total)}</p>
          <ul className="crf-vx__topics">
            {r.topics.map((t) => (
              <li key={t.name}>
                <span className="crf-vx__topicname">{t.name}</span>
                <span className="crf-vx__topicnum">
                  {t.right}/{t.n}
                </span>
              </li>
            ))}
          </ul>
          <div className="crf-vx__rvfilters">
            {v.filters.map((f, i) => (
              <button key={f} type="button" aria-pressed={i === 0} className={i === 0 ? 'crf-fpill is-on' : 'crf-fpill'}>
                {f}
              </button>
            ))}
          </div>
        </aside>

        <div className="crf-vx__resultsbody">
          <p className="crf-eyebrow">{COPY.questionFmt(v.num, v.topic)}</p>
          <p className="crf-vx__badge">{v.badge}</p>
          <p className="crf-vx__stem">{v.stem}</p>
          <ul className="crf-vx__opts">
            {v.opts.map((o) => (
              <li key={o.letter}>
                <span
                  className={`crf-vx__opt${o.isCorrect ? ' is-correct' : ''}${o.isYours ? ' is-yours' : ''}`}
                >
                  <span className="crf-vx__letter">{o.letter}</span>
                  {o.text}
                  {o.isCorrect ? <b className="crf-vx__tag">{COPY.correctAnswer}</b> : null}
                  {o.isYours ? <b className="crf-vx__tag">{COPY.yourAnswer}</b> : null}
                </span>
              </li>
            ))}
          </ul>
          {/* ⚠ THE PROMPT COMES FIRST AND THE EXPLANATION IS BEHIND A CLICK —
              his `rvHidden`. Rubi asks before telling. */}
          <p className="crf-vx__para">{v.prompt}</p>
          {revealed ? <p className="crf-vx__para">{v.explain}</p> : null}
          <div className="crf-vx__resultsfoot">
            {!revealed ? (
              <button type="button" className="crf-cta" onClick={onReveal}>
                {COPY.walkMeThrough}
              </button>
            ) : null}
            <button type="button" className="crf-btn" disabled>
              {COPY.prevQuestion}
            </button>
            <button type="button" className="crf-btn">
              {COPY.nextQuestion}
            </button>
            <button type="button" className="crf-btn" onClick={onBack}>
              <ArrowLeft size={12} aria-hidden />
              {COPY.backToResults}
            </button>
            <button type="button" className="crf-btn" onClick={onDone}>
              {COPY.donePreviewing}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
