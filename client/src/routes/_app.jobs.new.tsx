import { useRef, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button, Field, Notice } from '../components/ui'
import { jobsApi } from '../lib/api'
import { ApiError } from '../lib/types'
import type { CreateJobInput } from '../lib/types'
import { jobKeys, queryClient } from '../lib/query'

export const Route = createFileRoute('/_app/jobs/new')({
  component: NewJobPage,
})
const payloadKey = (input: CreateJobInput) => JSON.stringify(input)

function NewJobPage() {
  const intent = useRef<{ payload: string; key: string } | null>(null)
  const [createdId, setCreatedId] = useState<string>()
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: async (input: CreateJobInput) => {
      const serialized = payloadKey(input)
      if (!intent.current || intent.current.payload !== serialized)
        intent.current = { payload: serialized, key: crypto.randomUUID() }
      return jobsApi.create(input, intent.current.key)
    },
    onSuccess: (job) => {
      queryClient.setQueryData(jobKeys.detail(job.id), job)
      void queryClient.invalidateQueries({ queryKey: jobKeys.member() })
      intent.current = null
      setCreatedId(job.id)
    },
    onError: (caught) => {
      const apiError = caught as ApiError
      if (!apiError.uncertain || apiError.kind === 'conflict')
        intent.current = null
      setError(apiError.message)
    },
  })
  const form = useForm({
    defaultValues: { totalStages: '5', totalTime: '10000', failStage: '' },
    onSubmit: ({ value }) => {
      setError('')
      setCreatedId(undefined)
      mutation.mutate({
        totalStages: Number(value.totalStages),
        totalTime: Number(value.totalTime),
        failStage: value.failStage === '' ? null : Number(value.failStage),
      })
    },
  })
  const reset = () => {
    intent.current = null
    mutation.reset()
    setError('')
    setCreatedId(undefined)
    form.reset()
  }
  const positiveInteger =
    (label: string) =>
    ({ value }: { value: string }) =>
      Number.isInteger(Number(value)) && Number(value) > 0
        ? undefined
        : `${label} must be a positive integer.`
  return (
    <main className="narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">New submission</p>
          <h1>Create a job</h1>
          <p>
            Total time is measured in milliseconds. Failure stages are
            zero-based.
          </p>
        </div>
      </div>
      <form
        className="surface form-surface"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Field
          name="totalStages"
          validators={{ onChange: positiveInteger('Total stages') }}
        >
          {(field) => (
            <Field
              id="totalStages"
              label="Total stages"
              type="number"
              min="1"
              step="1"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              error={field.state.meta.errors[0]?.toString()}
            />
          )}
        </form.Field>
        <form.Field
          name="totalTime"
          validators={{ onChange: positiveInteger('Total time') }}
        >
          {(field) => (
            <Field
              id="totalTime"
              label="Total time (ms)"
              type="number"
              min="1"
              step="1"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              error={field.state.meta.errors[0]?.toString()}
            />
          )}
        </form.Field>
        <form.Field
          name="failStage"
          validators={{
            onChangeListenTo: ['totalStages'],
            onChange: ({ value, fieldApi }) =>
              value === '' ||
              (Number.isInteger(Number(value)) &&
                Number(value) >= 0 &&
                Number(value) <
                  Number(fieldApi.form.getFieldValue('totalStages')))
                ? undefined
                : 'Failure stage must be an integer from 0 to total stages − 1.',
          }}
        >
          {(field) => (
            <Field
              id="failStage"
              label="Failure stage (optional)"
              type="number"
              min="0"
              step="1"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              error={field.state.meta.errors[0]?.toString()}
            />
          )}
        </form.Field>
        {error && (
          <Notice kind="error">
            {error}{' '}
            {mutation.error instanceof ApiError &&
              mutation.error.uncertain &&
              'Retrying unchanged values will safely reuse the same submission key.'}
          </Notice>
        )}
        {createdId && (
          <Notice kind="success">
            Job created.{' '}
            <Link to="/jobs/$jobId" params={{ jobId: createdId }}>
              View its details
            </Link>
            .
          </Notice>
        )}
        <div className="actions">
          <form.Subscribe selector={(state) => [state.canSubmit]}>
            {([canSubmit]) => (
              <Button type="submit" disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending
                  ? 'Submitting…'
                  : error && intent.current
                    ? 'Retry submission'
                    : 'Create job'}
              </Button>
            )}
          </form.Subscribe>
          <Button
            className="secondary"
            type="button"
            onClick={reset}
            disabled={mutation.isPending}
          >
            Reset
          </Button>
        </div>
      </form>
    </main>
  )
}
