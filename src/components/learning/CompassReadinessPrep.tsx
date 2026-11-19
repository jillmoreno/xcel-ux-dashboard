import { CircleCheck, RubiLogo } from '@/icons'
import { Band, PathLine, ReadinessRing, TopicTable } from './CompassReadinessParts'
import {
  prepStage,
  type Evidence,
} from './compassReadinessModel'
import './compassReadiness.css'

/**
 * "YOUR EXAM PREP" — his `JOverviewPrep`, ported 2026-11-05.
 *
 * The page after the QE course, where Readiness IS the page: a recommended
 * next activity, the Readiness-to-pass ring, Rubi's suggestion, the
 * blueprint-weighted topic table, and what the learner's confidence says
 * against their answers.
 *
 * ⚠ THE RING IS THREE NESTED ARCS, outside in: Exam Simulator, practice
 * coverage, Readiness. Not one percentage — the point of the drawing is that
 * three different things are being measured and only the inner one is the
 * number people quote. His own caption says so under it.
 *
 * ⚠ READINESS COMES FROM EXAM PREP PRACTICE ONLY. The gate line at the foot
 * says it, the ring's caption says it, and the table's note says it again. It
 * is the rule the whole design is built to teach, so all three stay.
 *
 * ⚠ EVERY NUMBER IS HIS. The model is evaluated out of his own code (see
 * `compassReadinessFixtures.ts`), so nothing here is a port's approximation of
 * "about 58%".
 */
