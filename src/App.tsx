import { Navigate, Route, Routes } from 'react-router-dom'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { PrototypeFeaturePage } from '@/pages/PrototypeFeaturePage'
import { PrototypeHandoffDetailPage } from '@/pages/PrototypeHandoffDetailPage'
import { ResearchRationalePage } from '@/pages/ResearchRationalePage'
import { QaNotesPage } from '@/pages/QaNotesPage'

/**
 * PartnerHub UX Dashboard — routes.
 *
 * Deliberately small. This app is the GATEWAY only: the dashboard, the feature
 * walkthrough gateways, and the dev-handoff detail screens. The PartnerHub
 * prototypes themselves are standalone HTML under `public/prototypes/`, opened
 * in a new tab (or iframed as a preview) rather than routed through here — so
 * there is no in-app product surface to keep in sync.
 *
 * Ported from the Common LMS dashboard (`jill-dashboard-ux-designs`), whose
 * App.tsx additionally routes ~28 product pages. Keep this file lean: a new
 * PartnerHub screen belongs in `public/prototypes/`, not as a route here.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<UxDashboardPage />} />
      <Route path="/prototype/:featureId" element={<PrototypeFeaturePage />} />
      <Route
        path="/prototype/:featureId/handoff/:componentId"
        element={<PrototypeHandoffDetailPage />}
      />
      <Route path="/research-rationale" element={<ResearchRationalePage />} />
      <Route path="/qa-notes" element={<QaNotesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
