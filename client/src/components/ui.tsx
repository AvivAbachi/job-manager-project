import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'
import type { JobStatus } from '../lib/types'

export function Button({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`button ${className}`} {...props} />
}

export function Field({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${props.id}-error` : undefined}
        {...props}
      />
      {error && (
        <span className="field-error" id={`${props.id}-error`}>
          {error}
        </span>
      )}
    </label>
  )
}

export function Notice({
  kind = 'info',
  children,
}: {
  kind?: 'info' | 'error' | 'success' | 'forbidden'
  children: ReactNode
}) {
  return (
    <div
      className={`notice notice-${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export function PageState({
  title,
  children,
  action,
}: {
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="page-state">
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </section>
  )
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`status status-${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  )
}
