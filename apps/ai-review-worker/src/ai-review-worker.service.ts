import { Injectable } from '@nestjs/common';

@Injectable()
export class AiReviewWorkerService {
  getHello(): string {
    return 'Hello World!';
  }
}
