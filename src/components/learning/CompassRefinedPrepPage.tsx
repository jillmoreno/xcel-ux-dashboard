import { REFINED_COURSE } from '@/data/compassRefinedCopy'
import { CircleCheck, RubiLogo } from '@/icons'
import { Band, PathLine, ReadinessRing, TopicTable } from './CompassRefinedParts'
import {
  prepStage,
  type Evidence,
} from './compassReadinessModel'
import './compassRefinedJourney.css'

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
export function CompassRefinedPrepPage({ stage = 'p2' }: { stage?: string }) {
  const m = prepStage(stage)
  return (
    <div className="crf-rd" data-stage={m.stage}>
      {/* ⚠ THE COURSE EYEBROW — 2026-11-10. It is the FIRST thing on
          the page, above the greeting: an eyebrow labels the page, and the
          greeting is addressed to the learner. Below the greeting it read as
          a third stacked line of header rather than the context for it. */}
      <p className="crf-rd-brow">
        <span>{REFINED_COURSE.name}</span>
        <span className="crf-rd-brow__dot" aria-hidden>
          ·
        </span>
        <span className="crf-rd-brow__access">{REFINED_COURSE.access}</span>
      </p>
      <p className="crf-rd-hello">{m.hello}</p>
      <h1 className="serif crf-rd-h1">Your exam prep</h1>
      <p className="crf-rd-meta">
        <span>Life &amp; Health · Florida 2-15</span>
        <span aria-hidden>·</span>
        <span>{m.metaLine}</span>
        <span aria-hidden>·</span>
        <b className="crf-rd-phase">{m.phase}</b>
        <span className="crf-rd-cert">
          <CircleCheck size={14} aria-hidden />
          QE course complete · certificate Jul 18
        </span>
      </p>

      {/* ---- recommended next ---- */}
      <section className="crf-rd-next" aria-label="Recommended next">
        <div>
          <p className="crf-rd-eyebrow">{m.nextLabel}</p>
          <h2 className="crf-rd-next-title">{m.nextTitle}</h2>
          <p className="crf-rd-next-sub">
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
            <p className="crf-rd-covers">
              <span className="crf-rd-label">Covers</span> {m.nextCovers}
            </p>
          )}
        </div>
        <div className="crf-rd-next-aside">
          <p>{m.weekLine}</p>
        </div>
        <div className="crf-rd-next-cta">
          <button type="button" className="crf-rd-primary">
            {m.ctaLabel}
          </button>
          {m.ctaAlt && <button type="button" className="crf-rd-quiet">{m.ctaAlt}</button>}
        </div>
      </section>

      {/* ---- readiness + Rubi ---- */}
      <div className="crf-rd-pair">
        <section className="crf-rd-ready" aria-label="Readiness to pass">
          <div className="crf-rd-ready-head">
            <span className="crf-rd-eyebrow">Readiness to pass</span>
            <button type="button" className="crf-rd-quiet">How is this figured?</button>
          </div>
          <div className="crf-rd-ready-body">
            <ReadinessRing ring={m.ring} />
            <ul className="crf-rd-path">
              {m.path.map((p) => (
                <PathLine key={p.label} row={p} />
              ))}
            </ul>
          </div>
          <p className="crf-rd-basis">{m.basis}</p>
        </section>

        <section className="crf-rd-rubi" aria-label="Rubi suggests">
          <p className="crf-rd-eyebrow crf-rd-rubi-eyebrow">
            <RubiLogo size={15} aria-hidden />
            Rubi suggests
            <span className="crf-rd-rubi-path">· {m.rubi.path}</span>
          </p>
          <h3 className="crf-rd-rubi-title">{m.rubi.title}</h3>
          <p className="crf-rd-rubi-why">{m.rubi.why}</p>
          {m.rubi.effect && (
            /* ⚠ THE PREDICTION IS THE POINT. Not "practise this" but what
               practising it would MOVE — the only place on the page that
               connects an action to the number above it. */
            <p className="crf-rd-rubi-effect">
              <span className="crf-rd-label">{m.rubi.effectTitle}</span> <b>{m.rubi.effect}</b>
            </p>
          )}
          <button type="button" className="crf-rd-rubi-cta">
            {m.rubi.cta}
          </button>
        </section>
      </div>

      {/* ---- the topic table ---- */}
      <section className="crf-rd-table" aria-label="Your prep by exam topic">
        <div className="crf-rd-table-head">
          <div>
            <h2 className="crf-rd-h2">Your prep by exam topic</h2>
            <p className="crf-rd-summary">{m.summary}</p>
          </div>
          <p className="crf-rd-note">
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
      <section className="crf-rd-evidence" aria-label="Where confidence and answers differ">
        <div className="crf-rd-table-head">
          <h2 className="crf-rd-h2">Where confidence and answers differ</h2>
          <p className="crf-rd-note">{m.evNote}</p>
        </div>
        {m.noEvidence ? (
          <p className="crf-rd-empty">
            Appears after a few more practice sets: where you’re sure and right, sure and wrong,
            and which terms you keep missing.
          </p>
        ) : (
          <div className="crf-rd-evidence-pair">
            {m.evidence.map((e) => (
              <EvidenceCard key={e.topic} card={e} />
            ))}
          </div>
        )}
      </section>

      <p className="crf-rd-gate">{m.gate}</p>
    </div>
  )
}

function EvidenceCard({ card }: { card: Evidence }) {
  return (
    <div className="crf-rd-ev">
      <p className="crf-rd-label">{card.topic}</p>
      <h3 className="crf-rd-ev-head">{card.head}</h3>
      {card.bars.map((b) => (
        <div className="crf-rd-ev-bar" key={b.label}>
          <span>{b.label}</span>
          {/* ⚠ ONE CELL PER QUESTION, not a proportional bar — eight cells for
              eight questions, so "3 of 8" is countable rather than estimated. */}
          <span className="crf-rd-cells" aria-hidden>
            {b.cells.map((s, i) => (
              <span key={i} style={{ background: `var(--rd-${s.style.tone})` }} />
            ))}
          </span>
          <b>{b.val}</b>
        </div>
      ))}
      {card.flag && <p style={{ color: `var(--rd-${card.flagColor})` }}>{card.flag}</p>}
      <p className="crf-rd-ev-links">
        {card.link && <button type="button" className="crf-rd-quiet">{card.link}</button>}
        {card.hasRubi && (
          <button type="button" className="crf-rd-link crf-rd-link--rubi">
            {card.rubiCta} ›
          </button>
        )}
      </p>
    </div>
  )
}

