import { useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clone, Envelope, Qrcode } from '@/icons'
import { ADMIN_COMPANY, ADMIN_DEPARTMENTS, ADMIN_USER } from '@/data/atlasAdmin/learners'
import { ADMIN_BASE, useAdminStore } from './adminStore'
import { BUTTON_BRAND, BUTTON_OUTLINE, CARD, EYEBROW, HEADING, PAGE_H1, PAGE_SUB } from './adminStyles'
import { InviteLearnersDialog } from './InviteLearnersDialog'
import { CreateDepartmentDialog } from './AtlasAdminDepartmentsPage'

/**
 * ATLAS ADMIN · STUDENTS, EMPTY (2026-10-20) — the reference's first-run
 * office: nobody on the roster yet. Shown when the roster is empty, which is
 * where finishing onboarding lands, Settings → Sample roster off, and the
 * Flow menu's "Students (empty roster)". The first-step card invites (or
 * copies the link, emails, opens the QR); the two below say what happens
 * after a send and what the roster will hold.
 */

type InviteTab = 'email' | 'link' | 'qr'

const STEPS = [
  ['They enroll and pay', 'Nothing comes out of your budget. They appear on this page the moment they check out.'],
  ['Quiet recruits get nudged', 'If someone has not opened the course by day 10, the portal emails them from you.'],
  ['Monday morning you get a brief', 'Who stalled, who to call first, and who is ready for the exam.'],
] as const

export function StudentsEmptyState() {
  const navigate = useNavigate()
  const { addedDepartments, addDepartment, showToast } = useAdminStore()
  const [inviting, setInviting] = useState<InviteTab | null>(null)
  const [creating, setCreating] = useState(false)

  // The same link the invite dialog's Link tab hands out.
  const dept = ADMIN_USER.department.replace(`${ADMIN_COMPANY} · `, '')
  const link = `https://xcelsolutions.com/invite/${ADMIN_COMPANY.toLowerCase()}/${dept.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
  const copyLink = () => {
    navigator.clipboard?.writeText(link).catch(() => undefined)
    showToast('Invite link copied')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={PAGE_H1}>Students</h2>
          <p style={PAGE_SUB}>Your office is ready · add people by email, link, or QR</p>
        </div>
        <button type="button" className="cre-admin-brand" onClick={() => setInviting('email')} style={BUTTON_BRAND}>
          Invite learners
        </button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <section style={{ ...CARD, padding: '28px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
          <div style={{ flex: '1 1 420px', minWidth: 0 }}>
            <p style={{ ...EYEBROW, letterSpacing: '0.1em', color: 'var(--admin-brand)' }}>First step</p>
            <h3 style={{ margin: '8px 0 0', fontFamily: HEADING, fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--admin-ink)' }}>Get your first recruits enrolled</h3>
            <p style={{ margin: '8px 0 0', maxWidth: 576, fontSize: 15, lineHeight: 1.625, color: 'var(--admin-text)' }}>
              Your department is set up and priced. Invite by email, link, or QR. They land on the same discounted page.
            </p>
            <button type="button" className="cre-admin-brand" onClick={() => setInviting('email')} style={{ ...BUTTON_BRAND, marginTop: 24 }}>
              Invite students
            </button>
          </div>
          <div>
            <p style={{ ...EYEBROW, fontSize: 11, letterSpacing: '0.1em' }}>Share your link</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              <button type="button" className="cre-admin-outline" onClick={copyLink} style={SHARE}>
                <Clone size={12} aria-hidden /> Copy link
              </button>
              <button type="button" className="cre-admin-outline" onClick={() => setInviting('email')} style={SHARE}>
                <Envelope size={12} aria-hidden /> Email
              </button>
              <button type="button" className="cre-admin-outline" onClick={() => setInviting('qr')} style={SHARE}>
                <Qrcode size={12} aria-hidden /> QR
              </button>
            </div>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={{ ...CARD, padding: '24px 18px' }}>
            <h3 style={CARD_TITLE}>What happens after you send</h3>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--admin-text)' }}>You do not have to watch this page. The portal does the chasing.</p>
            <ol style={{ margin: '20px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {STEPS.map(([title, body], i) => (
                <li key={title} style={{ display: 'flex', gap: 14 }}>
                  <span aria-hidden style={{ width: 8, fontSize: 14, fontWeight: 700, color: 'var(--admin-brand)' }}>
                    {i + 1}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--admin-ink)' }}>{title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--admin-text)' }}>{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => navigate(`${ADMIN_BASE}/pulse${window.location.search}`)} style={{ ...TEXT_LINK, marginTop: 20 }}>
              See what the brief looks like
            </button>
          </section>

          <section style={{ ...CARD, padding: '24px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h3 style={CARD_TITLE}>Your roster</h3>
              <span style={{ fontSize: 11, color: 'var(--admin-muted)' }}>nobody yet</span>
            </div>
            <div aria-hidden style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
              {['88%', '72%', '60%'].map((w) => (
                <span key={w} style={{ display: 'block', width: w, height: 8, borderRadius: 9999, background: 'var(--admin-fill)' }} />
              ))}
            </div>
            <p style={{ margin: '24px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--admin-text)' }}>
              Each recruit will show their progress, how long since they last opened the course, and their exam date once they set one.
            </p>
            <p style={{ margin: '16px 0 0', fontSize: 14, color: 'var(--admin-ink)' }}>
              Need a named department for someone else?{' '}
              <button type="button" onClick={() => setCreating(true)} style={TEXT_LINK}>
                Create a department
              </button>
            </p>
          </section>
        </div>
      </div>

      {inviting ? <InviteLearnersDialog tab={inviting} onClose={() => setInviting(null)} /> : null}
      {creating ? (
        <CreateDepartmentDialog
          taken={[...ADMIN_DEPARTMENTS, ...addedDepartments.map((d) => d.name)].map((n) => n.toLowerCase())}
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

const CARD_TITLE: CSSProperties = { margin: 0, fontFamily: HEADING, fontSize: 16, fontWeight: 700, color: 'var(--admin-ink)' }
const SHARE: CSSProperties = { ...BUTTON_OUTLINE, gap: 6, padding: '5px 12px', fontSize: 12, borderColor: 'var(--admin-rule)' }
const TEXT_LINK: CSSProperties = { border: 'none', background: 'none', padding: 0, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, color: 'var(--admin-brand)', cursor: 'pointer' }
