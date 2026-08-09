import { Link } from '@tanstack/react-router'
import type { Job } from '../lib/types'
import { StatusBadge } from './ui'

const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '—'
const duration = (ms: number) =>
  ms < 1000 ? `${ms} ms` : `${(ms / 1000).toLocaleString()} s`

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
        <dt>Failure attempted</dt>
        <dd>{job.failAttempted ?? '—'}</dd>
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
    <article className="surface job-card">
      <div className="row">
        <div>
          <p className="eyebrow">Job</p>
          <h2>{job.id}</h2>
        </div>
        <StatusBadge status={job.status} />
      </div>
      <p>
        {job.totalStages} stages over {duration(job.totalTime)}
      </p>
      <p className="muted">Updated {date(job.updatedAt)}</p>
      <Link className="text-link" to="/jobs/$jobId" params={{ jobId: job.id }}>
        View details →
      </Link>
    </article>
  )
}

export function hasActiveJobs(jobs: Job[]) {
  return jobs.some((job) => job.status === 'PENDING' || job.status === 'ACTIVE')
}
