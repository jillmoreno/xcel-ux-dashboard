import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import {
  COURSES,
  PROGRAMS,
  STATES,
  audienceLabel,
  formatDay,
  matchAudience,
  trainingById,
  type AssignmentRule,
  type Audience,
  type AudienceKind,
} from '@/data/atlasAdmin/assignments'
import { ArrowLeft, MagnifyingGlass, XmarkRegular } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT } from './adminStyles'
import { emptyDraft, type RuleDraft } from './ruleDraft'

/**
 * ATLAS ADMIN — CREATE ASSIGNMENT RULE (2026-10-20). The reference's
 * three-step builder: What & who, When & notifications, Review — with the
 * Summary and the Audience impact beside it the whole way. Each training
 * picked becomes its own rule with the same audience and schedule.
 *
 * It opens three ways: empty (New assignment rule), on a draft Quick assign
 * read from a sentence (router state `quick`), or on an existing rule
 * (/assignments/rules/:id/edit), where Create becomes Save changes.
 */

const STEPS = ['What & who', 'When & notifications', 'Review'] as const

const WHO: { kind: AudienceKind; title: string; body: string }[] = [
  { kind: 'all', title: 'All learners', body: 'Everyone in your roster who passes the rules below (minus any exclusions you add).' },
  { kind: 'new-hires', title: 'New hires', body: 'Learners enrolled in the last 30 days; optionally narrow by location.' },
  { kind: 'location', title: 'By location', body: 'Only people in one or more states you pick.' },
  { kind: 'filters', title: 'By department or location', body: 'Combine department and location filters.' },
]

