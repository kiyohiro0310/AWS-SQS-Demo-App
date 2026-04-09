import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  getJobs() {
    return this.jobsService.getQueueSnapshot();
  }

  @Post()
  async createJob(@Body() createJobDto: CreateJobDto) {
    const job = await this.jobsService.createJob(createJobDto);

    return {
      message: 'Job submitted to SQS.',
      job,
    };
  }
}
