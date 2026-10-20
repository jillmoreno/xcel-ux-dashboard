import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ADMIN_USER, bucketOf, byNeed, formatExamDate, type Learner } from '@/data/atlasAdmin/learners'
import { toIso } from '@/data/atlasAdmin/assignments'
import { BookOpen, CalendarRegular, ChartSimple, Envelope, Sparkles, TriangleExclamation, Users } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { ATLAS_BUTTON_PRIMARY, ATLAS_BUTTON_SECONDARY, BUTTON_BRAND, BUTTON_OUTLINE, EYEBROW, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'
import { STUDENT_FILTER_PARAM } from './AtlasAdminStudentsPage'

/**
 * ATLAS ADMIN — PULSE (2026-10-20). The reference's /pulse (and
 * /pulse/:date, and /admin-insight, which lands here): the Monday briefing,
 * nine cards read top to bottom or stepped with ← and →, each ending in one
 * action. It sits outside the shell, as the reference's does, with its own
 * way back.
 *
 * Every figure is the store's roster: who is off track, who is prepared
 * with and without an exam date, a forecast of licences from the pipeline,
 * exam-prep readiness bands and this week's new enrolments. The industry
 * brief and the course update are editorial — written, not counted.
 *
 * ⚠ DEPARTURES FROM THE REFERENCE: its briefing greets "Sarah" and counts
 * an MLO (mortgage) pipeline of 300-odd. This greets the signed-in admin,
 * and its editorial is an insurance agency's. "Simulator readiness" reads
 * the roster's exam-prep progress, since there are no simulator scores. The
 * customer-success rep, Nicole Anderson, is invented, as the reference's is.
 */

const REP = 'Nicole Anderson'

/** Monday of the week a date falls in. */
function weekOf(iso?: string) {
  const d = iso && /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date()
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toIso(d)
}

export function AtlasAdminPulsePage() {
  const { date } = useParams()
  const { learners, addTouch, showToast, toast } = useAdminStore()
  const navigate = useNavigate()
  const week = weekOf(date)
  const [current, setCurrent] = useState(0)
  const [dialog, setDialog] = useState<'email' | 'brief' | 'ask' | null>(null)
  const [reminded, setReminded] = useState(false)

  const pulse = useMemo(() => {
    const offTrack = learners.filter((l) => bucketOf(l) === 'off-track').sort(byNeed)
    const prepared = learners.filter((l) => bucketOf(l) === 'prepared')
    const dated = prepared.filter((l) => l.examDate)
    const undated = prepared.filter((l) => !l.examDate)
    const inProgress = learners.filter((l) => bucketOf(l) === 'in-progress')
    const licensed = learners.filter((l) => bucketOf(l) === 'licensed')
    const pipeline = learners.filter((l) => bucketOf(l) !== 'licensed').length
    const forecast = licensed.length + Math.round(prepared.length * 0.85 + inProgress.length * 0.35)
    const prep = learners.filter((l) => l.prepPct !== null && l.stage !== 'licensed')
    return {
      offTrack,
      prepared,
      dated,
      undated,
      forecast,
      rate: pipeline ? Math.round((100 * forecast) / (pipeline + licensed.length)) : 0,
      passedAll: prep.filter((l) => (l.prepPct ?? 0) >= 90).length,
      close: prep.filter((l) => (l.prepPct ?? 0) >= 70 && (l.prepPct ?? 0) < 90).length,
      support: prep.filter((l) => (l.prepPct ?? 0) < 70).length,
      newThisWeek: learners.filter((l) => l.enrolledDaysAgo <= 7),
    }
  }, [learners])

  const TOTAL = 9
  const go = (i: number) => {
    const n = Math.max(0, Math.min(TOTAL - 1, i))
    setCurrent(n)
    const el = document.querySelector<HTMLElement>(`[data-pulse-card="${n}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el?.focus({ preventScroll: true })
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || (e.target instanceof Element && e.target.closest('input, textarea, select'))) return
      const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
      if (!step) return
      e.preventDefault()
      go(current + step)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const card = (i: number) => ({ index: i, onFocus: () => setCurrent(i) })
  const students = (filter?: string) => `${ADMIN_BASE}/students${filter ? `?${STUDENT_FILTER_PARAM}=${filter}` : ''}`

  const sendReminders = () => {
    const behind = pulse.offTrack.filter((l) => l.lastActiveDays >= 7)
    behind.forEach((l) => addTouch({ learnerId: l.id, kind: 'nudge', note: 'Pulse auto reminder' }))
    setReminded(true)
    showToast(`Auto reminders sent to ${behind.length} candidates quiet for a week or more`)
  }

  return (
    <div style={PAGE}>
      <header style={TOP}>
        <Link to={`${ADMIN_BASE}/notifications`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
          ← Back to Notifications
        </Link>
        <div style={{ textAlign: 'right' }}>
          <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Atlas Pulse</p>
          <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Week of {week}</span>
        </div>
      </header>

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 64px' }}>
        <p style={{ ...EYEBROW, fontSize: 10 }}>Weekly briefing</p>
        <h1 style={{ margin: '6px 0 4px', fontFamily: HEADING, fontSize: 24, fontWeight: 700, color: 'var(--admin-ink)' }}>Good morning, {ADMIN_USER.name.split(' ')[0]}.</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text)' }}>Licensing pipeline: intervention first, then exam scheduling.</p>
        <nav aria-label="Briefing cards" style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', gap: 4, padding: '12px 0', background: 'var(--admin-page)' }}>
          {Array.from({ length: TOTAL }, (_, i) => (
            <button key={i} type="button" aria-label={`Card ${i + 1}`} aria-current={i === current || undefined} onClick={() => go(i)} style={{ flex: 1, height: 4, padding: 0, border: 'none', borderRadius: 9999, background: i <= current ? 'var(--admin-brand)' : 'var(--admin-rule)', cursor: 'pointer' }} />
          ))}
        </nav>
        <p className="sr-only" aria-live="polite">
          Card {current + 1} of {TOTAL}. Use left and right arrow keys to move between cards.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card {...card(0)} icon={<Sparkles size={13} />} title="Briefing" sub="One-minute overview of what changed this week.">
            <Box label="What changed">
              {pulse.offTrack.length} learners need intervention first; {pulse.prepared.length} are exam ready.
            </Box>
            {/* Hugging their content. */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 8 }}>
              <Figure hug label="Need intervention" value={pulse.offTrack.length} bg={FIGURE_TINT} ink="var(--admin-amber)" />
              <Figure hug label="Exam ready" value={pulse.prepared.length} bg={FIGURE_TINT} ink="var(--admin-success-ink)" />
              <Figure hug label="Forecasted licensed" value={pulse.forecast} bg={FIGURE_TINT} ink="var(--admin-chart-blue)" />
            </div>
            <Action
              button={
                <button type="button" onClick={() => navigate(students())} style={ATLAS_BUTTON_PRIMARY}>
                  Open workspace
                </button>
              }
            >
              Start with intervention, then move exam-ready learners into scheduling.
            </Action>
          </Card>

          <Card {...card(1)} alert icon={<TriangleExclamation size={13} />} title="Need intervention" sub={`${pulse.offTrack.length} candidates need manager attention now.`}>
            <p style={{ margin: 0 }}>
              <strong style={{ fontFamily: HEADING, fontSize: 28, color: 'var(--admin-ink)' }}>{pulse.offTrack.length}</strong> <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>off track — done with no prep, or gone quiet</span>
            </p>
            <Action>Send auto reminders to the candidates quiet for a week or more first, then review the full list.</Action>
            {pulse.offTrack.slice(0, 4).map((l) => (
              <Person key={l.id} learner={l} pill="Off track" tone="amber" line={l.prepPct === null ? 'Course done, prep not started' : `${l.prepPct}% toward exam prep`} />
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" disabled={reminded} onClick={sendReminders} style={{ ...ATLAS_BUTTON_PRIMARY, flex: 1, opacity: reminded ? 0.6 : 1 }}>
                {reminded ? 'Reminders sent' : 'Send auto reminders'}
              </button>
              <Link to={students('quiet7')} style={{ ...ATLAS_BUTTON_SECONDARY, textDecoration: 'none' }}>
                Full list
              </Link>
            </div>
          </Card>

          <Card {...card(2)} icon={<CalendarRegular size={13} />} title="Exam scheduling" sub="Who has a date on file vs. who is ready to book.">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Figure label="Exam date on file" value={pulse.dated.length} bg={FIGURE_TINT} ink="var(--admin-ink)" note="We can track them through exam day." />
              <Figure label="Ready to schedule" value={pulse.undated.length} bg={FIGURE_TINT} ink="var(--admin-success-ink)" note="Prepared, no date yet. The bulk email targets this group." />
            </div>
            <Action>Draft a personal bulk email congratulating {pulse.undated.length} learners and asking them to book, or add their date if they already have one.</Action>
            {pulse.dated.slice(0, 2).map((l) => (
              <Person key={l.id} learner={l} pill="Date on file" tone="green" line={`Exam ${formatExamDate(l.examDate)}`} />
            ))}
            {pulse.undated.slice(0, 3).map((l) => (
              <Person key={l.id} learner={l} pill="Ready to schedule" tone="blue" line={`${l.prepPct ?? 0}% exam prep · no exam date yet`} />
            ))}
            <button type="button" disabled={!pulse.undated.length} onClick={() => setDialog('email')} style={ATLAS_BUTTON_PRIMARY}>
              Draft bulk email to {pulse.undated.length} ready learners
            </button>
          </Card>

          <Card {...card(3)} icon={<ChartSimple size={13} />} title="Forecast" sub="Likely licences and projected rate from the current pipeline.">
            <p style={{ margin: 0 }}>
              <strong style={{ fontFamily: HEADING, fontSize: 28, color: 'var(--admin-ink)' }}>{pulse.forecast}</strong> <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>likely licences</span>
            </p>
            <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>{pulse.rate}% projected rate · Moderate confidence</span>
            <Action>Use the forecast to decide where leadership attention or manager coaching is needed.</Action>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text)' }}>Based on everyone licensed, 85% of the prepared and 35% of those in progress.</p>
            <Link to={`${ADMIN_BASE}/reports/team-comparison`} style={{ ...ATLAS_BUTTON_SECONDARY, alignSelf: 'flex-start', textDecoration: 'none' }}>
              Open forecast by department
            </Link>
          </Card>

          <Card {...card(4)} icon={<BookOpen size={13} />} title="Exam prep readiness" sub="The clearest early signal for exam momentum.">
            <p style={{ margin: 0 }}>
              <strong style={{ fontFamily: HEADING, fontSize: 28, color: 'var(--admin-ink)' }}>{pulse.passedAll}</strong> <span style={{ fontSize: 13, color: 'var(--admin-text)' }}>at 90% or more of exam prep</span>
            </p>
            <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
              {pulse.close} are close (70–89%) · {pulse.support} still need support
            </span>
            <Action>Review who is close and decide where one more push could improve exam readiness.</Action>
            <Link to={students('readyNoDate')} style={{ ...ATLAS_BUTTON_SECONDARY, alignSelf: 'flex-start', textDecoration: 'none' }}>
              Review readiness
            </Link>
          </Card>

          <Card {...card(5)} icon={<Users size={13} />} title="Add new hires" sub={pulse.newThisWeek.length ? `${pulse.newThisWeek.length} enrolled this week.` : 'No new hires waiting for assignments.'}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text)' }}>
              {pulse.newThisWeek.length ? 'Check they are on an assignment rule, so the right course and due date reach them.' : 'Your recent enrolments are assigned. Check back next week.'}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link to={students('new30')} style={{ ...ATLAS_BUTTON_SECONDARY, textDecoration: 'none' }}>
                View new hires
              </Link>
              {pulse.newThisWeek.length ? (
                <Link to={`${ADMIN_BASE}/assignments/new`} style={{ ...ATLAS_BUTTON_PRIMARY, textDecoration: 'none' }}>
                  Assign training
                </Link>
              ) : null}
            </div>
          </Card>

          <Card {...card(6)} icon={<Envelope size={13} />} title="Industry brief" sub="Curated XCEL editorial, not regulatory advice.">
            <span style={{ ...PILL, alignSelf: 'flex-start', fontSize: 10, background: 'var(--admin-fill)', color: 'var(--admin-text)' }}>EDITORIAL · NOT ADVICE</span>
            <strong style={{ fontSize: 15, color: 'var(--admin-ink)' }}>Florida updates its 2-15 Life, Health &amp; Annuities exam outline</strong>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>More weight on annuity suitability and Florida law from January. Learners above 80% prep should book before the switch.</p>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Effective Jan 1, 2027 · XCEL editorial brief</span>
            <button type="button" onClick={() => setDialog('brief')} style={{ ...ATLAS_BUTTON_SECONDARY, alignSelf: 'flex-start' }}>
              View brief
            </button>
          </Card>

          <Card {...card(7)} icon={<BookOpen size={13} />} title="Course content update" sub="New or refreshed content that may affect assigned programs.">
            <strong style={{ fontSize: 15, color: 'var(--admin-ink)' }}>Life &amp; Health Pre-Licensing — practice bank refresh</strong>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>New scenario questions for policy provisions, riders and state law.</p>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Published Oct 13, 2026 · Assigned to every active pre-licensing track.</span>
            <Link to={`${ADMIN_BASE}/resources`} style={{ ...ATLAS_BUTTON_SECONDARY, alignSelf: 'flex-start', textDecoration: 'none' }}>
              Review update
            </Link>
          </Card>

          <Card {...card(8)} icon={<Envelope size={13} />} title="Feedback & ask" sub="A direct line to your customer success rep.">
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text)' }}>Ask a question about this briefing — your customer success rep will follow up within one business day.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 10, background: FIGURE_TINT }}>
              <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 9999, background: 'var(--admin-nav-active-bg)', fontSize: 11, fontWeight: 700, color: 'var(--admin-nav-active-ink)' }}>
                NA
              </span>
              <span>
                <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-ink)' }}>{REP}</strong>
                <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Last contact · This week</span>
              </span>
            </div>
            <Action>Your question helps us improve Pulse and opens the door for more when you need it.</Action>
            <button type="button" onClick={() => setDialog('ask')} style={{ ...ATLAS_BUTTON_PRIMARY, alignSelf: 'flex-start' }}>
              Request a follow-up
            </button>
          </Card>
        </div>
      </main>

      {dialog === 'email' ? (
        <BulkEmailDialog
          count={pulse.undated.length}
          onClose={() => setDialog(null)}
          onSend={() => {
            pulse.undated.forEach((l) => addTouch({ learnerId: l.id, kind: 'email', note: 'Pulse: congratulations, please book your exam' }))
            setDialog(null)
            showToast(`Email sent to ${pulse.undated.length} learners`)
          }}
        />
      ) : null}
      {dialog === 'brief' ? (
        <AdminDialog title="Florida 2-15 exam outline update" subtitle="XCEL editorial brief · Effective Jan 1, 2027" onClose={() => setDialog(null)} footer={<button type="button" onClick={() => setDialog(null)} style={BUTTON_BRAND}>Done</button>}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-ink)' }}>
            The state’s testing vendor is reweighting the 2-15 exam: annuity suitability and Florida insurance law gain questions; general insurance concepts lose a few. Learners who book before January sit the current outline.
          </p>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-ink)' }}>
            What to do: encourage Florida learners above 80% exam prep to book now. XCEL’s Florida course will carry the new outline from December.
          </p>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--admin-muted)' }}>Demo editorial — not a real regulatory notice.</p>
        </AdminDialog>
      ) : null}
      {dialog === 'ask' ? (
        <AskDialog
          onClose={() => setDialog(null)}
          onSend={() => {
            setDialog(null)
            showToast(`Sent to ${REP} — expect a reply within one business day`)
          }}
        />
      ) : null}
      {toast ? (
        <div role="status" style={TOAST}>
          {toast}
        </div>
      ) : null}
    </div>
  )
}

/** `alert` keeps the icon in brand red — Need intervention's warning. */
function Card({ index, icon, title, sub, children, onFocus, alert }: { index: number; icon: ReactNode; title: string; sub: string; children: ReactNode; onFocus: () => void; alert?: boolean }) {
  return (
    <section data-pulse-card={index} tabIndex={-1} onFocus={onFocus} aria-label={`Card ${index + 1}: ${title}`} style={CARD_STYLE}>
      <div style={{ display: 'flex', gap: 10 }}>
        <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, flex: 'none', borderRadius: 8, background: FIGURE_TINT, color: alert ? 'var(--admin-brand)' : 'var(--admin-atlas-neutral-800)' }}>
          {icon}
        </span>
        <div>
          <h2 style={{ margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }}>{title}</h2>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{sub}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

/* Pulse's tinted boxes (figures, What changed, learner rows): Atlas primary 100 at half strength. */
const FIGURE_TINT = 'color-mix(in srgb, var(--admin-atlas-primary-100) 50%, var(--admin-surface))'

/* The small box labels (Need intervention, Action now…): 11 / bold. */
const LABEL: CSSProperties = { ...EYEBROW, fontSize: 11 }

function Box({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: 16, borderRadius: 10, background: FIGURE_TINT }}>
      <p style={{ ...LABEL, color: 'var(--admin-atlas-neutral-800)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-ink)' }}>{children}</p>
    </div>
  )
}

function Figure({ label, value, bg, ink, note, hug }: { label: string; value: number; bg: string; ink: string; note?: string; hug?: boolean }) {
  return (
    <div style={{ padding: 16, borderRadius: 10, background: bg, flex: hug ? 'none' : undefined }}>
      <p style={{ ...LABEL, color: ink }}>{label}</p>
      {/* A 1px rule between title and count, across the content width. */}
      {hug ? <hr style={{ margin: '12px 0 8px', border: 'none', borderTop: '1px solid var(--admin-rule)' }} /> : null}
      <strong style={{ display: 'block', marginTop: 4, fontFamily: HEADING, fontSize: 22, color: 'var(--admin-ink)' }}>{value}</strong>
      {note ? <span style={{ fontSize: 11, color: 'var(--admin-text)' }}>{note}</span> : null}
    </div>
  )
}

/** `button` sits at the box's right, 40px from the text, centred
 *  vertically. */
function Action({ children, button }: { children: ReactNode; button?: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 40, padding: 16, borderRadius: 10, background: 'var(--admin-atlas-secondary-100)' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ ...LABEL, color: 'var(--admin-brand)' }}>Action now</p>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: '18px', color: 'var(--admin-ink)' }}>{children}</p>
      </div>
      {button ? <div style={{ flex: 'none' }}>{button}</div> : null}
    </div>
  )
}

function Person({ learner, pill, tone, line }: { learner: Learner; pill: string; tone: 'amber' | 'green' | 'blue'; line: string }) {
  const colors = { amber: ['var(--admin-amber-tint)', 'var(--admin-amber)'], green: ['var(--admin-success-tint)', 'var(--admin-success-ink)'], blue: ['var(--admin-fill)', 'var(--admin-chart-blue)'] }[tone]
  return (
    <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(learner.id)}`} className="cre-admin-tile" style={{ display: 'block', padding: 16, borderRadius: 10, background: FIGURE_TINT, textDecoration: 'none' }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{learner.name}</strong>
        <span style={{ ...PILL, fontSize: 10, background: colors[0], color: colors[1] }}>● {pill}</span>
      </span>
      <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>{line}</span>
    </Link>
  )
}

function BulkEmailDialog({ count, onClose, onSend }: { count: number; onClose: () => void; onSend: () => void }) {
  const [subject, setSubject] = useState('You’re ready — let’s get your exam booked')
  const [body, setBody] = useState(
    'Hi {first name},\n\nCongratulations — your exam prep says you’re ready for the state exam. The next step is booking your date.\n\nIf you’ve already booked, reply with the date and we’ll add it to your record so we can cheer you on.\n\n— ' + ADMIN_USER.name,
  )
  return (
    <AdminDialog
      title="Draft bulk email"
      subtitle={`To ${count} learners who are prepared with no exam date. {first name} is filled in for each.`}
      width={560}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!subject.trim() || !body.trim()} onClick={onSend} style={BUTTON_BRAND}>
            Send to {count}
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Subject</span>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} style={INPUT} />
      </label>
      <label>
        <span style={FIELD_LABEL}>Message</span>
        <textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
      </label>
    </AdminDialog>
  )
}

function AskDialog({ onClose, onSend }: { onClose: () => void; onSend: () => void }) {
  const [text, setText] = useState('')
  return (
    <AdminDialog
      title={`Ask ${REP}`}
      subtitle="About this briefing, your pipeline, or adding seats."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!text.trim()} onClick={onSend} style={{ ...BUTTON_BRAND, opacity: text.trim() ? 1 : 0.5 }}>
            Send question
          </button>
        </>
      }
    >
      <textarea autoFocus rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your question" style={{ ...INPUT, resize: 'vertical' }} />
    </AdminDialog>
  )
}

const PAGE: CSSProperties = { minHeight: '100vh', background: 'var(--admin-page)', fontFamily: 'var(--font-body)' }
const TOP: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', borderBottom: '1px solid var(--admin-rule)', background: 'var(--admin-surface)' }
const CARD_STYLE: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, padding: 32, borderRadius: 14, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', scrollMarginTop: 40, outline: 'none' }
const TOAST: CSSProperties = { position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', zIndex: 60, padding: '10px 16px', borderRadius: 9999, background: 'var(--admin-ink)', color: 'var(--admin-surface)', fontSize: 13 }
