import { Injectable, Logger } from '@nestjs/common';
import { ReviewCompletedDto } from '@app/shared';
import { ReviewGateway } from './gateways/review.gateway';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly reviewGateway: ReviewGateway) {}

  async handleReviewCompleted(dto: ReviewCompletedDto) {
    this.logger.log(
      `Notifying clients of completed review for PR #${dto.prNumber} in ${dto.repoFullName}`,
    );

    this.reviewGateway.emitReviewCompleted(dto);

    this.logger.log(`Review notification sent for PR #${dto.prNumber}`);
  }
}