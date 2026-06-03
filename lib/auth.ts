import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '@/lib/prisma'
import { getDatabaseProvider } from '@/lib/database-provider'
import { getAllowedOrigins, getAuthUrl } from '@/lib/env'
import { authRateLimitConfig } from '@/lib/auth-config'
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/auth-password-policy'

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const googleEnabled = Boolean(googleClientId && googleClientSecret)

export const auth = betterAuth({
  appName: 'Launch Kit',
  baseURL: getAuthUrl(),
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: getDatabaseProvider(),
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
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
