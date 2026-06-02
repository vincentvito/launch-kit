import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '@/lib/prisma'
import { getDatabaseProvider } from '@/lib/database-provider'
import { getAllowedOrigins, getAppUrl } from '@/lib/env'
import { authRateLimitConfig } from '@/lib/auth-config'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const googleEnabled = Boolean(googleClientId && googleClientSecret)

export const auth = betterAuth({
  appName: 'Launch Kit',
  baseURL: process.env.BETTER_AUTH_URL || getAppUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: getDatabaseProvider(),
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        },
      }
    : {},
  rateLimit: authRateLimitConfig,
  trustedOrigins: getAllowedOrigins(),
})

export const isGoogleAuthEnabled = googleEnabled
