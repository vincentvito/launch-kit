import { createAuthClient } from 'better-auth/react'
import { getAuthClientBaseUrl } from '@/lib/auth-client-url'

export const authClient = createAuthClient({
  baseURL: getAuthClientBaseUrl(),
})

export const { signIn, signOut, signUp, useSession } = authClient
