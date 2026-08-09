import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { authClient } from '../lib/auth'
import { Button, Field, Notice } from './ui'

export function safeDestination(value: unknown) {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : '/jobs'
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'register' }) {
  const navigate = useNavigate()
  const search = useSearch({ strict: false })
  const [error, setError] = useState('')
  const form = useForm({
    defaultValues: { name: '', email: '', password: '', isAdmin: false },
    onSubmit: async ({ value }) => {
      setError('')
      const options =
        mode === 'sign-in'
          ? { email: value.email, password: value.password }
          : {
              name: value.name,
              email: value.email,
              password: value.password,
              role: value.isAdmin ? 'admin' : 'user',
            }
      const result =
        mode === 'sign-in'
          ? await authClient.signIn.email(options)
          : await authClient.signUp.email(
              options as {
                name: string
                email: string
                password: string
                role: string
              },
            )
      if (result.error) {
        setError(
          result.error.status === 401
            ? 'The email or password is incorrect.'
            : result.error.message ||
                'Authentication failed. Please review your details.',
        )
        return
      }
      await navigate({ to: safeDestination(search.redirect) })
    },
  })

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Job Manager</p>
        <h1>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">
          {mode === 'sign-in'
            ? 'Sign in to manage your jobs.'
            : 'Register to submit and track jobs.'}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
          }}
        >
          {mode === 'register' && (
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) =>
                  value.trim().length < 2
                    ? 'Enter at least 2 characters.'
                    : undefined,
              }}
            >
              {(field) => (
                <Field
                  id="name"
                  label="Name"
                  autoComplete="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  error={field.state.meta.errors[0]?.toString()}
                />
              )}
            </form.Field>
          )}
          <form.Field
            name="email"
            validators={{
              onBlur: ({ value }) =>
                /^\S+@\S+\.\S+$/.test(value)
                  ? undefined
                  : 'Enter a valid email address.',
            }}
          >
            {(field) => (
              <Field
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors[0]?.toString()}
              />
            )}
          </form.Field>
          {mode === 'register' && (
            <form.Field name="isAdmin">
              {(field) => (
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.checked)}
                  />
                  <span>Register as administrator</span>
                </label>
              )}
            </form.Field>
          )}
          <form.Field
            name="password"
            validators={{
              onBlur: ({ value }) =>
                value.length < 8 ? 'Use at least 8 characters.' : undefined,
            }}
          >
            {(field) => (
              <Field
                id="password"
                label="Password"
                type="password"
                autoComplete={
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                }
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                error={field.state.meta.errors[0]?.toString()}
              />
            )}
          </form.Field>
          {error && <Notice kind="error">{error}</Notice>}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting
                  ? 'Please wait…'
                  : mode === 'sign-in'
                    ? 'Sign in'
                    : 'Create account'}
              </Button>
            )}
          </form.Subscribe>
        </form>
        <p>
          {mode === 'sign-in' ? (
            <>
              New here? <Link to="/register">Create an account</Link>
            </>
          ) : (
            <>
              Already registered?{' '}
              <Link to="/sign-in" search={{ redirect: undefined }}>
                Sign in
              </Link>
            </>
          )}
        </p>
      </section>
    </main>
  )
}
