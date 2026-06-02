import { describe, expect, it } from 'vitest'
import { getDatabaseProvider, getDatabaseUrl, isPostgresDatabaseUrl } from '../lib/database-provider'

describe('database provider helpers', () => {
  it('defaults to the local SQLite database', () => {
    expect(getDatabaseUrl('')).toBe('file:./dev.db')
    expect(getDatabaseProvider('file:./dev.db')).toBe('sqlite')
  })

  it('detects postgres URLs for production wiring', () => {
    expect(getDatabaseProvider('postgres://user:pass@example.com:5432/app')).toBe('postgresql')
    expect(getDatabaseProvider('postgresql://user:pass@example.com:5432/app')).toBe('postgresql')
    expect(isPostgresDatabaseUrl('postgresql://user:pass@example.com:5432/app')).toBe(true)
  })

  it('detects local SQLite URLs', () => {
    expect(getDatabaseProvider('file:./custom.db')).toBe('sqlite')
    expect(getDatabaseProvider(':memory:')).toBe('sqlite')
  })

  it('rejects unsupported database URLs at runtime', () => {
    expect(() => getDatabaseProvider('mysql://user:pass@example.com:3306/app')).toThrow(
      'Unsupported DATABASE_URL',
    )
    expect(isPostgresDatabaseUrl('mysql://user:pass@example.com:3306/app')).toBe(false)
  })
})
