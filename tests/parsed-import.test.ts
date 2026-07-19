import { describe, expect, it } from 'vitest'
import {
  droppedEnumWarnings,
  sanitizeListItems,
  sanitizeParsedRecipe,
} from '@/lib/parsed-import'

describe('sanitizeListItems', () => {
  it('collapses internal newlines that would corrupt the \\n-join round-trip', () => {
    expect(sanitizeListItems(['8 oz pasta', '4 tbsp\nbutter', 'salt\r\nto taste'])).toEqual([
      '8 oz pasta',
      '4 tbsp butter',
      'salt to taste',
    ])
  })

  it('drops empty and whitespace-only items', () => {
    expect(sanitizeListItems(['  ', 'flour', '\n'])).toEqual(['flour'])
  })
})

describe('sanitizeParsedRecipe', () => {
  it('sanitizes both arrays without mutating the input', () => {
    const parsed = {
      title: 'X',
      ingredients: ['a\nb'],
      instructions: ['step\none'],
    }
    const clean = sanitizeParsedRecipe(parsed)
    expect(clean.ingredients).toEqual(['a b'])
    expect(clean.instructions).toEqual(['step one'])
    expect(parsed.ingredients).toEqual(['a\nb']) // original untouched
  })
})

describe('droppedEnumWarnings', () => {
  it('surfaces values the unified conversion silently dropped', () => {
    const warnings = droppedEnumWarnings(
      { cuisine: 'Peruvian', course: 'Main', difficulty: undefined },
      { cuisine: undefined, course: 'Main', difficulty: undefined }
    )
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('Peruvian')
  })

  it('is silent when nothing was dropped', () => {
    expect(
      droppedEnumWarnings({ cuisine: 'Italian' }, { cuisine: 'Italian' })
    ).toEqual([])
  })
})
