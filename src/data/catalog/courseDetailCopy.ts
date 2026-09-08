// Per-course marketing copy for the Course Details view of the new Purchase
// Course flow (`CoursePurchaseSheet`). The Figma design replaces the old
// wall-of-paragraphs description with a short Introduction + a scannable
// "What you'll learn" outcome list, so the copy needs its own shape.
//
// TODO(content): these live in the CMS in production — the course record should
// carry `introduction` + `outcomes[]`. Until then, keyed fixtures with a
// generic fallback so ANY course opens without a content hole.

export type CourseDetailCopy = {
  /** Single introductory paragraph under the "Introduction" subhead. */
  introduction: string
  /** Checkmarked outcome lines under "What you'll learn". */
  outcomes: string[]
}

const COPY: Record<string, CourseDetailCopy> = {
  'c-sepsis': {
    introduction:
      'This webinar gives clinicians a fast, practical framework for recognizing sepsis early and responding within the critical first hour. Through case-based sessions you’ll practice screening, escalation, and the sepsis bundle at the bedside.',
    outcomes: [
      'Apply screening criteria to identify sepsis and septic shock at triage.',
      'Initiate the Hour-1 bundle and coordinate rapid escalation.',
      'Interpret lactate and perfusion markers to guide resuscitation.',
      'Document and hand off in line with current CMS SEP-1 measures.',
    ],
  },
}

/** Generic fallback — phrased off the course title so an unmapped course still
 *  reads as intentional copy rather than lorem ipsum. */
function fallback(title: string): CourseDetailCopy {
  return {
    introduction: `${title} covers the core requirements and practical application you need to complete this credit. Each section pairs the underlying rule with worked examples so you can apply it in practice immediately.`,
    outcomes: [
      'Identify the requirements this course satisfies for your license.',
      'Apply the course material to realistic day-to-day scenarios.',
      'Recognize the documentation your state board expects.',
    ],
  }
}

export function courseDetailCopy(courseId: string, title: string): CourseDetailCopy {
  return COPY[courseId] ?? fallback(title)
}
