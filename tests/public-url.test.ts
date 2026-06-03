import { describe, expect, it } from 'vitest'
import { normalizePublicLaunchUrl } from '@/lib/launch-kit/public-url'

describe('public launch URL normalization', () => {
  it('normalizes public HTTP URLs before handing them to the dashboard', () => {
    expect(normalizePublicLaunchUrl('example.com/product/?ref=launch#hero')).toBe(
      'https://example.com/product',
    )
    expect(normalizePublicLaunchUrl('http://www.example.com')).toBe('http://www.example.com/')
  })

  it('rejects private, internal, and unsupported URLs on the client side', () => {
    expect(normalizePublicLaunchUrl('localhost:3000')).toBeNull()
    expect(normalizePublicLaunchUrl('127.0.0.1:3000')).toBeNull()
    expect(normalizePublicLaunchUrl('10.0.0.5')).toBeNull()
    expect(normalizePublicLaunchUrl('192.0.2.1')).toBeNull()
    expect(normalizePublicLaunchUrl('192.168.1.20')).toBeNull()
    expect(normalizePublicLaunchUrl('app.local')).toBeNull()
    expect(normalizePublicLaunchUrl('javascript:alert(1)')).toBeNull()
  })
})
