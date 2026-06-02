import { PrismaClient } from './generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { getDatabaseProvider, getDatabaseUrl } from '@/lib/database-provider'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = getDatabaseUrl()
  const adapter = getDatabaseProvider(url) === 'postgresql'
    ? createPostgresAdapter(url)
    : new PrismaBetterSqlite3({ url })

  return new PrismaClient({ adapter })
}

function createPostgresAdapter(connectionString: string) {
  const url = new URL(connectionString)
  const schema = url.searchParams.get('schema') || 'public'
  url.searchParams.delete('schema')

  const pool = new Pool({
    connectionString: url.toString(),
    options: `-c search_path=${schema}`,
  })

  return new PrismaPg(pool, { schema })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
