import { Test, TestingModule } from '@nestjs/testing';
import { ReviewWorkerService } from './review-worker.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReviewEntity, ReviewCommentEntity, ReviewStatus } from '@app/shared';
import { ClaudeService } from './services/claude.service';
import { GithubService } from './services/github.service';

const mockReviewRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockCommentRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockClaudeService = {
  reviewDiff: jest.fn(),
};

const mockGithubService = {
  getPullRequestDiff: jest.fn(),
};

const mockReviewRequestedDto = {
  prNumber: 1,
  repoFullName: 'testuser/testrepo',
  installationId: '456',
  headSha: 'abc123',
  baseSha: 'def456',
  prTitle: 'feat: add new feature',
  authorUsername: 'testuser',
};

describe('ReviewWorkerService', () => {
  let service: ReviewWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewWorkerService,
        {
          provide: getRepositoryToken(ReviewEntity),
          useValue: mockReviewRepository,
        },
        {
          provide: getRepositoryToken(ReviewCommentEntity),
          useValue: mockCommentRepository,
        },
        {
          provide: ClaudeService,
          useValue: mockClaudeService,
        },
        {
          provide: GithubService,
          useValue: mockGithubService,
        },
      ],
    }).compile();

    service = module.get<ReviewWorkerService>(ReviewWorkerService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('processReview', () => {
    it('should throw if no pending review found', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      await expect(
        service.processReview(mockReviewRequestedDto),
      ).rejects.toThrow('No pending review found for PR #1');
    });

    it('should process review and save comments', async () => {
      const mockReview = {
        id: 'review-1',
        status: ReviewStatus.PENDING,
        processingStartedAt: null,
        processingCompletedAt: null,
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockGithubService.getPullRequestDiff.mockResolvedValue('diff content');
      mockClaudeService.reviewDiff.mockResolvedValue({
        summary: 'Looks good overall',
        comments: [
          {
            filePath: 'src/app.ts',
            line: 10,
            body: 'Consider adding error handling here',
            severity: 'warning',
          },
        ],
      });
      mockCommentRepository.create.mockReturnValue({ id: 'comment-1' });
      mockCommentRepository.save.mockResolvedValue({ id: 'comment-1' });

      const result = await service.processReview(mockReviewRequestedDto);

      expect(result.reviewId).toBe('review-1');
      expect(result.summary).toBe('Looks good overall');
      expect(result.comments).toHaveLength(1);
      expect(mockReviewRepository.save).toHaveBeenCalledTimes(2);
    });

    it('should mark review as failed on error', async () => {
      const mockReview = {
        id: 'review-1',
        status: ReviewStatus.PENDING,
        processingStartedAt: null,
      };

      mockReviewRepository.findOne.mockResolvedValue(mockReview);
      mockReviewRepository.save.mockResolvedValue(mockReview);
      mockGithubService.getPullRequestDiff.mockRejectedValue(
        new Error('GitHub API error'),
      );

      await expect(
        service.processReview(mockReviewRequestedDto),
      ).rejects.toThrow('GitHub API error');

      expect(mockReview.status).toBe(ReviewStatus.FAILED);
    });
  });
});