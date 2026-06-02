import type { BetterAuthOptions } from 'better-auth'

export const authRateLimitConfig = {
  enabled: true,
  storage: 'database',
  window: 60,
  max: 120,
  customRules: {
    '/sign-in/email': {
      window: 60,
      max: 10,
    },
    '/sign-up/email': {
      window: 60,
      max: 5,
    },
    '/sign-in/social': {
      window: 60,
      max: 20,
    },
    '/get-session': {
      window: 60,
      max: 240,
    },
  },
} satisfies NonNullable<BetterAuthOptions['rateLimit']>
