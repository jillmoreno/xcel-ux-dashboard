import { describe, expect, it } from 'vitest'
import { makeItem, parseBulk, stageLabel, toMarkdown, type TodoItem } from '@/components/prototype/todoStore'

describe('parseBulk', () => {
  it('splits on newlines and drops blank lines', () => {
    expect(parseBulk('one\n\ntwo\n   \nthree')).toEqual(['one', 'two', 'three'])
  })

  it('strips the markers a pasted list arrives with', () => {
    const pasted = [
      '- Compass pass 2',
      '* Gift recipients cooldown',
      '• Membership cancel copy',
      '1. Onboarding reassurance line',
      '2) Flashcards build-a-set',
      '[ ] Contrast check',
      '[x] Rubi row fix',
      '## Heading pasted by accident',
      '– en dash bullet',
    ].join('\n')
    expect(parseBulk(pasted)).toEqual([
      'Compass pass 2',
      'Gift recipients cooldown',
      'Membership cancel copy',
      'Onboarding reassurance line',
      'Flashcards build-a-set',
      'Contrast check',
      'Rubi row fix',
      'Heading pasted by accident',
      'en dash bullet',
    ])
  })

  it('leaves interior punctuation alone', () => {
    expect(parseBulk('Fix the 1. ordering bug - it regressed')).toEqual([
      'Fix the 1. ordering bug - it regressed',
    ])
  })

  it('handles CRLF from Windows paste', () => {
    expect(parseBulk('one\r\ntwo')).toEqual(['one', 'two'])
  })

  it('returns nothing for whitespace or bare markers', () => {
    expect(parseBulk('   \n\n')).toEqual([])
    expect(parseBulk('-\n*\n')).toEqual([])
  })
})

describe('makeItem', () => {
  it('starts undone, with the stage it was given', () => {
    const it0 = makeItem('a task', 'development')
    expect(it0.done).toBe(false)
    expect(it0.stage).toBe('development')
    expect(it0.text).toBe('a task')
  })

  it('mints distinct ids', () => {
    const ids = new Set(Array.from({ length: 200 }, () => makeItem('x').id))
    expect(ids.size).toBe(200)
  })
})

describe('stageLabel', () => {
  it('maps the pipeline stages and degrades to empty for none', () => {
    expect(stageLabel('design')).toBe('Design')
    expect(stageLabel('sandbox')).toBe('Sandbox')
    expect(stageLabel('')).toBe('')
  })
})

describe('toMarkdown', () => {
  const items: TodoItem[] = [
    { id: 'a', text: 'Open one', stage: 'design', done: false },
    { id: 'b', text: 'Open two', stage: '', done: false },
    { id: 'c', text: 'Finished', stage: 'development', done: true },
  ]

  it('separates open from done and marks the checkboxes', () => {
    const md = toMarkdown(items)
    expect(md).toContain('- [ ] Open one _(Design)_')
    expect(md).toContain('- [ ] Open two')
    expect(md).toContain('## Done')
    expect(md).toContain('- [x] Finished _(Development)_')
    expect(md).toContain('2 open')
  })

  it('omits the Done heading when nothing is done', () => {
    expect(toMarkdown([items[0]])).not.toContain('## Done')
  })

  it('says so when the list is empty', () => {
    expect(toMarkdown([])).toContain('Nothing on the list')
  })
})

/** The reorder used by both the drag handler and the arrow buttons. Kept here
 *  because a silent off-by-one in a move is the kind of bug that only shows up
 *  as "the list shuffled itself". */
function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr
  const next = arr.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

describe('reorder', () => {
  const base = ['a', 'b', 'c', 'd']

  it('moves an item up and down by one', () => {
    expect(move(base, 2, 1)).toEqual(['a', 'c', 'b', 'd'])
    expect(move(base, 1, 2)).toEqual(['a', 'c', 'b', 'd'])
  })

  it('moves across the whole list without losing an item', () => {
    expect(move(base, 0, 3)).toEqual(['b', 'c', 'd', 'a'])
    expect(move(base, 3, 0)).toEqual(['d', 'a', 'b', 'c'])
  })

  it('refuses out-of-range and no-op moves without mutating', () => {
    expect(move(base, 0, -1)).toBe(base)
    expect(move(base, 0, 4)).toBe(base)
    expect(move(base, 2, 2)).toBe(base)
  })

  it('never changes length', () => {
    for (let f = 0; f < base.length; f++) {
      for (let t = 0; t < base.length; t++) {
        expect(move(base, f, t)).toHaveLength(base.length)
      }
    }
  })
})
