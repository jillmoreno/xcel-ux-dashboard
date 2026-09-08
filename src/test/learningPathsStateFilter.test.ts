import { describe, expect, it } from 'vitest'
import { learningPathsFor } from '@/data/learningFixtures'
import { applyCountVariantToSummaries } from '@/data/learningPathsCountVariant'
import {
  filterAndSortPaths,
  statesOf,
  STATE_COLLAPSE_LIMIT,
} from '@/components/learning/learningPathsHomeUtil'

/**
 * The Learning Paths landing State filter (state-count flag). statesOf derives
 * the pill set from the current path set; filterAndSortPaths scopes to the
 * selected state; and the count-variant rotation gives the "40+ paths" demo
 * enough states to trigger the "Show all (N)" collapse.
 */

const ELITE = learningPathsFor('xcel')

describe('Learning Paths — State filter', () => {
  it('statesOf lists distinct states with counts, skipping stateless paths', () => {
    const states = statesOf(ELITE)
    expect(states.length).toBeGreaterThan(0)
    // Every entry is a { value, label, count } with a positive count.
    for (const s of states) {
      expect(s.value).toBeTruthy()
      expect(s.label).toBe(s.value)
      expect(s.count).toBeGreaterThan(0)
    }
    // Sum of per-state counts never exceeds the path count (stateless paths drop out).
    const summed = states.reduce((n, s) => n + s.count, 0)
    expect(summed).toBeLessThanOrEqual(ELITE.length)
  })

  it('filterAndSortPaths scopes to the selected state', () => {
    const states = statesOf(ELITE)
    const target = states[0].value
    const filtered = filterAndSortPaths(ELITE, {
      query: '',
      chip: 'all',
      profession: 'all',
      state: target,
      sort: 'recent',
    })
    expect(filtered.length).toBe(states[0].count)
    expect(filtered.every((p) => p.state === target)).toBe(true)
  })

  it('state "all" (or omitted) does not scope by state', () => {
    const all = filterAndSortPaths(ELITE, { query: '', chip: 'all', profession: 'all', state: 'all', sort: 'recent' })
    const omitted = filterAndSortPaths(ELITE, { query: '', chip: 'all', profession: 'all', sort: 'recent' })
    expect(all.length).toBe(ELITE.length)
    expect(omitted.length).toBe(ELITE.length)
  })

  it('the "40+ paths" count variant yields more than the collapse limit of states (Show all case)', () => {
    const lots = applyCountVariantToSummaries(ELITE, 'lots')
    expect(statesOf(lots).length).toBeGreaterThan(STATE_COLLAPSE_LIMIT)
  })
})
