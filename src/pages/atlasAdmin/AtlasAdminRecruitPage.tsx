import { useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatExamDate, relativeDays, type Learner } from '@/data/atlasAdmin/learners'
import {
  EXAM_VENDOR,
  STATE_EXAM,
  alertsFor,
  alertsStory,
  bannerFor,
  dailyActivity,
  dayLabel,
  firstName,
  journeyFor,
  nudgeLabel,
  readinessPill,
  timeInCourse,
  type Tone,
} from '@/data/atlasAdmin/record'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'
import { AdminTabs, StagePill } from './adminUi'

/**
 * ATLAS ADMIN · A LEARNER'S RECORD — rebuilt from the reference's
 * /students/recruit/:id (2026-10-19). One learner, and what to do about
 * them: the header (contacts, stage and readiness pills, the actions), a
 * one-sentence banner, then two columns — Alerts, Pre-licensing and the
 * Journey; Study coaching, Licensing, Touches, Facts and Records.
 *
 * What works: the nudge (once, then "Nudge sent ✓"), Set exam date and Log a
 * call (dialogs that write to the roster and to Touches), the email links,
 * the progress-report switch, clearing an alert, and the Licensing status.
 * Every part is derived from the learner (`record.ts`), so all 198 read true.
 */

const TONE: Record<Tone, CSSProperties> = {
  red: { background: 'var(--admin-brand-tint)', color: 'var(--admin-brand-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-brand-edge)' },
  amber: { background: 'var(--admin-amber-tint)', color: 'var(--admin-amber)', boxShadow: 'inset 0 0 0 1px var(--admin-amber-edge)' },
  green: { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)', boxShadow: 'inset 0 0 0 1px var(--admin-success-edge)' },
  slate: { background: 'var(--admin-fill)', color: 'var(--admin-slate-700)', boxShadow: 'inset 0 0 0 1px var(--admin-rule)' },
}
const BANNER_EDGE: Record<Tone, [string, string, string]> = {
  red: ['var(--admin-brand-tint)', 'var(--admin-brand-edge)', 'var(--admin-brand)'],
  amber: ['var(--admin-amber-tint)', 'var(--admin-amber-edge)', 'var(--admin-amber)'],
  green: ['var(--admin-success-tint)', 'var(--admin-success-edge)', 'var(--admin-success-ink)'],
  slate: ['var(--admin-fill-soft)', 'var(--admin-rule)', 'var(--admin-muted)'],
}

const LICENSE_STATUSES = ['Unknown', 'Passed exam', 'Not passed', 'Not taken', 'Licensed', 'Denied (background)', 'Appeal filed'] as const

export function AtlasAdminRecruitPage() {
  const { recruitId = '' } = useParams()
  const { learners } = useAdminStore()
  const learner = learners.find((l) => l.id === decodeURIComponent(recruitId))
  const tabs = (
    <AdminTabs
      tabs={[
        { to: `${ADMIN_BASE}/students`, label: 'Students' },
        { to: `${ADMIN_BASE}/invites`, label: 'Invites' },
      ]}
    />
  )
  if (!learner) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {tabs}
        <p style={{ color: 'var(--admin-muted)' }}>
          No learner with that address. <Link to={`${ADMIN_BASE}/students${window.location.search}`}>Back to Students</Link>
        </p>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {tabs}
      {/* Keyed, so moving between records starts each one fresh. */}
      <Record key={learner.id} learner={learner} />
    </div>
  )
}

