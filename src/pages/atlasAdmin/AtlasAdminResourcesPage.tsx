import { useRef, useState, type CSSProperties } from 'react'
import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { AdminDialog } from './AdminDialog'
import { useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, INPUT, PAGE_H1, PAGE_SUB } from './adminStyles'

/**
 * ATLAS ADMIN · RESOURCES — rebuilt from colibri-b2b.vercel.app/resources
 * (2026-10-19). Everything an admin hands a recruit: XCEL's own guides (kept
 * current, with every state's checklist behind All states), the agency's
 * files with an upload area that takes a file or a link, and, on the right,
 * either the Share panel for the chosen file or the hint and what recruits
 * actually opened. Share sends to a state, a department or chosen people, by
 * attaching to future invites, emailing once, or copying a link.
 */

type Kind = 'PDF' | 'VID' | 'LINK' | 'DOC'
type Resource = { id: string; kind: Kind; title: string; sub: string; mine?: boolean; folder?: string }

const XCEL_FILES: Resource[] = [
  { id: 'tx-checklist', kind: 'PDF', title: 'Texas Life and Health licensing checklist', sub: 'What to do after the course, in order · updated Aug 12' },
  { id: 'first-attempt', kind: 'PDF', title: 'How to pass on the first attempt', sub: 'Study plan for the two weeks before the exam · updated Jun 3' },
  { id: 'rubi', kind: 'VID', title: 'Meet Rubi, the AI study partner', sub: 'Three minutes. Cuts study time if they actually watch it. · updated May 18' },
  { id: 'pearson', kind: 'LINK', title: 'Exam scheduling, Pearson VUE', sub: 'How to book, what to bring, what happens if they cancel · updated Aug 1' },
]
const STATE_FILES: Resource[] = ['New York', 'New Jersey', 'Pennsylvania', 'Florida'].map((s) => ({
  id: `checklist-${s}`,
  kind: 'PDF' as const,
  title: `${s} Life and Health licensing checklist`,
  sub: 'What to do after the course, in order · updated Sep 2',
}))
const AGENCY_FILES: Resource[] = [
  { id: 'welcome', kind: 'PDF', title: 'Hinojosa welcome packet', sub: 'Uploaded by Cody on Aug 2 · attached to every invite', mine: true },
  { id: 'script', kind: 'DOC', title: 'Manager call script', sub: 'Uploaded by Tina on Jul 30 · leads only', mine: true },
]

