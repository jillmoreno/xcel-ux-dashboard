import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_COMPANY, ADMIN_DEPARTMENTS, bucketOf, type Learner } from '@/data/atlasAdmin/learners'
import { STATES } from '@/data/atlasAdmin/assignments'
import { LOCATIONS, membersOfLocation } from '@/data/atlasAdmin/organization'
import { Building, Download, Plus, ShieldCheck, Users } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT, PILL } from './adminStyles'

/**
 * ATLAS ADMIN — TEAMS & ORGANIZATION (2026-10-20). The reference's /teams:
 * the hierarchy on the left (organization → regions → offices, then the
 * departments and the regulatory groups), and the chosen team on the right
 * with its counts, its members (add / remove), its admins (assign) and the
 * roles an admin can hold. Create team, Add group and Import CSV add to it.
 *
 * ⚠ DEPARTURES FROM THE REFERENCE: its tree is a securities firm's (Seattle
 * Branch, Series 7 Candidates) with three members in every team. Here the
 * regions are the roster's states, the offices are Organization's, the
 * regulatory groups are each state's Life & Health candidates, and members
 * are the roster's own. Membership edits last the session.
 */

type Kind = 'organization' | 'region' | 'office' | 'department' | 'regulatory' | 'custom'
type Team = { id: string; name: string; kind: Kind; parent: string | null; base: (ls: readonly Learner[]) => Learner[] }
type Admin = { name: string; email: string; role: string }

const ROLES = [
  ['Training Administrator', 'Full access to create programs, assignment rules, and manage all learners'],
  ['Regional Compliance Officer', 'View every office in a region, run reports, send nudges'],
  ['Agency Manager', 'View their office’s learners, progress, and off-track candidates only'],
  ['Executive Viewer', 'Read-only dashboard access across the entire organization'],
  ['Supervisor', 'View direct reports’ training progress'],
] as const

const KIND_LABEL: Record<Kind, string> = {
  organization: 'Organization',
  region: 'Region',
  office: 'Office',
  department: 'Department',
  regulatory: 'Regulatory group',
  custom: 'Team',
}

function buildTeams(): Team[] {
  const teams: Team[] = [{ id: 'org', name: `${ADMIN_COMPANY} Agency`, kind: 'organization', parent: null, base: (ls) => [...ls] }]
  for (const loc of LOCATIONS.filter((x) => x.status === 'active' && x.state)) {
    teams.push({ id: loc.id, name: loc.name.replace(', Region', ''), kind: loc.parent ? 'office' : 'region', parent: loc.parent ?? 'org', base: (ls) => membersOfLocation(loc, ls) })
  }
  for (const d of ADMIN_DEPARTMENTS) teams.push({ id: `dept-${d}`, name: d, kind: 'department', parent: 'org', base: (ls) => ls.filter((l) => l.team === d) })
  return teams
}

function regulatoryGroups(): Team[] {
  return STATES.map(([code, name]) => ({ id: `reg-${code}`, name: `${name} Life & Health candidates`, kind: 'regulatory' as const, parent: null, base: (ls: readonly Learner[]) => ls.filter((l) => l.state === code && l.stage !== 'licensed') }))
}

