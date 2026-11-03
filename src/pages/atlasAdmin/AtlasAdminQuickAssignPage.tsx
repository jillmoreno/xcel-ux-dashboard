import { useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { STATES, TRAININGS, type AudienceKind } from '@/data/atlasAdmin/assignments'
import { ArrowLeft, Sparkles } from '@/icons'
import { ADMIN_BASE } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, FIELD_LABEL, HEADING, INPUT, PAGE_SUB } from './adminStyles'
import { QUICK_EXAMPLES, emptyDraft, parseRuleSentence } from './ruleDraft'

/**
 * ATLAS ADMIN — QUICK ASSIGN (2026-10-20). The reference's
 * /assignments/quick: describe the rule in one sentence, or answer four
 * questions one at a time. Either way it ends in the rule wizard, filled in,
 * for the admin to check — nothing is created from here.
 */
export function AtlasAdminQuickAssignPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'sentence' | 'steps'>((location.state as { mode?: 'steps' } | null)?.mode ?? 'sentence')
  const [text, setText] = useState('')
  const [q, setQ] = useState(0)
  const [answers, setAnswers] = useState({ training: TRAININGS[0].id, who: 'all' as AudienceKind, place: '', due: 14 })

  const toWizard = (quick: ReturnType<typeof parseRuleSentence>) => navigate(`${ADMIN_BASE}/assignments/new${window.location.search}`, { state: { quick } })
  const build = () => text.trim() && toWizard(parseRuleSentence(text))
  const finishSteps = () => {
    const draft = emptyDraft()
    draft.trainingIds = [answers.training]
    const isState = STATES.some(([c]) => c === answers.place)
    draft.audience = {
      ...draft.audience,
      kind: answers.who,
      states: isState ? [answers.place] : [],
      departments: answers.who === 'filters' && !isState && answers.place ? [answers.place] : [],
    }
    draft.schedule.dueOffsetDays = answers.due
    toWizard({ draft, found: ['your answers'] })
  }

  const QUESTIONS = [
    {
      title: 'What training?',
      body: (
        <select value={answers.training} onChange={(e) => setAnswers((a) => ({ ...a, training: e.target.value }))} style={INPUT}>
          {TRAININGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.kind === 'program' ? 'Program' : 'Course'})
            </option>
          ))}
        </select>
      ),
    },
    {
      title: 'Who gets it?',
      body: (
        <select value={answers.who} onChange={(e) => setAnswers((a) => ({ ...a, who: e.target.value as AudienceKind, place: '' }))} style={INPUT}>
          <option value="all">All learners</option>
          <option value="new-hires">New hires</option>
          <option value="location">People in one state</option>
          <option value="filters">One department</option>
        </select>
      ),
    },
    {
      title: answers.who === 'filters' ? 'Which department?' : 'Where? (optional)',
      body: (
        <select value={answers.place} onChange={(e) => setAnswers((a) => ({ ...a, place: e.target.value }))} style={INPUT}>
          <option value="">{answers.who === 'filters' ? 'Pick a department' : 'Anywhere'}</option>
          {answers.who === 'filters'
            ? ADMIN_DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))
            : STATES.map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
        </select>
      ),
    },
    {
      title: 'Due how many days after it is assigned?',
      body: <input type="number" min={1} max={365} value={answers.due} onChange={(e) => setAnswers((a) => ({ ...a, due: Math.max(1, Number(e.target.value) || 1) }))} style={{ ...INPUT, maxWidth: 160 }} />,
    },
  ]
  const blocked = q === 2 && (answers.who === 'location' || answers.who === 'filters') && !answers.place

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <button type="button" onClick={() => navigate(`${ADMIN_BASE}/assignments${window.location.search}`)} style={{ ...BUTTON_OUTLINE, alignSelf: 'flex-start', padding: '6px 14px', fontSize: 13 }}>
        <ArrowLeft size={12} aria-hidden /> Back to workspace
      </button>
      <div>
        <h1 style={{ margin: 0, fontFamily: HEADING, fontSize: 24, fontWeight: 700, color: 'var(--admin-ink)' }}>Quick assign</h1>
        <p style={PAGE_SUB}>Describe who gets what training in one sentence, or switch to step-by-step questions.</p>
      </div>
      <div role="tablist" style={{ display: 'inline-flex', alignSelf: 'flex-start', gap: 2, padding: 3, borderRadius: 10, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)' }}>
        {(['sentence', 'steps'] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)} style={mode === k ? SEG_ON : SEG}>
            {k === 'sentence' ? 'One sentence' : 'Step-by-step'}
          </button>
        ))}
      </div>

      {mode === 'sentence' ? (
        <section style={{ ...CARD, borderRadius: 14, padding: 20 }}>
          <label>
            <span style={{ ...FIELD_LABEL, textTransform: 'none', letterSpacing: 0, fontSize: 13, fontWeight: 400 }}>
              Describe the assignment in one sentence — training, audience, schedule, and new-hire handling. Include locations, departments, or due dates.
            </span>
            <textarea
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && build()}
              rows={4}
              style={{ ...INPUT, resize: 'vertical' }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <button type="button" disabled={!text.trim()} onClick={build} style={{ ...BUTTON_BRAND, opacity: text.trim() ? 1 : 0.5, cursor: text.trim() ? 'pointer' : 'default' }}>
              <Sparkles size={13} aria-hidden /> Build assignment
            </button>
            <span style={{ fontSize: 12, color: 'var(--admin-muted)' }}>⌘/Ctrl + Enter</span>
          </div>
          <p style={{ ...EYEBROW, fontSize: 10, marginTop: 24 }}>Try asking</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {QUICK_EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setText(ex)} className="cre-admin-tile" style={EXAMPLE}>
                {ex}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section style={{ ...CARD, borderRadius: 14, padding: 20 }}>
          <p style={{ ...EYEBROW, fontSize: 10 }}>
            Question {q + 1} of {QUESTIONS.length}
          </p>
          <h2 style={{ margin: '4px 0 12px', fontFamily: HEADING, fontSize: 18, fontWeight: 700, color: 'var(--admin-ink)' }}>{QUESTIONS[q].title}</h2>
          {QUESTIONS[q].body}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button type="button" disabled={q === 0} onClick={() => setQ((n) => (n === 3 && answers.who === 'all' ? 1 : n - 1))} style={{ ...BUTTON_OUTLINE, opacity: q === 0 ? 0.5 : 1 }}>
              Back
            </button>
            {q < QUESTIONS.length - 1 ? (
              <button type="button" disabled={blocked} onClick={() => setQ((n) => (n === 1 && answers.who === 'all' ? 3 : n + 1))} style={{ ...BUTTON_BRAND, opacity: blocked ? 0.5 : 1 }}>
                Next
              </button>
            ) : (
              <button type="button" onClick={finishSteps} style={BUTTON_BRAND}>
                Open in rule builder
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

const SEG: CSSProperties = { border: 'none', borderRadius: 7, background: 'none', padding: '5px 12px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, color: 'var(--admin-text)', cursor: 'pointer' }
const SEG_ON: CSSProperties = { ...SEG, background: 'var(--admin-fill)', color: 'var(--admin-ink)' }
const EXAMPLE: CSSProperties = { textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-rule)', background: 'var(--admin-surface)', fontFamily: 'inherit', fontSize: 13, color: 'var(--admin-ink)', cursor: 'pointer' }
