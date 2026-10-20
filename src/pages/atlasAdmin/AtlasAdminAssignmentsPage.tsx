import { useMemo, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDay, addDays, type AssignmentRule } from '@/data/atlasAdmin/assignments'
import { Download, MagnifyingGlass, Plus, Sparkles } from '@/icons'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, HEADING, INPUT, PAGE_H1, PAGE_SUB, PILL } from './adminStyles'
import { parseRuleSentence } from './ruleDraft'

/**
 * ATLAS ADMIN — ASSIGNMENT RULES (2026-10-20). The reference's /assignments
 * workspace: Quick assign over the list, then every rule with its dates,
 * schedule, enrolment and status — Active or Archived, searchable, exported
 * as CSV. A row opens the rule; New assignment rule opens the wizard.
 */

const PAGE = 25

export function AtlasAdminAssignmentsPage() {
  const { rules } = useAdminStore()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'active' | 'archived'>('active')
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)
  const [sentence, setSentence] = useState('')

  const enrolled = rules.reduce((n, r) => n + r.students, 0)
  const visible = useMemo(
    () => rules.filter((r) => r.status === tab && (!query.trim() || r.name.toLowerCase().includes(query.trim().toLowerCase()))),
    [rules, tab, query],
  )

  const go = (path: string, state?: unknown) => navigate(`${ADMIN_BASE}/assignments${path}${window.location.search}`, { state })
  const build = () => {
    if (!sentence.trim()) return go('/quick')
    go('/new', { quick: parseRuleSentence(sentence) })
  }

  const exportCsv = () => {
    const head = ['Name', 'Start', 'Due', 'End', 'Schedule', 'Students', 'Status']
    const body = visible.map((r) => [r.name, r.schedule.start, dueOf(r), r.schedule.end ?? '', r.processed ? 'Processed' : 'Pending', r.students, r.status])
    const csv = [head, ...body].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = 'assignment-rules.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={PAGE_H1}>Assignment Rules</h1>
          <p style={PAGE_SUB}>All assignment rules, schedules, enrollment counts, and completion in one workspace.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={exportCsv} style={BUTTON_OUTLINE}>
            <Download size={13} aria-hidden /> Export report
          </button>
          <button type="button" onClick={() => go('/quick')} style={{ ...BUTTON_OUTLINE, background: 'var(--admin-brand-tint)', borderColor: 'var(--admin-brand-soft-edge)', color: 'var(--admin-brand)' }}>
            <Sparkles size={13} aria-hidden /> Quick assign with AI
          </button>
          <button type="button" onClick={() => go('/new')} style={BUTTON_BRAND}>
            <Plus size={12} aria-hidden /> New assignment rule
          </button>
        </div>
      </div>

      <section style={{ ...CARD, borderRadius: 14, padding: 16, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: '1 1 380px', display: 'flex', gap: 12 }}>
          <span aria-hidden style={SPARK}>
            <Sparkles size={13} />
          </span>
          <div style={{ flex: 1 }}>
            <strong style={{ fontFamily: HEADING, fontSize: 15, color: 'var(--admin-ink)' }}>Quick assign with AI</strong>
            <p style={{ margin: '2px 0 10px', fontSize: 13, color: 'var(--admin-text)' }}>Describe the rule in one sentence, or open the step-by-step wizard.</p>
            <input
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && build()}
              placeholder='Describe a rule: "Assign New Agent Onboarding to Florida new hires, due in 14 days"'
              aria-label="Describe a rule"
              style={{ ...INPUT, maxWidth: 520, padding: '8px 12px', fontSize: 13 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={build} style={BUTTON_BRAND}>
            <Sparkles size={13} aria-hidden /> Build from sentence
          </button>
          <button type="button" onClick={() => go('/quick', { mode: 'steps' })} style={BUTTON_OUTLINE}>
            Step-by-step wizard
          </button>
          <button type="button" onClick={() => go('/new')} style={BUTTON_OUTLINE}>
            Full rule builder
          </button>
        </div>
      </section>

      <section style={{ ...CARD, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ ...EYEBROW, fontSize: 11 }}>Assignment rules</p>
        <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>
          {rules.length} rules · {enrolled.toLocaleString('en-US')} enrolled learners
        </span>
      </section>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div role="tablist" style={SEG_WRAP}>
          {(['active', 'archived'] as const).map((k) => (
            <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => (setTab(k), setShown(PAGE))} style={tab === k ? SEG_ON : SEG}>
              {k === 'active' ? 'Active' : 'Archived / ended'}
            </button>
          ))}
        </div>
        <label style={{ position: 'relative', flex: '0 1 260px' }}>
          <MagnifyingGlass size={13} aria-hidden style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-faint)' }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assignment rules" aria-label="Search assignment rules" style={{ ...INPUT, padding: '8px 12px 8px 32px', fontSize: 13 }} />
        </label>
      </div>

      <section style={{ ...CARD, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead style={{ background: 'var(--admin-fill-soft)' }}>
              <tr>
                {['Name', 'Start / due / end', 'Schedule', 'Students', 'Status'].map((h) => (
                  <th key={h} style={TH}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, shown).map((r) => (
                <tr
                  key={r.id}
                  className="cre-admin-row"
                  tabIndex={0}
                  onClick={() => go(`/rules/${r.id}`)}
                  onKeyDown={(e) => e.key === 'Enter' && go(`/rules/${r.id}`)}
                  style={{ borderTop: '1px solid var(--admin-rule)', cursor: 'pointer' }}
                >
                  <td style={{ ...TD, fontWeight: 600, color: 'var(--admin-ink)' }}>{r.name}</td>
                  <td style={{ ...TD, fontSize: 11, lineHeight: 1.45, color: 'var(--admin-muted)', whiteSpace: 'nowrap' }}>
                    Start: {formatDay(r.schedule.start)}
                    <br />
                    Due: {formatDay(dueOf(r))}
                    <br />
                    End: {formatDay(r.schedule.end)}
                  </td>
                  <td style={TD}>
                    <span style={{ ...PILL, fontSize: 10, letterSpacing: '0.06em', background: 'var(--admin-fill)', color: 'var(--admin-text)' }}>{r.processed ? 'PROCESSED' : 'PENDING'}</span>
                  </td>
                  <td style={{ ...TD, fontWeight: 700, color: 'var(--admin-brand)' }}>{r.students}</td>
                  <td style={TD}>
                    <span style={{ ...PILL, fontSize: 10, letterSpacing: '0.06em', ...(r.status === 'active' ? { background: 'var(--admin-success-tint)', color: 'var(--admin-success-ink)' } : { background: 'var(--admin-fill)', color: 'var(--admin-muted)' }) }}>
                      {r.status === 'active' ? 'ACTIVE' : 'ARCHIVED'}
                    </span>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...TD, padding: 32, textAlign: 'center', color: 'var(--admin-muted)' }}>
                    No rules match.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {visible.length > shown ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--admin-rule)', fontSize: 12, color: 'var(--admin-muted)' }}>
            Showing {shown} of {visible.length}
            <button type="button" onClick={() => setShown((n) => n + PAGE)} style={{ ...BUTTON_OUTLINE, padding: '6px 14px', fontSize: 13 }}>
              Show more
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function dueOf(r: AssignmentRule) {
  return addDays(r.schedule.start, r.schedule.dueOffsetDays)
}

const SPARK: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  flex: 'none',
  width: 28,
  height: 28,
  borderRadius: 8,
  background: 'var(--admin-brand)',
  color: 'var(--admin-surface)',
}
const SEG_WRAP: CSSProperties = { display: 'inline-flex', gap: 2, padding: 3, borderRadius: 10, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)' }
const SEG: CSSProperties = { border: 'none', borderRadius: 7, background: 'none', padding: '5px 10px', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const SEG_ON: CSSProperties = { ...SEG, background: 'var(--admin-fill)', color: 'var(--admin-ink)' }
const TH: CSSProperties = { padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--admin-muted)', whiteSpace: 'nowrap' }
const TD: CSSProperties = { padding: '10px 16px', verticalAlign: 'middle' }
