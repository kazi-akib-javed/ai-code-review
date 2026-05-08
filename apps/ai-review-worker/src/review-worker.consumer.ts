import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { ReviewWorkerService } from './review-worker.service';
import { RABBITMQ_QUEUES, ReviewRequestedDto } from '@app/shared';

@Controller()
export class ReviewWorkerConsumer {
  private readonly logger = new Logger(ReviewWorkerConsumer.name);

  constructor(private readonly reviewWorkerService: ReviewWorkerService) {}

  @EventPattern(RABBITMQ_QUEUES.REVIEW_REQUESTED)
  async handleReviewRequested(
    @Payload() data: ReviewRequestedDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.reviewWorkerService.processReview(data);
      channel.ack(originalMsg);
      this.logger.log(`Review processed for PR #${data.prNumber}`);
    } catch (error) {
      this.logger.error(`Review failed for PR #${data.prNumber}`, error.stack);
      channel.nack(originalMsg, false, false);
    }
  }
}