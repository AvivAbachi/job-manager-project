import { ApiError } from './types'
import type { CreateJobInput, Job } from './types'

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
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError(
      'The server could not be reached. Check your connection and retry.',
      null,
      'network',
      init?.method === 'POST',
    )
  }

  if (!response.ok) {
    if (response.status === 401) onUnauthorized?.()
    const kind = errorKind(response.status)
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
    throw new ApiError(fallback, response.status, kind)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const jobsApi = {
  list: () => request<Job[]>('/job'),
  detail: (id: string) => request<Job>(`/job/${encodeURIComponent(id)}`),
  all: () => request<Job[]>('/job/all'),
  create: (input: CreateJobInput, idempotencyKey: string) =>
    request<Job>('/job', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(input),
    }),
}
