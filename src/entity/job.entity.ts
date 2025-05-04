export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class Job {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}
