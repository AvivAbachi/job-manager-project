import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForm } from '../components/auth-form'
import { getSession } from '../lib/auth'

export const Route = createFileRoute('/sign-in')({
  validateSearch: (search) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: '/jobs' })
  },
  component: () => <AuthForm mode="sign-in" />,
})
