import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { JobCard, hasActiveJobs } from '../components/job-view'
import { Button, PageState } from '../components/ui'
import { jobsApi } from '../lib/api'
import { jobKeys } from '../lib/query'

export const Route = createFileRoute('/_app/jobs/')({ component: JobsPage })

function JobsPage() {
  const query = useQuery({
    queryKey: jobKeys.member(),
    queryFn: jobsApi.list,
    refetchInterval: ({ state }) =>
      state.data && hasActiveJobs(state.data) ? 5_000 : false,
  })
  if (query.isPending)
    return (
      <PageState title="Loading jobs">Retrieving your latest jobs…</PageState>
    )
  if (query.isError && !query.data)
    return (
      <PageState
        title="Jobs could not be loaded"
        action={<Button onClick={() => void query.refetch()}>Retry</Button>}
      >
        {query.error.message}
      </PageState>
    )
  const jobs = query.data
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>My jobs</h1>
          <p>Track processing state, timing, and failures.</p>
        </div>
        <Link className="button" to="/jobs/new">
          Create job
        </Link>
      </div>
      {jobs.length === 0 ? (
        <PageState
          title="No jobs yet"
          action={
            <Link className="button" to="/jobs/new">
              Create your first job
            </Link>
          }
        >
          Submit a job to begin tracking its progress.
        </PageState>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
      <Button
        className="secondary refresh-button"
        onClick={() => void query.refetch()}
        disabled={query.isFetching}
      >
        Refresh
      </Button>
    </main>
  )
}
