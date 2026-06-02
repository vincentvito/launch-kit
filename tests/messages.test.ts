import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function collectShape(value: unknown, prefix = '$'): string[] {
  if (Array.isArray(value)) {
    return [
      `${prefix}:array:${value.length}`,
      ...value.flatMap((child, index) => collectShape(child, `${prefix}[${index}]`)),
    ]
  }

  if (value && typeof value === 'object') {
    return [
      `${prefix}:object`,
      ...Object.entries(value).flatMap(([key, child]) => collectShape(child, `${prefix}.${key}`)),
    ]
  }

  return [`${prefix}:${typeof value}`]
}

function collectStrings(value: unknown, prefix = '$', output = new Map<string, string>()): Map<string, string> {
  if (typeof value === 'string') {
    output.set(prefix, value)
    return output
  }

  if (Array.isArray(value)) {
    value.forEach((child, index) => collectStrings(child, `${prefix}[${index}]`, output))
    return output
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => collectStrings(child, `${prefix}.${key}`, output))
  }

  return output
}

function interpolationVariables(value: string): string[] {
  return [...value.matchAll(/\{([a-zA-Z_][\w.]*)/g)]
    .map((match) => match[1])
    .sort()
}

describe('messages', () => {
  it('keeps english and spanish message structure in sync', () => {
    const en = JSON.parse(readFileSync('messages/en.json', 'utf8')) as unknown
    const es = JSON.parse(readFileSync('messages/es.json', 'utf8')) as unknown
    const enShape = collectShape(en)
    const esShape = collectShape(es)

    expect(enShape.filter((entry) => !esShape.includes(entry))).toEqual([])
    expect(esShape.filter((entry) => !enShape.includes(entry))).toEqual([])
  })

  it('keeps interpolation variables aligned across locales', () => {
    const en = collectStrings(JSON.parse(readFileSync('messages/en.json', 'utf8')) as unknown)
    const es = collectStrings(JSON.parse(readFileSync('messages/es.json', 'utf8')) as unknown)

    for (const [key, enValue] of en) {
      const esValue = es.get(key)
      expect(esValue, `Missing Spanish message at ${key}`).toBeDefined()
      expect(interpolationVariables(esValue || ''), `Interpolation mismatch at ${key}`).toEqual(
        interpolationVariables(enValue),
      )
    }
  })
})
