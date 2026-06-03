import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function findSourceFiles(dir = 'app'): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      return findSourceFiles(path)
    }

    return /\.(tsx|ts)$/.test(entry.name) ? [path] : []
  })
}

function targetBlankTags(source: string): string[] {
  return [...source.matchAll(/<\w[\s\S]*?target="_blank"[\s\S]*?>/g)].map((match) => match[0])
}

describe('external link security', () => {
  it('sets noopener and noreferrer on links that open a new tab', () => {
    for (const file of findSourceFiles()) {
      const source = readFileSync(file, 'utf8')

      for (const tag of targetBlankTags(source)) {
        const rel = tag.match(/rel="([^"]*)"/)?.[1] || ''
        const relValues = rel.split(/\s+/).filter(Boolean)

        expect(relValues, `${file}: ${tag}`).toContain('noopener')
        expect(relValues, `${file}: ${tag}`).toContain('noreferrer')
      }
    }
  })
})