export function AtlasAdminTeamsPage() {
  const { learners, showToast } = useAdminStore()
  const [custom, setCustom] = useState<Team[]>([])
  const teams = useMemo(() => [...buildTeams(), ...custom.filter((t) => t.kind === 'custom')], [custom])
  const groups = useMemo(() => [...regulatoryGroups(), ...custom.filter((t) => t.kind === 'regulatory')], [custom])
  const [selectedId, setSelectedId] = useState('org')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [added, setAdded] = useState<Record<string, string[]>>({})
  const [removed, setRemoved] = useState<Record<string, string[]>>({})
  const [admins, setAdmins] = useState<Record<string, Admin[]>>({
    org: [
      { name: 'Cody McClintock', email: 'cody.mcclintock@summitins.com', role: 'Training Administrator' },
      { name: 'Patricia Thompson', email: 'patricia.thompson@summitins.com', role: 'Executive Viewer' },
    ],
  })
  const [dialog, setDialog] = useState<'team' | 'group' | 'members' | 'admin' | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const all = [...teams, ...groups]
  const selected = all.find((t) => t.id === selectedId) ?? teams[0]
  const membersOf = (t: Team) => {
    const gone = new Set(removed[t.id] ?? [])
    const keep = new Set([...t.base(learners).map((l) => l.id), ...(added[t.id] ?? [])])
    return learners.filter((l) => keep.has(l.id) && !gone.has(l.id))
  }
  const members = membersOf(selected)
  const activeCount = members.filter((l) => l.lastActiveDays <= 7).length
  const atRisk = members.filter((l) => bucketOf(l) === 'off-track').length

  const addMembers = (ids: string[]) => {
    setAdded((a) => ({ ...a, [selected.id]: [...new Set([...(a[selected.id] ?? []), ...ids])] }))
    setRemoved((r) => ({ ...r, [selected.id]: (r[selected.id] ?? []).filter((x) => !ids.includes(x)) }))
    showToast(`${ids.length} added to ${selected.name}`)
  }
  const removeMember = (l: Learner) => {
    setRemoved((r) => ({ ...r, [selected.id]: [...(r[selected.id] ?? []), l.id] }))
    setAdded((a) => ({ ...a, [selected.id]: (a[selected.id] ?? []).filter((x) => x !== l.id) }))
    showToast(`${l.name} removed from ${selected.name}`)
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    const emails = new Set(text.toLowerCase().match(/[^\s,;"]+@[^\s,;"]+/g) ?? [])
    const hits = learners.filter((l) => emails.has(l.email.toLowerCase())).map((l) => l.id)
    if (hits.length) addMembers(hits)
    showToast(hits.length ? `Imported ${hits.length} of ${emails.size} rows into ${selected.name}` : `No roster emails found in ${file.name}`)
  }

  const children = (id: string | null) => teams.filter((t) => t.parent === id)
  const renderNode = (t: Team, depth: number) => {
    const kids = children(t.id)
    const open = !collapsed.has(t.id)
    return (
      <li key={t.id}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: depth * 16 }}>
          {kids.length ? (
            <button type="button" aria-label={open ? `Collapse ${t.name}` : `Expand ${t.name}`} aria-expanded={open} onClick={() => setCollapsed((c) => toggle(c, t.id))} style={CARET}>
              {open ? '▾' : '▸'}
            </button>
          ) : (
            <span style={{ width: 16 }} />
          )}
          <NodeButton team={t} count={membersOf(t).length} on={t.id === selected.id} onClick={() => setSelectedId(t.id)} />
        </div>
        {kids.length && open ? <ul style={TREE}>{kids.map((k) => renderNode(k, depth + 1))}</ul> : null}
      </li>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={{ ...CARD, borderRadius: 14, padding: 20, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: HEADING, fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>Teams &amp; Organization</h1>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--admin-text)' }}>Manage your team hierarchy, assign admins, and control data access scopes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => (e.target.files?.[0] && importCsv(e.target.files[0]), (e.target.value = ''))} />
          <button type="button" onClick={() => fileRef.current?.click()} style={BUTTON_OUTLINE} title={`Adds every roster email in the file to ${selected.name}`}>
            <Download size={13} aria-hidden /> Import CSV
          </button>
          <button type="button" onClick={() => setDialog('team')} style={BUTTON_BRAND}>
            <Plus size={12} aria-hidden /> Create team
          </button>
        </div>
      </section>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(240px, 1fr) minmax(0, 1.7fr)', alignItems: 'start' }}>
        <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
          <h2 style={H2}>Team hierarchy</h2>
          <p style={{ ...EYEBROW, fontSize: 10, margin: '12px 0 6px' }}>Organization hierarchy</p>
          <ul style={TREE}>{children(null).map((t) => renderNode(t, 0))}</ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 6px', paddingTop: 12, borderTop: '1px solid var(--admin-rule)' }}>
            <p style={{ ...EYEBROW, fontSize: 10 }}>Regulatory groups</p>
            <button type="button" onClick={() => setDialog('group')} style={LINK}>
              + Add group
            </button>
          </div>
          <ul style={TREE}>
            {groups.map((g) => (
              <li key={g.id} style={{ paddingLeft: 20 }}>
                <NodeButton team={g} count={membersOf(g).length} on={g.id === selected.id} onClick={() => setSelectedId(g.id)} />
              </li>
            ))}
          </ul>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{all.find((t) => t.id === selected.parent)?.name ?? `${ADMIN_COMPANY} Agency`}</span>
                <h2 style={{ ...H2, fontSize: 18, marginTop: 2 }}>{selected.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ ...PILL, fontSize: 11, background: 'var(--admin-fill)', color: 'var(--admin-text)' }}>{KIND_LABEL[selected.kind]}</span>
                  <span style={{ fontSize: 12, color: 'var(--admin-text)' }}>{members.length} members</span>
                </div>
              </div>
              <button type="button" onClick={() => setDialog('members')} style={{ ...BUTTON_OUTLINE, alignSelf: 'flex-start', padding: '6px 12px', fontSize: 12 }}>
                <Users size={12} aria-hidden /> Add members
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--admin-rule)', textAlign: 'center' }}>
              <Stat value={members.length} label="Total members" />
              <Stat value={activeCount} label="Active this week" color="var(--admin-success-ink)" />
              <Stat value={atRisk} label="Off track" color="var(--admin-brand)" />
            </div>
          </section>

          <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={H2}>Members</h2>
              <button type="button" onClick={() => setDialog('members')} style={{ ...BUTTON_BRAND, padding: '6px 12px', fontSize: 12 }}>
                <Plus size={11} aria-hidden /> Add learners
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((l) => (
                <li key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'var(--admin-fill-soft)' }}>
                  <span>
                    <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${window.location.search}`} style={{ display: 'block', fontSize: 13, color: 'var(--admin-ink)', textDecoration: 'none' }}>
                      {l.name}
                    </Link>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{l.email}</span>
                  </span>
                  <button type="button" onClick={() => removeMember(l)} style={{ ...LINK, color: 'var(--admin-brand)' }}>
                    Remove
                  </button>
                </li>
              ))}
              {members.length === 0 ? <li style={{ fontSize: 13, color: 'var(--admin-muted)' }}>No members yet.</li> : null}
            </ul>
          </section>

          <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={H2}>Team admins</h2>
              <button type="button" onClick={() => setDialog('admin')} style={{ ...LINK, color: 'var(--admin-brand)' }}>
                + Assign admin
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(admins[selected.id] ?? []).map((a) => (
                <li key={a.email} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: 'var(--admin-fill-soft)' }}>
                  <span aria-hidden style={AVATAR}>
                    {a.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <span style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{a.name}</strong>
                    <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{a.email}</span>
                  </span>
                  <span style={{ ...PILL, fontSize: 10, background: 'var(--admin-brand-tint)', color: 'var(--admin-brand)' }}>{a.role}</span>
                </li>
              ))}
              {(admins[selected.id] ?? []).length === 0 ? <li style={{ fontSize: 13, color: 'var(--admin-muted)' }}>No admins scoped to this team — it inherits from {ADMIN_COMPANY} Agency.</li> : null}
            </ul>
          </section>

          <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
            <h2 style={{ ...H2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={14} aria-hidden /> Available roles
            </h2>
            <p style={{ margin: '4px 0 12px', fontSize: 12, color: 'var(--admin-text)' }}>Assign roles to control what admins can see and do within this team’s scope.</p>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {ROLES.map(([name, body]) => (
                <div key={name} style={{ padding: 12, borderRadius: 10, border: '1px solid var(--admin-rule)' }}>
                  <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{name}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 11, lineHeight: 1.45, color: 'var(--admin-text)' }}>{body}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {dialog === 'team' || dialog === 'group' ? (
        <NameDialog
          title={dialog === 'team' ? 'Create team' : 'Add regulatory group'}
          subtitle={dialog === 'team' ? `A team directly under ${ADMIN_COMPANY} Agency. Add members once it exists.` : 'A group of candidates sitting the same exam. Add members once it exists.'}
          onClose={() => setDialog(null)}
          onSave={(name) => {
            const t: Team = { id: `custom-${Date.now()}`, name, kind: dialog === 'team' ? 'custom' : 'regulatory', parent: dialog === 'team' ? 'org' : null, base: () => [] }
            setCustom((c) => [...c, t])
            setSelectedId(t.id)
            setDialog(null)
            showToast(`${name} created`)
          }}
        />
      ) : null}
      {dialog === 'members' ? (
        <AddMembersDialog
          team={selected.name}
          candidates={learners.filter((l) => !members.some((m) => m.id === l.id))}
          onClose={() => setDialog(null)}
          onAdd={(ids) => {
            addMembers(ids)
            setDialog(null)
          }}
        />
      ) : null}
      {dialog === 'admin' ? (
        <AssignAdminDialog
          team={selected.name}
          onClose={() => setDialog(null)}
          onSave={(a) => {
            setAdmins((m) => ({ ...m, [selected.id]: [...(m[selected.id] ?? []), a] }))
            setDialog(null)
            showToast(`${a.name} is now ${a.role} for ${selected.name}`)
          }}
        />
      ) : null}
    </div>
  )
}

function toggle(set: Set<string>, id: string) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function NodeButton({ team, count, on, onClick }: { team: Team; count: number; on: boolean; onClick: () => void }) {
  const tone =
    team.kind === 'organization' ? 'var(--admin-brand)' : team.kind === 'region' ? 'var(--admin-chart-blue)' : team.kind === 'regulatory' ? 'var(--admin-amber)' : team.kind === 'office' ? 'var(--admin-success-ink)' : 'var(--admin-text)'
  return (
    <button type="button" aria-current={on || undefined} onClick={onClick} style={{ ...NODE, ...(on ? { background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-soft-edge)' } : null) }}>
      <span aria-hidden style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: 6, background: 'var(--admin-fill)', color: tone }}>
        {team.kind === 'regulatory' ? <ShieldCheck size={10} /> : team.kind === 'department' || team.kind === 'custom' ? <Users size={10} /> : <Building size={10} />}
      </span>
      <span style={{ fontSize: 12, color: on ? 'var(--admin-brand)' : 'var(--admin-ink)', textAlign: 'left' }}>{team.name}</span>
      <span style={{ fontSize: 10, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>{count} members</span>
    </button>
  )
}

function Stat({ value, label, color = 'var(--admin-ink)' }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <strong style={{ display: 'block', fontFamily: HEADING, fontSize: 22, color }}>{value}</strong>
      <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{label}</span>
    </div>
  )
}

function NameDialog({ title, subtitle, onClose, onSave }: { title: string; subtitle: string; onClose: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <AdminDialog
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={() => onSave(name.trim())} style={{ ...BUTTON_BRAND, opacity: name.trim() ? 1 : 0.5 }}>
            Create
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />
      </label>
    </AdminDialog>
  )
}

function AddMembersDialog({ team, candidates, onClose, onAdd }: { team: string; candidates: Learner[]; onClose: () => void; onAdd: (ids: string[]) => void }) {
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const list = candidates.filter((l) => !q.trim() || `${l.name} ${l.email} ${l.team}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 40)
  return (
    <AdminDialog
      title={`Add learners to ${team}`}
      onClose={onClose}
      width={520}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!picked.size} onClick={() => onAdd([...picked])} style={{ ...BUTTON_BRAND, opacity: picked.size ? 1 : 0.5 }}>
            Add {picked.size || ''} {picked.size === 1 ? 'learner' : 'learners'}
          </button>
        </>
      }
    >
      <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or department" aria-label="Search learners" style={INPUT} />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 300, overflowY: 'auto' }}>
        {list.map((l) => (
          <li key={l.id}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 4px', cursor: 'pointer' }}>
              <input type="checkbox" checked={picked.has(l.id)} onChange={() => setPicked((s) => toggle(s, l.id))} style={{ accentColor: 'var(--admin-brand)' }} />
              <span style={{ fontSize: 13, color: 'var(--admin-ink)' }}>{l.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--admin-muted)' }}>{l.team}</span>
            </label>
          </li>
        ))}
      </ul>
    </AdminDialog>
  )
}

