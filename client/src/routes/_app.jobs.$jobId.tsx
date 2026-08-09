import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Button,
  EmptyState,
  Stack,
} from '@astryxdesign/core'
import { JobFacts, StatusBadge } from '../components/job-view'
import { jobsApi } from '../lib/api'
import { jobKeys } from '../lib/query'
import { ApiError } from '../lib/types'

export const Route = createFileRoute('/_app/jobs/$jobId')({
  component: JobDetailPage,
})

function JobDetailPage() {
  const { jobId } = Route.useParams()
  const query = useQuery({
    queryKey: jobKeys.detail(jobId),
    queryFn: () => jobsApi.detail(jobId),
    refetchInterval: ({ state }) =>
      state.data &&
      (state.data.status === 'PENDING' || state.data.status === 'ACTIVE')
        ? 5_000
        : false,
  })
  if (query.isPending)
    return (
      <EmptyState title="Loading job" description="Retrieving job details…" />
    )
  if (query.error instanceof ApiError && query.error.kind === 'not-found')
    return (
      <EmptyState
        title="Job unavailable"
        description="This job does not exist or is not owned by your account."
      />
    )
  if (query.isError)
    return (
      <EmptyState
        title="Job could not be loaded"
        description={query.error.message}
        actions={<Button label="Retry" onClick={() => void query.refetch()} />}
      />
    )
  return (
    <Stack gap={5}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Job details</div>
          <h1>{query.data.id}</h1>
          <p>Current configuration, progress, and timing.</p>
        </div>
        <Button
          label={query.isFetching ? 'Refreshing…' : 'Refresh'}
          variant="secondary"
          onClick={() => void query.refetch()}
          isDisabled={query.isFetching}
        />
      </div>
      <div className="detail-summary">
        <section className="detail-panel">
          <div className="eyebrow">Current state</div>
          <StatusBadge status={query.data.status} />
          <p className="detail-copy">
            {query.data.status === 'FAILED'
              ? `Processing stopped at stage ${query.data.failStage ?? 'unknown'}.`
              : query.data.status === 'COMPLETED'
                ? 'Processing completed successfully.'
                : 'This job is still being processed. This page refreshes automatically.'}
          </p>
        </section>
        <section className="detail-panel">
          <div className="eyebrow">Job facts</div>
          <JobFacts job={query.data} />
        </section>
      </div>
    </Stack>
  )
}
