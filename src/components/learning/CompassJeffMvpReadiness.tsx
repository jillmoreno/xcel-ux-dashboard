import { useState } from 'react'
import { ChevronDown, CircleInfoRegular, Clock, RubiLogo } from '@/icons'
import {
  JEFF_MVP_READINESS as RD,
  JEFF_MVP_READINESS_COPY as COPY,
  type JeffMvpPage,
} from '@/data/compassJeffMvpFixtures'
import { CompassJeffMvpColumn, CompassJeffMvpHead } from './CompassJeffMvpShell'
import './compassJeffMvp.css'

/**
 * JEFF'S READINESS PAGE — 2026-11-09, the first page of his Compass MVP to be
 * ported, picked by Jillienne.
 *
 * ⚠ IT IS A PAGE, NOT AN OVERVIEW ARM. The Readiness prototype already in
 * here (`CompassReadinessOverview`, 2026-11-05) is sixteen states of the
 * Compass OVERVIEW rebuilt around Readiness, arguing about whether Readiness
 * is a phase after the course or a signal beside it. This page starts from the
 * other side of that question being settled: Readiness has its own rail row,
 * under an EXAM PREP rule, and the page's job is "what do I do next", not
 * "where does this belong". Both ports stand; neither replaces the other.
 *
 * ⚠ ALL GEOMETRY IS HIS, MEASURED OFF HIS MARKUP, not approximated:
 *   · the ring is 148×148, `rotate(-90 74 74)`, two concentric circles at
 *     r=66 (Readiness, amber) and r=52 (Coverage, steel), stroke-width 10 on a
 *     #E2E7EC track, round caps. The dasharrays come out of his `renderVals()`.
 *   · the trend chart is viewBox 0 0 960 210 with the PLOT 880 wide, which is
 *     why the date row carries `padding-right: 8.3%` — that is what puts
 *     "Today" under x=880 rather than under the viewBox edge.
 *   · the band marker is placed at `score%` of the whole track, linearly. His
 *     segments are flex 40/25/20/15, summing to 100, so 52 lands inside
 *     Developing (40–65) and 66 lands just inside Proficient. Checked against
 *     his render for all five rows.
 *
 * ⚠ THE PRACTICE BUTTONS DO NOT ALL GO TO THE SAME PLACE, and that is the
 * page's thesis rather than a slip: every Practice control opens the Practice
 * page EXCEPT the weakest sub-topic's, which opens a question set directly.
 * The top recommendation is one click from being done; everything else is one
 * click from being chosen.
 */
