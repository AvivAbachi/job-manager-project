import { useState } from 'react'
import {
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
  Link,
} from '@tanstack/react-router'
import { Button } from '@astryxdesign/core/Button'
import { ThemeToggle } from '../components/theme-toggle'
import { JobCreationDialog } from '../components/job-creation-dialog'
import { authClient, getSession, isAdmin } from '../lib/auth'
import { clearProtectedQueries } from '../lib/query'

export const Route = createFileRoute('/_app')({
  beforeLoad: async ({ location }) => {
    const session = await getSession()
    if (!session)
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    return { session }
  },
  component: AppLayout,
})

function AppLayout() {
  const { session } = Route.useRouteContext()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)
  async function signOut() {
    setSigningOut(true)
    await authClient.signOut()
    clearProtectedQueries()
    await navigate({ to: '/sign-in', search: { redirect: undefined } })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-bar">
          <Link to="/jobs" className="brand">
            Job Manager
          </Link>
          <nav className="app-nav" aria-label="Main navigation">
            <Link to="/jobs" activeProps={{ 'aria-current': 'page' }}>
              My jobs
            </Link>
            <Button
              label="Create job"
              variant="secondary"
              onClick={() => setIsJobDialogOpen(true)}
            />
            {isAdmin(session) && (
              <>
                <Link to="/admin" activeProps={{ 'aria-current': 'page' }}>
                  All jobs
                </Link>
                <Link
                  to="/admin/users"
                  activeProps={{ 'aria-current': 'page' }}
                >
                  Users
                </Link>
              </>
            )}
          </nav>
          <div className="account">
            <span className="avatar" aria-hidden="true">
              {session.user.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="account-copy">
              <strong>{session.user.name}</strong>
              <span>{session.user.email}</span>
            </span>
            <ThemeToggle />
            <Button
              label={signingOut ? 'Signing out…' : 'Sign out'}
              variant="secondary"
              isLoading={signingOut}
              onClick={() => void signOut()}
            />
          </div>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <JobCreationDialog
        isAdmin={isAdmin(session)}
        isOpen={isJobDialogOpen}
        onOpenChange={setIsJobDialogOpen}
      />
    </div>
  )
}
