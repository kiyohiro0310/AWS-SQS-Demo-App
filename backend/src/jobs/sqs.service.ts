import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStoreService } from './job-store.service';
import { ProcessedJobRecord, SubmittedJobRecord } from './job.types';

@Injectable()
export class SqsService {
  private readonly logger = new Logger(SqsService.name);
  private readonly queueUrl: string | undefined;
  private readonly client: SQSClient | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly jobStore: JobStoreService,
  ) {
    this.queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
    this.client = this.createClient();
  }

  async enqueueJob(dto: CreateJobDto): Promise<SubmittedJobRecord> {
    if (!this.queueUrl || !this.client) {
      throw new ServiceUnavailableException(
        'SQS is not configured. Add AWS_SQS_QUEUE_URL and AWS credentials to backend/.env.',
      );
    }

    const job: SubmittedJobRecord = {
      id: randomUUID(),
      customerName: dto.customerName,
      customerEmail: dto.customerEmail,
      priority: dto.priority,
      message: dto.message,
      submittedAt: new Date().toISOString(),
    };

    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(job),
        MessageAttributes: {
          priority: {
            DataType: 'String',
            StringValue: job.priority,
          },
          customerEmail: {
            DataType: 'String',
            StringValue: job.customerEmail,
          },
        },
      }),
    );

    this.jobStore.addSubmittedJob(job);
    return job;
  }

  getQueueSnapshot() {
    return this.jobStore.getSnapshot({
      configured: Boolean(this.queueUrl && this.client),
      queueName: this.queueUrl?.split('/').pop(),
      queueUrl: this.queueUrl,
    });
  }

  @Interval(5000)
  async pollQueue(): Promise<void> {
    if (!this.queueUrl || !this.client) {
      return;
    }

    try {
      const response = await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: this.queueUrl,
          MaxNumberOfMessages: 5,
          WaitTimeSeconds: 1,
          MessageAttributeNames: ['All'],
        }),
      );

      const messages = response.Messages ?? [];
      const now = new Date().toISOString();

      for (const message of messages) {
        if (!message.Body || !message.ReceiptHandle) {
          continue;
        }

        const payload = JSON.parse(message.Body) as SubmittedJobRecord;
        const processedJob: ProcessedJobRecord = {
          ...payload,
          receiptHandle: message.ReceiptHandle,
          processedAt: now,
        };

        this.jobStore.addProcessedJob(processedJob);

        await this.client.send(
          new DeleteMessageCommand({
            QueueUrl: this.queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          }),
        );
      }

      this.jobStore.updatePollStatus(now);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error while polling SQS';
      this.logger.error(message);
      this.jobStore.updatePollStatus(new Date().toISOString(), message);
    }
  }

  private createClient(): SQSClient | null {
    const region = this.configService.get<string>('AWS_REGION');
    if (!region) {
      return null;
    }

    const endpoint = this.configService.get<string>('AWS_SQS_ENDPOINT');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    return new SQSClient({
      region,
      endpoint,
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : undefined,
    });
  }
}
