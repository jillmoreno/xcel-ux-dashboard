import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { PrototypeFeaturePage } from '@/pages/PrototypeFeaturePage'
import { PrototypeHandoffDetailPage } from '@/pages/PrototypeHandoffDetailPage'
import { ResearchRationalePage } from '@/pages/ResearchRationalePage'
import { QaNotesPage } from '@/pages/QaNotesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DashboardRebrandPage } from '@/pages/DashboardRebrandPage'
import { RecommendedCardABComparePage } from '@/pages/RecommendedCardABComparePage'
import { OnboardingFlowPage } from '@/pages/OnboardingFlowPage'
import { CatalogPage } from '@/pages/CatalogPage'
import { LearningPathPage } from '@/pages/LearningPathPage'
import { MyCoursesPage } from '@/pages/MyCoursesPage'
import { CertificatesPage } from '@/pages/CertificatesPage'
import { MyPodcastsPage } from '@/pages/MyPodcastsPage'
import { MembershipLandingPage } from '@/pages/MembershipLandingPage'
import { LearningRecapPage } from '@/pages/LearningRecapPage'
import { PassportProductPage } from '@/pages/PassportProductPage'
import { CourseDetailPage } from '@/pages/CourseDetailPage'
import { ResourceDetailPage } from '@/pages/ResourceDetailPage'
import { ResourceUpdatesPage } from '@/pages/ResourceUpdatesPage'
import { AchievementsPage } from '@/pages/AchievementsPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { PrintViewPage } from '@/pages/PrintViewPage'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useAccount, supportsMembership } from '@/context/AccountContext'
import {
  GIFT_RECIPIENTS_DEMO_BRAND,
  supportsGiftRecipients,
} from '@/data/giftRecipientsFixtures'
import { recCardEnvTarget, recCardTestPath } from '@/data/recCardTest'
import { demoEnvTarget } from '@/data/demoPin'

/**
 * Gates the classic `/dashboard` route behind the `dashboard-tab` flag (OFF by
 * default). While the flag is off the Dashboard tab is hidden from the top nav
 * and the route redirects to the Learning Path page — the learner must turn the
 * flag on (from the Learning Path Feature Flag panel) to reach the dashboard.
 */
function DashboardRoute() {
  const showDashboard = useFeatureFlag('dashboard-tab').enabled
  return showDashboard ? <DashboardPage /> : <Navigate to="/my-learning/path" replace />
}

/**
 * Gift Recipients lives INSIDE the Dashboard Rebrand shell (`?section=
 * gift-recipients`) — the shell's left rail is the navigation and it owns the
 * section title, same as Profile. This classic account route only redirects
 * there, so the page never renders with the old top nav + account sub-nav.
 *
 * Still gated by the `gift-recipients` flag (ON by default): with the flag off
 * the account dropdown drops the row and this route falls back to Purchases, so
 * the feature can be turned off whole. Brand support is handled INSIDE the
 * panel — a brand with no purchase-for-others data renders the section's empty
 * state rather than redirecting, so a reviewer switching brands mid-demo sees
 * why it's blank.
 */
/**
 * The classic `/membership` page assumes the brand sells one. XCEL does not
 * (`supportsMembership`), so the route redirects into the rebrand shell rather
 * than opening a plan comparison for a product that doesn't exist. Paired with
 * the rail item + the `?section=membership` fallback in `PlatformShell` — all
 * three routes into the page have to be closed, not just the visible one.
 */
function MembershipRoute() {
  const { brand } = useAccount()
  if (!supportsMembership(brand)) return <Navigate to="/dashboard-rebrand" replace />
  return <MembershipLandingPage />
}

function GiftRecipientsRoute() {
  const enabled = useFeatureFlag('gift-recipients').enabled
  const { brand } = useAccount()
  if (!enabled) return <Navigate to="/account/purchases" replace />
  // Carry `?brand=` so the shell skips its default Elite seed — otherwise this
  // STC-only section would always open on the empty state. Keeps the ACTIVE
  // brand when it has records; falls back to the brand that does.
  const target = supportsGiftRecipients(brand) ? brand : GIFT_RECIPIENTS_DEMO_BRAND
  return (
    <Navigate to={`/dashboard-rebrand?section=gift-recipients&brand=${target}`} replace />
  )
}

