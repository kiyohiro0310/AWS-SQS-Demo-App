import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'React + NestJS + AWS SQS demo API is running.';
  }
}
