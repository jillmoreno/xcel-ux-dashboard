import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_DEPARTMENTS, bucketOf } from '@/data/atlasAdmin/learners'
import { cohortOf, riskOf } from '@/data/atlasAdmin/enterprise'
import { ChartSimple, CircleCheck, FileLinesRegular, TriangleExclamation } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, HEADING, INPUT, PAGE_H1, PAGE_SUB } from './adminStyles'
import { downloadCsv } from './csv'

/**
 * ATLAS ADMIN — ENTERPRISE INSIGHTS (2026-10-20). The reference's
 * /enterprise hub: three cards — Registration & compliance now, Risk &
 * readiness, Cohort progress — and the quick actions into the four reports.
 * Every figure is the store's roster.
 *
 * ⚠ The reference labels this "Financial Services View" and offers an
 * industry switch on its reports that changes only that label. Atlas is
 * insurance, so there is no switch.
 */

export function AtlasAdminEnterprisePage() {
  const { learners, addTouch, showToast } = useAdminStore()
  const [now] = useState(() => Date.now())
  const [creating, setCreating] = useState(false)
  const [more, setMore] = useState(false)
  const [cohorts, setCohorts] = useState<string[]>([])

  const s = useMemo(() => {
    const pipeline = learners.filter((l) => l.stage !== 'licensed')
    const onTrack = pipeline.filter((l) => bucketOf(l) === 'prepared' || (bucketOf(l) === 'in-progress' && l.readiness !== 'low'))
    const atRisk = pipeline.filter((l) => bucketOf(l) === 'off-track')
    const scored = pipeline.filter((l) => l.score !== null)
    const risks = pipeline.map((l) => riskOf(l, now)).filter(Boolean)
    const pending = pipeline.filter((l) => l.examDate && new Date(`${l.examDate}T12:00:00`).getTime() > now)
    const byCohort = new Map<string, number[]>()
    pipeline.forEach((l) => {
      const c = cohortOf(l, now)
      byCohort.set(c, [...(byCohort.get(c) ?? []), l.contentPct ?? 0])
    })
    const all = [...byCohort.values()].flat()
    return {
      pipeline,
      onTrack,
      atRisk,
      avgReadiness: scored.length ? Math.round(scored.reduce((n, l) => n + l.score!, 0) / scored.length) : 0,
      prepared: pipeline.filter((l) => bucketOf(l) === 'prepared').length,
      pending: pending.length,
      risks: risks.length,
      cohorts: byCohort,
      avgProgress: all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0,
    }
  }, [learners, now])

  const remind = () => {
    s.atRisk.forEach((l) => addTouch({ learnerId: l.id, kind: 'nudge', note: 'Enterprise bulk reminder' }))
    showToast(`Reminder sent to ${s.atRisk.length} off-track learners`)
  }
  const exportRoster = () =>
    downloadCsv('cohort-roster.csv', [['Cohort', 'Learner', 'Email', 'Department', 'Content %', 'Prep %'], ...s.pipeline.map((l) => [cohortOf(l, now), l.name, l.email, l.team, l.contentPct ?? 0, l.prepPct ?? 0])])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={PAGE_H1}>Enterprise Insights</h1>
        <p style={PAGE_SUB}>Insurance agency view · pre-licensing pipeline</p>
      </div>
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
        <Panel icon={<CircleCheck size={13} />} tint="var(--admin-success-tint)" ink="var(--admin-success-ink)" title="Registration & compliance now" quote="Show me who is registered and on track right now" info="On track: prepared to pass, or in progress without low practice scores. At risk: off track — done with no prep, or quiet.">
          <Pair a={['Exam ready', s.onTrack.length, 'var(--admin-success-ink)']} b={['At risk', s.atRisk.length, 'var(--admin-brand)']} />
          <Footer
            tone="plain"
            text={`${s.onTrack.length} of ${s.pipeline.length} candidates are on track for exam readiness`}
            sub={`Avg practice score: ${s.avgReadiness}%`}
            link={{ to: `${ADMIN_BASE}/students`, label: 'View details →' }}
          />
        </Panel>
        <Panel icon={<TriangleExclamation size={13} />} tint="var(--admin-amber-tint)" ink="var(--admin-amber)" title="Risk & readiness" quote="Help me understand risk without digging" info="Prepared to pass, exams booked in the future, and every learner a risk rule flags — stalled, slow, failing practice exams, due soon or overdue.">
          <Pair a={['Prepared to pass', s.prepared, 'var(--admin-amber)']} b={['Pending exams', s.pending, 'var(--admin-chart-blue)']} />
          <Footer tone="risk" text={`${s.risks} learners need attention`} sub="Stalled, low velocity, failing practice exams, or exam dates at risk" link={{ to: `${ADMIN_BASE}/enterprise/risk-explorer`, label: 'Explore risk →' }} />
        </Panel>
      </div>

      <Panel icon={<ChartSimple size={13} />} tint="var(--admin-fill)" ink="var(--admin-chart-blue)" title="Cohort progress report" quote="Track groups of learners through their exam prep journey and compare cohort performance." info="A cohort is everyone who enrolled in the same month, plus any cohort you create.">
        <Pair a={['Active cohorts', s.cohorts.size + cohorts.length, 'var(--admin-chart-blue)']} b={['Avg progress', `${s.avgProgress}%`, 'var(--admin-ink)']} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button type="button" onClick={() => setCreating(true)} style={CHIP}>
            Create new cohort
          </button>
          <button type="button" onClick={remind} style={CHIP}>
            Send bulk reminder
          </button>
          <button type="button" onClick={exportRoster} style={CHIP}>
            Export cohort roster
          </button>
          {more ? (
            <button type="button" onClick={() => showToast('Cohort report scheduled for Mondays at 7am')} style={CHIP}>
              Schedule cohort report
            </button>
          ) : (
            <button type="button" onClick={() => setMore(true)} style={CHIP}>
              +1 more
            </button>
          )}
        </div>
        <Link to={`${ADMIN_BASE}/enterprise/compliance`} style={{ alignSelf: 'flex-end', fontSize: 12, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
          View full report →
        </Link>
      </Panel>

      <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--admin-text)' }}>Quick actions</p>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginTop: 10 }}>
          <Quick to="enterprise/risk-explorer" icon={<TriangleExclamation size={12} />} label="View at-risk learners" />
          <Quick to="enterprise/pass-rate" icon={<ChartSimple size={12} />} label="Pass rate analysis" />
          <Quick to="enterprise/audit" icon={<FileLinesRegular size={12} />} label="Export audit report" />
          <Quick to="reports" icon={<FileLinesRegular size={12} />} label="View all reports" />
        </div>
      </section>

      {creating ? (
        <CohortDialog
          onClose={() => setCreating(false)}
          onCreate={(name) => {
            setCohorts((c) => [...c, name])
            setCreating(false)
            showToast(`${name} created`)
          }}
        />
      ) : null}
    </div>
  )
}

