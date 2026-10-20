import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ADMIN_COMPANY, ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { JOB_ROLES, LOCATIONS, jobRoleOf, membersOfLocation, type OrgStatus } from '@/data/atlasAdmin/organization'
import { MagnifyingGlass, Plus } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, HEADING, INPUT } from './adminStyles'

/**
 * ATLAS ADMIN — ORGANIZATION (2026-10-20). The reference's /organization:
 * Locations, Departments, Job roles and Groups, each a searchable table with
 * Add, Edit, Archive / Unarchive and View in Students; departments also
 * Share invite (a pre-attributed link — the learner never types a partner
 * code) and Assign learners (the rule builder, aimed at that department).
 *
 * Members are counted off the roster. Edits and archives last the session;
 * a department added here is the same list Department comparison adds to.
 */

type Tab = 'locations' | 'departments' | 'roles' | 'groups'
type Row = { id: string; name: string; code: string; members: number; status: OrgStatus; child: boolean }

const TABS: { id: Tab; label: string; add: string }[] = [
  { id: 'locations', label: 'Locations', add: 'Add location' },
  { id: 'departments', label: 'Departments', add: 'Add department' },
  { id: 'roles', label: 'Job roles', add: 'Add job role' },
  { id: 'groups', label: 'Groups', add: '' },
]

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')

export function AtlasAdminOrganizationPage() {
  const { learners, addedDepartments, addDepartment, showToast } = useAdminStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('locations')
  const [query, setQuery] = useState('')
  /** Session edits over the fixture: renames, codes, archive state, adds. */
  const [edits, setEdits] = useState<Record<string, Partial<Row>>>({})
  const [addedLocations, setAddedLocations] = useState<Row[]>([])
  const [addedRoles, setAddedRoles] = useState<Row[]>([])
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const base = useMemo<Row[]>(() => {
    if (tab === 'locations')
      return [
        ...LOCATIONS.map((x) => ({ id: x.id, name: x.name, code: x.code, members: membersOfLocation(x, learners).length, status: x.status, child: !!x.parent })),
        ...addedLocations,
      ]
    if (tab === 'departments')
      return [...ADMIN_DEPARTMENTS, ...addedDepartments.map((d) => d.name)].map((d) => ({
        id: `dept-${slug(d)}`,
        name: `${ADMIN_COMPANY} - ${d}`,
        code: '—',
        members: learners.filter((l) => l.team === d).length,
        status: 'active' as const,
        child: false,
      }))
    if (tab === 'roles')
      return [
        ...JOB_ROLES.map((r, i) => ({ id: `role-${slug(r)}`, name: r, code: `JR-${101 + i}`, members: learners.filter((l) => jobRoleOf(l) === r).length, status: 'active' as const, child: false })),
        ...addedRoles,
      ]
    return []
  }, [tab, learners, addedDepartments, addedLocations, addedRoles])

  const rows = base
    .map((r) => ({ ...r, ...edits[r.id] }))
    .filter((r) => !query.trim() || `${r.name} ${r.code}`.toLowerCase().includes(query.trim().toLowerCase()))

  // The roster's own name for a department, whatever it has been renamed to.
  const deptName = (r: Row) => (base.find((b) => b.id === r.id) ?? r).name.replace(`${ADMIN_COMPANY} - `, '')
  const viewInStudents = (r: Row) => {
    const q = new URLSearchParams(window.location.search)
    if (tab === 'departments') q.set('department', deptName(r))
    if (tab === 'locations') q.set('location', r.id)
    if (tab === 'roles') q.set('role', r.name)
    navigate(`${ADMIN_BASE}/students?${q}`)
  }
  const shareInvite = (r: Row) => {
    const link = `${window.location.origin}/invite/${slug(ADMIN_COMPANY)}/${slug(deptName(r))}`
    navigator.clipboard?.writeText(link).catch(() => undefined)
    showToast(`Invite link for ${deptName(r)} copied`)
  }
  const assign = () => navigate(`${ADMIN_BASE}/assignments/new${window.location.search}`)
  const toggleArchive = (r: Row) => {
    const status: OrgStatus = r.status === 'active' ? 'archived' : 'active'
    setEdits((e) => ({ ...e, [r.id]: { ...e[r.id], status } }))
    showToast(`${r.name} ${status === 'archived' ? 'archived' : 'restored'}`)
  }
  const save = (draft: { name: string; code: string }) => {
    if (editing === 'new') {
      const row: Row = { id: `${tab}-new-${Date.now()}`, name: draft.name, code: draft.code || '—', members: 0, status: 'active', child: false }
      if (tab === 'locations') setAddedLocations((l) => [...l, row])
      if (tab === 'roles') setAddedRoles((l) => [...l, row])
      if (tab === 'departments') addDepartment({ name: draft.name, lead: draft.name })
      showToast(`${draft.name} added`)
    } else if (editing) {
      setEdits((e) => ({ ...e, [editing.id]: { ...e[editing.id], name: draft.name, code: draft.code || '—' } }))
      showToast('Saved')
    }
    setEditing(null)
  }

  const current = TABS.find((t) => t.id === tab)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={{ ...CARD, borderRadius: 14, padding: 20 }}>
        <h1 style={{ margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>Organization</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: 'var(--admin-text)' }}>
          Manage locations, departments, job roles, and open Teams for group hierarchy and membership. Each department can share a pre-attributed invite link — learners never enter a partner code.
        </p>
      </section>

      <div role="tablist" aria-label="Organization" style={{ display: 'flex', gap: 6 }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => (setTab(t.id), setQuery(''))} style={tab === t.id ? TAB_ON : TAB}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'groups' ? (
        <section style={{ ...CARD, borderRadius: 14, padding: 20 }}>
          <strong style={{ fontSize: 15, color: 'var(--admin-ink)' }}>Teams</strong>
          <p style={{ margin: '4px 0 12px', fontSize: 13, color: 'var(--admin-text)' }}>
            Groups use the team hierarchy ({ADMIN_DEPARTMENTS.length} departments and the state exam groups). Add or remove learners on the Teams page.
          </p>
          <Link to={`${ADMIN_BASE}/teams${window.location.search}`} style={{ ...BUTTON_BRAND, textDecoration: 'none' }}>
            Open Teams
          </Link>
        </section>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ position: 'relative', flex: '0 1 300px' }}>
              <MagnifyingGlass size={13} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-faint)' }} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${current.label.toLowerCase()}…`} aria-label={`Search ${current.label.toLowerCase()}`} style={{ ...INPUT, padding: '8px 12px 8px 32px', fontSize: 13 }} />
            </label>
            <button type="button" onClick={() => setEditing('new')} style={BUTTON_BRAND}>
              <Plus size={12} aria-hidden /> {current.add}
            </button>
          </div>
          <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: 'var(--admin-fill-soft)' }}>
                  <tr>
                    {['Name', 'Internal code ID', 'Members', 'Status'].map((h) => (
                      <th key={h} style={TH}>
                        {h}
                      </th>
                    ))}
                    <th style={{ ...TH, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--admin-rule)', opacity: r.status === 'archived' ? 0.6 : 1 }}>
                      <td style={{ ...TD, color: 'var(--admin-ink)', paddingLeft: r.child ? 32 : 16 }}>
                        {r.child ? <span style={{ color: 'var(--admin-faint)' }}>↳ </span> : null}
                        {r.name}
                      </td>
                      <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.code}</td>
                      <td style={{ ...TD, color: 'var(--admin-ink)' }}>{r.members}</td>
                      <td style={{ ...TD, color: 'var(--admin-text)' }}>{r.status === 'active' ? 'Active' : 'Archived'}</td>
                      <td style={{ ...TD, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'inline-flex', gap: 4 }}>
                          {tab === 'departments' ? (
                            <button type="button" onClick={() => shareInvite(r)} style={{ ...ACTION, background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-soft-edge)', color: 'var(--admin-brand)' }}>
                              Share invite
                            </button>
                          ) : null}
                          <button type="button" onClick={() => viewInStudents(r)} style={ACTION}>
                            View in Students
                          </button>
                          {tab !== 'roles' && r.status === 'active' ? (
                            <button type="button" onClick={assign} style={ACTION}>
                              Assign learners
                            </button>
                          ) : null}
                          <button type="button" onClick={() => setEditing(r)} style={ACTION}>
                            Edit
                          </button>
                          <button type="button" onClick={() => toggleArchive(r)} style={{ ...ACTION, background: 'var(--admin-amber-tint)', borderColor: 'var(--admin-amber-edge)', color: 'var(--admin-amber)' }}>
                              {r.status === 'active' ? 'Archive' : 'Unarchive'}
                            </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...TD, padding: 24, textAlign: 'center', color: 'var(--admin-muted)' }}>
                        Nothing matches.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {editing ? <EditDialog tab={tab} row={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} /> : null}
    </div>
  )
}

