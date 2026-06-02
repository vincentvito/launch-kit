export type DatabaseProvider = 'postgresql'

export function getDatabaseUrl(value?: string): string {
  const hasExplicitValue = arguments.length > 0
  const databaseUrl = value?.trim()
  if (databaseUrl && isPostgresDatabaseUrl(databaseUrl)) {
    return databaseUrl
  }

  const directUrl = process.env.DIRECT_URL?.trim()
  if (!hasExplicitValue && directUrl && isPostgresDatabaseUrl(directUrl)) {
    return directUrl
  }

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required and must be a postgres:// or postgresql:// URL.')
  }

  throw new Error('Unsupported DATABASE_URL. Use postgres:// or postgresql://.')
}

export function getDatabaseProvider(databaseUrl = getDatabaseUrl()): DatabaseProvider {
  const normalizedUrl = databaseUrl.trim().toLowerCase()

  if (normalizedUrl.startsWith('postgres://') || normalizedUrl.startsWith('postgresql://')) {
    return 'postgresql'
  }

  throw new Error('Unsupported DATABASE_URL. Use postgres:// or postgresql://.')
}

export function isPostgresDatabaseUrl(databaseUrl: string): boolean {
  const normalizedUrl = databaseUrl.trim().toLowerCase()
  return normalizedUrl.startsWith('postgres://') || normalizedUrl.startsWith('postgresql://')
}
