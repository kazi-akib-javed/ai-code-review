import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewStatus,
} from '@app/shared';

const mockRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockPullRequestRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockReviewRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockRabbitClient = {
  emit: jest.fn(),
};

const mockWebhookPayload = {
  action: 'opened',
  number: 1,
  pull_request: {
    title: 'feat: add new feature',
    head: { sha: 'abc123' },
    base: { sha: 'def456' },
    user: { login: 'testuser' },
  },
  repository: {
    full_name: 'testuser/testrepo',
    id: 123,
  },
  installation: {
    id: 456,
  },
};

describe('WebhookService', () => {
  let service: WebhookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(PullRequestEntity),
          useValue: mockPullRequestRepo,
        },
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: mockReviewRepo,
        },
        {
          provide: 'RABBITMQ_CLIENT',
          useValue: mockRabbitClient,
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('handlePullRequestEvent', () => {
    it('should ignore non-relevant PR actions', async () => {
      const result = await service.handlePullRequestEvent({
        ...mockWebhookPayload,
        action: 'labeled',
      });
      expect(result).toEqual({ ignored: true });
    });

    it('should ignore PRs from unregistered repositories', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      const result = await service.handlePullRequestEvent(mockWebhookPayload);
      expect(result).toEqual({ ignored: true });
    });

    it('should create PR and review then emit to RabbitMQ', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'repo-1' });
      mockPullRequestRepo.findOne.mockResolvedValue(null);
      mockPullRequestRepo.create.mockReturnValue({ id: 'pr-1', prNumber: 1 });
      mockPullRequestRepo.save.mockResolvedValue({ id: 'pr-1', prNumber: 1 });
      mockReviewRepo.create.mockReturnValue({
        id: 'review-1',
        status: ReviewStatus.PENDING,
      });
      mockReviewRepo.save.mockResolvedValue({
        id: 'review-1',
        status: ReviewStatus.PENDING,
      });

      const result = await service.handlePullRequestEvent(mockWebhookPayload);

      expect(result).toEqual({ reviewId: 'review-1' });
      expect(mockRabbitClient.emit).toHaveBeenCalledTimes(1);
    });

    it('should update existing PR head sha on synchronize', async () => {
      mockRepo.findOne.mockResolvedValue({ id: 'repo-1' });
      mockPullRequestRepo.findOne.mockResolvedValue({
        id: 'pr-1',
        prNumber: 1,
        headSha: 'old-sha',
        baseSha: 'base-sha',
      });
      mockPullRequestRepo.save.mockResolvedValue({ id: 'pr-1' });
      mockReviewRepo.create.mockReturnValue({ id: 'review-1' });
      mockReviewRepo.save.mockResolvedValue({ id: 'review-1' });

      await service.handlePullRequestEvent({
        ...mockWebhookPayload,
        action: 'synchronize',
      });

      expect(mockPullRequestRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ headSha: 'abc123' }),
      );
    });
  });
});