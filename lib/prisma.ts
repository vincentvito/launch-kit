import { PrismaClient } from './generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'
import { getDatabaseProvider, getDatabaseUrl } from '@/lib/database-provider'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = getDatabaseUrl()
  const adapter = getDatabaseProvider(url) === 'postgresql'
    ? new PrismaPg(url)
    : new PrismaBetterSqlite3({ url })

  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