function Panel({ icon, tint, ink, title, quote, info, children }: { icon: ReactNode; tint: string; ink: string; title: string; quote: string; info: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section style={{ ...CARD, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 8, background: tint, color: ink }}>
            {icon}
          </span>
          <div>
            <h2 style={{ margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }}>{title}</h2>
            <p style={{ margin: '2px 0 0', fontSize: 11, fontStyle: 'italic', color: 'var(--admin-muted)' }}>“{quote}”</p>
          </div>
        </div>
        <button type="button" aria-label={`About ${title}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} style={{ alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none', color: 'var(--admin-faint)', cursor: 'pointer' }}>
          ⓘ
        </button>
      </div>
      {open ? <p style={{ margin: 0, padding: '8px 10px', borderRadius: 8, background: 'var(--admin-fill-soft)', fontSize: 12, color: 'var(--admin-text)' }}>{info}</p> : null}
      {children}
    </section>
  )
}

function Pair({ a, b }: { a: [string, ReactNode, string]; b: [string, ReactNode, string] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {[a, b].map(([label, value, ink]) => (
        <div key={label} style={{ padding: 12, borderRadius: 10, background: 'var(--admin-fill-soft)' }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--admin-muted)' }}>{label}</span>
          <strong style={{ display: 'block', marginTop: 4, fontFamily: HEADING, fontSize: 22, color: ink }}>{value}</strong>
        </div>
      ))}
    </div>
  )
}

function Footer({ tone, text, sub, link }: { tone: 'plain' | 'risk'; text: string; sub: string; link: { to: string; label: string } }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: tone === 'risk' ? 'var(--admin-brand-tint)' : 'var(--admin-fill-soft)' }}>
      <span>
        <span style={{ display: 'block', fontSize: 12, color: tone === 'risk' ? 'var(--admin-brand)' : 'var(--admin-ink)' }}>{text}</span>
        <span style={{ fontSize: 10, color: tone === 'risk' ? 'var(--admin-brand)' : 'var(--admin-muted)' }}>{sub}</span>
      </span>
      <Link to={link.to + window.location.search} style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', color: 'var(--admin-brand)', textDecoration: 'none' }}>
        {link.label}
      </Link>
    </div>
  )
}

function Quick({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link to={`${ADMIN_BASE}/${to}${window.location.search}`} className="cre-admin-tile" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--admin-rule)', background: 'var(--admin-fill-soft)', fontSize: 12, color: 'var(--admin-ink)', textDecoration: 'none' }}>
      <span aria-hidden style={{ color: 'var(--admin-amber)' }}>{icon}</span>
      {label}
    </Link>
  )
}

function CohortDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  const [dept, setDept] = useState('')
  return (
    <AdminDialog
      title="Create new cohort"
      subtitle="Group learners to track them through exam prep together."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={() => onCreate(name.trim())} style={{ ...BUTTON_BRAND, opacity: name.trim() ? 1 : 0.5 }}>
            Create cohort
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Cohort name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. November Florida class" style={INPUT} />
      </label>
      <label>
        <span style={FIELD_LABEL}>Department (optional)</span>
        <select value={dept} onChange={(e) => setDept(e.target.value)} style={INPUT}>
          <option value="">Any department</option>
          {ADMIN_DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
    </AdminDialog>
  )
}

const CHIP: CSSProperties = { borderRadius: 9999, border: '1px solid var(--admin-rule)', background: 'var(--admin-fill-soft)', padding: '5px 12px', fontFamily: 'inherit', fontSize: 12, color: 'var(--admin-ink)', cursor: 'pointer' }
