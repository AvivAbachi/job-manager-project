export type JobStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'FAILED'

export interface Job {
  id: string
  key?: string
  userId: string
  failAttempted: number | null
  failStage: number | null
  totalTime: number
  totalStages: number
  status: JobStatus
  createdAt: string
  updatedAt: string
  completedAt: string | null
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
