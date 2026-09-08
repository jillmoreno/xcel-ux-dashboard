import { describe, it, expect, beforeEach } from 'vitest'
import { deriveArchetype } from '@/data/membership/learningAtAGlanceFixtures'

beforeEach(() => {
  window.localStorage.clear()
})

describe('deriveArchetype', () => {
  const consistency = { ceHours: 42, streakWeeks: 7, peakTime: '8–10 PM', mostActiveDay: 'Sundays' }

  it('video-dominant + high hours → "The Visual Deep-Diver"', () => {
    expect(deriveArchetype({ video: 54, podcast: 26, reading: 20 }, consistency).label).toBe(
      'The Visual Deep-Diver',
    )
  })

  it('podcast-dominant → an "Audio" label', () => {
    expect(deriveArchetype({ video: 20, podcast: 60, reading: 20 }, consistency).label).toContain(
      'Audio',
    )
  })

  it('reading-dominant → a "Reader" label', () => {
    expect(deriveArchetype({ video: 20, podcast: 20, reading: 60 }, consistency).label).toContain(
      'Reader',
    )
  })
})
