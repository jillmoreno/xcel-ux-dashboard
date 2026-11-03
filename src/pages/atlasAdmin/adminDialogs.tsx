import { useState } from 'react'
import { XmarkRegular } from '@/icons'
import { AdminDialog } from './AdminDialog'
import { ADMIN_EMAIL, DAYS, TIMES } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, FIELD_LABEL, INPUT, PILL } from './adminStyles'

/** ATLAS ADMIN — dialogs more than one page opens (2026-10-19): the Progress
 *  report's cadence and recipients, from Reports and from Notifications. */

export function CadenceDialog({ value, onClose, onSave }: { value: { day: string; time: string }; onClose: () => void; onSave: (v: { day: string; time: string }) => void }) {
  const [day, setDay] = useState(value.day)
  const [time, setTime] = useState(value.time)
  return (
    <AdminDialog
      title="Change cadence"
      subtitle="When the progress report lands in inboxes."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" onClick={() => onSave({ day, time })} style={BUTTON_BRAND}>
            Save
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={FIELD_LABEL} htmlFor="cad-day">
            Day
          </label>
          <select id="cad-day" value={day} onChange={(e) => setDay(e.target.value)} style={INPUT}>
            {DAYS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={FIELD_LABEL} htmlFor="cad-time">
            Time
          </label>
          <select id="cad-time" value={time} onChange={(e) => setTime(e.target.value)} style={INPUT}>
            {TIMES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </AdminDialog>
  )
}

export function PeopleDialog({ value, onClose, onSave }: { value: string[]; onClose: () => void; onSave: (v: string[]) => void }) {
  const [list, setList] = useState(value)
  const [draft, setDraft] = useState('')
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.trim())
  return (
    <AdminDialog
      title="Who gets it"
      subtitle="Recipients see only recruits in your scope. No portal account needed."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button type="button" onClick={() => onSave(list)} style={BUTTON_BRAND}>
            Save
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ ...PILL, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }}>{ADMIN_EMAIL} · you</span>
        {list.map((p) => (
          <button key={p} type="button" onClick={() => setList((l) => l.filter((x) => x !== p))} aria-label={`Remove ${p}`} style={{ ...PILL, border: 'none', cursor: 'pointer', gap: 6, background: 'var(--admin-fill)', color: 'var(--admin-ink)' }}>
            {p} <XmarkRegular size={9} aria-hidden />
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input aria-label="Add a recipient" placeholder="name@company.com" value={draft} onChange={(e) => setDraft(e.target.value)} style={{ ...INPUT, flex: 1 }} />
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            setList((l) => [...l, draft.trim()])
            setDraft('')
          }}
          style={{ ...BUTTON_OUTLINE, opacity: valid ? 1 : 0.5 }}
        >
          Add
        </button>
      </div>
    </AdminDialog>
  )
}

