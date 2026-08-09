import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  createSortedRowModel,
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { StatusBadge, Button, PageState } from '../components/ui'
import { authClient, getSession, isAdmin } from '../lib/auth'
import { jobsApi } from '../lib/api'
import { jobKeys, queryClient } from '../lib/query'
import { ApiError } from '../lib/types'
import type { Job, JobStatus } from '../lib/types'

export const Route = createFileRoute('/_app/admin')({
  beforeLoad: async () => {
    if (!isAdmin(await getSession())) throw redirect({ to: '/jobs' })
  },
  component: AdminPage,
})
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
  const query = useQuery({
    queryKey: jobKeys.admin(),
    queryFn: jobsApi.all,
    retry: false,
  })
  const data = useMemo(
    () =>
      (query.data ?? []).filter(
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
  if (query.error instanceof ApiError && query.error.kind === 'forbidden') {
    queryClient.removeQueries({ queryKey: jobKeys.admin() })
    void authClient.getSession()
    return (
      <PageState title="Administrator access denied">
        The server refused this request. Your role may have changed; sign in
        again if this persists.
      </PageState>
    )
  }
  if (query.isPending)
    return (
      <PageState title="Loading all jobs">
        Retrieving the administrator job collection…
      </PageState>
    )
  if (query.isError)
    return (
      <PageState
        title="All jobs could not be loaded"
        action={<Button onClick={() => void query.refetch()}>Retry</Button>}
      >
        {query.error.message}
      </PageState>
    )
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>All jobs</h1>
          <p>
            Inspect jobs across all owners. Backend authorization remains
            authoritative.
          </p>
        </div>
      </div>
      <div className="filters surface">
        <label>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus | '')}
          >
            <option value="">All statuses</option>
            <option>PENDING</option>
            <option>ACTIVE</option>
            <option>COMPLETED</option>
            <option>FAILED</option>
          </select>
        </label>
        <label>
          Owner ID
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Filter by owner"
          />
        </label>
        <Button
          className="secondary"
          onClick={() => {
            setStatus('')
            setOwner('')
          }}
        >
          Clear filters
        </Button>
      </div>
      {query.data.length === 0 ? (
        <PageState title="No jobs exist">
          The administrator collection is empty.
        </PageState>
      ) : data.length === 0 ? (
        <PageState title="No matching jobs">
          Clear or change the active filters.
        </PageState>
      ) : (
        <div className="table-wrap surface">
          <table>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      <button
                        className="sort-button"
                        onClick={header.column.getToggleSortingHandler()}
                      >
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
          </table>
        </div>
      )}
    </main>
  )
}