export function AtlasAdminRuleWizard() {
  const { ruleId } = useParams()
  const { learners, rules, saveRule, showToast } = useAdminStore()
  const navigate = useNavigate()
  const location = useLocation()
  const editing = ruleId ? rules.find((r) => r.id === ruleId) : undefined
  const quick = (location.state as { quick?: { draft: RuleDraft; found: string[] } } | null)?.quick

  const [draft, setDraft] = useState<RuleDraft>(() =>
    editing
      ? { trainingIds: editing.trainingIds, audience: editing.audience, schedule: editing.schedule, email: editing.email, name: editing.name, description: editing.description }
      : (quick?.draft ?? emptyDraft()),
  )
  const [step, setStep] = useState(0)
  const [search, setSearch] = useState('')
  const [excludeOpen, setExcludeOpen] = useState(draft.audience.excludeDepartments.length > 0)
  const [includeQuery, setIncludeQuery] = useState('')
  const [advanced, setAdvanced] = useState(false)

  const setAudience = (patch: Partial<Audience>) => setDraft((d) => ({ ...d, audience: { ...d.audience, ...patch } }))
  const setSchedule = (patch: Partial<RuleDraft['schedule']>) => setDraft((d) => ({ ...d, schedule: { ...d.schedule, ...patch } }))
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  const impact = useMemo(() => matchAudience(draft.audience, learners), [draft.audience, learners])
  const firstName = trainingById(draft.trainingIds[0])?.name ?? 'New rule'
  const ruleName = draft.name.trim() || `${firstName} automation`
  const back = () => navigate(editing ? `${ADMIN_BASE}/assignments/rules/${editing.id}${window.location.search}` : `${ADMIN_BASE}/assignments${window.location.search}`)

  const canNext = step === 0 ? draft.trainingIds.length > 0 && !(draft.audience.kind === 'location' && draft.audience.states.length === 0) : true

  const create = () => {
    const base = { audience: draft.audience, schedule: draft.schedule, email: draft.email, description: draft.description.trim(), status: 'active' as const, students: impact.matched.length, processed: false }
    if (editing) {
      saveRule({ ...editing, ...base, status: editing.status, trainingIds: draft.trainingIds, name: ruleName })
      showToast('Rule saved')
      return navigate(`${ADMIN_BASE}/assignments/rules/${editing.id}${window.location.search}`)
    }
    const stamp = Date.now()
    const made: AssignmentRule[] = draft.trainingIds.map((id, i) => ({
      ...base,
      id: `rule-new-${stamp}-${i}`,
      trainingIds: [id],
      name: draft.trainingIds.length === 1 ? ruleName : `${trainingById(id)?.name ?? 'Training'} automation`,
    }))
    made.forEach(saveRule)
    showToast(made.length === 1 ? `Rule created — ${impact.matched.length} learners assigned` : `${made.length} rules created`)
    navigate(made.length === 1 ? `${ADMIN_BASE}/assignments/rules/${made[0].id}${window.location.search}` : `${ADMIN_BASE}/assignments${window.location.search}`)
  }

  const q = search.trim().toLowerCase()
  const match = (name: string) => !q || name.toLowerCase().includes(q)
  const includeCandidates = learners.filter((l) => !draft.audience.includeLearners.includes(l.id) && (!includeQuery.trim() || l.name.toLowerCase().includes(includeQuery.trim().toLowerCase()))).slice(0, 12)

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1fr) 300px', alignItems: 'start' }}>
      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--admin-rule)' }}>
          <div>
            <p style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>{editing ? 'Edit assignment rule' : 'Create assignment rule'}</p>
            <h1 style={{ margin: '2px 0 0', fontFamily: HEADING, fontSize: 18, fontWeight: 700, color: 'var(--admin-ink)' }}>{STEPS[step]}</h1>
            <p style={{ margin: '2px 0 8px', fontSize: 12, color: 'var(--admin-muted)' }}>
              Step {step + 1} of 3 · {STEPS[step]}
            </p>
            <div style={{ display: 'flex', gap: 4 }}>
              {STEPS.map((s, i) => (
                <span key={s} style={{ width: 32, height: 3, borderRadius: 2, background: i <= step ? 'var(--admin-brand)' : 'var(--admin-fill)' }} />
              ))}
            </div>
          </div>
          <button type="button" onClick={back} style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13 }}>
            <ArrowLeft size={12} aria-hidden /> {editing ? 'Back to rule' : 'Back to workspace'}
          </button>
        </header>

        {quick && step === 0 && !editing ? (
          <p style={{ margin: 0, padding: '10px 20px', fontSize: 12, background: 'var(--admin-brand-tint)', color: 'var(--admin-ink)' }}>
            Built from your sentence{quick.found.length ? ` — read ${quick.found.join(' · ')}` : ' — nothing recognised, so the defaults are filled in'}. Check it and change anything that is wrong.
          </p>
        ) : null}

        <div style={{ padding: 20 }}>
          {step === 0 ? (
            <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              <div>
                <p style={{ ...EYEBROW, fontSize: 10 }}>What</p>
                <h2 style={H2}>Programs and courses</h2>
                <p style={HELP}>Search and check items to assign. Each selection becomes its own rule with the same audience and schedule.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, margin: '12px 0', padding: '8px 10px', borderRadius: 10, border: '1px solid var(--admin-rule)' }}>
                  <span style={{ ...EYEBROW, fontSize: 10, color: 'var(--admin-brand)' }}>Selected · {draft.trainingIds.length}</span>
                  {draft.trainingIds.map((id) => {
                    const t = trainingById(id)
                    return (
                      <span key={id} style={SELECTED_CHIP}>
                        {t?.name}
                        <span style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--admin-muted)' }}>{t?.kind === 'program' ? 'PROGRAM' : 'COURSE'}</span>
                        <button type="button" aria-label={`Remove ${t?.name}`} onClick={() => setDraft((d) => ({ ...d, trainingIds: d.trainingIds.filter((x) => x !== id) }))} style={CHIP_X}>
                          <XmarkRegular size={9} aria-hidden />
                        </button>
                      </span>
                    )
                  })}
                </div>
                <label style={{ position: 'relative', display: 'block' }}>
                  <MagnifyingGlass size={13} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-faint)' }} />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search programs and courses…" aria-label="Search programs and courses" style={{ ...INPUT, padding: '8px 12px 8px 32px', fontSize: 13 }} />
                </label>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
                  {[
                    { label: 'Training programs', list: PROGRAMS },
                    { label: 'Online courses', list: COURSES },
                  ].map((col) => (
                    <div key={col.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ ...EYEBROW, fontSize: 10 }}>{col.label}</p>
                      {col.list
                        .filter((t) => match(t.name))
                        .map((t) => {
                          const on = draft.trainingIds.includes(t.id)
                          return (
                            <label key={t.id} style={{ ...TILE, borderColor: on ? 'var(--admin-brand)' : 'var(--admin-rule)', background: on ? 'var(--admin-brand-tint)' : 'var(--admin-surface)' }}>
                              <input type="checkbox" checked={on} onChange={() => setDraft((d) => ({ ...d, trainingIds: toggle(d.trainingIds, t.id) }))} style={CHECK} />
                              <span>
                                <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-ink)' }}>{t.name}</strong>
                                <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>{t.kind === 'course' ? `${t.category} • ${t.minutes} min` : t.category}</span>
                              </span>
                            </label>
                          )
                        })}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p style={{ ...EYEBROW, fontSize: 10 }}>Who</p>
                <p style={{ ...EYEBROW, fontSize: 10, marginTop: 8, color: 'var(--admin-brand)' }}>Who is included</p>
                <h2 style={H2}>Who should get this training?</h2>
                <p style={HELP}>Pick a common path first. You can add exclusions in the next section — most rules do not need any.</p>
                <div role="radiogroup" aria-label="Who is included" style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
                  {WHO.map((w) => {
                    const on = draft.audience.kind === w.kind
                    return (
                      <button key={w.kind} type="button" role="radio" aria-checked={on} onClick={() => setAudience({ kind: w.kind })} style={{ ...OPTION, borderColor: on ? 'var(--admin-brand)' : 'var(--admin-rule)', background: on ? 'var(--admin-brand-tint)' : 'var(--admin-surface)' }}>
                        <strong style={{ display: 'block', fontSize: 13, color: on ? 'var(--admin-brand)' : 'var(--admin-ink)' }}>{w.title}</strong>
                        <span style={{ fontSize: 11, lineHeight: 1.4, color: 'var(--admin-text)' }}>{w.body}</span>
                      </button>
                    )
                  })}
                </div>

                {draft.audience.kind !== 'all' ? (
                  <div style={{ marginTop: 16 }}>
                    <span style={FIELD_LABEL}>{draft.audience.kind === 'location' ? 'Locations (pick at least one)' : 'Locations (optional)'}</span>
                    <ToggleChips options={STATES.map(([code, name]) => [code, name])} value={draft.audience.states} onToggle={(v) => setAudience({ states: toggle(draft.audience.states, v) })} />
                  </div>
                ) : null}
                {draft.audience.kind === 'filters' ? (
                  <div style={{ marginTop: 16 }}>
                    <span style={FIELD_LABEL}>Departments</span>
                    <ToggleChips options={ADMIN_DEPARTMENTS.map((d) => [d, d])} value={draft.audience.departments} onToggle={(v) => setAudience({ departments: toggle(draft.audience.departments, v) })} />
                  </div>
                ) : null}

                <div style={{ ...SUB_CARD, marginTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <p style={{ ...EYEBROW, fontSize: 10 }}>Exclude (optional)</p>
                      <strong style={{ fontSize: 13, color: 'var(--admin-ink)' }}>Who should not be enrolled</strong>
                      <p style={{ ...HELP, fontSize: 11 }}>Skip this unless you need to remove specific departments from an otherwise broad rule.</p>
                    </div>
                    <button type="button" onClick={() => setExcludeOpen((o) => !o)} style={{ ...SMALL_PILL, alignSelf: 'flex-start' }}>
                      {draft.audience.excludeDepartments.length ? `${draft.audience.excludeDepartments.length} excluded` : excludeOpen ? 'Hide' : 'None'}
                    </button>
                  </div>
                  {excludeOpen ? (
                    <div style={{ marginTop: 10 }}>
                      <ToggleChips options={ADMIN_DEPARTMENTS.map((d) => [d, d])} value={draft.audience.excludeDepartments} onToggle={(v) => setAudience({ excludeDepartments: toggle(draft.audience.excludeDepartments, v) })} />
                    </div>
                  ) : null}
                </div>

                <div style={{ marginTop: 16 }}>
                  <span style={FIELD_LABEL}>Always include individuals (optional)</span>
                  {draft.audience.includeLearners.length ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {draft.audience.includeLearners.map((id) => (
                        <span key={id} style={SELECTED_CHIP}>
                          {learners.find((l) => l.id === id)?.name ?? id}
                          <button type="button" aria-label="Remove" onClick={() => setAudience({ includeLearners: draft.audience.includeLearners.filter((x) => x !== id) })} style={CHIP_X}>
                            <XmarkRegular size={9} aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <input value={includeQuery} onChange={(e) => setIncludeQuery(e.target.value)} placeholder="Search learners to add" aria-label="Search learners to always include" style={{ ...INPUT, padding: '8px 12px', fontSize: 13 }} />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {includeCandidates.map((l) => (
                      <button key={l.id} type="button" onClick={() => setAudience({ includeLearners: [...draft.audience.includeLearners, l.id] })} style={SMALL_PILL}>
                        + {l.name}
                      </button>
                    ))}
                  </div>
                  <p style={{ ...HELP, fontSize: 11 }}>These people are enrolled even if they do not match the filters above (unless excluded).</p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
              <div>
                <p style={{ ...EYEBROW, fontSize: 10 }}>When</p>
                <h2 style={H2}>Schedule</h2>
                <div role="radiogroup" aria-label="Schedule" style={{ display: 'inline-flex', gap: 2, padding: 3, marginTop: 8, borderRadius: 10, border: '1px solid var(--admin-rule)' }}>
                  {(['ongoing', 'one-time'] as const).map((k) => (
                    <button key={k} type="button" role="radio" aria-checked={draft.schedule.kind === k} onClick={() => setSchedule({ kind: k })} style={draft.schedule.kind === k ? SEG_ON : SEG}>
                      {k === 'ongoing' ? 'Ongoing' : 'One-time'}
                    </button>
                  ))}
                </div>
                <p style={{ ...HELP, fontSize: 11 }}>
                  {draft.schedule.kind === 'ongoing' ? 'Ongoing: anyone who matches later is enrolled too, until you stop assigning.' : 'One-time: only the people who match on the start date.'}
                </p>
                <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 12 }}>
                  <label>
                    <span style={FIELD_LABEL}>Start assigning</span>
                    <input type="date" value={draft.schedule.start} onChange={(e) => e.target.value && setSchedule({ start: e.target.value })} style={INPUT} />
                  </label>
                  <label>
                    <span style={FIELD_LABEL}>Stop assigning after</span>
                    <input type="date" value={draft.schedule.end ?? ''} min={draft.schedule.start} onChange={(e) => setSchedule({ end: e.target.value || null })} style={INPUT} />
                  </label>
                </div>
              </div>
              <div>
                <p style={{ ...EYEBROW, fontSize: 10 }}>Due date</p>
                <p style={HELP}>Days after assignment start (or hire offset if you use advanced timing).</p>
                <label style={{ display: 'block', maxWidth: 200, marginTop: 8 }}>
                  <span style={FIELD_LABEL}>Due offset (days)</span>
                  <input type="number" min={1} max={365} value={draft.schedule.dueOffsetDays} onChange={(e) => setSchedule({ dueOffsetDays: Math.max(1, Number(e.target.value) || 1) })} style={INPUT} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--admin-ink)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={advanced} onChange={() => setAdvanced((a) => !a)} style={CHECK} />
                  Advanced timing (hire-relative offsets, per-course due dates)
                </label>
                {advanced ? (
                  <div style={{ ...SUB_CARD, marginTop: 10 }}>
                    {draft.trainingIds.map((id) => {
                      const t = trainingById(id)
                      return (
                        <div key={id} style={{ marginBottom: 8 }}>
                          <strong style={{ fontSize: 12, color: 'var(--admin-ink)' }}>{t?.name}</strong>
                          {(t?.courses ?? [{ name: t?.name ?? '', type: 'Required' as const, dueDays: draft.schedule.dueOffsetDays }]).map((c) => (
                            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--admin-text)', padding: '2px 0' }}>
                              <span>
                                {c.name} · {c.type}
                              </span>
                              <span>{c.dueDays} days after hire</span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
              <div>
                <p style={{ ...EYEBROW, fontSize: 10 }}>Email (optional)</p>
                <h2 style={H2}>Learner notifications</h2>
                <p style={HELP}>Default: {draft.email}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Link to={`${ADMIN_BASE}/notifications${window.location.search}`} style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}>
                    Customize email template
                  </Link>
                  <Link to={`${ADMIN_BASE}/notifications${window.location.search}`} style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13, textDecoration: 'none' }}>
                    Open in Notifications
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>
              <p style={{ ...EYEBROW, fontSize: 10 }}>Name &amp; review</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setStep(0)} style={SMALL_PILL}>
                  Edit training &amp; audience
                </button>
                <button type="button" onClick={() => setStep(1)} style={SMALL_PILL}>
                  Edit schedule &amp; notifications
                </button>
              </div>
              <label>
                <span style={FIELD_LABEL}>Rule name</span>
                <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder={ruleName} style={INPUT} />
                <span style={{ ...HELP, display: 'block', fontSize: 11 }}>
                  Shown in your assignment list and reports.{draft.trainingIds.length > 1 ? ' With several trainings, each rule is named for its own training.' : ''}
                </span>
              </label>
              <label>
                <span style={FIELD_LABEL}>Description (optional)</span>
                <textarea value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} rows={3} style={{ ...INPUT, resize: 'vertical' }} />
              </label>
              <p style={HELP}>Confirm targets, audience, and schedule in the summary panel on the right before {editing ? 'saving' : 'creating'}.</p>
            </div>
          ) : null}
        </div>

        <footer style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--admin-rule)' }}>
          <button type="button" onClick={step === 0 ? back : () => setStep((s) => s - 1)} style={BUTTON_OUTLINE}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 2 ? (
            <button type="button" disabled={!canNext} onClick={() => setStep((s) => s + 1)} style={{ ...BUTTON_BRAND, opacity: canNext ? 1 : 0.5, cursor: canNext ? 'pointer' : 'default' }}>
              Next
            </button>
          ) : (
            <button type="button" onClick={create} style={BUTTON_BRAND}>
              {editing ? 'Save changes' : draft.trainingIds.length > 1 ? `Create ${draft.trainingIds.length} rules` : 'Create rule'}
            </button>
          )}
        </footer>
      </section>

      <aside style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 16 }}>
        <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>Summary</p>
          <h2 style={{ ...H2, marginTop: 4 }}>{ruleName}</h2>
          <SummaryRow title="Training">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {draft.trainingIds.map((id) => (
                <li key={id}>
                  {trainingById(id)?.name} ({trainingById(id)?.kind === 'program' ? 'Program' : 'Course'})
                </li>
              ))}
              {draft.trainingIds.length === 0 ? <li>Nothing selected yet</li> : null}
            </ul>
          </SummaryRow>
          <SummaryRow title="Audience">{audienceLabel(draft.audience)}</SummaryRow>
          <SummaryRow title="Schedule">
            {draft.schedule.kind === 'ongoing' ? 'Ongoing automation' : 'One-time assignment'}
            <br />
            Start assigning: {formatDay(draft.schedule.start)}
            {draft.schedule.end ? (
              <>
                <br />
                Stop: {formatDay(draft.schedule.end)}
              </>
            ) : null}
            <br />
            Due offset: {draft.schedule.dueOffsetDays} days
          </SummaryRow>
          <SummaryRow title="Email">{draft.email}</SummaryRow>
        </section>
        <section style={{ ...CARD, borderRadius: 14, padding: 16 }}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>Audience impact</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div style={{ borderRadius: 10, padding: 10, border: '1px solid var(--admin-success-edge)', background: 'var(--admin-success-tint)' }}>
              <p style={{ ...EYEBROW, fontSize: 9, color: 'var(--admin-success-ink)' }}>Will receive assignment</p>
              <strong style={{ display: 'block', marginTop: 4, fontFamily: HEADING, fontSize: 24, color: 'var(--admin-ink)' }}>{impact.matched.length}</strong>
            </div>
            <div style={{ borderRadius: 10, padding: 10, border: '1px solid var(--admin-rule)' }}>
              <p style={{ ...EYEBROW, fontSize: 9 }}>Excluded by filters</p>
              <span style={{ display: 'block', marginTop: 4, fontSize: 12, color: 'var(--admin-text)' }}>
                {impact.removed ? `${impact.removed} removed by exclusions` : 'None — no department or individual exclusions applied.'}
              </span>
            </div>
          </div>
          <p style={{ ...EYEBROW, fontSize: 9, marginTop: 12 }}>Sample matched</p>
          <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--admin-ink)' }}>
            {impact.matched.slice(0, 6).map((l) => (
              <li key={l.id}>{l.name}</li>
            ))}
            {impact.matched.length > 6 ? <li style={{ color: 'var(--admin-muted)' }}>…and {impact.matched.length - 6} more</li> : null}
            {impact.matched.length === 0 ? <li style={{ color: 'var(--admin-muted)' }}>No one matches yet.</li> : null}
          </ul>
        </section>
      </aside>
    </div>
  )
}

