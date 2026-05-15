import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
  PrStatus,
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
    const repos = await this.repositoryRepository.find({
      where: { user: { id: userId }, isActive: true },
      order: { createdAt: 'DESC' },
    });

    const enriched = await Promise.all(
      repos.map(async (repo) => {

        const totalPrs = await this.pullRequestRepository.count({
          where: { repository: { id: repo.id } },
        });

        const openPrs = await this.pullRequestRepository.count({
          where: { repository: { id: repo.id }, status: PrStatus.OPEN },
        });

        const mergedPrs = await this.pullRequestRepository.count({
          where: { repository: { id: repo.id }, status: PrStatus.MERGED },
        });

        const closedPrs = await this.pullRequestRepository.count({
          where: { repository: { id: repo.id }, status: PrStatus.CLOSED },
        });

        return {
          ...repo,
          totalPrs,
          openPrs,
          mergedPrs,
          closedPrs,
        };
      }),
    );

    return enriched;
  }

  async getPullRequests(repositoryId: string, userId: string) {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repositoryId, user: { id: userId } },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    const pullRequests = await this.pullRequestRepository.find({
      where: { repository: { id: repositoryId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const enriched = await Promise.all(
      pullRequests.map(async (pr) => {
        const reviews = await this.reviewRepository.find({
          where: { pullRequest: { id: pr.id } },
          order: { createdAt: 'DESC' },
        });

        const latestReview = reviews[0];
        const totalComments = latestReview
          ? await this.commentRepository.count({
              where: { review: { id: latestReview.id } },
            })
          : 0;

        return {
          ...pr,
          reviewCount: reviews.length,
          latestReviewStatus: latestReview?.status ?? null,
          latestReviewComments: totalComments,
        };
      }),
    );

    return enriched;
  }

  async getReview(prId: string) {
    const review = await this.reviewRepository.findOne({
      where: { pullRequest: { id: prId } },
      order: { createdAt: 'DESC' },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const comments = await this.commentRepository.find({
      where: { review: { id: review.id } },
      order: { filePath: 'ASC', line: 'ASC' },
    });

    return { ...review, comments };
  }

  async getReviews(prId: string) {
    const reviews = await this.reviewRepository.find({
      where: { pullRequest: { id: prId } },
      relations: ['pullRequest', 'pullRequest.repository'],
      order: { createdAt: 'DESC' },
    });

    if (!reviews.length) {
      throw new NotFoundException('No reviews found for this pull request');
    }

    const reviewsWithComments = await Promise.all(
      reviews.map(async (review) => {
        const comments = await this.commentRepository.find({
          where: { review: { id: review.id } },
          order: { filePath: 'ASC', line: 'ASC' },
        });
        return { ...review, comments };
      }),
    );

    return reviewsWithComments;
  }

  async getRepositoryStats(repositoryId: string, userId: string) {
    const repo = await this.repositoryRepository.findOne({
      where: { id: repositoryId, user: { id: userId } },
    });

    if (!repo) {
      throw new NotFoundException('Repository not found');
    }

    const pullRequests = await this.pullRequestRepository.find({
      where: { repository: { id: repositoryId } },
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
        'review.id = comment."reviewId" AND review."pullRequestId" IN (:...prIds)',
        { prIds },
      )
      .getCount();

    const commentsBySeverity = await this.commentRepository
      .createQueryBuilder('comment')
      .innerJoin(
        'reviews',
        'review',
        'review.id = comment."reviewId" AND review."pullRequestId" IN (:...prIds)',
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
