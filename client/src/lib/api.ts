import ky, { HTTPError } from 'ky'
import { ApiError } from './types'
import type {
  AdminUser,
  AdminUserList,
  CreateJobInput,
  Job,
  JobList,
} from './types'

type UnauthorizedHandler = () => void
let onUnauthorized: UnauthorizedHandler | undefined

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler
}

function errorKind(status: number): ApiError['kind'] {
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not-found'
  if (status === 409) return 'conflict'
  if (status === 400 || status === 422) return 'validation'
  return 'unknown'
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await ky(path, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    if (response.status === 204) return undefined as T
    return await response.json<T>()
  } catch (error) {
    if (error instanceof HTTPError) {
      if (error.response.status === 401) onUnauthorized?.()
      const kind = errorKind(error.response.status)
      const fallback =
        kind === 'forbidden'
          ? 'You do not have access to this resource.'
          : kind === 'not-found'
            ? 'The requested job was not found or is inaccessible.'
            : kind === 'conflict'
              ? 'This request conflicts with an earlier submission.'
              : kind === 'validation'
                ? 'The server rejected the submitted values.'
                : 'The request failed. Please retry.'
      throw new ApiError(fallback, error.response.status, kind)
    }
    throw new ApiError(
      'The server could not be reached. Check your connection and retry.',
      null,
      'network',
      init?.method === 'POST',
    )
  }
}

export const jobsApi = {
  list: (page: number, limit: number) =>
    request<JobList>(`/job?page=${page}&limit=${limit}`),
  detail: (id: string) => request<Job>(`/job/${encodeURIComponent(id)}`),
  all: (page: number, limit: number) =>
    request<JobList>(`/job/all?page=${page}&limit=${limit}`),
  create: (input: CreateJobInput, idempotencyKey: string) =>
    request<Job>('/job', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }),
}

export const adminUsersApi = {
  listUsers: (
    search: string,
    searchField: 'email' | 'name',
    offset: number,
  ) => {
    const query = new URLSearchParams({ limit: '20', offset: String(offset) })
    if (search) {
      query.set('searchValue', search)
      query.set('searchField', searchField)
      query.set('searchOperator', 'contains')
    }
    return request<AdminUserList>(`/api/auth/admin/list-users?${query}`)
  },
  setRole: (userId: string, role: 'admin' | 'user') =>
    request<{ user: AdminUser }>('/api/auth/admin/set-role', {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),
  banUser: (userId: string) =>
    request<{ user: AdminUser }>('/api/auth/admin/ban-user', {
      method: 'POST',
      body: JSON.stringify({ userId, banReason: 'Administrative action' }),
    }),
  unbanUser: (userId: string) =>
    request<{ user: AdminUser }>('/api/auth/admin/unban-user', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
}
