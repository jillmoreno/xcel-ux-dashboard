// Shared fixture content + label maps for the course purchase sheets.
//
// Extracted from `CourseSheet.tsx` so the current flow and the new
// `CoursePurchaseSheet` render the SAME course header (modality label, badge,
// webinar schedule, instructor, venue) instead of drifting apart. When the
// catalog API lands, these become fields on the course record — see the TODOs.

import { Monitor, Podcast, Users, Video } from '@/icons'
import type { IndividualCourse } from '@/data/catalogFixtures'

export const DELIVERY_ICON: Partial<Record<IndividualCourse['delivery'], typeof Monitor>> = {
  online: Monitor,
  podcast: Podcast,
  webinar: Video,
  'in-person': Users,
}

export const DELIVERY_LABEL: Record<IndividualCourse['delivery'], string> = {
  online: 'Online',
  podcast: 'Podcast',
  'in-person': 'In Person',
  webinar: 'Webinar',
}

export const BADGE_LABEL: Record<IndividualCourse['badge'], string> = {
  mandatory: 'Mandatory',
  elective: 'Elective',
}

// TODO(data): venue belongs on the in-person course record.
export const VENUE = {
  name: 'Superior School of Real Estate',
  street: '14815 Ballantyne Village Way, Suite 270',
  cityStateZip: 'Charlotte, NC  28277',
}

// Stub billing address for the webinar-shipping confirmation. Replace with the
// signed-in member's saved billing address when the account API is wired.
export const BILLING_ADDRESS = ['Sarah Cook', '4221 Sharon Road', 'Charlotte, NC 28211']

export type Session = { day: string; date: string; time: string }

// TODO(data): sessions belong on the live-course record.
export const WEBINAR_INFO = {
  dateRange: 'Fri April 7 - Fri April 14',
  /** Compact form used in the new sheet's course summary ("Fri Apr 7 – Fri Apr 14"). */
  dateRangeShort: 'Fri Apr 7 – Fri Apr 14',
  sessionCount: 5,
  meetingCadence: 'Class meets M/T/W 9am-5pm, Th/F 12pm-5pm EST',
  sessions: [
    { day: 'Monday', date: 'April 7, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Tuesday', date: 'April 8, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Wednesday', date: 'April 9, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Thursday', date: 'April 10, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Monday', date: 'April 11, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Tuesday', date: 'April 12, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Wednesday', date: 'April 13, 2026', time: '11am - 7:30pm EDT' },
    { day: 'Thursday', date: 'April 14, 2026', time: '11am - 7:30pm EDT' },
  ] as Session[],
}

// TODO(data): instructor belongs on the course record.
export const INSTRUCTOR = {
  name: 'Dan Bradley',
  // Professional headshot (Unsplash). TODO(data): move to the course record
  // alongside the rest of the instructor detail.
  avatarUrl:
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=96&h=96&fit=crop&crop=faces&q=80',
  title: 'AQB Certified Instructor, #64804',
  bio:
    'Dan has been a practicing real property appraiser since 1987, and has been instructing and authoring appraisal courses since 1992. He is a state certified general appraiser, holds an SRA designation from the Appraisal Institute, and is currently on the FHA appraiser roster. He also holds a CDEI (Certified Distance Education Instructor) designation from the International Distance Education Certification Center (IDECC). He earned a Bachelor of Science degree from Clarion University of Pennsylvania. From 2004 until 2013, Dan was a member of the Pennsylvania State Board of Certified Real Estate Appraisers, serving for five years as vice-chairman and three years as chairman.',
}

export const DESCRIPTION_PARAGRAPHS = [
  'This course provides an in-depth look at statistical analysis, mathematical modeling and the principles of real estate finance. It teaches skills that are appropriate for appraisal of both residential and income producing properties. The primary focus will be on residential applications. The course is structured to conform to the 2008 Real Property Appraiser Qualification Criteria established by the Appraiser Qualifications Board (AQB) of The Appraisal Foundation. It is part of the Required Core Curriculum to become a Certified Residential or Certified General Appraiser.',
  'Starting with a discussion and examples explaining the importance of statistical analysis for real property appraisers, it progresses through such topics as descriptive and inferential statistics, graphical analysis, measures of central tendency, and measures of dispersion. Then, mathematical and valuation modeling are demonstrated. In this same section, Automated Valuation Models (AVMs) are also covered, along with linear regression and multiple regression analysis.',
  'The last section will investigate the history of financing and the flow of funds. The role of the Federal Reserve System will be explored, along with how mortgages work. There will be extensive analysis of mortgage types, terms, and instruments.',
]