export function CompassReadinessPrep({ stage = 'p2' }: { stage?: string }) {
  const m = prepStage(stage)
  return (
    <div className="cre-rd" data-stage={m.stage}>
      <p className="cre-rd-hello">{m.hello}</p>
      <h1 className="serif cre-rd-h1">Your exam prep</h1>
      <p className="cre-rd-meta">
        <span>Life &amp; Health · Florida 2-15</span>
        <span aria-hidden>·</span>
        <span>{m.metaLine}</span>
        <span aria-hidden>·</span>
        <b className="cre-rd-phase">{m.phase}</b>
        <span className="cre-rd-cert">
          <CircleCheck size={14} aria-hidden />
          QE course complete · certificate Jul 18
        </span>
      </p>

      {/* ---- recommended next ---- */}
      <section className="cre-rd-next" aria-label="Recommended next">
        <div>
          <p className="cre-rd-eyebrow">{m.nextLabel}</p>
          <h2 className="serif cre-rd-next-title">{m.nextTitle}</h2>
          <p className="cre-rd-next-sub">
            {m.nextSub}
            {m.hasGoal && (
              <>
                <span aria-hidden> · </span>
                {m.goalLead} <Band segs={m.goalFrom.segs} />
                <b style={{ color: `var(--rd-${m.goalFrom.color})` }}>{m.goalFrom.word}</b>
                <span aria-hidden> → </span>
                <b style={{ color: `var(--rd-${m.goalTo.color})` }}>{m.goalTo.word}</b>
              </>
            )}
          </p>
          {m.nextCovers && (
            <p className="cre-rd-covers">
              <span className="cre-rd-label">Covers</span> {m.nextCovers}
            </p>
          )}
        </div>
        <div className="cre-rd-next-aside">
          <p>{m.weekLine}</p>
        </div>
        <div className="cre-rd-next-cta">
          <button type="button" className="cre-rd-primary">
            {m.ctaLabel}
          </button>
          {m.ctaAlt && <button type="button" className="cre-rd-quiet">{m.ctaAlt}</button>}
        </div>
      </section>

      {/* ---- readiness + Rubi ---- */}
      <div className="cre-rd-pair">
        <section className="cre-rd-ready" aria-label="Readiness to pass">
          <div className="cre-rd-ready-head">
            <span className="cre-rd-eyebrow">Readiness to pass</span>
            <button type="button" className="cre-rd-quiet">How is this figured?</button>
          </div>
          <div className="cre-rd-ready-body">
            <ReadinessRing ring={m.ring} />
            <ul className="cre-rd-path">
              {m.path.map((p) => (
                <PathLine key={p.label} row={p} />
              ))}
            </ul>
          </div>
          <p className="cre-rd-basis">{m.basis}</p>
        </section>

        <section className="cre-rd-rubi" aria-label="Rubi suggests">
          <p className="cre-rd-eyebrow cre-rd-rubi-eyebrow">
            <RubiLogo size={15} aria-hidden />
            Rubi suggests
            <span className="cre-rd-rubi-path">· {m.rubi.path}</span>
          </p>
          <h3 className="serif cre-rd-rubi-title">{m.rubi.title}</h3>
          <p className="cre-rd-rubi-why">{m.rubi.why}</p>
          {m.rubi.effect && (
            /* ⚠ THE PREDICTION IS THE POINT. Not "practise this" but what
               practising it would MOVE — the only place on the page that
               connects an action to the number above it. */
            <p className="cre-rd-rubi-effect">
              <span className="cre-rd-label">{m.rubi.effectTitle}</span> <b>{m.rubi.effect}</b>
            </p>
          )}
          <button type="button" className="cre-rd-rubi-cta">
            {m.rubi.cta}
          </button>
        </section>
      </div>

      {/* ---- the topic table ---- */}
      <section className="cre-rd-table" aria-label="Your prep by exam topic">
        <div className="cre-rd-table-head">
          <div>
            <h2 className="serif cre-rd-h2">Your prep by exam topic</h2>
            <p className="cre-rd-summary">{m.summary}</p>
          </div>
          <p className="cre-rd-note">
            Ready at 85% · from Exam Prep practice only · pie = share of the exam
          </p>
        </div>
        <TopicTable rows={m.rows} />
      </section>

      {/* ---- confidence ---- */}
      {/* ⚠ THE SECTION STAYS WHEN THERE IS NOTHING IN IT, and says what will
          fill it. Hiding it (the first pass) makes the panel appear from
          nowhere a few practice sets later; his version tells the learner it
          is coming and what it will show. */}
      <section className="cre-rd-evidence" aria-label="Where confidence and answers differ">
        <div className="cre-rd-table-head">
          <h2 className="serif cre-rd-h2">Where confidence and answers differ</h2>
          <p className="cre-rd-note">{m.evNote}</p>
        </div>
        {m.noEvidence ? (
          <p className="cre-rd-empty">
            Appears after a few more practice sets: where you’re sure and right, sure and wrong,
            and which terms you keep missing.
          </p>
        ) : (
          <div className="cre-rd-evidence-pair">
            {m.evidence.map((e) => (
              <EvidenceCard key={e.topic} card={e} />
            ))}
          </div>
        )}
      </section>

      <p className="cre-rd-gate">{m.gate}</p>
    </div>
  )
}

function EvidenceCard({ card }: { card: Evidence }) {
  return (
    <div className="cre-rd-ev">
      <p className="cre-rd-label">{card.topic}</p>
      <h3 className="serif cre-rd-ev-head">{card.head}</h3>
      {card.bars.map((b) => (
        <div className="cre-rd-ev-bar" key={b.label}>
          <span>{b.label}</span>
          {/* ⚠ ONE CELL PER QUESTION, not a proportional bar — eight cells for
              eight questions, so "3 of 8" is countable rather than estimated. */}
          <span className="cre-rd-cells" aria-hidden>
            {b.cells.map((s, i) => (
              <span key={i} style={{ background: `var(--rd-${s.style.tone})` }} />
            ))}
          </span>
          <b>{b.val}</b>
        </div>
      ))}
      {card.flag && <p style={{ color: `var(--rd-${card.flagColor})` }}>{card.flag}</p>}
      <p className="cre-rd-ev-links">
        {card.link && <button type="button" className="cre-rd-quiet">{card.link}</button>}
        {card.hasRubi && (
          <button type="button" className="cre-rd-link cre-rd-link--rubi">
            {card.rubiCta} ›
          </button>
        )}
      </p>
    </div>
  )
}

