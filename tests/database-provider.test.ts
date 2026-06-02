import { describe, expect, it } from 'vitest'
import { getDatabaseProvider, getDatabaseUrl, isPostgresDatabaseUrl } from '../lib/database-provider'

describe('database provider helpers', () => {
  it('requires an explicit postgres database URL', () => {
    expect(() => getDatabaseUrl('')).toThrow('DATABASE_URL is required')
  })

  it('falls back to DIRECT_URL for runtime when DATABASE_URL is unset locally', () => {
    const originalDatabaseUrl = process.env.DATABASE_URL
    const originalDirectUrl = process.env.DIRECT_URL
    delete process.env.DATABASE_URL
    process.env.DIRECT_URL = 'postgresql://user:pass@example.com:5432/app'

    expect(getDatabaseUrl()).toBe('postgresql://user:pass@example.com:5432/app')

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl
    }
    if (originalDirectUrl === undefined) {
      delete process.env.DIRECT_URL
    } else {
      process.env.DIRECT_URL = originalDirectUrl
    }
  })

  it('detects postgres URLs for production wiring', () => {
    expect(getDatabaseProvider('postgres://user:pass@example.com:5432/app')).toBe('postgresql')
    expect(getDatabaseProvider('postgresql://user:pass@example.com:5432/app')).toBe('postgresql')
    expect(isPostgresDatabaseUrl('postgresql://user:pass@example.com:5432/app')).toBe(true)
  })

  it('rejects unsupported database URLs at runtime', () => {
    expect(() => getDatabaseProvider('mysql://user:pass@example.com:3306/app')).toThrow(
      'Unsupported DATABASE_URL',
    )
    expect(() => getDatabaseProvider('file:./dev.db')).toThrow('Unsupported DATABASE_URL')
    expect(isPostgresDatabaseUrl('mysql://user:pass@example.com:3306/app')).toBe(false)
  })
})
