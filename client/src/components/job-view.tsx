import { Link } from '@tanstack/react-router'
import {
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table'
import { Badge, HStack, Stack, Table, Text } from '@astryxdesign/core'
import type { Job, JobSortBy, SortOrder } from '../lib/types'

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
    : '—'
const duration = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString()} s`

const features = tableFeatures({
  rowSortingFeature,
})
const helper = createColumnHelper<typeof features, Job>()
const columns = helper.columns([
  helper.accessor('id', { header: 'Job' }),
  helper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  helper.accessor('totalStages', { header: 'Stages' }),
  helper.accessor('totalTime', {
    header: 'Total time',
    cell: (info) => duration(info.getValue()),
  }),
  helper.accessor('updatedAt', {
    header: 'Updated',
    cell: (info) => date(info.getValue()),
  }),
  helper.display({
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    cell: (info) => (
      <Link to="/jobs/$jobId" params={{ jobId: info.row.original.id }}>
        View details
      </Link>
    ),
  }),
])

export function JobTable({
  jobs,
  sortBy,
  sortOrder,
  onSortChange,
}: {
  jobs: Job[]
  sortBy?: JobSortBy
  sortOrder?: SortOrder
  onSortChange: (sortBy?: JobSortBy, sortOrder?: SortOrder) => void
}) {
  const table = useTable({
    features,
    data: jobs,
    columns,
    state: {
      sorting: sortBy ? [{ id: sortBy, desc: sortOrder === 'desc' }] : [],
    },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(table.state.sorting) : updater
      const sorting = next.at(0)
      if (!sorting) return onSortChange()
      onSortChange(sorting.id as JobSortBy, sorting.desc ? 'desc' : 'asc')
    },
  })

  return (
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
  )
}

export function JobFacts({ job }: { job: Job }) {
  return (
    <dl className="facts">
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={job.status} />
        </dd>
      </div>
      <div>
        <dt>Stages</dt>
        <dd>{job.totalStages}</dd>
      </div>
      <div>
        <dt>Total time</dt>
        <dd>{duration(job.totalTime)}</dd>
      </div>
      <div>
        <dt>Failure stage</dt>
        <dd>{job.failStage === null ? 'None' : job.failStage}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{date(job.createdAt)}</dd>
      </div>
      <div>
        <dt>Updated</dt>
        <dd>{date(job.updatedAt)}</dd>
      </div>
      <div>
        <dt>Completed</dt>
        <dd>{date(job.completedAt)}</dd>
      </div>
    </dl>
  )
}

export function JobCard({ job }: { job: Job }) {
  return (
    <article className="job-card">
      <Stack gap={3}>
        <HStack justify="between" align="start">
          <div>
            <Text type="supporting">Job</Text>
            <h2>{job.id}</h2>
          </div>
          <StatusBadge status={job.status} />
        </HStack>
        <Text display="block">
          {job.totalStages} stages over {duration(job.totalTime)}
        </Text>
        <Text type="supporting" display="block">
          Updated {date(job.updatedAt)}
        </Text>
        <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
          View details →
        </Link>
      </Stack>
    </article>
  )
}

export function StatusBadge({ status }: { status: Job['status'] }) {
  const variant =
    status === 'COMPLETED'
      ? 'success'
      : status === 'FAILED'
        ? 'error'
        : status === 'ACTIVE'
          ? 'info'
          : 'neutral'
  return <Badge variant={variant} label={status.toLowerCase()} />
}

export function hasActiveJobs(jobs: Job[]) {
  return jobs.some((job) => job.status === 'PENDING' || job.status === 'ACTIVE')
}
