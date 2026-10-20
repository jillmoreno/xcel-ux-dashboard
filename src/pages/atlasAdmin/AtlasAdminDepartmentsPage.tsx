import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ADMIN_DEPARTMENTS, ADMIN_USER } from '@/data/atlasAdmin/learners'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, INPUT, PAGE_H1, PAGE_SUB, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — DEPARTMENT COMPARISON (2026-10-20). The reference's
 * /reports/team-comparison: every department in one table, sortable, with
 * Export and Create a department. A row opens Students filtered to it.
 *
 * Every figure is counted off the store's roster, so it agrees with Students:
 * PIPELINE is the department's learners not yet licensed, ENROLLED 7D those
 * who started in the last week, COMPLETION the share who have finished the
 * course content, LICENSED those who passed. The admin's own department sits
 * last, tagged Yours, whatever the sort — the reference keeps it there.
 */

type Row = { name: string; pipeline: number; enrolled7d: number; completion: number; licensed: number; lead: string; yours: boolean }
type SortKey = 'name' | 'pipeline' | 'enrolled7d' | 'completion' | 'licensed' | 'lead'

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: 'name', label: 'Department', numeric: false },
  { key: 'pipeline', label: 'Pipeline', numeric: true },
  { key: 'enrolled7d', label: 'Enrolled 7d', numeric: true },
  { key: 'completion', label: 'Completion', numeric: true },
  { key: 'licensed', label: 'Licensed', numeric: true },
  { key: 'lead', label: 'Lead', numeric: false },
]

