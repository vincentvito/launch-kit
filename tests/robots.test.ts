import { describe, expect, it } from 'vitest'
import robots from '../app/robots'

describe('robots', () => {
  it('keeps private and transactional app surfaces out of indexing', () => {
    const payload = robots()
    const disallow = Array.isArray(payload.rules)
      ? payload.rules.flatMap((rule) => rule.disallow || [])
      : payload.rules.disallow || []

    expect(disallow).toEqual(expect.arrayContaining([
      '/api/',
      '/auth/',
      '/billing/',
      '/dashboard',
    ]))
  })
})
