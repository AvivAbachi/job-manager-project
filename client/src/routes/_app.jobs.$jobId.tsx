import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { JobFacts } from '../components/job-view'
import { Button, PageState } from '../components/ui'
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
    return <PageState title="Loading job">Retrieving job details…</PageState>
  if (query.error instanceof ApiError && query.error.kind === 'not-found')
    return (
      <PageState title="Job unavailable">
        This job does not exist or is not owned by your account.
      </PageState>
    )
  if (query.isError)
    return (
      <PageState
        title="Job could not be loaded"
        action={<Button onClick={() => void query.refetch()}>Retry</Button>}
      >
        {query.error.message}
      </PageState>
    )
  return (
    <main className="narrow">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Job details</p>
          <h1>{query.data.id}</h1>
          <p>Current configuration, progress, and timing.</p>
        </div>
        <Button
          className="secondary"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
        >
          {query.isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>
      <section className="surface detail-surface">
        <JobFacts job={query.data} />
      </section>
    </main>
  )
}
