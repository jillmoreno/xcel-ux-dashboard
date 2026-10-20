import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addDays, audienceLabel, formatDay, matchAudience, trainingById, type AssignmentRule } from '@/data/atlasAdmin/assignments'
import type { Learner } from '@/data/atlasAdmin/learners'
import { ArrowLeft, BookOpen, CalendarRegular, Envelope, PenToSquare, Users } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — ONE ASSIGNMENT RULE (2026-10-20). The reference's
 * /assignments/rules/:id: the rule's tags, then Training, Audience, Schedule
 * and Notifications cards, then the learners it enrolled, each with Adjust
 * schedule. Edit rule opens the wizard on it; Archive / Restore moves it
 * between the list's two tabs.
 *
 * The learners are the roster people its audience matches, capped at the
 * rule's enrolment — so a rule's list and the wizard's impact agree.
 */

export function AtlasAdminRulePage() {
  const { ruleId } = useParams()
  const { rules, learners, saveRule, showToast } = useAdminStore()
  const navigate = useNavigate()
  const rule = rules.find((r) => r.id === ruleId)
  const [coursesOpen, setCoursesOpen] = useState(true)
  const [adjusting, setAdjusting] = useState<Learner | null>(null)
  const [dueFor, setDueFor] = useState<Record<string, string>>({})
  const [showAll, setShowAll] = useState(false)

  const enrolled = useMemo(() => (rule ? matchAudience(rule.audience, learners).matched.slice(0, rule.students) : []), [rule, learners])

  if (!rule) {
    return (
      <div style={{ ...CARD, padding: 32, textAlign: 'center' }}>
        <p style={{ margin: 0, color: 'var(--admin-text)' }}>That rule does not exist.</p>
        <Link to={`${ADMIN_BASE}/assignments${window.location.search}`} style={{ ...BUTTON_OUTLINE, marginTop: 16, textDecoration: 'none' }}>
          Back to assignments
        </Link>
      </div>
    )
  }

  const due = addDays(rule.schedule.start, rule.schedule.dueOffsetDays)
  const training = trainingById(rule.trainingIds[0])
  const toggleArchive = () => {
    const next: AssignmentRule = { ...rule, status: rule.status === 'active' ? 'archived' : 'active' }
    saveRule(next)
    showToast(next.status === 'archived' ? 'Rule archived — it stops assigning' : 'Rule restored')
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Link to={`${ADMIN_BASE}/assignments${window.location.search}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--admin-text)', textDecoration: 'none' }}>
            <ArrowLeft size={12} aria-hidden /> Back to assignments
          </Link>
          <h1 style={{ margin: '10px 0 0', fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>{rule.name}</h1>
          <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--admin-text)' }}>{rule.description || 'No description provided for this assignment rule.'}</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ ...TAG, ...(rule.status === 'active' ? { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)' } : null) }}>{rule.status === 'active' ? 'Active' : 'Archived'}</span>
            <span style={TAG}>{rule.schedule.kind === 'ongoing' ? 'Ongoing automation' : 'One-time assignment'}</span>
            <span style={TAG}>Calendar dates</span>
            <span style={{ ...TAG, background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' }}>{rule.students} learners</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={toggleArchive} style={BUTTON_OUTLINE}>
            {rule.status === 'active' ? 'Archive' : 'Restore'}
          </button>
          <Link to={`${ADMIN_BASE}/reports${window.location.search}`} style={{ ...BUTTON_OUTLINE, background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-soft-edge)', color: 'var(--admin-brand)', textDecoration: 'none' }}>
            Open training health
          </Link>
          <button type="button" onClick={() => navigate(`${ADMIN_BASE}/assignments/rules/${rule.id}/edit${window.location.search}`)} style={BUTTON_BRAND}>
            <PenToSquare size={12} aria-hidden /> Edit rule
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <Panel icon={<BookOpen size={12} aria-hidden />} title="Training">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-ink)' }}>{training?.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>{training?.kind === 'program' ? 'Training program' : `Online course · ${training?.minutes} min`}</p>
          {training?.courses ? (
            <>
              <button type="button" onClick={() => setCoursesOpen((o) => !o)} style={LINK_BUTTON}>
                {training.courses.length} courses in program {coursesOpen ? '⌃' : '⌄'}
              </button>
              {coursesOpen ? (
                <table style={{ width: '100%', marginTop: 8, borderCollapse: 'collapse', fontSize: 12, border: '1px solid var(--admin-rule)' }}>
                  <thead style={{ background: 'var(--admin-fill-soft)' }}>
                    <tr>
                      {['Course', 'Type', 'Due'].map((h) => (
                        <th key={h} style={{ ...EYEBROW, fontSize: 9, padding: '8px 10px', textAlign: 'left' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {training.courses.map((c) => (
                      <tr key={c.name} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                        <td style={CELL}>{c.name}</td>
                        <td style={{ ...CELL, color: 'var(--admin-text)' }}>{c.type}</td>
                        <td style={{ ...CELL, color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>{formatDay(addDays(rule.schedule.start, c.dueDays))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </>
          ) : null}
        </Panel>
        <Panel icon={<Users size={12} aria-hidden />} title="Audience">
          <p style={{ ...EYEBROW, fontSize: 9 }}>Included</p>
          <span style={{ ...TAG, display: 'inline-block', margin: '6px 0 12px' }}>{audienceLabel(rule.audience)}</span>
          <p style={{ ...EYEBROW, fontSize: 9 }}>Excluded</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>{rule.audience.excludeDepartments.length ? rule.audience.excludeDepartments.join(', ') : 'None'}</p>
        </Panel>
        <Panel icon={<CalendarRegular size={12} aria-hidden />} title="Schedule">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              ['Start', rule.schedule.start],
              ['Due', due],
              ['End', rule.schedule.end],
            ].map(([k, v]) => (
              <div key={k}>
                <p style={{ ...EYEBROW, fontSize: 9 }}>{k}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-ink)' }}>{formatDay(v)}</p>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>
            {rule.schedule.kind === 'one-time' ? 'Fixed start, due, and end dates apply to all matched learners.' : `Each learner is due ${rule.schedule.dueOffsetDays} days after they are assigned.`}
          </p>
        </Panel>
        <Panel icon={<Envelope size={12} aria-hidden />} title="Notifications">
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-ink)' }}>{rule.email}</p>
        </Panel>
      </div>

      <Panel icon={<Users size={12} aria-hidden />} title={`Learners (${enrolled.length})`} aside={<span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Matched against today’s roster</span>}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {(showAll ? enrolled : enrolled.slice(0, 8)).map((l) => {
            const pct = l.stage === 'licensed' ? 100 : (l.contentPct ?? 0)
            const status = pct >= 100 ? 'Completed' : l.lastActiveDays > 7 ? 'At risk' : pct > 0 ? 'In progress' : 'Not started'
            return (
              <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid var(--admin-rule)' }}>
                <div>
                  <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`} style={{ fontSize: 13, color: 'var(--admin-ink)', textDecoration: 'none' }}>
                    {l.name}
                  </Link>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>
                    {status} · {pct}% · Due {formatDay(dueFor[l.id] ?? due)}
                  </p>
                </div>
                <button type="button" onClick={() => setAdjusting(l)} style={{ ...LINK_BUTTON, marginTop: 0 }}>
                  Adjust schedule
                </button>
              </li>
            )
          })}
          {enrolled.length === 0 ? <li style={{ padding: '10px 0', fontSize: 13, color: 'var(--admin-muted)' }}>No one on the roster matches this rule today.</li> : null}
        </ul>
        {enrolled.length > 8 ? (
          <button type="button" onClick={() => setShowAll((s) => !s)} style={LINK_BUTTON}>
            {showAll ? 'Show fewer' : `Show all ${enrolled.length}`}
          </button>
        ) : null}
      </Panel>

      {adjusting ? (
        <AdjustDialog
          learner={adjusting}
          due={dueFor[adjusting.id] ?? due}
          onClose={() => setAdjusting(null)}
          onSave={(iso) => {
            setDueFor((m) => ({ ...m, [adjusting.id]: iso }))
            showToast(`${adjusting.name} is now due ${formatDay(iso)}`)
            setAdjusting(null)
          }}
        />
      ) : null}
    </div>
  )
}

function AdjustDialog({ learner, due, onClose, onSave }: { learner: Learner; due: string; onClose: () => void; onSave: (iso: string) => void }) {
  const [value, setValue] = useState(due)
  return (
    <AdminDialog
      title="Adjust schedule"
      subtitle={`A new due date for ${learner.name} on this rule only.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" onClick={() => value && onSave(value)} style={BUTTON_BRAND}>
            Save due date
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Due date</span>
        <input type="date" value={value} onChange={(e) => setValue(e.target.value)} style={INPUT} />
      </label>
    </AdminDialog>
  )
}

function Panel({ icon, title, aside, children }: { icon: ReactNode; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>
          <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 22, height: 22, borderRadius: 6, border: '1px solid var(--admin-rule)', color: 'var(--admin-text)' }}>
            {icon}
          </span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

const TAG: CSSProperties = { ...PILL, fontSize: 11, padding: '2px 8px', background: 'var(--admin-fill)', color: 'var(--admin-text)' }
const CELL: CSSProperties = { padding: '8px 10px', color: 'var(--admin-ink)' }
const LINK_BUTTON: CSSProperties = { marginTop: 10, padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }
