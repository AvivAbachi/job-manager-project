import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import {
  Banner,
  Button,
  CheckboxInput,
  FormLayout,
  TextInput,
} from '@astryxdesign/core'
import { authClient } from '../lib/auth'
import { ThemeToggle } from './theme-toggle'

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
        <div className="auth-brand">
          <span className="brand">Job Manager</span>
          <ThemeToggle />
        </div>
        <h1>{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h1>
        <p>
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
          <FormLayout>
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
                  <TextInput
                    label="Name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(value) => field.handleChange(value)}
                    status={
                      field.state.meta.errors[0]
                        ? {
                            type: 'error',
                            message: field.state.meta.errors[0].toString(),
                          }
                        : undefined
                    }
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
                <TextInput
                  label="Email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(value) => field.handleChange(value)}
                  status={
                    field.state.meta.errors[0]
                      ? {
                          type: 'error',
                          message: field.state.meta.errors[0].toString(),
                        }
                      : undefined
                  }
                />
              )}
            </form.Field>
            {mode === 'register' && (
              <form.Field name="isAdmin">
                {(field) => (
                  <CheckboxInput
                    label="Register as administrator"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(value) => field.handleChange(value)}
                  />
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
                <TextInput
                  label="Password"
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(value) => field.handleChange(value)}
                  status={
                    field.state.meta.errors[0]
                      ? {
                          type: 'error',
                          message: field.state.meta.errors[0].toString(),
                        }
                      : undefined
                  }
                />
              )}
            </form.Field>
            {error && <Banner status="error" title={error} />}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  isDisabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                  variant="primary"
                  label={
                    isSubmitting
                      ? 'Please wait…'
                      : mode === 'sign-in'
                        ? 'Sign in'
                        : 'Create account'
                  }
                />
              )}
            </form.Subscribe>
          </FormLayout>
        </form>
        <p className="auth-switch">
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
