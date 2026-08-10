export type JobStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED'
export type JobSortBy = 'id' | 'status' | 'totalStages' | 'totalTime' | 'updatedAt'
export type SortOrder = 'asc' | 'desc'

export interface JobListParams {
  status?: JobStatus
  sortBy?: JobSortBy
  sortOrder?: SortOrder
}

export interface Job {
  id: string
  key?: string
  userId: string
  failStage: number | null
  totalTime: number
  totalStages: number
  status: JobStatus
  progress: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export interface JobList {
  jobs: Job[]
  total: Record<JobStatus, number>
}

export interface CreateJobInput {
  totalStages: number
  totalTime: number
  failStage: number | null
}

export type SessionRole = 'admin' | 'user'

export interface SessionUser {
  id: string
  name: string
  email: string
  role?: SessionRole | string | null
}

export interface AppSession {
  user: SessionUser
  session: { id: string; expiresAt: string | Date }
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role?: string | null
  banned: boolean | null
  banReason?: string | null
  banExpires?: string | null
}

export interface AdminUserList {
  users: AdminUser[]
  total: number
}

export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'conflict'
  | 'validation'
  | 'network'
  | 'unknown'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null,
    public readonly kind: ApiErrorKind,
    public readonly uncertain = false,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
