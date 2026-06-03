import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('runtime contract', () => {
  it('keeps local, package, and CI Node versions aligned', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      engines?: { node?: string }
    }
    const nvmrc = readFileSync('.nvmrc', 'utf8').trim()
    const npmrc = readFileSync('.npmrc', 'utf8')
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8')

    expect(nvmrc).toBe('24')
    expect(packageJson.engines?.node).toBe('>=24 <26')
    expect(npmrc).toContain('engine-strict=true')
    expect(ci).toContain('node-version: 24')
  })

  it('keeps application source TypeScript-only', () => {
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf8')) as {
      compilerOptions?: { allowJs?: boolean }
    }
    const sourceRoots = ['app', 'components', 'lib', 'scripts', 'tests']
    const javascriptFiles = sourceRoots.flatMap((root) => listFiles(root))
      .filter((file) => /\.(?:cjs|js|jsx|mjs)$/.test(file))

    expect(tsconfig.compilerOptions?.allowJs).toBe(false)
    expect(javascriptFiles).toEqual([])
  })
})

function listFiles(path: string): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(path, entry.name)
    if (entry.isDirectory()) {
      return listFiles(filePath)
    }
    return filePath
  })
}