function Record({ learner: l }: { learner: Learner }) {
  const { updateLearner, touches, addTouch, showToast } = useAdminStore()
  const [nudged, setNudged] = useState(false)
  const [dialog, setDialog] = useState<'exam' | 'call' | null>(null)
  const [cleared, setCleared] = useState<string[]>([])
  const [licenseStatus, setLicenseStatus] = useState<(typeof LICENSE_STATUSES)[number]>(l.stage === 'licensed' ? 'Licensed' : 'Unknown')
  const [licenseNote, setLicenseNote] = useState('')
  const first = firstName(l)
  const banner = bannerFor(l)
  const ready = readinessPill(l)
  const alerts = alertsFor(l).filter((a) => !cleared.includes(a.id))
  const story = alertsStory(l, alerts.length)
  const mine = touches.filter((t) => t.learnerId === l.id)
  const courseDone = l.contentPct === 100
  const time = timeInCourse(l)
  const back = `${ADMIN_BASE}/students${window.location.search}`
  const mail = (subject: string, body: string) =>
    `mailto:${l.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi ${first},\n\n${body}\n\n`)}`
  const [bg, edge, bar] = BANNER_EDGE[banner.tone]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <nav aria-label="Breadcrumb" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <Link to={back} className="cre-admin-soft" style={BACK}>
          ← Back to {l.team}
        </Link>
        <ol style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: 0, padding: 0, listStyle: 'none', fontSize: 13, color: 'var(--admin-text)' }}>
          <li>
            <Link to={back} style={CRUMB}>
              Students
            </Link>
          </li>
          <li style={{ color: 'var(--admin-faint)' }}>/</li>
          <li>
            <Link to={back} style={CRUMB}>
              {l.team}
            </Link>
          </li>
          <li style={{ color: 'var(--admin-faint)' }}>/</li>
          <li style={{ fontWeight: 700, color: 'var(--admin-ink)' }}>{l.name}</li>
        </ol>
      </nav>

      <header style={{ ...BOX }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <h2 style={NAME}>{l.name}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 14.5, color: 'var(--admin-text)' }}>
              {l.course} · {l.team} · {l.hiringManager ? `manager ${l.hiringManager}` : 'no manager'}
            </p>
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', columnGap: 20, rowGap: 4, fontSize: 14 }}>
              <a href={`mailto:${l.email}`} style={CONTACT}>
                {l.email}
              </a>
              {l.phone ? (
                <a href={`tel:${l.phone}`} style={CONTACT}>
                  {l.phone}
                </a>
              ) : (
                <span style={{ color: 'var(--admin-faint)' }}>No phone</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <StagePill stage={l.stage} />
            <span style={{ ...PILL, padding: '4px 12px', ...TONE[ready.tone] }}>{ready.text}</span>
            {l.readiness ? (
              <span
                title="Score is the chapter-quiz and practice-exam trend. Low ≤ 69 · Moderate 70–79 · On Track ≥ 80."
                style={{ ...PILL, padding: '4px 12px', ...TONE[l.readiness === 'on-track' ? 'green' : l.readiness === 'moderate' ? 'amber' : 'red'] }}
              >
                Score · {l.readiness === 'on-track' ? 'On Track' : l.readiness === 'moderate' ? 'Moderate' : 'Low'}
              </span>
            ) : null}
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              disabled={nudged}
              onClick={() => {
                setNudged(true)
                addTouch({ learnerId: l.id, kind: 'nudge', note: nudgeLabel(l) })
                showToast(`${nudgeLabel(l)} · sent to ${first}`)
              }}
              className="cre-admin-brand"
              style={{ ...BUTTON_BRAND, opacity: nudged ? 0.6 : 1, cursor: nudged ? 'default' : 'pointer' }}
            >
              {nudged ? 'Nudge sent ✓' : nudgeLabel(l)}
            </button>
            <button type="button" onClick={() => setDialog('exam')} className="cre-admin-soft" style={SOFT}>
              {l.examDate ? 'Change exam date' : 'Set exam date'}
            </button>
            <button type="button" onClick={() => setDialog('call')} className="cre-admin-soft" style={SOFT}>
              Log a call
            </button>
            <a href={mail('Quick check-in on your course', 'Wanted to check in on your course.')} className="cre-admin-soft" style={SOFT}>
              Email {first.toLowerCase()}
            </a>
          </div>
          <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>Include in progress report</span>
            <button
              type="button"
              role="switch"
              aria-checked={!l.hiddenFromReport}
              onClick={() => updateLearner(l.id, { hiddenFromReport: !l.hiddenFromReport })}
              style={{ ...SWITCH, background: l.hiddenFromReport ? 'var(--admin-rule-strong)' : 'var(--admin-brand)' }}
            >
              <span style={{ ...KNOB, left: l.hiddenFromReport ? 2 : 22 }} />
            </button>
          </label>
        </div>
      </header>

      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, border: `1px solid ${edge}`, background: bg, padding: '16px 16px 16px 20px' }}>
        <span aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 4, background: bar }} />
        <p style={{ margin: 0, fontSize: 16.5, fontWeight: 600, lineHeight: 1.6, color: 'var(--admin-ink)' }}>{banner.text}</p>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="Alerts" aside={story}>
            {alerts.length ? (
              <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
                {alerts.map((a, i) => (
                  <li key={a.id} style={{ padding: '12px 0', borderTop: i ? '1px solid var(--admin-fill)' : undefined }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--admin-ink)' }}>
                          {a.title}
                          <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--admin-faint)' }}>Fired {dayLabel(a.firedDaysAgo)}</span>
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>{a.body}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{a.move}</p>
                      </div>
                      <div style={{ display: 'flex', flex: 'none', gap: 6 }}>
                        <a href={mail(`Check-in · ${a.title}`, `Wanted to check in. ${a.title} came up on your study path.`)} style={SMALL_SOFT}>
                          Email
                        </a>
                        <button type="button" onClick={() => setCleared((c) => [...c, a.id])} style={SMALL_PLAIN}>
                          Clear
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={MUTED}>No open alerts.</p>
            )}
          </Card>

          <Card title="Pre-licensing" aside="From Compass. Course, then exam prep, then simulations.">
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Bar label="Pre-licensing course" pct={l.contentPct ?? 0} note={courseDone ? 'Certification exam complete' : l.contentPct ? 'Opens the lesson list' : 'Not opened'} />
              {courseDone ? (
                <Bar label="Exam prep" pct={l.prepPct ?? 0} />
              ) : (
                <Locked label="Exam prep" text="Unlocks when the pre-licensing course is complete" />
              )}
              {courseDone ? (
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>Simulations</p>
                  <SimRow name="Simulator 1" passed={(l.prepPct ?? 0) >= 60} />
                  <SimRow name="Simulator 2" passed={(l.prepPct ?? 0) >= 80} lockedNote={(l.prepPct ?? 0) >= 60 ? null : 'Unlocks when simulator 1 is passed'} />
                </div>
              ) : (
                <Locked label="Simulations" text="Unlocks when the pre-licensing course is complete" />
              )}
            </div>
          </Card>

          <Card title="Journey">
            <ol style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
              {journeyFor(l).map((s, i, all) => (
                <li key={s.label} style={{ position: 'relative', display: 'flex', gap: 12, paddingBottom: i === all.length - 1 ? 0 : 12 }}>
                  {i < all.length - 1 ? (
                    <span aria-hidden style={{ position: 'absolute', left: 4, top: 12, bottom: 0, width: 2, background: s.state === 'done' ? 'var(--admin-success-ink)' : 'var(--admin-rule)' }} />
                  ) : null}
                  <span aria-hidden style={{ ...DOT, ...(s.state === 'done' ? DOT_DONE : s.state === 'now' ? DOT_NOW : null) }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: s.state === 'now' ? 'var(--admin-brand)' : s.state === 'done' ? 'var(--admin-ink)' : 'var(--admin-faint)' }}>
                      {s.label}
                      {s.state === 'now' ? <span style={NOW}>Now</span> : null}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 12, color: s.state === 'now' ? 'var(--admin-brand)' : 'var(--admin-muted)' }}>{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => showToast('Custom steps are next in the rebuild')} style={{ ...LINKISH, marginTop: 12, color: 'var(--admin-faint)' }}>
              Add a step
            </button>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title="Study coaching"
            sub="Score · quiz + practice trend"
            aside={
              <span style={{ fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>
                {l.score === null ? '—' : `${l.score} · ${l.readiness === 'on-track' ? 'On Track' : l.readiness === 'moderate' ? 'Moderate' : 'Low'}`}
              </span>
            }
          >
            <div style={{ marginTop: 12 }}>
              <div style={{ position: 'relative', display: 'flex', height: 6, borderRadius: 9999, overflow: 'hidden' }}>
                <span style={{ flex: 69, background: 'var(--admin-brand)' }} />
                <span style={{ flex: 10, background: 'var(--admin-amber)' }} />
                <span style={{ flex: 21, background: 'var(--admin-success-ink)' }} />
              </div>
              {l.score !== null ? (
                <div style={{ position: 'relative', height: 8 }}>
                  <span aria-hidden style={{ position: 'absolute', left: `calc(${l.score}% - 4px)`, top: 0, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '6px solid var(--admin-ink)' }} />
                </div>
              ) : null}
              <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Low ≤ 69 · Moderate 70–79 · On Track ≥ 80</p>
            </div>
            <div style={{ marginTop: 12, borderRadius: 10, background: 'var(--admin-fill-soft)', padding: '4px 12px' }}>
              <Fact label="Time in course" value={time ? `${time.h}h` : '0h'} />
              <Fact label="Course progress" value={`${l.contentPct ?? 0}%`} />
              <Fact label="Exam prep" value={l.prepPct === null ? 'Prep not started' : `${l.prepPct}%`} />
              <Fact label="Simulations" value={`${(l.prepPct ?? 0) >= 80 ? 2 : (l.prepPct ?? 0) >= 60 ? 1 : 0} of 2 passed`} last />
            </div>
            <div style={{ marginTop: 8 }}>
              <Fact
                label="Exam date"
                value={
                  l.examDate ? (
                    formatExamDate(l.examDate)
                  ) : (
                    <button type="button" onClick={() => setDialog('exam')} style={{ ...PILL, border: 'none', cursor: 'pointer', ...TONE.red }}>
                      Not set · set it
                    </button>
                  )
                }
              />
              <Fact label="Chapter quiz average" value={l.score === null ? '—' : `${l.score}%`} />
              <Fact
                label="Practice exam"
                value={l.prepPct ? `${Math.min(99, (l.score ?? 70) + 2)}%` : <span style={{ color: 'var(--admin-brand)', fontWeight: 600 }}>Prep not started</span>}
              />
              <Fact label="Readiness exam" value={(l.prepPct ?? 0) >= 80 ? 'Passed' : 'Locked until prep'} last />
            </div>
            <p style={{ margin: '16px 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>Daily activity · last 14 days</p>
            <Activity values={dailyActivity(l)} />
            <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>
              {dailyActivity(l).some(Boolean) ? `Last study ${dayLabel(l.lastActiveDays)}.` : 'No study time in the last 14 days.'}
            </p>
          </Card>

          {courseDone ? (
            <section style={{ ...BOX, ...(licenseStatus === 'Unknown' ? { background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-edge)' } : null) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <h3 style={CARD_TITLE}>Licensing</h3>
                <span style={{ ...PILL, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 11, ...TONE[licenseStatus === 'Licensed' ? 'green' : licenseStatus === 'Unknown' ? 'red' : 'slate'] }}>
                  {licenseStatus}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>Licensed is set by an admin. Passing the exam is not a license.</p>
              {licenseStatus === 'Unknown' ? (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--admin-ink)' }}>
                  Course complete, and nobody has the exam result. If {first} already sat the {l.state} exam, this page is out of date. Ask how it went.
                </p>
              ) : null}
              <div style={{ marginTop: 12 }}>
                <label style={FIELD_LABEL} htmlFor={`status-${l.id}`}>
                  Status
                </label>
                <select
                  id={`status-${l.id}`}
                  value={licenseStatus}
                  onChange={(e) => setLicenseStatus(e.target.value as (typeof LICENSE_STATUSES)[number])}
                  style={INPUT}
                >
                  {LICENSE_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={FIELD_LABEL} htmlFor={`note-${l.id}`}>
                  Note
                </label>
                <textarea id={`note-${l.id}`} rows={2} value={licenseNote} onChange={(e) => setLicenseNote(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
              </div>
              <p style={{ ...FIELD_LABEL, margin: '12px 0 4px' }}>State next step</p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-ink)' }}>{STATE_EXAM[l.state]}</p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (licenseStatus === 'Licensed') updateLearner(l.id, { stage: 'licensed' })
                    showToast(`Saved · ${licenseStatus}`)
                  }}
                  className="cre-admin-brand"
                  style={{ ...BUTTON_BRAND, padding: '6px 14px', fontSize: 13 }}
                >
                  Enter exam result
                </button>
                <a href={mail('How did the exam go?', `How did the ${STATE_EXAM[l.state]} go?`)} className="cre-admin-soft" style={{ ...SOFT, padding: '6px 14px', fontSize: 13 }}>
                  Ask how it went
                </a>
              </div>
            </section>
          ) : null}

          <Card title="Touches">
            {mine.length ? (
              <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                {mine.map((t) => (
                  <li key={t.id} style={{ padding: '8px 0', borderTop: '1px solid var(--admin-fill)', fontSize: 13, color: 'var(--admin-ink)' }}>
                    <strong style={{ fontWeight: 600 }}>{t.kind === 'call' ? 'Call logged' : t.kind === 'exam-date' ? 'Exam date set' : t.kind === 'email' ? 'Email' : 'Nudge sent'}</strong>
                    <span style={{ color: 'var(--admin-muted)' }}> · today{t.note ? ` · ${t.note}` : ''}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ ...MUTED, color: 'var(--admin-text)' }}>
                No nudge or call yet.{' '}
                <button type="button" onClick={() => setDialog('call')} style={{ ...LINKISH, color: 'var(--admin-brand)' }}>
                  Log a call
                </button>
              </p>
            )}
          </Card>

          <Card title="Facts">
            <div style={{ marginTop: 8 }}>
              <Fact label="Time in course" value={time && (time.h || time.m) ? `${time.h}h ${time.m}m` : 'Not opened'} />
              <Fact
                label="Last active"
                value={<span style={{ color: l.lastActiveDays >= 7 && l.stage !== 'licensed' ? 'var(--admin-brand)' : undefined }}>{relativeDays(l.lastActiveDays)}</span>}
              />
              <Fact label={l.contentPct ? 'Finish by' : 'Starts by'} value={dayLabel(l.enrolledDaysAgo - 30)} />
              <Fact label="Exam ID" value={<span style={{ color: 'var(--admin-brand)' }}>{EXAM_VENDOR[l.state]} · SSN last 4 missing</span>} last />
            </div>
          </Card>

          <Card title="Records" sub="State-approved completions. These persist when an entitlement expires, is revoked, or is refunded. Progress percents on this page are from Compass.">
            {courseDone ? (
              <div style={{ marginTop: 12 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>
                  {l.state} Life and Health QE 2026.1 · {l.state} · passed
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>
                  {dayLabel(Math.max(l.lastActiveDays, 3))}, 2026 · criterion {l.state}-QE-2026.1
                </p>
              </div>
            ) : (
              <p style={MUTED}>No completion records yet.</p>
            )}
          </Card>
        </div>
      </div>

      {dialog === 'exam' ? <ExamDateDialog learner={l} onClose={() => setDialog(null)} /> : null}
      {dialog === 'call' ? <LogCallDialog learner={l} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function ExamDateDialog({ learner: l, onClose }: { learner: Learner; onClose: () => void }) {
  const { updateLearner, addTouch, showToast } = useAdminStore()
  const [date, setDate] = useState(l.examDate ?? '')
  const [vendor, setVendor] = useState('Not set')
  const [state, setState] = useState<string>(l.state)
  return (
    <AdminDialog
      title="Set exam date"
      subtitle="1 recruit · keeps the outcome visible in digests."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!date}
            onClick={() => {
              updateLearner(l.id, { examDate: date })
              addTouch({ learnerId: l.id, kind: 'exam-date', note: `${formatExamDate(date)}${vendor !== 'Not set' ? ` · ${vendor}` : ''}` })
              showToast(`Exam date set · ${formatExamDate(date)}`)
              onClose()
            }}
            style={{ ...BUTTON_BRAND, opacity: date ? 1 : 0.5 }}
          >
            Save
          </button>
        </>
      }
    >
      <div>
        <label style={FIELD_LABEL} htmlFor="exam-date">
          Exam date
        </label>
        <input id="exam-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={INPUT} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={FIELD_LABEL} htmlFor="exam-vendor">
            Vendor
          </label>
          <select id="exam-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} style={INPUT}>
            {['Not set', 'PSI', 'Prometric', 'Pearson VUE'].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={FIELD_LABEL} htmlFor="exam-state">
            State
          </label>
          <select id="exam-state" value={state} onChange={(e) => setState(e.target.value)} style={INPUT}>
            {['NY', 'NJ', 'PA', 'FL'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </AdminDialog>
  )
}

function LogCallDialog({ learner: l, onClose }: { learner: Learner; onClose: () => void }) {
  const { addTouch, showToast } = useAdminStore()
  const [note, setNote] = useState('')
  return (
    <AdminDialog
      title="Log a call"
      subtitle={`${l.name} · shows under Touches and clears the "no call logged" flag.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              addTouch({ learnerId: l.id, kind: 'call', note: note.trim() || null })
              showToast(`Call logged for ${firstName(l)}`)
              onClose()
            }}
            style={BUTTON_BRAND}
          >
            Log call
          </button>
        </>
      }
    >
      <div>
        <label style={FIELD_LABEL} htmlFor="call-note">
          Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
        </label>
        <textarea id="call-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
      </div>
    </AdminDialog>
  )
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Card({ title, sub, aside, children }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section style={BOX}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 12, rowGap: 4 }}>
        <div>
          <h3 style={CARD_TITLE}>{title}</h3>
          {sub ? <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{sub}</p> : null}
        </div>
        {typeof aside === 'string' ? <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>{aside}</p> : aside}
      </div>
      {children}
    </section>
  )
}

