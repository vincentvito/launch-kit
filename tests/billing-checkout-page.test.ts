import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('billing checkout page', () => {
  it('validates redirect URLs before navigating the browser', () => {
    const source = readFileSync('app/billing/checkout/page.tsx', 'utf8')

    expect(source).toContain('getSafeBillingRedirectUrl(json.url)')
    expect(source).not.toContain('window.location.href = json.url')
  })
})