function AssignAdminDialog({ team, onClose, onSave }: { team: string; onClose: () => void; onSave: (a: Admin) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>(ROLES[2][0])
  const ok = name.trim() && /.+@.+\..+/.test(email)
  return (
    <AdminDialog
      title="Assign admin"
      subtitle={`Their access is scoped to ${team} and the teams under it.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!ok} onClick={() => onSave({ name: name.trim(), email: email.trim(), role })} style={{ ...BUTTON_BRAND, opacity: ok ? 1 : 0.5 }}>
            Assign
          </button>
        </>
      }
    >
      <label>
        <span style={FIELD_LABEL}>Name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />
      </label>
      <label>
        <span style={FIELD_LABEL}>Work email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={INPUT} />
      </label>
      <label>
        <span style={FIELD_LABEL}>Role</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={INPUT}>
          {ROLES.map(([r]) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
    </AdminDialog>
  )
}

const H2: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 15, fontWeight: 700, color: 'var(--admin-ink)' }
const TREE: CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }
const CARET: CSSProperties = { width: 16, padding: 0, border: 'none', background: 'none', fontSize: 10, color: 'var(--admin-muted)', cursor: 'pointer' }
const NODE: CSSProperties = { flex: 1, display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '5px 8px', borderRadius: 8, borderWidth: 1, borderStyle: 'solid', borderColor: 'transparent', background: 'none', fontFamily: 'inherit', cursor: 'pointer' }
const LINK: CSSProperties = { padding: 0, border: 'none', background: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const AVATAR: CSSProperties = { display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 9999, background: 'var(--admin-nav-active-bg)', fontSize: 11, fontWeight: 700, color: 'var(--admin-nav-active-ink)' }