export function AtlasAdminResourcesPage() {
  const { showToast } = useAdminStore()
  const [allStates, setAllStates] = useState(false)
  const [agency, setAgency] = useState<Resource[]>(AGENCY_FILES)
  const [folders, setFolders] = useState<string[]>([])
  const [sharing, setSharing] = useState<Resource | null>(null)
  const [newFolder, setNewFolder] = useState(false)
  const [link, setLink] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceFor = useRef<string | null>(null)

  const addFile = (name: string, kind: Kind) => {
    setAgency((a) => [...a, { id: `up-${a.length}-${name}`, kind, title: name, sub: 'Uploaded by Cody today · leads and recruits', mine: true }])
    showToast(`Added · ${name}`)
  }
  const onFile = (f: File | undefined) => {
    if (!f) return
    const kind: Kind = /\.(mp4|mov|webm)$/i.test(f.name) ? 'VID' : /\.(docx?|rtf)$/i.test(f.name) ? 'DOC' : 'PDF'
    if (replaceFor.current) {
      const id = replaceFor.current
      setAgency((a) => a.map((r) => (r.id === id ? { ...r, title: f.name, kind, sub: 'Replaced by Cody today' } : r)))
      showToast(`Replaced with ${f.name}`)
      replaceFor.current = null
    } else addFile(f.name, kind)
  }

  const row = (r: Resource) => {
    const on = sharing?.id === r.id
    return (
      <div key={r.id} style={{ ...ROW, background: on ? 'var(--admin-brand-tint)' : undefined }}>
        <span style={{ ...BADGE, ...(on ? { background: 'var(--admin-brand)', color: 'var(--admin-surface)' } : null) }}>{r.kind}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: 'var(--admin-ink)' }}>{r.title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{r.sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flex: 'none' }}>
          <button type="button" onClick={() => setSharing(r)} style={LINKISH}>
            Share
          </button>
          {r.mine ? (
            <button
              type="button"
              onClick={() => {
                replaceFor.current = r.id
                fileInput.current?.click()
              }}
              style={LINKISH}
            >
              Replace
            </button>
          ) : (
            <button type="button" onClick={() => showToast(`Opened · ${r.title}`)} style={LINKISH}>
              Open
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input ref={fileInput} type="file" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ maxWidth: 560 }}>
          <h2 style={PAGE_H1}>Resources</h2>
          <p style={PAGE_SUB}>Everything you hand a recruit, in one place. Share a link, attach it to an invite, or send it to a whole department.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setNewFolder(true)} className="cre-admin-outline" style={BUTTON_OUTLINE}>
            New folder
          </button>
          <button
            type="button"
            onClick={() => {
              replaceFor.current = null
              fileInput.current?.click()
            }}
            className="cre-admin-brand"
            style={BUTTON_BRAND}
          >
            Upload
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section style={{ ...CARD, borderRadius: 12, overflow: 'hidden' }}>
            <Head title="From XCEL" sub="Kept current for you · state guides update when the state does." />
            {[...XCEL_FILES, ...(allStates ? STATE_FILES : [])].map(row)}
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--admin-rule)' }}>
              <button type="button" onClick={() => setAllStates((v) => !v)} style={LINKISH}>
                {allStates ? 'Fewer states' : 'All states'}
              </button>
            </div>
          </section>

          <section style={{ ...CARD, borderRadius: 12, overflow: 'hidden' }}>
            <Head title="Your agency's files" sub="Visible to Summitinsurancegroup only." />
            {agency.map(row)}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                onFile(e.dataTransfer.files?.[0])
              }}
              style={DROP}
            >
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>Drop a file here, or add a link</p>
              <p style={{ margin: '4px 0 12px', fontSize: 11.5, color: 'var(--admin-muted)' }}>
                PDF, Word, video, or a URL. Choose who sees it after upload: your leads, your recruits, or both.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    replaceFor.current = null
                    fileInput.current?.click()
                  }}
                  style={{ ...BUTTON_BRAND, padding: '6px 14px', fontSize: 13 }}
                >
                  Choose file
                </button>
                <input aria-label="Link URL" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} style={{ ...INPUT, width: 180, borderRadius: 9999, padding: '6px 12px' }} />
                <button
                  type="button"
                  disabled={!/^https?:\/\/\S+\.\S+/.test(link)}
                  onClick={() => {
                    addFile(link.replace(/^https?:\/\//, ''), 'LINK')
                    setLink('')
                  }}
                  style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13, opacity: /^https?:\/\/\S+\.\S+/.test(link) ? 1 : 0.5 }}
                >
                  Add a link
                </button>
              </div>
            </div>
          </section>

          {folders.map((f) => (
            <section key={f} style={{ ...CARD, borderRadius: 12, overflow: 'hidden' }}>
              <Head title={f} sub="New folder · empty. Upload into it, or drag a file here." />
              <div style={{ padding: 16, fontSize: 12.5, color: 'var(--admin-muted)' }}>Nothing here yet.</div>
            </section>
          ))}
        </div>

        <div style={{ position: 'sticky', top: 104, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sharing ? (
            <SharePanel
              resource={sharing}
              onClose={() => setSharing(null)}
              onDone={(msg) => {
                showToast(msg)
                setSharing(null)
              }}
            />
          ) : (
            <div style={{ ...CARD, borderRadius: 12, padding: '12px 16px', fontSize: 12.5, color: 'var(--admin-text)' }}>Click Share on a file to send it without leaving the portal.</div>
          )}
          <section style={{ ...CARD, borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }}>What recruits actually opened</h3>
            <ul style={{ margin: '10px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
              <li style={{ color: 'var(--admin-brand)' }}>Manager call script · 0 of 34 opens</li>
              <li style={{ color: 'var(--admin-ink)' }}>Meet Rubi, the AI study partner · 3 of 34 opens</li>
              <li style={{ color: 'var(--admin-ink)' }}>Pennsylvania Life checklist · 9 of 34 opens</li>
            </ul>
            <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--admin-text)' }}>Manager call script is the one almost nobody opened. Worth attaching to the invite.</p>
          </section>
        </div>
      </div>

      {newFolder ? (
        <NewFolderDialog
          onClose={() => setNewFolder(false)}
          onCreate={(name) => {
            setFolders((f) => [...f, name])
            showToast(`Folder created · ${name}`)
            setNewFolder(false)
          }}
        />
      ) : null}
    </div>
  )
}

