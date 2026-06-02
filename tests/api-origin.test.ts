import { afterEach, describe, expect, it } from 'vitest'
import {
  assertTrustedRequestOrigin,
  LaunchApiError,
} from '../lib/launch-kit/api-guard'

const originalEnv = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
}

afterEach(() => {
  process.env.VERCEL_ENV = originalEnv.VERCEL_ENV
  process.env.NEXT_PUBLIC_APP_URL = originalEnv.NEXT_PUBLIC_APP_URL
  process.env.BETTER_AUTH_URL = originalEnv.BETTER_AUTH_URL
})

describe('api origin guard', () => {
  it('allows configured production origins for mutating requests', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'https://launch.example'
    process.env.BETTER_AUTH_URL = 'https://launch.example'

    expect(() =>
      assertTrustedRequestOrigin(new Request('https://launch.example/api/test', {
        method: 'POST',
        headers: { origin: 'https://launch.example' },
      })),
    ).not.toThrow()
  })

  it('rejects untrusted production origins', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'https://launch.example'
    process.env.BETTER_AUTH_URL = 'https://launch.example'

    expect(() =>
      assertTrustedRequestOrigin(new Request('https://launch.example/api/test', {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
      })),
    ).toThrow(LaunchApiError)
  })

  it('requires an origin header for production mutating requests', () => {
    process.env.VERCEL_ENV = 'production'
    process.env.NEXT_PUBLIC_APP_URL = 'https://launch.example'
    process.env.BETTER_AUTH_URL = 'https://launch.example'

    expect(() =>
      assertTrustedRequestOrigin(new Request('https://launch.example/api/test', {
        method: 'POST',
      })),
    ).toThrow(LaunchApiError)
  })

  it('does not require origin headers for local development requests', () => {
    process.env.VERCEL_ENV = 'development'

    expect(() =>
      assertTrustedRequestOrigin(new Request('http://localhost:3000/api/test', {
        method: 'POST',
      })),
    ).not.toThrow()
  })
})