export function CompassJeffMvpReadiness({
  onSelectPage,
}: {
  onSelectPage?: (p: JeffMvpPage) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [help, setHelp] = useState(false)
  const go = (p: JeffMvpPage) => () => onSelectPage?.(p)
  /* His first row opens expanded and the rest closed; a click flips whichever
     it is. Seeded from the fixture rather than from a second source of truth,
     so the row that is open on arrival is the one HIS page opens. */
  const isOpen = (name: string, fallback: boolean) => open[name] ?? fallback

  return (
    <div className="cjm-page">
      <button type="button" className="cjm-ask">
        <RubiLogo size={17} aria-hidden />
        {COPY.askRubi}
      </button>

      <CompassJeffMvpColumn>
      <CompassJeffMvpHead
        title={COPY.title}
        lead={COPY.lead}
        ruled
        leadClass="cjm-lead--readiness"
        aside={
          <p className="cjm-live">
            <span className="cjm-live__dot" aria-hidden />
            {COPY.liveChip}
          </p>
        }
      />

      {/* ---------- do this next ---------- */}
      <section className="cjm-next" aria-label={COPY.nextTitle}>
        <div className="cjm-next__body">
          <ReadinessRing />
          <div className="cjm-next__mid">
            <p className="cjm-next__eyebrow">
              <RubiLogo size={13} aria-hidden />
              {COPY.nextEyebrow} {RD.overall}%
            </p>
            <h2 className="cjm-next__title cjm-serif">{COPY.nextTitle}</h2>
            <p className="cjm-next__text">{COPY.nextBody}</p>
          </div>
          <div className="cjm-next__set">
            <p className="cjm-eyebrow">{COPY.setEyebrow}</p>
            <p className="cjm-set__title">{COPY.setTitle}</p>
            <p className="cjm-set__meta">{COPY.setMeta}</p>
            <button type="button" className="cjm-cta" onClick={go('practice')}>
              {COPY.setCta}
            </button>
            <button type="button" className="cjm-link" onClick={go('practice')}>
              {COPY.setAlt}
            </button>
          </div>
        </div>
        <div className="cjm-next__also">
          <Clock size={14} aria-hidden />
          <p>
            {COPY.alsoLead} <strong>{COPY.alsoStrong}</strong> {COPY.alsoRest}
          </p>
          <button type="button" className="cjm-link" onClick={go('practice')}>
            {COPY.alsoCta}
          </button>
        </div>
      </section>

      {/* ---------- the trend ---------- */}
      <section className="cjm-card" aria-label={COPY.trendEyebrow}>
        <div className="cjm-card__head">
          <div style={{ minWidth: 0 }}>
            <p className="cjm-eyebrow">{COPY.trendEyebrow}</p>
            <p className="cjm-card__text">{COPY.trendBody}</p>
          </div>
          <dl className="cjm-stats">
            {RD.stats.map((s) => (
              <div key={s.label} style={{ borderLeft: s.ruled ? '1px solid var(--cjm-rule-warm)' : undefined }}>
                <dt>{s.label}</dt>
                <dd className="cjm-serif" style={{ color: `var(--cjm-${s.tone})` }}>
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <TrendChart />
        <p className="cjm-caption">{COPY.trendCaption}</p>
      </section>

      {/* ---------- readiness by topic ---------- */}
      <section className="cjm-topics" aria-label={COPY.topicsTitle}>
        <div className="cjm-topics__head">
          <div style={{ minWidth: 0 }}>
            <h2 className="cjm-h2 cjm-serif">{COPY.topicsTitle}</h2>
            <p className="cjm-topics__sub">{COPY.topicsSub}</p>
            <p className="cjm-card__text">{COPY.topicsBody}</p>
          </div>
          <p
            className="cjm-pill"
            style={{
              background: `var(--cjm-${RD.bandBg})`,
              border: `1px solid var(--cjm-${RD.bandBorder})`,
              color: `var(--cjm-${RD.bandInk})`,
            }}
          >
            Overall {RD.overall} · {RD.band}
          </p>
        </div>

        <div className="cjm-topics__legend">
          <span>
            <span className="cjm-marker-key" aria-hidden />
            {COPY.markerLegend}
          </span>
          <button
            type="button"
            className="cjm-help"
            aria-expanded={help}
            onClick={() => setHelp((v) => !v)}
          >
            <CircleInfoRegular size={14} aria-hidden />
            {COPY.helpCta}
            <ChevronDown
              size={12}
              aria-hidden
              style={{ transform: help ? 'rotate(180deg)' : undefined }}
            />
          </button>
        </div>
        {help ? (
          <ul className="cjm-help__panel">
            {RD.bandHelp.map((b) => (
              <li key={b.name}>
                <span className="cjm-help__name">
                  <span className="cjm-dot" style={{ background: `var(--cjm-${b.dotTone})` }} aria-hidden />
                  {b.name}
                </span>
                <span className="cjm-help__range">{b.range}</span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {RD.rows.map((r) => {
          const expanded = isOpen(r.name, r.expanded)
          return (
            <article className="cjm-row" key={r.name}>
              <div className="cjm-row__head">
                <div style={{ minWidth: 0 }}>
                  <h3 className="cjm-row__name">{r.name}</h3>
                  <p className="cjm-row__meta">
                    {r.weight}% of exam · {r.answered}
                  </p>
                </div>
                <div className="cjm-row__right">
                  {/* ⚠ NO TREND GLYPH, AND THAT IS A DELIBERATE OMISSION.
                      His mark is a rising-line arrow
                      (`M22 7l-8.5 8.5-5-5L2 17M16 7h6v6`); this registry ships
                      none, and the one up-arrow it has —
                      `ArrowUpRightFromSquare` — already means "opens
                      elsewhere" everywhere else in this app. A glyph that
                      says the wrong thing beside a number is worse than no
                      glyph: the green and the sign carry the direction, and
                      `compassPages.ts` rejected `Flag` for the same reason.
                      Adding a trend icon is a registry decision. */}
                  <span className="cjm-delta">
                    +{r.delta}
                    <span className="cjm-sr"> {COPY.deltaSuffix}</span>
                  </span>
                  <p
                    className="cjm-pill"
                    style={{
                      background: `var(--cjm-${r.bandBg})`,
                      border: `1px solid var(--cjm-${r.bandBorder})`,
                      color: `var(--cjm-${r.bandInk})`,
                    }}
                  >
                    {r.band} · {r.score}/100
                  </p>
                </div>
              </div>

              <div className="cjm-track" role="img" aria-label={r.aria}>
                {r.track.map((t) => (
                  <span
                    key={t.label}
                    className="cjm-track__seg"
                    style={{
                      flex: `${t.flex} 1 0`,
                      height: t.height,
                      borderRadius: t.radius,
                      background: `var(--cjm-${t.tone})`,
                    }}
                  />
                ))}
                <span className="cjm-track__marker" style={{ left: `${r.score}%` }} aria-hidden />
              </div>
              <div className="cjm-track__labels">
                {r.track.map((t) => (
                  <span
                    key={t.label}
                    style={{
                      flex: `${t.flex} 1 0`,
                      color: `var(--cjm-${t.labelTone})`,
                      fontWeight: t.labelWeight,
                    }}
                  >
                    {t.label}
                  </span>
                ))}
              </div>

              <div className="cjm-row__foot">
                <span className="cjm-gap">{r.gapNote}</span>
                <span className="cjm-foot-actions">
                  <button
                    type="button"
                    className={r.isPrimary ? 'cjm-btn cjm-btn--primary' : 'cjm-btn'}
                    onClick={go('practice')}
                  >
                    {COPY.practiceCta}
                  </button>
                  <button
                    type="button"
                    className="cjm-chev"
                    aria-expanded={expanded}
                    aria-label={expanded ? r.collapseLabel : r.expandLabel}
                    onClick={() => setOpen((o) => ({ ...o, [r.name]: !expanded }))}
                  >
                    <ChevronDown
                      size={14}
                      aria-hidden
                      style={{ transform: expanded ? 'rotate(180deg)' : undefined }}
                    />
                  </button>
                </span>
              </div>

              {expanded && r.subs.length ? (
                <div className="cjm-subs">
                  <p className="cjm-subs__eyebrow">{COPY.subEyebrow}</p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {r.subs.map((s) => (
                      <li className="cjm-sub" key={s.name}>
                        <span className="cjm-sub__name">{s.name}</span>
                        <span className="cjm-sub__note" style={{ color: `var(--cjm-${s.noteTone})` }}>
                          {s.note}
                        </span>
                        <span className="cjm-sub__bar" aria-hidden>
                          {s.segs.map((g, i) => (
                            <span
                              key={i}
                              style={{
                                flex: `${g.flex} 1 0`,
                                height: g.height,
                                background: `var(--cjm-${g.tone})`,
                              }}
                            />
                          ))}
                        </span>
                        <span className="cjm-sub__band">
                          {s.band} <b>{s.num}</b>
                        </span>
                        {/* ⚠ THE MINUTES AND "Start here" BELONG TO THE WEAKEST
                            SUB-TOPIC ONLY (`rubi` on his row), and its Practice
                            button is the one that opens a question set. */}
                        {s.rubi ? (
                          <span className="cjm-sub__when">
                            <span>
                              {COPY.aboutMins} {s.mins}
                            </span>
                            {COPY.startHere}
                          </span>
                        ) : (
                          <span />
                        )}
                        {/* ⚠ THE WEAKEST SUB-TOPIC OPENS A QUESTION SET, every
                            other one opens the Practice page — his two hrefs,
                            `PracticeSession` against `Practice`. This page's
                            thesis in one link, and it pointed at Practice for
                            both until the question set existed to point at. */}
                        <button
                          type="button"
                          className={s.rubi ? 'cjm-btn cjm-btn--primary' : 'cjm-btn'}
                          aria-label={`Practice ${s.name}`}
                          onClick={go(s.rubi ? 'practice-session' : 'practice')}
                        >
                          {COPY.practiceCta}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          )
        })}

        <p className="cjm-footnote">
          <CircleInfoRegular size={14} aria-hidden />
          {COPY.footnote}
        </p>
      </section>
      </CompassJeffMvpColumn>
    </div>
  )
}

/** The double arc. Outer is Readiness, inner is Coverage — his order, outside
 *  in, which is also the order the legend below reads. */
function ReadinessRing() {
  return (
    <div className="cjm-ring">
      <div style={{ position: 'relative', width: 148, height: 148 }}>
        <svg viewBox="0 0 148 148" width="148" height="148" role="img" aria-label={RD.ring.aria} className="cjm-ring__svg">
          <g transform="rotate(-90 74 74)">
            <circle cx="74" cy="74" r="66" fill="none" stroke="var(--cjm-ring-track)" strokeWidth="10" />
            <circle
              cx="74"
              cy="74"
              r="66"
              fill="none"
              stroke={`var(--cjm-${RD.ring.readyTone})`}
              strokeWidth="10"
              strokeDasharray={RD.ring.readyDash}
              strokeLinecap="round"
            />
            <circle cx="74" cy="74" r="52" fill="none" stroke="var(--cjm-ring-track)" strokeWidth="10" />
            <circle
              cx="74"
              cy="74"
              r="52"
              fill="none"
              stroke="var(--cjm-steel)"
              strokeWidth="10"
              strokeDasharray={RD.ring.covDash}
              strokeLinecap="round"
            />
          </g>
        </svg>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
          }}
        >
          <span className="cjm-serif" style={{ fontSize: 28, lineHeight: 1 }}>
            {RD.overall}%
          </span>
          <span
            style={{
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--cjm-muted)',
            }}
          >
            Readiness
          </span>
        </div>
      </div>
      <ul className="cjm-ring__legend">
        <li>
          <span className="cjm-dot" style={{ background: `var(--cjm-${RD.ring.readyTone})` }} aria-hidden />
          Readiness <b>{RD.overall}%</b>
        </li>
        <li>
          <span className="cjm-dot" style={{ background: 'var(--cjm-steel)' }} aria-hidden />
          Coverage <b>{RD.coverage}%</b>
        </li>
      </ul>
    </div>
  )
}

/**
 * The three-week line.
 *
 * ⚠ THE PLOT IS 880 OF A 960 VIEWBOX. The right-hand 80 is where his axis
 * labels live (x=892), outside the plot — which is why the SVG sets
 * `overflow: visible` and the date row under it is inset by 8.3% on the right.
 * Fitting the labels inside 880 would have moved every point on the line.
 */
function TrendChart() {
  return (
    <div className="cjm-chart">
      <svg viewBox="0 0 960 210" width="100%" role="img" aria-label={RD.trend.aria}>
        <line x1="0" x2="880" y1="200" y2="200" stroke="var(--cjm-grid)" strokeWidth="1" />
        <line x1="0" x2="880" y1="173" y2="173" stroke="var(--cjm-grid)" strokeWidth="1" strokeDasharray="5 6" />
        <text x="892" y="177" fontSize="13" fill="var(--cjm-muted)" fontFamily="inherit">
          {COPY.axisLow}
        </text>
        <line x1="0" x2="880" y1="105" y2="105" stroke="var(--cjm-grid)" strokeWidth="1" strokeDasharray="5 6" />
        <text x="892" y="109" fontSize="13" fill="var(--cjm-muted)" fontFamily="inherit">
          {COPY.axisHigh}
        </text>
        <line x1="0" x2="880" y1="51" y2="51" stroke="var(--cjm-green)" strokeWidth="1.5" strokeDasharray="6 5" />
        <text x="892" y="55" fontSize="13" fontWeight="600" fill="var(--cjm-ready-ink)" fontFamily="inherit">
          {COPY.axisReady}
        </text>
        <path d={RD.trend.areaPath} fill="var(--cjm-area)" />
        <path
          d={RD.trend.linePath}
          fill="none"
          stroke="var(--cjm-steel-deep)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={RD.trend.endX}
          cy={RD.trend.endY}
          r="6"
          fill="var(--cjm-white)"
          stroke="var(--cjm-steel-deep)"
          strokeWidth="2.5"
        />
      </svg>
      <div className="cjm-chart__axis" style={{ paddingRight: '8.3%' }}>
        {COPY.axisDates.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  )
}
