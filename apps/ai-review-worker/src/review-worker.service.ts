import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReviewEntity,
  ReviewCommentEntity,
  ReviewStatus,
  ReviewRequestedDto,
  ReviewCompletedDto,
  RABBITMQ_QUEUES,
} from '@app/shared';
import { ClaudeService } from './services/claude.service';
import { GithubService } from './services/github.service';

@Injectable()
export class ReviewWorkerService {
  private readonly logger = new Logger(ReviewWorkerService.name);

  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ReviewCommentEntity)
    private readonly commentRepository: Repository<ReviewCommentEntity>,
    private readonly claudeService: ClaudeService,
    private readonly githubService: GithubService,
  ) {}

  async processReview(dto: ReviewRequestedDto): Promise<ReviewCompletedDto> {
    this.logger.log(`Processing review for PR #${dto.prNumber} in ${dto.repoFullName}`);

    const review = await this.reviewRepository.findOne({
      where: { id: dto.reviewId },
    });

    if (!review) {
      throw new Error(`No pending review found for PR #${dto.prNumber}`);
    }

    review.status = ReviewStatus.IN_PROGRESS;
    review.processingStartedAt = new Date();
    await this.reviewRepository.save(review);

    try {
      const diff = await this.githubService.getPullRequestDiff(
        dto.repoFullName,
        dto.prNumber,
        dto.installationId,
      );

      const { comments, summary } = await this.claudeService.reviewDiff(
        diff,
        dto.prTitle,
        dto.repoFullName,
      );

      const savedComments = await Promise.all(
        comments.map((c) => {
          const comment = this.commentRepository.create({
            filePath: c.filePath,
            line: c.line,
            body: c.body,
            severity: c.severity,
            reviewId: review.id,
          });
          return this.commentRepository.save(comment);
        }),
      );

      review.status = ReviewStatus.COMPLETED;
      review.summary = summary;
      review.processingCompletedAt = new Date();
      await this.reviewRepository.save(review);

      this.logger.log(`Review completed for PR #${dto.prNumber}`);

      return {
        reviewId: review.id,
        prNumber: dto.prNumber,
        repoFullName: dto.repoFullName,
        comments,
        summary,
      };
    } catch (error) {
      this.logger.error(`Review failed for PR #${dto.prNumber}`, error.stack);
      review.status = ReviewStatus.FAILED;
      await this.reviewRepository.save(review);
      throw error;
    }
  }
}