import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sheet } from '@/components/ui/Sheet'
import { GetLicensedStepPanel } from '@/components/learning/GetLicensedStepPanel'
import { ExamDetailsPanel, ExamFaqPanel } from '@/components/learning/ExamDetailsPanel'
import { LearningPathDetailPanel } from '@/components/learning/LearningPathDetailPanel'
import { EXAM_FAQ_STEP_ID } from '@/data/examDetails'
import { getLicensedStepsFor } from '@/data/nyProducerRequirements'
import { dashboardProgressPersonaFor } from '@/data/dashboardProgressFixtures'
import { isE2ELikeVersion, resolveDashboardVersion } from '@/data/dashboardVersions'
import { useAccount } from '@/context/AccountContext'
import { useCourseDemo, useFeatureFlag } from '@/context/FeatureFlagContext'
import { ATLAS_OPEN_PARAM } from './AtlasJourneyLinksCard'

/**
 * THE QUICK LINKS' THREE SHEETS, OFF HOME — 2026-11-10, Eric: "when clicking Exam Information, Applying for a License or State
 * Requirements in the Quick Links, do not reload to the homepage when the side sheet slides out from the right".
 *
 * Home (`MembershipOverview`) owns these sheets, so until today a Quick Link on My Courses or My Certificates went HOME with
 * `?open=` and Home opened the sheet. This draws the same three sheets — Exam Details (and the journey into a step or the
 * FAQ inside it), a step's own sheet, and State Requirements — over whatever section page is up, from the same `?open=`
 * request, which is stripped once read so a reload does not reopen it.
 *
 * ⚠ THE PATH IS RESOLVED THE WAY HOME RESOLVES IT for the Atlas family — the Progress persona, on Florida for the End-to-End
 * versions — so the sheet says the same state and exam facts as the Home behind it would. It does not carry Home's
 * onboarding enrichment or a path picked in My Learning Paths; neither reaches these pages.
 *
 * Desktop only: on the phone these are pages Home draws, and the links still go there.
 */
export function AtlasInfoSheets() {
  const [params, setParams] = useSearchParams()
  const { brand } = useAccount()
  const progressVariant = useFeatureFlag('dashboard-progress-state').variant ?? 'progress-on-track'
  const educationFlag = useFeatureFlag('dashboard-education-type').variant
  const { course: demoCourse, expiryDays } = useCourseDemo()
  const e2e = isE2ELikeVersion(resolveDashboardVersion(params.get('version'), brand))
  // Home's rule: the End-to-End family is QE Focused — pre-licensing, or Exam Prep when the control says so.
  const educationType = (e2e ? (educationFlag === 'exam-prep' ? 'exam-prep' : 'qe') : (educationFlag ?? 'ce')) as 'ce' | 'qe' | 'exam-prep'
  const path = dashboardProgressPersonaFor(brand, progressVariant, educationType, demoCourse ?? (e2e ? 'fl' : undefined), expiryDays)?.path

  const [examOpen, setExamOpen] = useState(false)
  const [stepId, setStepId] = useState<string | null>(null)
  const [reqOpen, setReqOpen] = useState(false)

  // The request, read during render and remembered (Home's own pattern), then stripped from the URL.
  const request = params.get(ATLAS_OPEN_PARAM)
  const [handled, setHandled] = useState<string | null>(null)
  if (request !== handled) {
    setHandled(request)
    if (request) {
      setExamOpen(request === 'exam-details')
      setStepId(request.startsWith('step:') ? request.slice(5) : null)
      setReqOpen(request === 'requirements')
    }
  }
  useEffect(() => {
    if (!request) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(ATLAS_OPEN_PARAM)
        return next
      },
      { replace: true },
    )
  }, [request, setParams])

  const step = getLicensedStepsFor(path?.state).find((s) => s.id === stepId) ?? null
  const journeyStep = examOpen && (Boolean(step) || stepId === EXAM_FAQ_STEP_ID)
  const closeExam = () => {
    setExamOpen(false)
    setStepId(null)
  }

  return (
    <>
      {path ? <LearningPathDetailPanel open={reqOpen} onClose={() => setReqOpen(false)} path={path} view="requirements" /> : null}
      <Sheet
        open={examOpen}
        onClose={closeExam}
        title={journeyStep ? (stepId === EXAM_FAQ_STEP_ID ? 'Common questions' : (step?.title ?? 'Exam Details')) : 'Exam Details'}
        width={480}
      >
        {!examOpen ? null : journeyStep ? (
          stepId === EXAM_FAQ_STEP_ID ? (
            <ExamFaqPanel onClose={closeExam} onBack={() => setStepId(null)} />
          ) : step ? (
            <GetLicensedStepPanel step={step} state={path?.state} onClose={closeExam} onBack={() => setStepId(null)} />
          ) : null
        ) : (
          <ExamDetailsPanel state={path?.state} onSelect={setStepId} onClose={() => setExamOpen(false)} />
        )}
      </Sheet>
      <Sheet
        open={!examOpen && (Boolean(step) || stepId === EXAM_FAQ_STEP_ID)}
        onClose={() => setStepId(null)}
        title={stepId === EXAM_FAQ_STEP_ID ? 'Common questions' : (step?.title ?? '')}
        width={480}
      >
        {examOpen ? null : stepId === EXAM_FAQ_STEP_ID ? (
          <ExamFaqPanel onClose={() => setStepId(null)} />
        ) : step ? (
          <GetLicensedStepPanel step={step} state={path?.state} onClose={() => setStepId(null)} />
        ) : null}
      </Sheet>
    </>
  )
}
