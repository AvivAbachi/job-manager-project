import { adminClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import type { AppSession } from './types'

export const authClient = createAuthClient({
  baseURL: window.location.origin,
  plugins: [adminClient()],
})

export async function getSession(): Promise<AppSession | null> {
  const result = await authClient.getSession()
  return result.data ?? null
}

export function isAdmin(session: AppSession | null) {
  return session?.user.role === 'admin'
}