function SummaryRow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 12 }}>
      <strong style={{ display: 'block', fontSize: 13, color: 'var(--admin-ink)' }}>{title}</strong>
      <div style={{ marginTop: 2, fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text)' }}>{children}</div>
    </div>
  )
}

function ToggleChips({ options, value, onToggle }: { options: (readonly [string, string])[]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(([v, label]) => {
        const on = value.includes(v)
        return (
          <button key={v} type="button" aria-pressed={on} onClick={() => onToggle(v)} style={{ ...SMALL_PILL, ...(on ? { borderColor: 'var(--admin-ink)', background: 'var(--admin-ink)', color: 'var(--admin-surface)' } : null) }}>
            {label}
          </button>
        )
      })}
    </div>
  )
}

const H2: CSSProperties = { margin: '4px 0 0', fontFamily: HEADING, fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }
const HELP: CSSProperties = { margin: '4px 0 0', fontSize: 12, lineHeight: 1.5, color: 'var(--admin-text)' }
const TILE: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, borderWidth: 1, borderStyle: 'solid', cursor: 'pointer' }
const OPTION: CSSProperties = { textAlign: 'left', padding: '10px 12px', borderRadius: 10, borderWidth: 1, borderStyle: 'solid', fontFamily: 'inherit', cursor: 'pointer' }
const CHECK: CSSProperties = { width: 15, height: 15, marginTop: 1, accentColor: 'var(--admin-brand)', cursor: 'pointer', flex: 'none' }
const SUB_CARD: CSSProperties = { padding: 12, borderRadius: 10, border: '1px solid var(--admin-rule)', background: 'var(--admin-fill-soft)' }
const SELECTED_CHIP: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 4px 2px 10px', borderRadius: 9999, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', fontSize: 12, color: 'var(--admin-ink)' }
const CHIP_X: CSSProperties = { display: 'grid', placeItems: 'center', width: 18, height: 18, padding: 0, border: 'none', borderRadius: 9999, background: 'none', color: 'var(--admin-muted)', cursor: 'pointer' }
const SMALL_PILL: CSSProperties = { borderRadius: 9999, borderWidth: 1, borderStyle: 'solid', borderColor: 'var(--admin-rule-strong)', background: 'var(--admin-surface)', padding: '4px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer', whiteSpace: 'nowrap' }
const SEG: CSSProperties = { border: 'none', borderRadius: 7, background: 'none', padding: '5px 12px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const SEG_ON: CSSProperties = { ...SEG, background: 'var(--admin-fill)', color: 'var(--admin-ink)' }
