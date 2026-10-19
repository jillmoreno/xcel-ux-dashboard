import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Clone, Download, Envelope, MagnifyingGlass, Play, Plus, ShareNodes, Star, StarSolid, XmarkRegular, CalendarRegular } from '@/icons'
import { ADMIN_REPORTS, REPORT_COLUMNS, reportRows, type ReportCategory, type ReportDef } from '@/data/xcelAdmin/reports'
import { AdminDialog } from './AdminDialog'
import { CadenceDialog, PeopleDialog } from './adminDialogs'
import { ADMIN_BASE, ADMIN_EMAIL, DAYS, TIMES, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT, PAGE_SUB, PILL } from './adminStyles'
import { ChipMenu, MenuItem } from './adminUi'

/**
 * XCEL ADMIN · REPORTS — rebuilt from colibri-b2b.vercel.app/reports
 * (2026-10-19). Three parts, as the reference:
 *
 *   - the PROGRESS REPORT set up in onboarding: on or off, its four counts
 *     (each View opens Students filtered to it), its cadence and who gets it;
 *   - the PIPELINE TABLES (Department comparison, My department);
 *   - the LIBRARY — fifteen reports to favourite, filter, sort, search, run,
 *     share, schedule and duplicate, with a Scheduled tab and Create Report.
 *
 * Running a report shows it in place — "Running report…", then the rows,
 * built from the admin roster — with filters, Export (CSV) and the actions.
 */

const CATEGORIES: ReportCategory[] = ['Progress', 'Completion', 'Compliance', 'Insurance', 'Audit']

