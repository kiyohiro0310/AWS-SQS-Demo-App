import { Injectable } from '@nestjs/common';
import {
  ProcessedJobRecord,
  QueueSnapshot,
  SubmittedJobRecord,
} from './job.types';

@Injectable()
export class JobStoreService {
  private readonly submittedJobs: SubmittedJobRecord[] = [];
  private readonly processedJobs: ProcessedJobRecord[] = [];
  private lastPolledAt?: string;
  private lastError?: string;

  addSubmittedJob(job: SubmittedJobRecord): void {
    this.submittedJobs.unshift(job);
    this.submittedJobs.splice(10);
  }

  addProcessedJob(job: ProcessedJobRecord): void {
    this.processedJobs.unshift(job);
    this.processedJobs.splice(10);
  }

  updatePollStatus(lastPolledAt: string, lastError?: string): void {
    this.lastPolledAt = lastPolledAt;
    this.lastError = lastError;
  }

  getSnapshot(config: {
    configured: boolean;
    queueName?: string;
    queueUrl?: string;
  }): QueueSnapshot {
    return {
      ...config,
      lastPolledAt: this.lastPolledAt,
      lastError: this.lastError,
      submittedJobs: this.submittedJobs,
      processedJobs: this.processedJobs,
    };
  }
}
