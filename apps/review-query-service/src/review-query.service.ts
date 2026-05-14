import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
} from '@app/shared';

@Injectable()
export class ReviewQueryService {
  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repositoryRepository: Repository<RepositoryEntity>,
    @InjectRepository(PullRequestEntity)
    private readonly pullRequestRepository: Repository<PullRequestEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @InjectRepository(ReviewCommentEntity)
    private readonly commentRepository: Repository<ReviewCommentEntity>,
  ) {}

  async getRepositories(userId: string) {
    return this.repositoryRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getPullRequests(repositoryId: string, userId: string) {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repositoryId, userId },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    return this.pullRequestRepository.find({
      where: { repositoryId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async getReview(prId: string) {
    const review = await this.reviewRepository.findOne({
      where: { pullRequestId: prId },
      order: { createdAt: 'DESC' },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const comments = await this.commentRepository.find({
      where: { reviewId: review.id },
      order: { filePath: 'ASC', line: 'ASC' },
    });

    return { ...review, comments };
  }

  async getRepositoryStats(repositoryId: string, userId: string) {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repositoryId, userId },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    const pullRequests = await this.pullRequestRepository.find({
      where: { repositoryId },
      select: ['id'],
    });

    const prIds = pullRequests.map((pr) => pr.id);

    if (prIds.length === 0) {
      return {
        repositoryId,
        totalReviews: 0,
        totalComments: 0,
        commentsBySeverity: [],
      };
    }

    const totalReviews = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review."pullRequestId" IN (:...prIds)', { prIds })
      .getCount();

    const totalComments = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin(
        'reviews',
        'review',
        'review.id::text = comment."reviewId" AND review."pullRequestId" IN (:...prIds)',
        { prIds },
      )
      .getCount();

    const commentsBySeverity = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin(
        'reviews',
        'review',
        'review.id::text = comment."reviewId" AND review."pullRequestId" IN (:...prIds)',
        { prIds },
      )
      .select('comment.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('comment.severity')
      .getRawMany();

    return {
      repositoryId,
      totalReviews,
      totalComments,
      commentsBySeverity,
    };
  }
}
