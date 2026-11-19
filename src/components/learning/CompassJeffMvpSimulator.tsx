import { useState } from 'react'
import { Clock, ClipboardList, LockRegular, RubiLogo } from '@/icons'
import {
  JEFF_MVP_SIMULATOR as SIM,
  JEFF_MVP_SIMULATOR_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

/**
 * JEFF'S EXAM SIMULATOR — 2026-11-09, the eighth page ported and the last of
 * his rail rows.
 *
 * Three full-length simulated exams, a readiness gate above them, and a modal
 * that asks which testing provider to imitate before one starts.
 *
 * ⚠ THE GATE IS DRAWN BUT NOT ENFORCED, and that is his. It reads "Unlocks at
 * 80% readiness" over a learner at 62% — and all three sims below say "Ready"
 * with working buttons. Making the buttons obey the gate would be inventing
 * an interaction he has not designed; hiding the gate would drop the rule he
 * is stating. Both halves are his, and the tension is the point of showing
 * the page to him.
 *
 * ⚠ THE MODAL IS THE PAGE'S REAL ARGUMENT — "the same screens, tools and
 * timing you'll see from your testing provider". None preselected, Start
 * disabled until one is chosen, and the label takes the provider's name when
 * it is. A modal that opened with Pearson VUE already ticked would answer the
 * question the modal exists to ask.
 */
export function CompassJeffMvpSimulator({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [modal, setModal] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)

  const close = () => {
    setModal(null)
    setProvider(null)
  }

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        Ask Rubi
      </button>
      <CompassJeffMvpColumn>
        <CompassJeffMvpHead
          title={COPY.title}
          below={
            <>
              <p className="cjm-ov__course cjm-prep__course">{COPY.course}</p>
              <p className="cjm-lead">{COPY.lead}</p>
            </>
          }
        />

        {/* ---------- practice first, and the gate ---------- */}
        <section className="cjm-pr__rec" aria-label={SIM.practiceFirst.title}>
          <p className="cjm-eyebrow cjm-eyebrow--rubi cjm-pr__receyebrow">
            <RubiLogo size={13} aria-hidden />
            {COPY.rubiEyebrow} · {SIM.practiceFirst.kind}
          </p>
          <div className="cjm-pr__weakest">
            <GateRing rec={SIM.practiceFirst} />
            <div className="cjm-pr__recbody">
              <p className="cjm-pr__rectopic">{SIM.practiceFirst.topic}</p>
              <h2 className="cjm-pr__rectitle cjm-serif">{SIM.practiceFirst.title}</h2>
              <p className="cjm-card__text">{SIM.practiceFirst.why}</p>
              <p className="cjm-pr__recstats">
                <span>
                  <span className="cjm-dot" style={{ background: `var(--cjm-${SIM.practiceFirst.readyTone})` }} aria-hidden />
                  {COPY.readinessLabel} <b>{SIM.practiceFirst.ready}%</b>
                </span>
                <span>
                  <span className="cjm-dot" style={{ background: 'var(--cjm-steel)' }} aria-hidden />
                  {COPY.gateLabel} <b>{SIM.practiceFirst.gate}%</b> {SIM.practiceFirst.covNote}
                </span>
                <span>
                  <Clock size={13} aria-hidden /> {COPY.aboutLabel} {SIM.practiceFirst.timeLabel}
                </span>
              </p>
            </div>
            <button type="button" className="cjm-cta" onClick={() => onSelectPage?.('practice')}>
              {SIM.practiceFirst.cta}
            </button>
          </div>

          {/* ⚠ NO CTA ON THE GATE ROW — his `hasBtn` is false. It states the
              rule and offers nothing to click, which is why the list below it
              is the only way on. */}
          <div className="cjm-pr__spaced">
            <p className="cjm-eyebrow">
              <LockRegular size={13} aria-hidden /> {SIM.gate.kind}
            </p>
            <p className="cjm-pr__spacedtitle">{SIM.gate.title}</p>
            <span
              className="cjm-pill"
              style={{
                background: `var(--cjm-${SIM.gate.bandBg})`,
                border: `1px solid var(--cjm-${SIM.gate.bandBorder})`,
                color: `var(--cjm-${SIM.gate.bandInk})`,
              }}
            >
              {SIM.gate.band}
            </span>
            <span className="cjm-pr__due">{SIM.gate.rowMeta}</span>
          </div>
        </section>

        {/* ---------- the three exams ---------- */}
        <section className="cjm-course" aria-label={COPY.simsHeading}>
          <header className="cjm-course__head">
            <span className="cjm-tile" aria-hidden>
              <ClipboardList size={16} />
            </span>
            <div className="cjm-course__name">
              <h2 className="cjm-sim__heading">{COPY.simsHeading}</h2>
            </div>
            <span className="cjm-course__of">{COPY.simsCountFmt(SIM.simCount)}</span>
          </header>
          {SIM.sims.map((s) => (
            <div className="cjm-sim__row" key={s.title}>
              <div className="cjm-sim__name">
                <p className="cjm-sim__title">
                  {s.title}
                  {s.timed ? <span className="cjm-pill cjm-pill--timed">{COPY.timedPill}</span> : null}
                </p>
                <p className="cjm-sim__meta">{s.meta}</p>
              </div>
              <button type="button" className="cjm-btn" onClick={() => setModal(s.title)}>
                {COPY.takeExam}
              </button>
            </div>
          ))}
        </section>

        <p className="cjm-footnote">{COPY.footnote}</p>
      </CompassJeffMvpColumn>

      {/* ---------- the provider modal ---------- */}
      {modal ? (
        <div className="cjm-sim__scrim" role="dialog" aria-modal aria-label={COPY.modalTitle}>
          <div className="cjm-sim__modal">
            <p className="cjm-eyebrow">{modal}</p>
            <h2 className="cjm-sim__modaltitle cjm-serif">{COPY.modalTitle}</h2>
            <p className="cjm-card__text">{COPY.modalBody}</p>
            <ul className="cjm-sim__providers">
              {SIM.providers.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={provider === p.name}
                    className={provider === p.name ? 'cjm-sim__prov is-on' : 'cjm-sim__prov'}
                    onClick={() => setProvider(p.name)}
                  >
                    <span className="cjm-sim__provdot" aria-hidden />
                    <span>
                      <b>{p.name}</b>
                      <span className="cjm-sim__provnote">{p.note}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="cjm-sim__help">{COPY.modalHelp}</p>
            <div className="cjm-sim__modalfoot">
              <button type="button" className="cjm-btn" onClick={close}>
                {COPY.cancel}
              </button>
              {/* ⚠ DISABLED UNTIL A PROVIDER IS PICKED, and the label takes
                  its name when one is — his `startLabel`. */}
              <button
                type="button"
                className="cjm-cta"
                disabled={!provider}
                aria-disabled={!provider}
                onClick={() => onSelectPage?.('exam-session')}
              >
                {provider ? COPY.startExamFmt(provider) : COPY.startExam}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** Readiness outside, the 80% gate inside — his two arcs on this page. */
function GateRing({ rec }: { rec: typeof SIM.practiceFirst }) {
  return (
    <div className="cjm-pr__ring">
      <div style={{ position: 'relative', width: 152, height: 152 }}>
        <svg width="152" height="152" viewBox="0 0 120 120" role="img" aria-label={rec.ringAria}>
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--cjm-ring-warm)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={`var(--cjm-${rec.readyTone})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={rec.readyDash}
            transform="rotate(-90 60 60)"
          />
          <circle cx="60" cy="60" r="40" fill="none" stroke="var(--cjm-ring-steel-track)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="none"
            stroke="var(--cjm-steel-deep)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={rec.covDash}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="cjm-pr__ringmid" aria-hidden>
          <span
            className="cjm-pill"
            style={{
              background: `var(--cjm-${rec.bandBg})`,
              border: `1px solid var(--cjm-${rec.bandBorder})`,
              color: `var(--cjm-${rec.bandInk})`,
            }}
          >
            {rec.band}
          </span>
        </span>
      </div>
    </div>
  )
}
