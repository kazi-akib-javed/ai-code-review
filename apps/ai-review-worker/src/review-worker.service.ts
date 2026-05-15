import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ReviewEntity,
  ReviewCommentEntity,
  ReviewStatus,
  ReviewRequestedDto,
  ReviewCompletedDto,
} from '@app/shared';
import { AI_REVIEW_SERVICE, IAIReviewService } from '@app/shared';
import { GithubService } from './services/github.service';
import { ReviewCommentDto } from '@app/shared';
import { DiffSanitizerService } from './services/diff-sanitizer.service';

@Injectable()
export class ReviewWorkerService {
  private readonly logger = new Logger(ReviewWorkerService.name);

  constructor(
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ReviewCommentEntity)
    private readonly commentRepository: Repository<ReviewCommentEntity>,
    @Inject(AI_REVIEW_SERVICE)
    private readonly aiReviewService: IAIReviewService,
    private readonly githubService: GithubService,
    private readonly diffSanitizerService: DiffSanitizerService,
  ) {}

  async processReview(dto: ReviewRequestedDto): Promise<ReviewCompletedDto> {
    this.logger.log(
      `Processing review for PR #${dto.prNumber} in ${dto.repoFullName}`,
    );

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

      const sanitizedDiff = this.diffSanitizerService.sanitize(diff);

      const { comments, summary } = await this.aiReviewService.reviewDiff(
        sanitizedDiff,
        dto.prTitle,
        dto.repoFullName,
      );

      await Promise.all(
        comments.map((c) => {
          const comment = this.commentRepository.create({
            filePath: c.filePath,
            line: c.line,
            body: c.body,
            severity: c.severity,
            review: { id: review.id },
          });
          return this.commentRepository.save(comment);
        }),
      );

      review.status = ReviewStatus.COMPLETED;
      review.summary = summary;
      review.processingCompletedAt = new Date();
      await this.reviewRepository.save(review);

      const commentBody = this.formatReviewComment(summary, comments);
      await this.githubService.postReviewComment(
        dto.repoFullName,
        dto.prNumber,
        dto.installationId,
        commentBody,
      );
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

  private formatReviewComment(
    summary: string,
    comments: ReviewCommentDto[],
  ): string {
    const severityEmoji = {
      error: '🔴',
      warning: '🟡',
      info: '🔵',
    };

    const commentLines = comments
      .map(
        (c) =>
          `${severityEmoji[c.severity] || '🔵'} **${c.filePath}:${c.line}** — ${c.body}`,
      )
      .join('\n');

    return `## AI Code Review
  
  ${summary}
  
  ---
  
  ${commentLines.length > 0 ? `### Comments\n\n${commentLines}` : '### No issues found'}
  
  ---
  *Reviewed by AI Code Review Bot*`;
  }
}
