import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Button, EmptyState, Stack } from '@astryxdesign/core'
import { JobTable, hasActiveJobs } from '../components/job-view'
import type { JobSortBy, JobStatus, SortOrder } from '../lib/types'
import { jobsApi } from '../lib/api'
import { jobKeys } from '../lib/query'

export const Route = createFileRoute('/_app/jobs/')({ component: JobsPage })

const pageSize = 100

function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>('ALL')
  const [sortBy, setSortBy] = useState<JobSortBy | undefined>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>('desc')
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: [...jobKeys.member(), page, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      jobsApi.list(page, pageSize, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        sortBy,
        sortOrder,
      }),
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
  const statusCounts = query.data.total
  const totalJobs = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  const matchingJobs =
    statusFilter === 'ALL' ? totalJobs : statusCounts[statusFilter]
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
                onClick={() => {
                  setStatusFilter(status)
                  setPage(1)
                }}
              >
                <span className="metric-label">{label}</span>
                <h2>{statusCounts[status]}</h2>
              </button>
            ))}
          </div>
          <div className="filter-bar">
            <span>
              Showing {jobs.length} of {matchingJobs} jobs
            </span>
            <button
              type="button"
              className={statusFilter === 'ALL' ? 'filter-active' : undefined}
              onClick={() => {
                setStatusFilter('ALL')
                setPage(1)
              }}
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
            <JobTable
              jobs={jobs}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={(nextSortBy, nextSortOrder) => {
                setSortBy(nextSortBy)
                setSortOrder(nextSortOrder)
                setPage(1)
              }}
            />
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
              isDisabled={page * pageSize >= matchingJobs || query.isFetching}
            />
          </div>
        </>
      )}
    </Stack>
  )
}
