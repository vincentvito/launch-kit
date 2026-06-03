import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('Vercel configuration', () => {
  it('schedules the secured maintenance route daily', () => {
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons?: Array<{ path?: string; schedule?: string }>
    }

    expect(config.crons).toEqual(expect.arrayContaining([
      {
        path: '/api/maintenance',
        schedule: '0 5 * * *',
      },
    ]))
  })
})