function EditDialog({ tab, row, onClose, onSave }: { tab: Tab; row: Row | null; onClose: () => void; onSave: (d: { name: string; code: string }) => void }) {
  const noun = tab === 'locations' ? 'location' : tab === 'departments' ? 'department' : 'job role'
  const [name, setName] = useState(row ? (tab === 'departments' ? row.name.replace(/^.* - /, '') : row.name) : '')
  const [code, setCode] = useState(row && row.code !== '—' ? row.code : '')
  const ok = name.trim() !== ''
  return (
    <AdminDialog
      title={row ? `Edit ${noun}` : `Add ${noun}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!ok} onClick={() => onSave({ name: name.trim(), code: code.trim() })} style={{ ...BUTTON_BRAND, opacity: ok ? 1 : 0.5 }}>
            {row ? 'Save' : `Add ${noun}`}
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />
      </label>
      {tab !== 'departments' ? (
        <label>
          <span style={FIELD_LABEL}>Internal code ID (optional)</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FL-ORL-LN" style={INPUT} />
        </label>
      ) : null}
    </AdminDialog>
  )
}

const TAB: CSSProperties = { borderRadius: 9999, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', padding: '6px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)', cursor: 'pointer' }
const TAB_ON: CSSProperties = { ...TAB, borderColor: 'var(--admin-brand)', background: 'var(--admin-brand)', color: 'var(--admin-surface)' }
const TH: CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', textAlign: 'left', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 16px' }
const ACTION: CSSProperties = { borderRadius: 6, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', padding: '3px 8px', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
