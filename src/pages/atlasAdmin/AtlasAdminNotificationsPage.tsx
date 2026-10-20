import { useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeRegular, XmarkRegular } from '@/icons'
import { ADMIN_NOTIFICATIONS, type NotificationAction, type NotificationDef, type NotificationPreview } from '@/data/atlasAdmin/notifications'
import { AdminDialog } from './AdminDialog'
import { CadenceDialog, PeopleDialog } from './adminDialogs'
import { ADMIN_BASE, ADMIN_EMAIL, useAdminStore } from './adminStore'
import { ATLAS_BUTTON_PRIMARY, BUTTON_BRAND, BUTTON_OUTLINE, CARD, FIELD_LABEL, INPUT, PAGE_H1, PAGE_SUB, PILL } from './adminStyles'

/**
 * ATLAS ADMIN · NOTIFICATIONS — rebuilt from colibri-b2b.vercel.app/
 * notifications (2026-10-19). Everything the portal sends, in two lists —
 * what the admin receives, what recruits receive from the admin — each row a
 * switch, its status line and its actions; and beside them the selected row's
 * message, as it will arrive. The Progress report shares its switch, cadence
 * and recipients with Reports (the admin store), and its preview counts come
 * from the live roster.
 */

const ACTION_LABEL: Record<NotificationAction, string> = {
  cadence: 'Change cadence',
  recipients: 'Recipients',
  sample: 'Send me a sample',
  rules: 'Edit the rules',
  note: 'Edit your note',
  day: 'Change the day',
  timing: 'Change timing',
}

type Dialog = null | 'cadence' | 'recipients' | 'rules' | 'note' | 'day' | 'timing' | 'history'

