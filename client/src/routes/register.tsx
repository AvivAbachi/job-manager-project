import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthForm } from '../components/auth-form'
import { getSession } from '../lib/auth'

export const Route = createFileRoute('/register')({
  beforeLoad: async () => {
    if (await getSession()) throw redirect({ to: '/jobs' })
  },
  component: () => <AuthForm mode="register" />,
})
