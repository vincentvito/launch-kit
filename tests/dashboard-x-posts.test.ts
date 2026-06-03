import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('dashboard X post handling', () => {
  it('treats X card titles as internal labels instead of editable post titles', () => {
    const browserSource = readFileSync('app/dashboard/result-asset-browser.tsx', 'utf8')
    const utilsSource = readFileSync('app/dashboard/dashboard-utils.ts', 'utf8')

    expect(browserSource).toContain("const hidesPostTitle = pack.id === 'x'")
    expect(browserSource).toContain('{!hidesPostTitle ? (')
    expect(utilsSource).toContain("if (channelId === 'x') {\n    return card.body\n  }")
  })
})
