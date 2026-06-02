export type DatabaseProvider = 'sqlite' | 'postgresql'

export function getDatabaseUrl(value = process.env.DATABASE_URL): string {
  return value?.trim() || 'file:./dev.db'
}

export function getDatabaseProvider(databaseUrl = getDatabaseUrl()): DatabaseProvider {
  const normalizedUrl = databaseUrl.trim().toLowerCase()

  if (normalizedUrl.startsWith('postgres://') || normalizedUrl.startsWith('postgresql://')) {
    return 'postgresql'
  }

  if (normalizedUrl.startsWith('file:') || normalizedUrl === ':memory:') {
    return 'sqlite'
  }

  throw new Error('Unsupported DATABASE_URL. Use file: for local SQLite or postgres:// / postgresql:// for production.')
}

export function isPostgresDatabaseUrl(databaseUrl: string): boolean {
  const normalizedUrl = databaseUrl.trim().toLowerCase()
  return normalizedUrl.startsWith('postgres://') || normalizedUrl.startsWith('postgresql://')
}
