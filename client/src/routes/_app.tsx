import { useState } from 'react'
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { authClient, getSession, isAdmin } from '../lib/auth'
import { clearProtectedQueries } from '../lib/query'
import { Button } from '../components/ui'

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
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  async function signOut() {
    setSigningOut(true)
    await authClient.signOut()
    clearProtectedQueries()
    await navigate({ to: '/sign-in', search: { redirect: undefined } })
  }
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/jobs">
          Job Manager
        </Link>
        <Button
          className="menu-button"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen(!open)}
        >
          Menu
        </Button>
        <nav
          id="main-nav"
          className={open ? 'nav nav-open' : 'nav'}
          aria-label="Main navigation"
        >
          <Link to="/jobs" activeProps={{ 'aria-current': 'page' }}>
            My jobs
          </Link>
          <Link to="/jobs/new" activeProps={{ 'aria-current': 'page' }}>
            Create job
          </Link>
          {isAdmin(session) && (
            <Link to="/admin" activeProps={{ 'aria-current': 'page' }}>
              All jobs
            </Link>
          )}
        </nav>
        <div className="identity">
          <span>
            <strong>{session.user.name}</strong>
            <small>{session.user.email}</small>
          </span>
          <Button onClick={() => void signOut()} disabled={signingOut}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </Button>
        </div>
      </header>
      <div className="content">
        <Outlet />
      </div>
    </div>
  )
}
