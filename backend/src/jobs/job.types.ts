export interface SubmittedJobRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  priority: 'low' | 'normal' | 'high';
  message: string;
  submittedAt: string;
}

export interface ProcessedJobRecord extends SubmittedJobRecord {
  receiptHandle?: string;
  processedAt: string;
}

export interface QueueSnapshot {
  configured: boolean;
  queueName?: string;
  queueUrl?: string;
  lastPolledAt?: string;
  lastError?: string;
  submittedJobs: SubmittedJobRecord[];
  processedJobs: ProcessedJobRecord[];
}
