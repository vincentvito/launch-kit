import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || ''

  // Pull an optional `?schema=` out of the URL; pg doesn't understand it.
  const url = new URL(connectionString)
  const schema = url.searchParams.get('schema') || 'public'
  url.searchParams.delete('schema')

  const pool = new Pool({
    connectionString: url.toString(),
    options: `-c search_path=${schema}`,
  })

  const adapter = new PrismaPg(pool, { schema })
  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
