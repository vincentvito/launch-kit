import { describe, expect, it } from 'vitest'
import { getDemoSourceUrl } from '@/lib/launch-kit/demo'

describe('demo source URL', () => {
  it('normalizes public app URLs to client-safe origins', () => {
    expect(getDemoSourceUrl('https://launch.example/dashboard?from=demo#hero')).toBe(
      'https://launch.example',
    )
    expect(getDemoSourceUrl('javascript:alert(1)')).toBe('http://localhost:3000')
  })
})
