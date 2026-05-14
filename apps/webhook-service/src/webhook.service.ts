import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import {
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewStatus,
  PrStatus,
  RABBITMQ_QUEUES,
  ReviewRequestedDto,
} from '@app/shared';
import { GithubPullRequestWebhookDto } from './dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repositoryRepository: Repository<RepositoryEntity>,
    @InjectRepository(PullRequestEntity)
    private readonly pullRequestRepository: Repository<PullRequestEntity>,
    @InjectRepository(ReviewEntity)
    private readonly reviewRepository: Repository<ReviewEntity>,
    @Inject('RABBITMQ_CLIENT')
    private readonly rabbitClient: ClientProxy,
  ) {}

  async handlePullRequestEvent(dto: GithubPullRequestWebhookDto) {
    const allowedActions = ['opened', 'synchronize', 'reopened', 'closed'];

    if (!allowedActions.includes(dto.action)) {
      this.logger.log(`Ignoring PR action: ${dto.action}`);
      return { ignored: true };
    }

    const repo = await this.repositoryRepository.findOne({
      where: { githubRepoId: dto.repository.id.toString() },
    });

    if (!repo) {
      this.logger.warn(`Repository not found: ${dto.repository.full_name}`);
      return { ignored: true };
    }

    let pullRequest = await this.pullRequestRepository.findOne({
      where: {
        prNumber: dto.number,
        repositoryId: repo.id,
      },
    });

    if (dto.action === 'closed') {
      if (pullRequest) {
        const isMerged = dto.pull_request['merged'] === true;
        pullRequest.status = isMerged ? PrStatus.MERGED : PrStatus.CLOSED;
        await this.pullRequestRepository.save(pullRequest);
        this.logger.log(`PR #${dto.number} marked as ${pullRequest.status}`);
      }
      return { updated: true };
    }

    if (!pullRequest) {
      pullRequest = this.pullRequestRepository.create({
        prNumber: dto.number,
        title: dto.pull_request.title,
        authorUsername: dto.pull_request.user.login,
        headSha: dto.pull_request.head.sha,
        baseSha: dto.pull_request.base.sha,
        status: PrStatus.OPEN,
        repositoryId: repo.id,
      });
      await this.pullRequestRepository.save(pullRequest);
    } else {
      pullRequest.headSha = dto.pull_request.head.sha;
      pullRequest.baseSha = dto.pull_request.base.sha;
      pullRequest.status = PrStatus.OPEN;
      await this.pullRequestRepository.save(pullRequest);
    }

    const review = this.reviewRepository.create({
      status: ReviewStatus.PENDING,
      pullRequestId: pullRequest.id,
    });
    await this.reviewRepository.save(review);

    const message: ReviewRequestedDto = {
      reviewId: review.id,
      prNumber: dto.number,
      repoFullName: dto.repository.full_name,
      installationId: dto.installation.id.toString(),
      headSha: dto.pull_request.head.sha,
      baseSha: dto.pull_request.base.sha,
      prTitle: dto.pull_request.title,
      authorUsername: dto.pull_request.user.login,
    };

    this.rabbitClient.emit(RABBITMQ_QUEUES.REVIEW_REQUESTED, message);
    this.logger.log(
      `Review requested for PR #${dto.number} in ${dto.repository.full_name}`,
    );

    return { reviewId: review.id };
  }
}
