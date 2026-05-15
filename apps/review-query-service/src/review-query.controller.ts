import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReviewQueryService } from './review-query.service';
import { UserId } from './decorators/user-id.decorator';
import { InternalServiceGuard } from '@app/shared';

@Controller()
@UseGuards(InternalServiceGuard)
export class ReviewQueryController {
  constructor(private readonly reviewQueryService: ReviewQueryService) {}

  @Get('repositories')
  getRepositories(@UserId() userId: string) {
    return this.reviewQueryService.getRepositories(userId);
  }

  @Get('repositories/:id/pull-requests')
  getPullRequests(@Param('id') id: string, @UserId() userId: string) {
    return this.reviewQueryService.getPullRequests(id, userId);
  }

  @Get('pull-requests/:prId/review')
  getReview(@Param('prId') prId: string) {
    return this.reviewQueryService.getReview(prId);
  }

  @Get('pull-requests/:prId/reviews')
  getReviews(@Param('prId') prId: string) {
    return this.reviewQueryService.getReviews(prId);
  }

  @Get('repositories/:id/stats')
  getRepositoryStats(@Param('id') id: string, @UserId() userId: string) {
    return this.reviewQueryService.getRepositoryStats(id, userId);
  }
}
