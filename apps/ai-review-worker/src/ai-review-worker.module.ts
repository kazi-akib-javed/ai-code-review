import { Module } from '@nestjs/common';
import { AiReviewWorkerController } from './ai-review-worker.controller';
import { AiReviewWorkerService } from './ai-review-worker.service';

@Module({
  imports: [],
  controllers: [AiReviewWorkerController],
  providers: [AiReviewWorkerService],
})
export class AiReviewWorkerModule {}