export function AtlasAdminNotificationsPage() {
  const { learners, progressReport, setProgressReport, showToast, touches } = useAdminStore()
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(ADMIN_NOTIFICATIONS.map((n) => [n.id, n.defaultOn])))
  const [selected, setSelected] = useState('progress-report')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [note, setNote] = useState('Excited to get you licensed this month.')
  const [nudgeDay, setNudgeDay] = useState(10)
  const [scoreDays, setScoreDays] = useState(7)
  const [rules, setRules] = useState({ neverOpened: 10, quiet: 14, noExamDate: true })
  const [draft, setDraft] = useState('')

  const isOn = (n: NotificationDef) => (n.id === 'progress-report' ? progressReport.active : on[n.id])
  const toggle = (n: NotificationDef) => {
    const next = !isOn(n)
    if (n.id === 'progress-report') setProgressReport({ active: next })
    else setOn((o) => ({ ...o, [n.id]: next }))
    showToast(`${n.title} · ${next ? 'on' : 'off'}`)
  }
  const statusLine = (n: NotificationDef) => {
    if (!isOn(n)) return n.offLine
    if (n.id === 'progress-report') return `Active · ${progressReport.day} at ${progressReport.time} · you plus ${progressReport.people.length} recipients`
    if (n.id === 'day-10') return `Active · day ${nudgeDay} · once per recruit`
    if (n.id === 'exam-score') return `Active · sends ${scoreDays} days after they complete all their training`
    if (n.id === 'falls-behind')
      return `Active · never opened after ${rules.neverOpened} days · quiet ${rules.quiet} days${rules.noExamDate ? ' · finished with no exam date' : ''}`
    return n.onLine
  }
  const runAction = (a: NotificationAction) => {
    if (a === 'sample') showToast(`Sample sent to ${ADMIN_EMAIL}`)
    else setDialog(a)
  }
  const sel = ADMIN_NOTIFICATIONS.find((n) => n.id === selected)!

  const groups = [
    { id: 'admin' as const, title: 'What you receive', sub: 'Sent to you and anyone you add as a recipient' },
    { id: 'recruit' as const, title: 'What your recruits receive', sub: 'Sent from you · replies come back to your inbox' },
  ]

  const addPerson = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    const v = draft.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || progressReport.people.includes(v)) return
    setProgressReport({ people: [...progressReport.people, v] })
    setDraft('')
  }

  const sendSample = () => showToast(`Sample sent to ${ADMIN_EMAIL}`)

  return (
    /* On the Atlas Global Navigation palette, CTAs on XCEL red (2026-10-20,
       Eric's request) — `.cre-admin-atlas` in tokens.css. */
    <div className="cre-admin-atlas" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={PAGE_H1}>Notifications</h2>
        <p style={PAGE_SUB}>Everything the portal sends, in one list. Click any row to read the message before you trust it.</p>
      </div>
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '500px minmax(0, 1fr)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map((g) => {
            const list = ADMIN_NOTIFICATIONS.filter((n) => n.group === g.id)
            return (
              <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 24px 14px', borderBottom: '1px solid var(--admin-rule)' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-ink)' }}>{g.title}</h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-muted)' }}>{g.sub}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
                      {list.filter(isOn).length} of {list.length} on
                    </span>
                  </div>
                  {list.map((n, i) => {
                    const active = selected === n.id
                    return (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        onClick={() => setSelected(n.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelected(n.id)
                        }}
                        style={{ ...ROW, ...(active ? { paddingTop: 22, boxShadow: 'inset 3px 0 0 var(--admin-atlas-primary-200), inset -3px 0 0 var(--admin-atlas-primary-200)' } : null), paddingBottom: (i === list.length - 1 ? 20 : 10) + (active ? 8 : 0), background: active ? 'var(--admin-brand-tint)' : undefined, borderTop: i ? '1px solid var(--admin-rule)' : undefined }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>
                              {n.title}
                              {active ? <span style={SELECTED}>Selected</span> : null}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45, color: 'var(--admin-text)' }}>{n.description}</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isOn(n)}
                            aria-label={`${n.title} on`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggle(n)
                            }}
                            style={{ ...SWITCH, background: isOn(n) ? 'var(--admin-brand)' : 'var(--admin-rule-strong)' }}
                          >
                            <span style={{ ...KNOB, left: isOn(n) ? 18 : 2 }} />
                          </button>
                        </div>
                        {/* The status line, then the links — each across the full row under a 1px rule. */}
                        <p style={{ margin: '10px 0 0', paddingTop: 8, borderTop: `1px solid ${active ? 'var(--admin-atlas-primary-200)' : 'var(--admin-atlas-primary-100)'}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, lineHeight: '11.5px', color: 'var(--admin-muted)' }}>
                          <span aria-hidden style={{ flex: 'none', width: 6, height: 6, borderRadius: '50%', background: isOn(n) ? 'var(--admin-success-ink)' : 'var(--admin-faint)' }} />
                          {statusLine(n)}
                        </p>
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${active ? 'var(--admin-atlas-primary-200)' : 'var(--admin-atlas-primary-100)'}`, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 20 }}>
                          {n.actions.map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelected(n.id)
                                runAction(a)
                              }}
                              className="cre-admin-text-link" style={ACTION}
                            >
                              {ACTION_LABEL[a]}
                            </button>
                          ))}
                          {n.id !== 'progress-report' ? (
                            <button type="button" onClick={() => setSelected(n.id)} className="cre-admin-text-link" style={ACTION}>
                              Preview
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </section>
                {g.id === 'admin' ? (
                  <div style={{ ...CARD, borderRadius: 14, padding: 24, background: 'var(--admin-fill-soft)' }}>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text)' }}>
                      No recruit gets more than one email or text from XCEL in 7 days, whatever is switched on here.
                    </p>
                    <button type="button" onClick={() => setDialog('history')} className="cre-admin-text-link" style={{ ...ACTION, display: 'block', marginTop: 6, marginLeft: 'auto' }}>
                      Sending history
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div style={{ position: 'sticky', top: 104, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sel.preview ? <EmailPreview title={sel.title} onSample={sendSample} p={sel.id === 'invite' ? { ...sel.preview, body: sel.preview.body.map((b) => (b.startsWith('“') ? `“${note}” Cody McClintock` : b)) } : sel.preview} /> : <ProgressPreview title={sel.title} onSample={sendSample} learners={learners} />}
          {sel.group === 'admin' ? (
            <section style={{ ...CARD, borderRadius: 14, padding: 24 }}>
              <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: 'var(--admin-ink)' }}>Recipients</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <span style={{ ...PILL, background: 'var(--admin-brand)', color: 'var(--admin-surface)' }}>{ADMIN_EMAIL}</span>
                {progressReport.people.map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-label={`Remove ${p}`}
                    onClick={() => setProgressReport({ people: progressReport.people.filter((x) => x !== p) })}
                    style={{ ...PILL, gap: 6, border: 'none', cursor: 'pointer', background: 'var(--admin-fill)', color: 'var(--admin-ink)' }}
                  >
                    {p} <XmarkRegular size={8} aria-hidden />
                  </button>
                ))}
                <input aria-label="Add a recipient" placeholder="+ Add" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={addPerson} style={ADD} />
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>Recipients see only the recruits in your scope. No portal account needed.</p>
            </section>
          ) : null}
        </div>
      </div>

      {dialog === 'cadence' ? (
        <CadenceDialog
          value={{ day: progressReport.day, time: progressReport.time }}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            setProgressReport(v)
            showToast(`Progress report · ${v.day} at ${v.time}`)
            setDialog(null)
          }}
        />
      ) : null}
      {dialog === 'recipients' ? (
        <PeopleDialog
          value={progressReport.people}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            setProgressReport({ people: v })
            setDialog(null)
          }}
        />
      ) : null}
      {dialog === 'note' ? (
        <SimpleDialog title="Edit your note" sub="Shows in quotes at the top of every invite." onClose={() => setDialog(null)} onSave={() => setDialog(null)}>
          <textarea aria-label="Your note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} style={{ ...INPUT, resize: 'vertical' }} />
        </SimpleDialog>
      ) : null}
      {dialog === 'day' ? (
        <SimpleDialog title="Change the day" sub="When the nudge goes to recruits who have not opened the course." onClose={() => setDialog(null)} onSave={() => setDialog(null)}>
          <NumberField label="Day" value={nudgeDay} onChange={setNudgeDay} min={3} max={30} />
        </SimpleDialog>
      ) : null}
      {dialog === 'timing' ? (
        <SimpleDialog title="Change timing" sub="Days after they complete all their training." onClose={() => setDialog(null)} onSave={() => setDialog(null)}>
          <NumberField label="Days" value={scoreDays} onChange={setScoreDays} min={1} max={60} />
        </SimpleDialog>
      ) : null}
      {dialog === 'rules' ? (
        <SimpleDialog title="Edit the rules" sub="One email the moment a recruit crosses any of these." onClose={() => setDialog(null)} onSave={() => setDialog(null)}>
          <NumberField label="Never opened after (days)" value={rules.neverOpened} onChange={(v) => setRules((r) => ({ ...r, neverOpened: v }))} min={3} max={30} />
          <NumberField label="Quiet for (days)" value={rules.quiet} onChange={(v) => setRules((r) => ({ ...r, quiet: v }))} min={2} max={30} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--admin-ink)' }}>
            <input type="checkbox" checked={rules.noExamDate} onChange={(e) => setRules((r) => ({ ...r, noExamDate: e.target.checked }))} style={{ accentColor: 'var(--admin-brand)' }} />
            Finished with no exam date
          </label>
        </SimpleDialog>
      ) : null}
      {dialog === 'history' ? (
        <AdminDialog
          title="Sending history"
          subtitle="The last week. One email or text per recruit in 7 days, whatever is switched on."
          onClose={() => setDialog(null)}
          footer={
            <button type="button" onClick={() => setDialog(null)} style={BUTTON_BRAND}>
              Done
            </button>
          }
          width={560}
        >
          <History touches={touches.map((t) => ({ who: learners.find((l) => l.id === t.learnerId)?.name ?? t.learnerId, what: t.kind === 'call' ? 'Call logged' : t.kind === 'exam-date' ? 'Exam date set' : 'Nudge', when: 'Today' }))} learners={learners} />
        </AdminDialog>
      ) : null}
    </div>
  )
}