export default function App() {
  // Recommended Card A/B single-arm test builds: a Netlify project that sets the
  // VITE_REC_CARD_ARM env var is pinned to that arm, so a bare visit to its root
  // auto-lands on the arm's NON-MEMBER Home (chrome hidden) — the clean single URL
  // "just works". Only the ROOT is intercepted — deep links pass through. The
  // main site sets no such var, so it's unaffected. Rendered as a synchronous
  // <Navigate> so there's no flash of the prototype landing before the redirect.
  const { pathname } = useLocation()
  const armPin = recCardEnvTarget()
  if (armPin && pathname === '/') {
    return <Navigate to={recCardTestPath(armPin.variant, armPin.membership)} replace />
  }
  // Env-var DEMO pin: a Netlify project that sets VITE_DEMO_TARGET pins its ROOT
  // to a specific Share Demo view (the black-background Demo frame). Same rules
  // as the arm pin — root only, deep links pass through, main site unaffected.
  const demoPin = demoEnvTarget()
  if (demoPin && pathname === '/') {
    return <Navigate to={demoPin} replace />
  }
  return (
    <Routes>
      {/* Print views sit outside AppLayout so the new tab opens with
          no header / nav chrome — acts as a PDF-style viewer that
          hands off to the browser's Print → Save-as-PDF dialog. */}
      <Route path="/print/study-calendar" element={<PrintViewPage />} />
      {/* Prototype gateway also sits outside AppLayout so it reads as a
          distinct landing surface (no platform header). `/` is the front
          door; each guided feature gets its own curated page list. */}
      <Route path="/" element={<UxDashboardPage />} />
      <Route path="/prototype/:featureId" element={<PrototypeFeaturePage />} />
      {/* The exploration's own route, kept so links already shared still work.
            It renders the same page as "/". */}
        <Route path="/ux-dashboard" element={<UxDashboardPage />} />
        <Route path="/research-rationale" element={<ResearchRationalePage />} />
      {/* QA Notes is a section of the UX Dashboard shell, not a standalone page —
          this route just redirects to its canonical URL. */}
      <Route path="/qa-notes" element={<QaNotesPage />} />
      <Route
        path="/prototype/:featureId/handoff/:componentId"
        element={<PrototypeHandoffDetailPage />}
      />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardRoute />} />
        {/* Rebranded dashboard — the left-nav shell, opened from the
            "Dashboard Rebrand" tile on the prototype home. */}
        <Route path="/dashboard-rebrand" element={<DashboardRebrandPage />} />
        {/* Recommended Card A/B — the Home band card-style compare page (CRE). */}
        <Route path="/recommended-card-ab" element={<RecommendedCardABComparePage />} />
        {/* Standalone Onboarding Flow — the new-user setup wizard extracted from
            Dashboard Discoverability into its own explorable section. */}
        <Route path="/onboarding-flow" element={<OnboardingFlowPage />} />
        {/* Standalone Learning Resources Updates demo — resource viewer with the
            new combined right rail (attachments + suggested topics). Not the
            rebrand shell; a focused page reached from its prototype tile. */}
        <Route path="/resource-updates" element={<ResourceUpdatesPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/my-learning/path" element={<LearningPathPage />} />
        <Route path="/my-learning/courses" element={<MyCoursesPage />} />
        <Route path="/my-learning/certificates" element={<CertificatesPage />} />
        <Route path="/my-learning/podcasts" element={<MyPodcastsPage />} />
        <Route path="/membership" element={<MembershipRoute />} />
        <Route path="/membership/recap" element={<LearningRecapPage />} />
        <Route path="/membership/passport/:productId" element={<PassportProductPage />} />
        <Route path="/membership/plans" element={<PlaceholderPage title="Membership Plans" />} />
        <Route path="/membership/benefits" element={<PlaceholderPage title="Membership Benefits" />} />
        {/* Profile lives inside the Dashboard Rebrand left-nav shell (reached
            from the top-right account dropdown). The classic account route
            redirects into the shell so it never renders with the top nav. */}
        <Route
          path="/account/profile"
          element={<Navigate to="/dashboard-rebrand?section=profile" replace />}
        />
        <Route path="/account/achievements" element={<AchievementsPage />} />
        {/* The rest of the account area also lives in the shell now, so each
            classic route redirects to its section — one canonical URL per
            section, and a shared link never opens the top-nav layout. They were
            PlaceholderPages outside the shell, which is why the account sub-nav
            had nowhere to point. */}
        <Route
          path="/account/notifications"
          element={<Navigate to="/dashboard-rebrand?section=notifications" replace />}
        />
        <Route
          path="/account/licenses"
          element={<Navigate to="/dashboard-rebrand?section=licenses" replace />}
        />
        <Route
          path="/account/transcripts"
          element={<Navigate to="/dashboard-rebrand?section=transcripts" replace />}
        />
        <Route
          path="/account/payment-methods"
          element={<Navigate to="/dashboard-rebrand?section=payment-methods" replace />}
        />
        <Route
          path="/account/purchases"
          element={<Navigate to="/dashboard-rebrand?section=purchases" replace />}
        />
        <Route path="/account/gift-recipients" element={<GiftRecipientsRoute />} />
        <Route path="/account/career-opportunities" element={<PlaceholderPage title="Career Opportunities" />} />
        <Route path="/account/tutoring" element={<PlaceholderPage title="Tutoring" />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/resources/:id" element={<ResourceDetailPage />} />
        <Route path="*" element={<PlaceholderPage title="Not Found" />} />
      </Route>
    </Routes>
  )
}