function SharePanel({ resource, onClose, onDone }: { resource: Resource; onClose: () => void; onDone: (msg: string) => void }) {
  const [to, setTo] = useState<'state' | 'department' | 'people'>('state')
  const [department, setDepartment] = useState<string>(ADMIN_DEPARTMENTS[0])
  const [people, setPeople] = useState('')
  const [how, setHow] = useState<'attach' | 'email' | 'link'>('attach')
  const label = how === 'attach' ? 'Attach to invites' : how === 'email' ? 'Email it now' : 'Copy link'
  const who = to === 'state' ? 'everyone in TX' : to === 'department' ? department : 'the people you picked'
  return (
    <section style={{ ...CARD, borderRadius: 12, padding: 16, borderColor: 'var(--admin-brand-edge)' }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }}>Share · {resource.title}</h3>
      <p style={{ ...FIELD_LABEL, margin: '14px 0 6px' }}>Send it to</p>
      <Radio checked={to === 'state'} onChange={() => setTo('state')} label="Everyone in TX · 34" />
      <Radio checked={to === 'department'} onChange={() => setTo('department')} label="A department" />
      {to === 'department' ? (
        <select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ ...INPUT, margin: '4px 0 6px 24px', width: 'calc(100% - 24px)' }}>
          {ADMIN_DEPARTMENTS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      ) : null}
      <Radio checked={to === 'people'} onChange={() => setTo('people')} label="Pick people" />
      {to === 'people' ? (
        <input aria-label="Emails" placeholder="Emails, separated by commas" value={people} onChange={(e) => setPeople(e.target.value)} style={{ ...INPUT, margin: '4px 0 6px 24px', width: 'calc(100% - 24px)' }} />
      ) : null}
      <p style={{ ...FIELD_LABEL, margin: '14px 0 6px' }}>How</p>
      <Radio checked={how === 'attach'} onChange={() => setHow('attach')} label="Attach to every future invite" sub="New recruits get it automatically" />
      <Radio checked={how === 'email'} onChange={() => setHow('email')} label="Email it once, now" sub="Counts against the 7 day email cap" />
      <Radio checked={how === 'link'} onChange={() => setHow('link')} label="Just give me a link" sub="Paste it into a text or a group chat" />
      <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => {
            if (how === 'link') void navigator.clipboard?.writeText(`https://xcelsolutions.com/r/${resource.id}`)
            onDone(how === 'attach' ? `${resource.title} · attached to invites for ${who}` : how === 'email' ? `${resource.title} · emailed to ${who}` : 'Link copied')
          }}
          style={{ ...BUTTON_BRAND, padding: '7px 14px', fontSize: 13 }}
        >
          {label}
        </button>
        <button type="button" onClick={onClose} style={{ ...BUTTON_OUTLINE, padding: '7px 14px', fontSize: 13 }}>
          Cancel
        </button>
      </div>
    </section>
  )
}

function Radio({ checked, onChange, label, sub }: { checked: boolean; onChange: () => void; label: string; sub?: string }) {
  return (
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', cursor: 'pointer' }}>
      <input type="radio" checked={checked} onChange={onChange} style={{ marginTop: 3, accentColor: 'var(--admin-brand)' }} />
      <span>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-ink)' }}>{label}</span>
        {sub ? <span style={{ display: 'block', fontSize: 11.5, color: 'var(--admin-muted)' }}>{sub}</span> : null}
      </span>
    </label>
  )
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--admin-rule)' }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }}>{title}</h3>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{sub}</p>
    </div>
  )
}

function NewFolderDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState('')
  return (
    <AdminDialog
      title="New folder"
      subtitle="Group files for a department or an event."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" disabled={!name.trim()} onClick={() => onCreate(name.trim())} style={{ ...BUTTON_BRAND, opacity: name.trim() ? 1 : 0.5 }}>
            Create
          </button>
        </>
      }
    >
      <div>
        <label style={FIELD_LABEL} htmlFor="folder-name">
          Name
        </label>
        <input id="folder-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Spring hiring event" style={INPUT} />
      </div>
    </AdminDialog>
  )
}

const ROW: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: '1px solid var(--admin-rule)' }
const BADGE: CSSProperties = {
  flex: 'none',
  width: 34,
  height: 34,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  background: 'var(--admin-fill)',
  color: 'var(--admin-text)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
}
const LINKISH: CSSProperties = { padding: 0, border: 'none', background: 'none', fontSize: 12.5, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }
const DROP: CSSProperties = { margin: 12, padding: 20, borderRadius: 12, border: '1px dashed var(--admin-rule-strong)', textAlign: 'center' }
