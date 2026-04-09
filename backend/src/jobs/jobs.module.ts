import { Module } from '@nestjs/common';
import { JobStoreService } from './job-store.service';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { SqsService } from './sqs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobStoreService, SqsService],
})
export class JobsModule {}
