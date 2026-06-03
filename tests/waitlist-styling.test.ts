import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const waitlistComponentFiles = [
  'components/waiting-list/waiting-list-page.tsx',
  'components/waiting-list/waiting-list-experience.tsx',
  'components/waiting-list/waiting-list-signup-form.tsx',
  'components/waiting-list/waiting-list-sample-dashboard.tsx',
]

describe('waitlist styling', () => {
  it('uses prefixed global Tailwind-layer styles instead of CSS modules', () => {
    expect(existsSync('components/waiting-list/waiting-list.module.css')).toBe(false)

    for (const file of waitlistComponentFiles) {
      const source = readFileSync(file, 'utf8')

      expect(source).not.toContain('waiting-list.module.css')
      expect(source).toContain('waiting-list-styles')
    }

    const styles = readFileSync('components/waiting-list/waiting-list-styles.ts', 'utf8')
    const globals = readFileSync('app/globals.css', 'utf8')

    expect(styles).toContain('"page": "waitlist-page"')
    expect(globals).toContain('@layer components')
    expect(globals).toContain('.waitlist-page')
    expect(globals).toContain('@keyframes waitlist-marquee')
  })
})