export function XcelAdminReportsPage() {
  const { learners, showToast } = useAdminStore()
  const [reports, setReports] = useState<ReportDef[]>(() => ADMIN_REPORTS.map((r) => ({ ...r })))
  const [running, setRunning] = useState<ReportDef | null>(null)
  const { progressReport, setProgressReport } = useAdminStore()
  const { active, day, time, people } = progressReport
  const cadence = { day, time }
  const setActive = (f: (a: boolean) => boolean) => setProgressReport({ active: f(active) })
  const setCadence = (v: { day: string; time: string }) => setProgressReport(v)
  const setPeople = (v: string[]) => setProgressReport({ people: v })
  const [dialog, setDialog] = useState<null | 'cadence' | 'people' | 'create' | { schedule: ReportDef }>(null)
  const [tab, setTab] = useState<'library' | 'scheduled'>('library')
  const [category, setCategory] = useState<ReportCategory | 'all'>('all')
  const [sort, setSort] = useState<'name' | 'category' | 'lastRun'>('name')
  const [search, setSearch] = useState('')

  const nudgeCounts = useMemo(() => {
    const live = learners.filter((l) => l.stage !== 'licensed' && !l.hiddenFromReport)
    return [
      { key: 'quiet7', label: 'No activity in the last 7 days', n: live.filter((l) => l.lastActiveDays >= 7).length },
      { key: 'low', label: 'Trending low', n: live.filter((l) => l.readiness === 'low').length },
      { key: 'quiet2', label: 'Quiet 2 days', n: live.filter((l) => l.lastActiveDays >= 2).length },
      { key: 'readyNoDate', label: 'Ready, no exam date', n: live.filter((l) => l.stage === 'ready-to-test' && !l.examDate).length },
    ]
  }, [learners])
  const totalNudges = nudgeCounts.reduce((a, c) => a + c.n, 0)

  const list = useMemo(() => {
    const q = search.trim().toLowerCase()
    const base = reports.filter(
      (r) => (tab === 'library' || r.scheduled) && (category === 'all' || r.category === category) && (!q || `${r.name} ${r.description}`.toLowerCase().includes(q)),
    )
    const by = (a: ReportDef, b: ReportDef) =>
      sort === 'category' ? a.category.localeCompare(b.category) || a.name.localeCompare(b.name) : sort === 'lastRun' ? Date.parse(b.lastRun) - Date.parse(a.lastRun) : a.name.localeCompare(b.name)
    // Favourites first, as the reference lists them.
    return base.sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || by(a, b))
  }, [reports, tab, category, sort, search])

  const patch = (id: string, p: Partial<ReportDef>) => setReports((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)))
  const duplicate = (r: ReportDef) => {
    setReports((rs) => [...rs, { ...r, id: `${r.id}-copy-${rs.length}`, name: `${r.name} (copy)`, favorite: false, scheduled: undefined, isNew: true }])
    showToast(`Duplicated · ${r.name}`)
  }
  const share = (r: ReportDef) => {
    void navigator.clipboard?.writeText(`${window.location.origin}${ADMIN_BASE}/reports?report=${r.id}`)
    showToast(`Link to ${r.name} copied`)
  }

  if (running) {
    return (
      <ReportRun
        report={running}
        onBack={() => setRunning(null)}
        onSchedule={() => setDialog({ schedule: running })}
        onShare={() => share(running)}
        onDuplicate={() => duplicate(running)}
        dialog={
          dialog && typeof dialog === 'object' ? (
            <ScheduleDialog
              report={dialog.schedule}
              onClose={() => setDialog(null)}
              onSave={(when) => {
                patch(dialog.schedule.id, { scheduled: when })
                showToast(`${dialog.schedule.name} · scheduled ${when}`)
                setDialog(null)
              }}
            />
          ) : null
        }
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>Reports Library</h2>
          <p style={PAGE_SUB}>Run, schedule, share, and favorite reports for your organization.</p>
        </div>
        <button type="button" onClick={() => setDialog('create')} style={DARK}>
          <Plus size={12} aria-hidden /> Create Report
        </button>
      </header>

      <section style={{ ...CARD, padding: 20, borderRadius: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ ...EYEBROW, fontSize: 10 }}>Configured in onboarding</p>
            <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }}>Progress report</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text)', maxWidth: 560 }}>
              Who stopped moving and who to call first. Trending low, quiet 2 days, and ready with no exam date each open a filtered roster. Recruits you hide on Students are left out.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>
              {active ? `Active · ${cadence.day} at ${cadence.time} · you plus ${people.length} recipients` : 'Paused · nobody gets it until you turn it back on'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Progress report on"
            onClick={() => {
              setActive((a) => !a)
              showToast(active ? 'Progress report paused' : 'Progress report on')
            }}
            style={{ ...SWITCH, background: active ? 'var(--admin-success-ink)' : 'var(--admin-rule-strong)' }}
          >
            <span style={{ ...KNOB, left: active ? 22 : 2 }} />
          </button>
        </div>
        <div style={{ marginTop: 16, borderRadius: 10, background: 'var(--admin-fill-soft)', padding: '12px 16px' }}>
          <p style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>
            <span style={{ color: 'var(--admin-brand)', display: 'inline-flex' }}>
              <Envelope size={13} aria-hidden />
            </span>
            {totalNudges} recruits need a nudge
          </p>
          {nudgeCounts.map((c) => (
            <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 13, color: 'var(--admin-text)' }}>
              <span>
                {c.label} <strong style={{ marginLeft: 4, color: 'var(--admin-ink)' }}>{c.n}</strong>
              </span>
              <Link to={`${ADMIN_BASE}/students?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(window.location.search)), filter: c.key })}`} style={VIEW}>
                View
              </Link>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div style={SUBCARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Cadence</strong>
              <button type="button" onClick={() => setDialog('cadence')} style={TEXT_BRAND}>
                Change cadence
              </button>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>
              {cadence.day} at {cadence.time}
            </p>
          </div>
          <div style={SUBCARD}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Who gets it</strong>
              <button type="button" onClick={() => setDialog('people')} style={TEXT_BRAND}>
                Change people
              </button>
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <span style={{ ...PILL, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }}>
                {ADMIN_EMAIL} <span style={{ marginLeft: 6, fontSize: 9, letterSpacing: '0.06em', opacity: 0.85 }}>YOU</span>
              </span>
              {people.map((p) => (
                <span key={p} style={{ ...PILL, background: 'var(--admin-fill)', color: 'var(--admin-ink)' }}>
                  {p}
                </span>
              ))}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Recipients see only recruits in your scope. No portal account needed.</p>
          </div>
        </div>
      </section>

      <section style={{ ...CARD, padding: 12, borderRadius: 14 }}>
        <p style={{ ...EYEBROW, fontSize: 10, padding: '0 4px' }}>Pipeline tables</p>
        <div style={{ marginTop: 8, display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <Link to={`${ADMIN_BASE}/reports/team-comparison${window.location.search}`} className="cre-admin-tile" style={TABLE_LINK}>
            <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Department comparison</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Former Compare all departments view.</span>
          </Link>
          <Link to={`${ADMIN_BASE}/my-department${window.location.search}`} className="cre-admin-tile" style={TABLE_LINK}>
            <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>My department</strong>
            <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>Your own roster as a table.</span>
          </Link>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 4, alignSelf: 'flex-start', padding: 3, borderRadius: 10, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)' }}>
        {(
          [
            ['library', 'Library'],
            ['scheduled', `Scheduled (${reports.filter((r) => r.scheduled).length})`],
          ] as const
        ).map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)} style={tab === id ? SEG_ON : SEG}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <label style={{ position: 'relative', flex: '1 1 320px' }}>
          <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--admin-faint)', display: 'flex' }}>
            <MagnifyingGlass size={13} aria-hidden />
          </span>
          <input type="search" aria-label="Search reports" placeholder="Search reports" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...INPUT, paddingLeft: 32, borderRadius: 8 }} />
        </label>
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value as ReportCategory | 'all')} style={{ ...INPUT, width: 'auto', borderRadius: 8 }}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as 'name' | 'category' | 'lastRun')} style={{ ...INPUT, width: 'auto', borderRadius: 8 }}>
          <option value="name">Sort: Name</option>
          <option value="category">Sort: Category</option>
          <option value="lastRun">Sort: Last run</option>
        </select>
      </div>

      <section style={{ ...CARD, borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead style={{ background: 'var(--admin-fill-soft)' }}>
            <tr>
              <th style={{ ...TH, width: 36 }}>
                <span className="cre-visually-hidden">Favorite</span>
              </th>
              <th style={TH}>Report name</th>
              <th style={TH}>Description</th>
              <th style={TH}>Category</th>
              <th style={TH}>{tab === 'scheduled' ? 'Schedule' : 'Last run'}</th>
              <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="cre-admin-row" style={{ borderTop: '1px solid var(--admin-rule)' }}>
                <td style={{ ...TD, paddingLeft: 16 }}>
                  <button
                    type="button"
                    aria-label={r.favorite ? 'Remove from favorites' : 'Add to favorites'}
                    onClick={() => patch(r.id, { favorite: !r.favorite })}
                    style={{ ...ICON_BTN, color: r.favorite ? 'var(--admin-amber)' : 'var(--admin-faint)' }}
                  >
                    {r.favorite ? <StarSolid size={14} aria-hidden /> : <Star size={14} aria-hidden />}
                  </button>
                </td>
                <td style={TD}>
                  <button type="button" className="cre-admin-name" onClick={() => setRunning(r)} style={{ ...ICON_BTN, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>
                    {r.name}
                  </button>
                  {r.isNew ? <span style={NEW}>New</span> : null}
                </td>
                <td style={{ ...TD, color: 'var(--admin-text)', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                <td style={TD}>
                  <span style={{ ...PILL, fontSize: 11, background: 'var(--admin-fill)', color: 'var(--admin-slate-700)' }}>{r.category}</span>
                </td>
                <td style={{ ...TD, whiteSpace: 'nowrap', color: 'var(--admin-text)' }}>{tab === 'scheduled' ? r.scheduled : r.lastRun}</td>
                <td style={{ ...TD, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button type="button" aria-label="Run" onClick={() => setRunning(r)} style={RUN}>
                    <Play size={10} aria-hidden /> Run
                  </button>
                  <button type="button" aria-label="Share" title="Share" onClick={() => share(r)} style={ROUND}>
                    <ShareNodes size={13} aria-hidden />
                  </button>
                  <button type="button" aria-label="Schedule" title="Schedule" onClick={() => setDialog({ schedule: r })} style={ROUND}>
                    <CalendarRegular size={13} aria-hidden />
                  </button>
                  <button type="button" aria-label="Duplicate" title="Duplicate" onClick={() => duplicate(r)} style={ROUND}>
                    <Clone size={13} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...TD, padding: 32, textAlign: 'center', color: 'var(--admin-muted)' }}>
                  No reports match.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      {dialog === 'cadence' ? (
        <CadenceDialog
          value={cadence}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            setCadence(v)
            showToast(`Progress report · ${v.day} at ${v.time}`)
            setDialog(null)
          }}
        />
      ) : null}
      {dialog === 'people' ? (
        <PeopleDialog
          value={people}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            setPeople(v)
            showToast(`Progress report · ${v.length + 1} recipients`)
            setDialog(null)
          }}
        />
      ) : null}
      {dialog === 'create' ? (
        <CreateDialog
          onClose={() => setDialog(null)}
          onCreate={(name, cat) => {
            setReports((rs) => [...rs, { id: `custom-${rs.length}`, name, description: 'Custom report.', category: cat, lastRun: 'Never', isNew: true }])
            showToast(`Created · ${name}`)
            setDialog(null)
          }}
        />
      ) : null}
      {dialog && typeof dialog === 'object' ? (
        <ScheduleDialog
          report={dialog.schedule}
          onClose={() => setDialog(null)}
          onSave={(when) => {
            patch(dialog.schedule.id, { scheduled: when })
            showToast(`${dialog.schedule.name} · scheduled ${when}`)
            setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}

/* ── Running a report ───────────────────────────────────────────────────── */

function ReportRun({
  report,
  onBack,
  onSchedule,
  onShare,
  onDuplicate,
  dialog,
}: {
  report: ReportDef
  onBack: () => void
  onSchedule: () => void
  onShare: () => void
  onDuplicate: () => void
  dialog: ReactNode
}) {
  const { learners, showToast } = useAdminStore()
  const [done, setDone] = useState(false)
  const [status, setStatus] = useState<'Active' | 'Inactive' | null>('Active')
  const [department, setDepartment] = useState<string | null>(null)
  useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 900)
    return () => window.clearTimeout(t)
  }, [])
  const rows = useMemo(
    () => reportRows(learners).filter((r) => (!status || r[2] === status) && (!department || r[3] === department)),
    [learners, status, department],
  )
  const exportCsv = () => {
    const csv = [REPORT_COLUMNS as readonly string[], ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `${report.id}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    showToast(`Exported ${rows.length} rows`)
  }
  const departments = [...new Set(learners.map((l) => l.team))]
  const stamp = new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <nav style={{ fontSize: 13, color: 'var(--admin-text)' }}>
        <button type="button" onClick={onBack} style={{ ...ICON_BTN, fontSize: 13, color: 'var(--admin-text)' }}>
          Reports Library
        </button>{' '}
        / <strong style={{ color: 'var(--admin-ink)' }}>{report.name}</strong>
      </nav>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: HEADING, fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>{report.name}</h2>
          <p style={PAGE_SUB}>{done ? `Data as of ${stamp} · ${rows.length.toLocaleString()} rows` : 'Running report…'}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onSchedule} style={SMALL}>
            <CalendarRegular size={12} aria-hidden /> Schedule
          </button>
          <button type="button" onClick={onShare} style={SMALL}>
            <ShareNodes size={12} aria-hidden /> Share
          </button>
          <button type="button" onClick={onDuplicate} style={SMALL}>
            <Clone size={12} aria-hidden /> Duplicate
          </button>
          <button type="button" onClick={exportCsv} disabled={!done} style={SMALL}>
            <Download size={12} aria-hidden /> Export
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {status ? (
          <button type="button" onClick={() => setStatus(null)} aria-label="Remove User Status filter" style={FILTER}>
            User Status: {status} <XmarkRegular size={9} aria-hidden />
          </button>
        ) : null}
        {department ? (
          <button type="button" onClick={() => setDepartment(null)} aria-label="Remove Department filter" style={FILTER}>
            Department: {department} <XmarkRegular size={9} aria-hidden />
          </button>
        ) : null}
        <ChipMenu label="Add filter" icon={<Plus size={9} aria-hidden />} width={240}>
          {(close) => (
            <>
              {(['Active', 'Inactive'] as const).map((s) => (
                <MenuItem
                  key={s}
                  onSelect={() => {
                    setStatus(s)
                    close()
                  }}
                >
                  User status: {s}
                </MenuItem>
              ))}
              {departments.map((d) => (
                <MenuItem
                  key={d}
                  onSelect={() => {
                    setDepartment(d)
                    close()
                  }}
                >
                  Department: {d}
                </MenuItem>
              ))}
            </>
          )}
        </ChipMenu>
      </div>
      <section style={{ ...CARD, borderRadius: 12, overflow: 'auto', maxHeight: 640 }}>
        {done ? (
          <table style={{ minWidth: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--admin-fill-soft)' }}>
              <tr>
                {REPORT_COLUMNS.map((c) => (
                  <th key={c} style={{ ...TH, fontSize: 10.5 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--admin-rule)' }}>
                  {r.map((v, j) => (
                    <td key={j} style={{ ...TD, padding: '9px 12px', whiteSpace: 'nowrap', color: j === 0 ? 'var(--admin-ink)' : 'var(--admin-text)' }}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--admin-muted)', fontSize: 14 }}>
            Running report… <span style={{ color: 'var(--admin-faint)' }}>{report.name}</span>
            <div style={{ marginTop: 12 }}>
              <button type="button" onClick={onBack} style={SMALL}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
      {dialog}
    </div>
  )
}

/* ── Dialogs ────────────────────────────────────────────────────────────── */

function CreateDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, category: ReportCategory) => void }) {
  const [name, setName] = useState('')
  const [cat, setCat] = useState<ReportCategory>('Progress')
  return (
    <AdminDialog
      title="Create Report"
      subtitle="Starts from the roster's columns. Add filters after it runs."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={() => onCreate(name.trim(), cat)} style={{ ...BUTTON_BRAND, opacity: name.trim() ? 1 : 0.5 }}>
            Create
          </button>
        </>
      }
    >
      <div>
        <label style={FIELD_LABEL} htmlFor="rep-name">
          Name
        </label>
        <input id="rep-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Albany office · weekly" style={INPUT} />
      </div>
      <div>
        <label style={FIELD_LABEL} htmlFor="rep-cat">
          Category
        </label>
        <select id="rep-cat" value={cat} onChange={(e) => setCat(e.target.value as ReportCategory)} style={INPUT}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
    </AdminDialog>
  )
}

function ScheduleDialog({ report, onClose, onSave }: { report: ReportDef; onClose: () => void; onSave: (when: string) => void }) {
  const [day, setDay] = useState<string>(DAYS[0])
  const [time, setTime] = useState<string>(TIMES[1])
  return (
    <AdminDialog
      title={`Schedule · ${report.name}`}
      subtitle="Runs and emails to you on this cadence."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" onClick={() => onSave(`${day} at ${time}`)} style={BUTTON_BRAND}>
            Schedule
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <select aria-label="Day" value={day} onChange={(e) => setDay(e.target.value)} style={INPUT}>
          {DAYS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <select aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} style={INPUT}>
          {TIMES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
    </AdminDialog>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

const DARK: CSSProperties = { ...BUTTON_BRAND, background: 'var(--admin-ink)', borderRadius: 10, padding: '8px 14px', fontSize: 13 }
const SWITCH: CSSProperties = { position: 'relative', flex: 'none', width: 44, height: 24, border: 'none', borderRadius: 9999, padding: 0, cursor: 'pointer' }
const KNOB: CSSProperties = { position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'var(--admin-surface)', boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)', transition: 'left 120ms ease' }
const VIEW: CSSProperties = { fontSize: 13, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }
const SUBCARD: CSSProperties = { borderRadius: 10, border: '1px solid var(--admin-rule)', padding: '12px 16px' }
const TEXT_BRAND: CSSProperties = { padding: 0, border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }
const TABLE_LINK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 10, border: '1px solid var(--admin-rule)', padding: '10px 12px', textDecoration: 'none', background: 'var(--admin-surface)' }
const SEG: CSSProperties = { border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 13, fontWeight: 600, background: 'none', color: 'var(--admin-text)', cursor: 'pointer' }
const SEG_ON: CSSProperties = { ...SEG, background: 'var(--admin-ink)', color: 'var(--admin-surface)' }
const TH: CSSProperties = { padding: 12, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: 12 }
const ICON_BTN: CSSProperties = { padding: 0, border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }
const NEW: CSSProperties = { ...PILL, marginLeft: 8, padding: '1px 6px', fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)' }
const RUN: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, border: 'none', borderRadius: 9999, padding: '6px 12px', fontSize: 12, fontWeight: 600, background: 'var(--admin-ink)', color: 'var(--admin-surface)', cursor: 'pointer' }
const ROUND: CSSProperties = { marginLeft: 6, width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--admin-rule)', borderRadius: 9999, background: 'var(--admin-surface)', color: 'var(--admin-text)', cursor: 'pointer', verticalAlign: 'middle' }
const SMALL: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--admin-rule)', borderRadius: 9999, padding: '6px 12px', fontSize: 12, fontWeight: 600, background: 'var(--admin-surface)', color: 'var(--admin-ink)', cursor: 'pointer' }
const FILTER: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--admin-rule)', borderRadius: 9999, padding: '3px 10px', fontSize: 11, fontWeight: 600, background: 'var(--admin-surface)', color: 'var(--admin-text)', cursor: 'pointer' }
