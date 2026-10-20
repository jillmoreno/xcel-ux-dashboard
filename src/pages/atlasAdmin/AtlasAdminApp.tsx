import { useCallback, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { ADMIN_DEPARTMENTS, ADMIN_LEARNERS, type Learner } from '@/data/atlasAdmin/learners'
import { ADMIN_INVITES, type Invite } from '@/data/atlasAdmin/invites'
import { ADMIN_RULES, type AssignmentRule } from '@/data/atlasAdmin/assignments'
import { SEATS_PURCHASED } from '@/data/atlasAdmin/organization'
import { ADMIN_BASE, AdminStoreContext, type AddedDepartment, type AdminEvent, type PartnerRequest, type AdminStore, type AdminTouch, type ProgressReportSettings } from './adminStore'
import type { OnboardingAnswers } from './onboarding'
import { AtlasAdminComingSoon, AtlasAdminLayout } from './AtlasAdminLayout'
import { AtlasAdminStudentsPage } from './AtlasAdminStudentsPage'
import { AtlasAdminRecruitPage } from './AtlasAdminRecruitPage'
import { AtlasAdminInvitesPage } from './AtlasAdminInvitesPage'
import { AtlasAdminReportsPage } from './AtlasAdminReportsPage'
import { AtlasAdminNotificationsPage } from './AtlasAdminNotificationsPage'
import { AtlasAdminResourcesPage } from './AtlasAdminResourcesPage'
import { AtlasAdminSettingsPage } from './AtlasAdminSettingsPage'
import { AtlasAdminDepartmentsPage } from './AtlasAdminDepartmentsPage'
import { AtlasAdminMyTeamPage } from './AtlasAdminMyTeamPage'
import { AtlasAdminAssignmentsPage } from './AtlasAdminAssignmentsPage'
import { AtlasAdminRuleWizard } from './AtlasAdminRuleWizard'
import { AtlasAdminRulePage } from './AtlasAdminRulePage'
import { AtlasAdminQuickAssignPage } from './AtlasAdminQuickAssignPage'
import { AtlasAdminEngagementPage } from './AtlasAdminEngagementPage'
import { AtlasAdminVideoEngagementPage } from './AtlasAdminVideoEngagementPage'
import { AtlasAdminLearningCenterPage } from './AtlasAdminLearningCenterPage'
import { AtlasAdminLicensesPage } from './AtlasAdminLicensesPage'
import { AtlasAdminOrganizationPage } from './AtlasAdminOrganizationPage'
import { AtlasAdminTeamsPage } from './AtlasAdminTeamsPage'
import { AtlasAdminPulsePage } from './AtlasAdminPulsePage'
import { AtlasAdminEnterprisePage } from './AtlasAdminEnterprisePage'
import { AtlasAdminCompliancePage } from './AtlasAdminCompliancePage'
import { AtlasAdminPassRatePage } from './AtlasAdminPassRatePage'
import { AtlasAdminRiskExplorerPage } from './AtlasAdminRiskExplorerPage'
import { AtlasAdminAuditPage } from './AtlasAdminAuditPage'
import { AtlasAdminPricingPage } from './AtlasAdminPricingPage'
import { AtlasAdminProductOfferingPage } from './AtlasAdminProductOfferingPage'
import { AtlasAdminInternalGate, AtlasAdminPortalAnalyticsPage } from './AtlasAdminInternalPages'
import { AtlasAdminPartnerPage } from './AtlasAdminPartnerPage'
import { AtlasAdminWelcomePage } from './AtlasAdminWelcomePage'
import { AtlasAdminOnboardingPage } from './AtlasAdminOnboardingPage'
import { AtlasAdminInvitePage, AtlasAdminJoinEventPage } from './AtlasAdminInvitePage'

/**
 * ATLAS ADMIN — the app (2026-10-19, feat/atlas-admin). The admin surface
 * rebuilt in React from colibri-b2b.vercel.app, mounted at `/atlas-admin/*`
 * behind the `atlas-admin` flag (on by default on Eric's branch; the Admin
 * row on Prototypes is Cody's scope, so whether it becomes that row is his
 * call). One store for the session, one shell, and the pages under it —
 * built in the reference's sidebar order, Students first.
 */
export function AtlasAdminApp() {
  const enabled = useFeatureFlag('atlas-admin').enabled
  const [learners, setLearners] = useState<Learner[]>(() => [...ADMIN_LEARNERS])
  const [touches, setTouches] = useState<AdminTouch[]>([])
  const [invites, setInvites] = useState<Invite[]>(() => [...ADMIN_INVITES])
  const [progressReport, setPR] = useState<ProgressReportSettings>({
    active: true,
    day: 'Mondays',
    time: '7am',
    people: ['coleen.acker@example.com', 'adam.neal@example.com'],
  })
  const setProgressReport = useCallback((patch: Partial<ProgressReportSettings>) => setPR((p) => ({ ...p, ...patch })), [])
  const [companyLabel, setCompanyLabel] = useState('Summit Insurance Group')
  const [partnerRequest, setPartnerRequest] = useState<PartnerRequest | null>(null)
  const [onboarded, setOnboarded] = useState(false)
  const [onboardingDraft, setOnboardingDraft] = useState<OnboardingAnswers | null>(null)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const logEvent = useCallback(
    (event: string, path: string) =>
      setEvents((prev) => {
        const at = new Date()
        // The same event on the same path inside a second is one event (a
        // re-render, or React's development double-run), not two.
        if (prev[0] && prev[0].event === event && prev[0].path === path && at.getTime() - Date.parse(prev[0].at) < 1000) return prev
        return [{ id: prev.length + 1, at: at.toISOString(), event, path }, ...prev].slice(0, 500)
      }),
    [],
  )
  const [sampleRoster, setSampleRoster] = useState(true)
  const [addedDepartments, setAddedDepartments] = useState<AddedDepartment[]>([])
  const addDepartment = useCallback((d: AddedDepartment) => setAddedDepartments((prev) => [...prev, d]), [])
  const [rules, setRules] = useState<AssignmentRule[]>(() => [...ADMIN_RULES])
  const [seatsPurchased, setSeats] = useState(SEATS_PURCHASED)
  const addSeats = useCallback((n: number) => setSeats((s) => s + n), [])
  const saveRule = useCallback((rule: AssignmentRule) => setRules((prev) => (prev.some((r) => r.id === rule.id) ? prev.map((r) => (r.id === rule.id ? rule : r)) : [rule, ...prev])), [])
  const [toast, setToast] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])
  const addInvites = useCallback<AdminStore['addInvites']>((list) => {
    const now = Date.now()
    setInvites((prev) => [
      ...list.map<Invite>((inv, i) => ({
        id: `inv-new-${now}-${i}`,
        name: inv.name,
        email: inv.email,
        status: 'sent',
        sentHoursAgo: 0,
        lastStepHoursAgo: 0,
        method: inv.via === 'qr' ? 'QR code' : inv.via === 'link' ? 'Link' : 'Email',
        department: inv.department,
        learnerId: null,
      })),
      ...prev,
    ])
  }, [])
  const resendInvite = useCallback((id: string) => {
    setInvites((prev) => {
      const hit = prev.find((i) => i.id === id)
      if (!hit) return prev
      return [{ ...hit, sentHoursAgo: 0, lastStepHoursAgo: 0, status: 'sent' }, ...prev.filter((i) => i.id !== id)]
    })
  }, [])
  const updateLearner = useCallback<AdminStore['updateLearner']>((id, patch) => {
    setLearners((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }, [])
  const addTouch = useCallback<AdminStore['addTouch']>((t) => {
    const at = new Date().toISOString()
    setTouches((prev) => [{ ...t, id: `${at}-${prev.length}`, at }, ...prev])
    logEvent(`${t.kind === 'exam-date' ? 'exam_date_set' : `${t.kind}_sent`}`, `${ADMIN_BASE}/students/recruit/${t.learnerId}`)
  }, [logEvent])
  const store = useMemo<AdminStore>(
    () => ({ learners: sampleRoster ? learners : [], sampleRoster, setSampleRoster, updateLearner, touches, addTouch, invites, addInvites, resendInvite, progressReport, setProgressReport, addedDepartments, addDepartment, rules, saveRule, seatsPurchased, addSeats, companyLabel, setCompanyLabel, partnerRequest, setPartnerRequest, onboarded, setOnboarded, onboardingDraft, setOnboardingDraft, events, logEvent, toast, showToast }),
    [learners, sampleRoster, updateLearner, touches, addTouch, invites, addInvites, resendInvite, progressReport, setProgressReport, addedDepartments, addDepartment, rules, saveRule, seatsPurchased, addSeats, companyLabel, partnerRequest, onboarded, onboardingDraft, events, logEvent, toast, showToast],
  )

  if (!enabled) {
    return (
      <div style={{ padding: 48, fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
        Atlas Admin is off. Turn on the “Atlas Admin” flag to see it.
      </div>
    )
  }

  return (
    <AdminStoreContext.Provider value={store}>
      <Routes>
        {/* Pulse is a page of its own, outside the shell, as the reference's is. */}
        <Route path="pulse" element={<AtlasAdminPulsePage />} />
        <Route path="pulse/:date" element={<AtlasAdminPulsePage />} />
        <Route path="admin-insight" element={<Navigate to={`../pulse${window.location.search}`} replace />} />
        {/* The public side, also outside the shell: the agency pitch, the
            welcome inbox and the setup wizard, and what a recruit sees. */}
        <Route path="partner-with-us" element={<AtlasAdminPartnerPage />} />
        <Route path="welcome" element={<AtlasAdminWelcomePage />} />
        <Route path="onboarding" element={<AtlasAdminOnboardingPage />} />
        <Route path="invite/:company" element={<AtlasAdminInvitePage />} />
        <Route path="invite/:company/:department" element={<AtlasAdminInvitePage />} />
        <Route path="invite/:company/:department/:offer" element={<AtlasAdminInvitePage />} />
        <Route path="join/event/:departmentId" element={<AtlasAdminJoinEventPage />} />
        <Route element={<AtlasAdminLayout />}>
          <Route index element={<Navigate to={`students${window.location.search}`} replace />} />
          <Route path="students" element={<AtlasAdminStudentsPage />} />
          <Route path="students/recruit/:recruitId" element={<AtlasAdminRecruitPage />} />
          <Route path="invites" element={<AtlasAdminInvitesPage />} />
          <Route path="reports" element={<AtlasAdminReportsPage />} />
          <Route path="reports/team-comparison" element={<AtlasAdminDepartmentsPage />} />
          {/* The reference sends these three on to the pages that answer them. */}
          <Route path="departments" element={<Navigate to={`../reports/team-comparison${window.location.search}`} replace />} />
          <Route path="pipeline" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="my-department" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="my-team" element={<AtlasAdminMyTeamPage />} />
          <Route path="lead" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="departments/:departmentId" element={<DepartmentRedirect />} />
          <Route path="department/:departmentId" element={<DepartmentRedirect />} />
          <Route path="lead/:departmentId" element={<Navigate to={`${ADMIN_BASE}/reports/team-comparison${window.location.search}`} replace />} />
          <Route path="library" element={<Navigate to={`${ADMIN_BASE}/students${window.location.search}`} replace />} />
          <Route path="training-programs/*" element={<Navigate to={`${ADMIN_BASE}/students${window.location.search}`} replace />} />
          <Route path="assignment-tracking/*" element={<Navigate to={`${ADMIN_BASE}/assignments${window.location.search}`} replace />} />
          <Route path="assignments" element={<AtlasAdminAssignmentsPage />} />
          <Route path="assignments/new" element={<AtlasAdminRuleWizard />} />
          <Route path="assignments/quick" element={<AtlasAdminQuickAssignPage />} />
          <Route path="assignments/rules" element={<Navigate to={`../assignments${window.location.search}`} replace />} />
          <Route path="assignments/rules/:ruleId" element={<AtlasAdminRulePage />} />
          <Route path="assignments/rules/:ruleId/edit" element={<AtlasAdminRuleWizard />} />
          <Route path="training-programs" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="assignment-tracking" element={<Navigate to={`../assignments${window.location.search}`} replace />} />
          <Route path="engagement" element={<AtlasAdminEngagementPage />} />
          <Route path="video-engagement" element={<AtlasAdminVideoEngagementPage />} />
          <Route path="learning-center" element={<AtlasAdminLearningCenterPage />} />
          <Route path="licenses" element={<AtlasAdminLicensesPage />} />
          <Route path="organization" element={<AtlasAdminOrganizationPage />} />
          <Route path="teams" element={<AtlasAdminTeamsPage />} />
          <Route path="enterprise" element={<AtlasAdminEnterprisePage />} />
          <Route path="enterprise/compliance" element={<AtlasAdminCompliancePage />} />
          <Route path="enterprise/pass-rate" element={<AtlasAdminPassRatePage />} />
          <Route path="enterprise/risk-explorer" element={<AtlasAdminRiskExplorerPage />} />
          <Route path="enterprise/audit" element={<AtlasAdminAuditPage />} />
          {/* The reference's Financial Services page renders nothing; its
              enterprise views are labelled "Financial Services View". */}
          <Route path="financial-services" element={<Navigate to={`../enterprise${window.location.search}`} replace />} />
          <Route path="exam-readiness" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="pricing" element={<AtlasAdminPricingPage />} />
          <Route path="product-offering" element={<AtlasAdminProductOfferingPage />} />
          <Route path="internal" element={<Navigate to={`../students${window.location.search}`} replace />} />
          <Route path="internal/portal-analytics" element={<AtlasAdminPortalAnalyticsPage />} />
          <Route path="internal/catalog" element={<AtlasAdminInternalGate name="Internal catalog" flag="internal.catalogConsole" />} />
          <Route path="internal/ledger" element={<AtlasAdminInternalGate name="Ledger" flag="internal.ledger" />} />
          <Route path="notifications/*" element={<AtlasAdminNotificationsPage />} />
          <Route path="resources" element={<AtlasAdminResourcesPage />} />
          <Route path="settings" element={<AtlasAdminSettingsPage />} />
          <Route path="*" element={<AtlasAdminComingSoon>Not built yet.</AtlasAdminComingSoon>} />
        </Route>
      </Routes>
    </AdminStoreContext.Provider>
  )
}

/** /departments/:id — the reference sends a department's own page on to
 *  Students, filtered to it. The id is the department's name, slugged. */
function DepartmentRedirect() {
  const { departmentId = '' } = useParams()
  const name = ADMIN_DEPARTMENTS.find((d) => d.toLowerCase().replace(/[^a-z0-9]+/g, '-') === departmentId)
  const q = new URLSearchParams(window.location.search)
  if (name) q.set('department', name)
  return <Navigate to={`${ADMIN_BASE}/students?${q}`} replace />
}
