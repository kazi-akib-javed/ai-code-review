import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { NotificationService } from './notification.service';
import { RABBITMQ_QUEUES, ReviewCompletedDto } from '@app/shared';

@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(RABBITMQ_QUEUES.REVIEW_COMPLETED)
  async handleReviewCompleted(
    @Payload() data: ReviewCompletedDto,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      await this.notificationService.handleReviewCompleted(data);
      channel.ack(originalMsg);
      this.logger.log(`Notification sent for PR #${data.prNumber}`);
    } catch (error) {
      this.logger.error(
        `Notification failed for PR #${data.prNumber}`,
        error.stack,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}