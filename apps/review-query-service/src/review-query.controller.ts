import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ReviewQueryService } from './review-query.service';
import { AuthenticatedRequest } from '@app/shared';

@Controller()
export class ReviewQueryController {
  constructor(private readonly reviewQueryService: ReviewQueryService) {}

  @Get('repositories')
  getRepositories(@Req() req: AuthenticatedRequest) {
    return this.reviewQueryService.getRepositories(req.user.sub);
  }

  @Get('repositories/:id/pull-requests')
  getPullRequests(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewQueryService.getPullRequests(id, req.user.sub);
  }

  @Get('pull-requests/:prId/review')
  getReview(@Param('prId') prId: string) {
    return this.reviewQueryService.getReview(prId);
  }

  @Get('repositories/:id/stats')
  getRepositoryStats(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewQueryService.getRepositoryStats(id, req.user.sub);
  }
}