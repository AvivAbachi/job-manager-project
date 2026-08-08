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

export interface UserJobsPayload {
  userId: string;
}

export interface UserJobPayload {
  id: string;
  userId: string;
}

export interface JobStatusUpdate {
  id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
}
