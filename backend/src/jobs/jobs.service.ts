import { Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { SqsService } from './sqs.service';

@Injectable()
export class JobsService {
  constructor(private readonly sqsService: SqsService) {}

  async createJob(createJobDto: CreateJobDto) {
    return this.sqsService.enqueueJob(createJobDto);
  }

  getQueueSnapshot() {
    return this.sqsService.getQueueSnapshot();
  }
}