function Bar({ label, pct, note }: { label: string; pct: number; note?: string }) {
  return (
    <div>
      <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ fontWeight: 600, color: 'var(--admin-ink)' }}>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--admin-muted)' }}>{pct}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 9999, background: 'var(--admin-fill)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 9999, background: 'var(--admin-success-ink)' }} />
      </div>
      {note ? <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{note}</p> : null}
    </div>
  )
}

function Locked({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{text}</p>
    </div>
  )
}

function SimRow({ name, passed, lockedNote }: { name: string; passed: boolean; lockedNote?: string | null }) {
  return (
    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, border: '1px solid var(--admin-rule)', padding: '8px 12px', fontSize: 13 }}>
      <span style={{ color: lockedNote ? 'var(--admin-muted)' : 'var(--admin-ink)' }}>
        {name}
        {lockedNote ? ` · ${lockedNote}` : ''}
      </span>
      {lockedNote ? null : <span style={{ color: passed ? 'var(--admin-success-ink)' : 'var(--admin-muted)', fontWeight: passed ? 600 : 400 }}>{passed ? 'Passed' : 'Not passed'}</span>}
    </div>
  )
}

function Fact({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: last ? undefined : '1px solid var(--admin-fill)', fontSize: 13 }}>
      <span style={{ color: 'var(--admin-text)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--admin-ink)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function Activity({ values }: { values: number[] }) {
  const max = Math.max(60, ...values)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 48 }} aria-label="Study minutes, last 14 days" role="img">
        {values.map((v, i) => (
          <span key={i} title={`${dayLabel(13 - i)} · ${v} min`} style={{ flex: 1, height: v ? `${Math.max(8, (v / max) * 100)}%` : 2, borderRadius: 3, background: v ? 'var(--admin-success-ink)' : 'var(--admin-rule)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--admin-faint)' }}>
        <span>{dayLabel(13)}</span>
        <span>today</span>
      </div>
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const BOX: CSSProperties = { borderRadius: 12, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', padding: 16 }
const CARD_TITLE: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }
const NAME: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 30, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.025em', color: 'var(--admin-ink)' }
const CONTACT: CSSProperties = { fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }
const MUTED: CSSProperties = { margin: '8px 0 0', fontSize: 13, color: 'var(--admin-muted)' }
const BACK: CSSProperties = {
  display: 'inline-flex',
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  border: '1px solid var(--admin-rule)',
  background: 'var(--admin-surface)',
  padding: '6px 12px',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--admin-brand)',
  textDecoration: 'none',
}
const CRUMB: CSSProperties = { color: 'var(--admin-text)', textDecoration: 'none' }
const SOFT: CSSProperties = {
  ...BUTTON_OUTLINE,
  border: '1px solid var(--admin-brand-soft-edge)',
  color: 'var(--admin-brand)',
  textDecoration: 'none',
}
const SMALL_SOFT: CSSProperties = {
  whiteSpace: 'nowrap',
  borderRadius: 9999,
  border: '1px solid var(--admin-brand-soft-edge)',
  background: 'var(--admin-surface)',
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--admin-brand)',
  textDecoration: 'none',
}
const SMALL_PLAIN: CSSProperties = { ...SMALL_SOFT, border: '1px solid var(--admin-rule)', color: 'var(--admin-text)', cursor: 'pointer' }
const SWITCH: CSSProperties = { position: 'relative', width: 44, height: 24, border: 'none', borderRadius: 9999, padding: 0, cursor: 'pointer' }
const KNOB: CSSProperties = { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'var(--admin-surface)', boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)', transition: 'left 120ms ease' }
const LINKISH: CSSProperties = { padding: 0, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const DOT: CSSProperties = { position: 'relative', zIndex: 1, flex: 'none', marginTop: 3, width: 10, height: 10, borderRadius: '50%', border: '2px solid var(--admin-rule)', background: 'var(--admin-surface)', boxSizing: 'border-box' }
const DOT_DONE: CSSProperties = { border: '2px solid var(--admin-success-ink)', background: 'var(--admin-success-ink)' }
const DOT_NOW: CSSProperties = { border: '2px solid var(--admin-brand)', background: 'var(--admin-surface)' }
const NOW: CSSProperties = { marginLeft: 6, borderRadius: 9999, background: 'var(--admin-brand)', color: 'var(--admin-surface)', padding: '1px 6px', fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', verticalAlign: 'middle' }
