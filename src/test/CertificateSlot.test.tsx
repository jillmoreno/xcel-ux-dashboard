import { describe, expect, it, beforeEach } from 'vitest'
import {
  type Brand } from '@/context/AccountContext'
import {
  certificateStateForCourse,
  certificatesFor } from '@/data/certificateFixtures'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * The footer marker slot, and the kebab that now has somewhere to go.
 *
 * The marker used to be a caller-supplied boolean that `LearningPathPage`
 * passed as `course.status === 'complete'` — the card asserted a certificate
 * existed purely because the course had finished, on the one surface that
 * opted in, and said nothing at all in My Courses. Every assertion below is
 * about that over-claim being gone.
 */

const ALL_BRANDS: Brand[] = ['xcel']

beforeEach(() => {
})

describe('the join', () => {
  it('never resolves an external certificate — they carry no courseId', () => {
    for (const brand of ALL_BRANDS) {
      for (const cert of certificatesFor(brand).filter((c) => c.status === 'external')) {
        expect(cert.courseId, `${cert.id} is external and should have no courseId`).toBeUndefined()
      }
    }
  })

  it('gives each course at most ONE certificate, per brand', () => {
    // `certificateStateForCourse` uses `.find()`, so two certificates on one
    // course would make the marker depend on array order — an issued and a
    // pending certificate for the same course would resolve to whichever was
    // authored first. Cheap to check, invisible when it breaks.
    for (const brand of ALL_BRANDS) {
      const ids = certificatesFor(brand)
        .map((c) => c.courseId)
        .filter((id): id is string => id != null)
      expect(new Set(ids).size, `${brand} has two certificates on one course`).toBe(ids.length)
    }
  })

  it('gives EVERY completed course a certificate, on every brand', () => {
    /**
     * The card refuses to guess: a completed course with no certificate record
     * shows no marker at all, because assuming "Issued" from a completed status
     * is exactly the over-claim the join replaced. That makes this a DATA
     * invariant rather than a rendering one — the only way every completed card
     * carries a marker is for every completed course to have a certificate.
     *
     * Six were missing when this was written (2 CRE, 4 McKissock) and the cards
     * rendered blank. This fails the moment someone adds a completed course
     * without one, which is the only way it stays true.
     */
    const gaps: string[] = []
    for (const brand of ALL_BRANDS) {
      for (const c of myCoursesFor(brand)) {
        if (c.myStatus !== 'completed') continue
        if (certificateStateForCourse(brand, c.id) === null) gaps.push(`${brand}/${c.id}`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('points every courseId at a course that actually exists', () => {
    // A typo'd id is silently indistinguishable from "no certificate" — the
    // card just shows nothing. This is the only thing that catches it.
    for (const brand of ALL_BRANDS) {
      const courseIds = new Set(myCoursesFor(brand).map((c) => c.id))
      for (const cert of certificatesFor(brand)) {
        if (!cert.courseId) continue
        // Learning Path courses (`lp-…`) live in learningFixtures, not here.
        if (cert.courseId.startsWith('lp-')) continue
        expect(courseIds.has(cert.courseId), `${cert.id} → unknown course ${cert.courseId}`).toBe(
          true,
        )
      }
    }
  })
})