/** The preview card's title — white on Atlas primary 500, across the card's
 *  top, with Send me a sample at its far right. It reaches 1px past the
 *  card's padding box so its fill covers the card's top and side rules there,
 *  and takes the card's top corners. */
function PreviewBanner({ title, onSample }: { title: string; onSample: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '-1px -1px 0', padding: '9px 25px 8px', borderRadius: '14px 14px 0 0', background: 'var(--admin-atlas-primary-500)', color: 'var(--admin-surface)' }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Preview · {title}</p>
      <button type="button" onClick={onSample} style={{ ...ACTION, display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--admin-surface)' }}>
        <EnvelopeRegular size={12} aria-hidden /> Send me a sample
      </button>
    </div>
  )
}

function EmailPreview({ title, onSample, p }: { title: string; onSample: () => void; p: NotificationPreview }) {
  return (
    <section style={{ ...CARD, borderRadius: 14 }}>
      <PreviewBanner title={title} onSample={onSample} />
      <div style={{ padding: '24px 24px 10px', background: 'var(--admin-fill-soft)', borderBottom: '1px solid var(--admin-rule)', fontSize: 11, color: 'var(--admin-text)', lineHeight: 1.6 }}>
        <div>From {p.from}</div>
        <div>To {p.to}</div>
        {p.replyTo ? <div>Reply-To {p.replyTo}</div> : null}
        <div style={{ fontWeight: 600, color: 'var(--admin-ink)' }}>{p.subject}</div>
      </div>
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 700, color: 'var(--admin-ink)' }}>{p.subject}</h3>
        {p.body.map((b, i) => (
          <p key={i} style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: b.startsWith('“') ? 'var(--admin-ink)' : 'var(--admin-text)', fontStyle: b.startsWith('“') ? 'italic' : undefined }}>
            {b}
          </p>
        ))}
        {p.items ? (
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--admin-ink)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {p.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        ) : null}
        {p.note ? <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-muted)' }}>{p.note}</p> : null}
        {p.cta ? (
          <span style={{ ...BUTTON_BRAND, alignSelf: 'flex-start', padding: '7px 14px', fontSize: 13, cursor: 'default' }}>{p.cta}</span>
        ) : null}
        {p.ctaAlt ? <p style={{ margin: 0, fontSize: 12.5, color: 'var(--admin-brand)', fontWeight: 600 }}>{p.ctaAlt}</p> : null}
        {p.footer ? <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--admin-muted)' }}>{p.footer}</p> : null}
      </div>
    </section>
  )
}

