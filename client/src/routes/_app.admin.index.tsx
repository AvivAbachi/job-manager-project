import {
  Button,
  Card,
  EmptyState,
  Grid,
  Selector,
  Stack,
  Table,
  TextInput,
} from '@astryxdesign/core'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { StatusBadge } from '../components/job-view'
import { jobsApi } from '../lib/api'
import { authClient, getSession, isAdmin } from '../lib/auth'
import { jobKeys, queryClient } from '../lib/query'
import { ApiError } from '../lib/types'
import type { Job, JobStatus } from '../lib/types'

export const Route = createFileRoute('/_app/admin/')({
  beforeLoad: async () => {
    if (!isAdmin(await getSession())) throw redirect({ to: '/jobs' })
  },
  component: AdminPage,
})
const pageSize = 100
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})
const helper = createColumnHelper<typeof features, Job>()
const columns = helper.columns([
  helper.accessor('id', { header: 'Job ID' }),
  helper.accessor('userId', { header: 'Owner' }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  helper.accessor('totalStages', { header: 'Stages' }),
  helper.accessor('totalTime', { header: 'Time (ms)' }),
  helper.accessor('failStage', {
    header: 'Fail stage',
    cell: (info) => info.getValue() ?? '—',
  }),
  helper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
])
function AdminPage() {
  const [status, setStatus] = useState<JobStatus | ''>('')
  const [owner, setOwner] = useState('')
  const [page, setPage] = useState(1)
  const query = useQuery({
    queryKey: [...jobKeys.admin(), page],
    queryFn: () => jobsApi.all(page, pageSize),
    retry: false,
    refetchInterval: ({ state }) =>
      state.data?.jobs.some(
        (job) => job.status === 'PENDING' || job.status === 'ACTIVE',
      )
        ? 5_000
        : false,
  })
  const data = useMemo(
    () =>
      (query.data?.jobs ?? []).filter(
        (job) =>
          (!status || job.status === status) &&
          (!owner || job.userId.toLowerCase().includes(owner.toLowerCase())),
      ),
    [query.data, status, owner],
  )
  const table = useTable({
    features,
    data,
    columns,
  })
  const statusCounts = query.data?.total
  const totalJobs = Object.values(statusCounts ?? {}).reduce(
    (sum, count) => sum + count,
    0,
  )
  if (query.error instanceof ApiError && query.error.kind === 'forbidden') {
    queryClient.removeQueries({ queryKey: jobKeys.admin() })
    void authClient.getSession()
    return (
      <EmptyState
        title="Administrator access denied"
        description="The server refused this request. Your role may have changed; sign in again if this persists."
      />
    )
  }
  if (query.isPending)
    return (
      <EmptyState
        title="Loading all jobs"
        description="Retrieving the administrator job collection…"
      />
    )
  if (query.isError)
    return (
      <EmptyState
        title="All jobs could not be loaded"
        description={query.error.message}
        actions={<Button label="Retry" onClick={() => void query.refetch()} />}
      />
    )
  return (
    <Stack gap={5}>
      <div className="page-heading">
        <div>
          <div className="eyebrow">Administration</div>
          <h1>All jobs</h1>
          <p>
            Inspect jobs across all owners. Backend authorization remains
            authoritative.
          </p>
        </div>
      </div>
      <Card className="form-panel">
        <Grid
          columns={{ minWidth: 280, max: 3, repeat: 'fit' }}
          rowGap={3}
          columnGap={3}
          align="end"
        >
          <Selector
            label="Status"
            options={['', 'PENDING', 'ACTIVE', 'COMPLETED', 'FAILED']}
            value={status}
            onChange={(value) => setStatus(value as JobStatus | '')}
            placeholder="All statuses"
          />
          <TextInput
            label="Owner ID"
            value={owner}
            onChange={setOwner}
            placeholder="Filter by owner"
          />
          <Button
            label="Clear filters"
            variant="secondary"
            onClick={() => {
              setStatus('')
              setOwner('')
            }}
          />
        </Grid>
      </Card>
      <div className="metrics-grid" aria-label="All job statistics">
        <div className="metric-card">
          <span className="metric-label">Total jobs</span>
          <h2>{totalJobs}</h2>
        </div>
        {(
          [
            ['PENDING', 'Pending'],
            ['ACTIVE', 'Active'],
            ['COMPLETED', 'Completed'],
            ['FAILED', 'Failed'],
          ] as const
        ).map(([status, label]) => (
          <div key={status} className="metric-card">
            <span className="metric-label">{label}</span>
            <h2>{statusCounts?.[status] ?? 0}</h2>
          </div>
        ))}
      </div>
      {query.data.jobs.length === 0 ? (
        <EmptyState
          title="No jobs exist"
          description="The administrator collection is empty."
        />
      ) : data.length === 0 ? (
        <EmptyState
          title="No matching jobs"
          description="Clear or change the active filters."
        />
      ) : (
        <div className="data-panel">
          <Table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      <button onClick={header.column.getToggleSortingHandler()}>
                        <table.FlexRender header={header} />
                        <span aria-hidden="true">
                          {header.column.getIsSorted() === 'asc'
                            ? ' ↑'
                            : header.column.getIsSorted() === 'desc'
                              ? ' ↓'
                              : ''}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-label={String(cell.column.columnDef.header)}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
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
    </Stack>
  )
}