export function AtlasAdminDepartmentsPage() {
  const { learners, addedDepartments, addDepartment, showToast } = useAdminStore()
  const navigate = useNavigate()
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'pipeline', dir: -1 })
  const [creating, setCreating] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const named = [...ADMIN_DEPARTMENTS, ...addedDepartments.map((d) => d.name)]
    const leads = new Map<string, string>(addedDepartments.map((d) => [d.name, d.lead]))
    const all = named.map<Row>((name) => {
      const mine = learners.filter((l) => l.team === name)
      const started = mine.filter((l) => l.stage !== 'invite-open' && l.stage !== 'never-started')
      return {
        name,
        pipeline: mine.filter((l) => l.stage !== 'licensed').length,
        enrolled7d: started.filter((l) => l.enrolledDaysAgo <= 7).length,
        completion: mine.length ? Math.round((100 * mine.filter((l) => (l.contentPct ?? 0) >= 100).length) / mine.length) : 0,
        licensed: mine.filter((l) => l.stage === 'licensed').length,
        lead: leads.get(name) ?? name,
        yours: false,
      }
    })
    const sorted = all.sort((a, b) => {
      const av = a[sort.key]
      const bv = b[sort.key]
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
      return cmp * sort.dir || a.name.localeCompare(b.name)
    })
    const own = learners.filter((l) => l.team === ADMIN_USER.department)
    return [
      ...sorted,
      {
        name: ADMIN_USER.department,
        pipeline: own.filter((l) => l.stage !== 'licensed').length,
        enrolled7d: own.filter((l) => l.enrolledDaysAgo <= 7).length,
        completion: 0,
        licensed: own.filter((l) => l.stage === 'licensed').length,
        lead: ADMIN_USER.department.split(' ')[0],
        yours: true,
      },
    ]
  }, [learners, addedDepartments, sort])

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: COLUMNS.find((c) => c.key === key)!.numeric ? -1 : 1 }))

  const open = (name: string) => navigate(`${ADMIN_BASE}/students?${withParam('department', name)}`)

  const exportCsv = () => {
    const head = COLUMNS.map((c) => c.label)
    const body = rows.map((r) => [r.name, r.pipeline, r.enrolled7d, `${r.completion}%`, r.licensed, r.lead])
    const csv = [head, ...body].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'department-comparison.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <Link to={`${ADMIN_BASE}/reports${window.location.search}`} style={CRUMB}>
            Reports
          </Link>
          <h1 style={{ ...PAGE_H1, marginTop: 4 }}>Department comparison</h1>
          <p style={PAGE_SUB}>Every department you can see. Sort and export. Open a row to filter Students.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            Export
          </button>
          <button type="button" onClick={() => setCreating(true)} style={BUTTON_BRAND}>
            Create a department
          </button>
        </div>
      </div>

      <section style={{ ...CARD, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 15 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {COLUMNS.map((c) => {
                  const on = sort.key === c.key
                  return (
                    <th key={c.key} aria-sort={on ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} style={{ ...TH, textAlign: c.numeric ? 'right' : 'left' }}>
                      <button type="button" onClick={() => toggleSort(c.key)} style={{ ...SORT_BUTTON, color: on ? 'var(--admin-ink)' : 'var(--admin-muted)' }}>
                        {c.label}
                        <span aria-hidden style={{ width: 10, opacity: on ? 1 : 0 }}>
                          {sort.dir === 1 ? '↑' : '↓'}
                        </span>
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.name}
                  className="cre-admin-row"
                  tabIndex={0}
                  onClick={() => open(r.name)}
                  onKeyDown={(e) => e.key === 'Enter' && open(r.name)}
                  style={{ borderTop: '1px solid var(--admin-rule)', cursor: 'pointer', background: r.yours ? 'var(--admin-fill-soft)' : undefined }}
                >
                  <td style={{ ...TD, fontWeight: 600, color: 'var(--admin-ink)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {r.name}
                      {r.yours ? <span style={{ ...PILL, background: 'var(--admin-ink)', color: 'var(--admin-surface)' }}>Yours</span> : null}
                    </span>
                  </td>
                  <td style={NUM}>{r.pipeline}</td>
                  <td style={NUM}>{r.enrolled7d}</td>
                  <td style={NUM}>{r.completion}%</td>
                  <td style={NUM}>{r.licensed}</td>
                  <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.lead}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {creating ? (
        <CreateDepartmentDialog
          taken={rows.map((r) => r.name.toLowerCase())}
          onClose={() => setCreating(false)}
          onCreate={(d) => {
            addDepartment(d)
            setCreating(false)
            showToast(`${d.name} created`)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateDepartmentDialog({ taken, onClose, onCreate }: { taken: string[]; onClose: () => void; onCreate: (d: { name: string; lead: string }) => void }) {
  const [name, setName] = useState('')
  const [lead, setLead] = useState('')
  const clash = taken.includes(name.trim().toLowerCase())
  const ready = name.trim() !== '' && lead.trim() !== '' && !clash
  return (
    <AdminDialog
      title="Create a department"
      subtitle="It shows here straight away, empty until you invite learners into it."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!ready} onClick={() => onCreate({ name: name.trim(), lead: lead.trim() })} style={{ ...BUTTON_BRAND, opacity: ready ? 1 : 0.5, cursor: ready ? 'pointer' : 'default' }}>
            Create department
          </button>
        </>
      }
    >
      <label style={{ display: 'block' }}>
        <span style={FIELD_LABEL}>Department name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tampa Westshore" style={INPUT} />
      </label>
      {clash ? <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--admin-brand)' }}>A department with that name already exists.</p> : null}
      <label style={{ display: 'block', marginTop: 16 }}>
        <span style={FIELD_LABEL}>Lead</span>
        <input value={lead} onChange={(e) => setLead(e.target.value)} placeholder="Who runs it" style={INPUT} />
      </label>
    </AdminDialog>
  )
}

/** The current query (the demo flags) with one parameter set over it. */
function withParam(key: string, value: string) {
  const q = new URLSearchParams(window.location.search)
  q.set(key, value)
  return q.toString()
}

const CRUMB: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--admin-muted)', textDecoration: 'none' }
const TH: CSSProperties = { padding: '10px 16px', whiteSpace: 'nowrap' }
const SORT_BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: 0,
  border: 'none',
  background: 'none',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  cursor: 'pointer',
}
const TD: CSSProperties = { padding: '12px 16px' }
const NUM: CSSProperties = { ...TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--admin-ink)' }
