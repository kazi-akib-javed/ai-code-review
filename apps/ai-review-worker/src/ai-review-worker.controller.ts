import { Controller, Get } from '@nestjs/common';
import { AiReviewWorkerService } from './ai-review-worker.service';

@Controller()
export class AiReviewWorkerController {
  constructor(private readonly aiReviewWorkerService: AiReviewWorkerService) {}

  @Get()
  getHello(): string {
    return this.aiReviewWorkerService.getHello();
  }
}
