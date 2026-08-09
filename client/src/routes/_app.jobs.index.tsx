import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Button, EmptyState, Stack, Table } from '@astryxdesign/core'
import { StatusBadge, hasActiveJobs } from '../components/job-view'
import type { JobStatus } from '../lib/types'
import { jobsApi } from '../lib/api'
import { jobKeys } from '../lib/query'

export const Route = createFileRoute('/_app/jobs/')({ component: JobsPage })

const pageSize = 100

function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: [...jobKeys.member(), page],
    queryFn: () => jobsApi.list(page, pageSize),
    refetchInterval: ({ state }) =>
      state.data && hasActiveJobs(state.data.jobs) ? 5_000 : false,
  })
  if (query.isPending)
    return (
      <EmptyState
        title="Loading jobs"
        description="Retrieving your latest jobs…"
      />
    )
  if (query.isError && !query.data)
    return (
      <EmptyState
        title="Jobs could not be loaded"
        description={query.error.message}
        actions={<Button label="Retry" onClick={() => void query.refetch()} />}
      />
    )
  const jobs = query.data.jobs
  const visibleJobs =
    statusFilter === 'ALL'
      ? jobs
      : jobs.filter((job) => job.status === statusFilter)
  const statusCounts = query.data.total
  const totalJobs = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  return (
    <Stack gap={5}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Workspace</div>
          <h1>My jobs</h1>
          <p>Track processing state, timing, and failures.</p>
        </div>
      </div>
      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Submit a job to begin tracking its progress."
        />
      ) : (
        <>
          <div className="metrics-grid" aria-label="Job status summary">
            {(
              [
                ['PENDING', 'Pending'],
                ['ACTIVE', 'Active'],
                ['COMPLETED', 'Completed'],
                ['FAILED', 'Failed'],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                className="metric-card"
                type="button"
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(status)}
              >
                <span className="metric-label">{label}</span>
                <h2>{statusCounts[status]}</h2>
              </button>
            ))}
          </div>
          <div className="filter-bar">
            <span>
              Showing {visibleJobs.length} of {totalJobs} jobs
            </span>
            <button
              type="button"
              className={statusFilter === 'ALL' ? 'filter-active' : undefined}
              onClick={() => setStatusFilter('ALL')}
            >
              All statuses
            </button>
            <Button
              label="Refresh"
              variant="secondary"
              onClick={() => void query.refetch()}
              isDisabled={query.isFetching}
            />
          </div>
          <div className="data-panel">
            <Table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Stages</th>
                  <th>Total time</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleJobs.map((job) => (
                  <tr key={job.id}>
                    <td data-label="Job">{job.id}</td>
                    <td data-label="Status">
                      <StatusBadge status={job.status} />
                    </td>
                    <td data-label="Stages">{job.totalStages}</td>
                    <td data-label="Total time">
                      {job.totalTime < 1000
                        ? `${job.totalTime} ms`
                        : `${(job.totalTime / 1000).toLocaleString()} s`}
                    </td>
                    <td data-label="Updated">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(job.updatedAt))}
                    </td>
                    <td data-label="Actions">
                      <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                        View details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="filter-bar">
            <span>Page {page}</span>
            <Button
              label="Previous"
              variant="secondary"
              onClick={() => setPage((current) => current - 1)}
              isDisabled={page === 1 || query.isFetching}
            />
            <Button
              label="Next"
              variant="secondary"
              onClick={() => setPage((current) => current + 1)}
              isDisabled={page * pageSize >= totalJobs || query.isFetching}
            />
          </div>
        </>
      )}
    </Stack>
  )
}
