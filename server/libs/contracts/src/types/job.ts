import type { JobStatus } from '../prisma/generate/enums';

export interface JobDetails {
  failStage: number | null;
  totalStages: number;
  totalTime: number;
}

export interface CreateJobPayload {
  userId: string;
  details: JobDetails;
  key: string;
}

export interface PaginationPayload {
  page: number;
  limit: number;
}

export type JobSortBy =
  'id' | 'status' | 'totalStages' | 'totalTime' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface JobListPayload extends PaginationPayload {
  status?: JobStatus;
  sortBy?: JobSortBy;
  sortOrder?: SortOrder;
}

export interface UserJobsPayload extends JobListPayload {
  userId: string;
}

export interface UserJobPayload {
  id: string;
  userId: string;
}