function ProgressPreview({ title, onSample, learners }: { title: string; onSample: () => void; learners: ReturnType<typeof useAdminStore>['learners'] }) {
  const live = learners.filter((l) => l.stage !== 'licensed' && !l.hiddenFromReport)
  const counts = [
    { key: 'quiet7', label: 'No activity in the last 7 days', n: live.filter((l) => l.lastActiveDays >= 7).length, tone: 'var(--admin-brand-tint)' },
    { key: 'low', label: 'Trending low', n: live.filter((l) => l.readiness === 'low').length, tone: 'var(--admin-atlas-secondary-100)' },
    { key: 'quiet2', label: 'Quiet 2 days', n: live.filter((l) => l.lastActiveDays >= 2).length, tone: 'var(--admin-atlas-secondary-100)' },
  ]
  const total = live.filter((l) => l.lastActiveDays >= 2 || l.readiness === 'low').length
  const expiring = live.filter((l) => l.stage === 'stalled').slice(0, 3)
  const search = window.location.search
  return (
    <section style={{ ...CARD, borderRadius: 14 }}>
      <PreviewBanner title={title} onSample={onSample} />
      <div style={{ padding: '24px 24px 10px', background: 'var(--admin-fill-soft)', borderBottom: '1px solid var(--admin-rule)', fontSize: 11, color: 'var(--admin-text)', lineHeight: 1.6 }}>
        <div>From XCEL Solutions</div>
        <div>To Cody McClintock</div>
        <div style={{ fontWeight: 600, color: 'var(--admin-ink)' }}>{total} recruits need a nudge</div>
      </div>
      <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: 'var(--admin-ink)' }}>
          <span style={{ color: 'var(--admin-brand)' }}>{total} recruits</span> need a nudge
        </h3>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--admin-text)' }}>Nothing broke overnight. These are the people whose next step is waiting on you.</p>
        {counts.map((c) => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 16, borderRadius: 10, background: c.tone, padding: '4px 16px' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'var(--admin-ink)', minWidth: 36 }}>{c.n}</span>
            <span style={{ flex: 1, fontSize: 13, color: 'var(--admin-ink)' }}>{c.label}</span>
            <Link to={`${ADMIN_BASE}/students${search}${search ? '&' : '?'}filter=${c.key}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-brand)', textDecoration: 'none' }}>
              View list
            </Link>
          </div>
        ))}
        <Link to={`${ADMIN_BASE}/my-team${search}`} style={{ ...ATLAS_BUTTON_PRIMARY, alignSelf: 'flex-start', textDecoration: 'none' }}>
          Open My Team
        </Link>
        {expiring.map((l, i) => (
          <p key={l.id} style={{ margin: 0, fontSize: 12.5, color: 'var(--admin-text)' }}>
            <Link to={`${ADMIN_BASE}/students/recruit/${encodeURIComponent(l.id)}${search}`} style={{ color: 'var(--admin-brand)', fontWeight: 600, textDecoration: 'none' }}>
              {l.name}
            </Link>{' '}
            · Expiring · Access ends in {[1, 3, 3][i]} {i ? 'days' : 'day'}. Course not complete.
          </p>
        ))}
      </div>
    </section>
  )
}

function History({ touches, learners }: { touches: { who: string; what: string; when: string }[]; learners: ReturnType<typeof useAdminStore>['learners'] }) {
  const base = useMemo(
    () =>
      learners
        .filter((l) => l.lastActiveDays >= 7 && l.stage !== 'licensed')
        .slice(0, 8)
        .map((l, i) => ({ who: l.name, what: i % 3 === 0 ? 'Day 10 nudge · email' : i % 3 === 1 ? 'Quiet 7 days · email, then text' : 'Quiet 7 days · email', when: `${(i % 6) + 1} days ago` })),
    [learners],
  )
  const rows = [...touches, ...base]
  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: i ? '1px solid var(--admin-fill)' : undefined, fontSize: 13 }}>
          <span style={{ color: 'var(--admin-ink)', fontWeight: 600 }}>{r.who}</span>
          <span style={{ color: 'var(--admin-text)', flex: 1, textAlign: 'right' }}>{r.what}</span>
          <span style={{ color: 'var(--admin-muted)', width: 80, textAlign: 'right' }}>{r.when}</span>
        </div>
      ))}
    </div>
  )
}

function SimpleDialog({ title, sub, onClose, onSave, children }: { title: string; sub: string; onClose: () => void; onSave: () => void; children: ReactNode }) {
  const { showToast } = useAdminStore()
  return (
    <AdminDialog
      title={title}
      subtitle={sub}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} style={BUTTON_OUTLINE}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              showToast('Saved')
              onSave()
            }}
            style={BUTTON_BRAND}
          >
            Save
          </button>
        </>
      }
    >
      {children}
    </AdminDialog>
  )
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  const id = `num-${label.replace(/\W+/g, '-')}`
  return (
    <div>
      <label style={FIELD_LABEL} htmlFor={id}>
        {label}
      </label>
      <input id={id} type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))} style={{ ...INPUT, width: 120 }} />
    </div>
  )
}

/* ── Styles ─────────────────────────────────────────────────────────────── */

/* 24 to the card's edges, 14 between rows — the last row takes 24 below (in the map). */
const ROW: CSSProperties = { paddingTop: 14, paddingLeft: 24, paddingRight: 24, cursor: 'pointer', outline: 'none' }
const SELECTED: CSSProperties = { ...PILL, marginLeft: 8, padding: '1px 8px', fontSize: 10, background: 'var(--admin-surface)', color: 'var(--admin-brand)', boxShadow: 'inset 0 0 0 1px var(--admin-brand-edge)' }
const ACTION: CSSProperties = { padding: 0, border: 'none', background: 'none', fontSize: 12, fontWeight: 600, color: 'var(--admin-atlas-primary-500)', cursor: 'pointer' }
const SWITCH: CSSProperties = { position: 'relative', flex: 'none', width: 36, height: 20, border: 'none', borderRadius: 9999, padding: 0, cursor: 'pointer' }
const KNOB: CSSProperties = { position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: 'var(--admin-surface)', boxShadow: '0 1px 2px rgb(0 0 0 / 0.2)', transition: 'left 120ms ease' }
const ADD: CSSProperties = { width: 120, border: '1px dashed var(--admin-rule-strong)', borderRadius: 9999, padding: '3px 10px', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)' }
