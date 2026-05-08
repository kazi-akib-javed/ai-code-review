import { Test, TestingModule } from '@nestjs/testing';
import { ReviewQueryService } from './review-query.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
  ReviewStatus,
  PrStatus,
} from '@app/shared';
import { NotFoundException } from '@nestjs/common';

const mockRepositoryRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockPullRequestRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockReviewRepo = {
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockCommentRepo = {
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('ReviewQueryService', () => {
  let service: ReviewQueryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewQueryService,
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: mockRepositoryRepo,
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
          provide: getRepositoryToken(ReviewCommentEntity),
          useValue: mockCommentRepo,
        },
      ],
    }).compile();

    service = module.get<ReviewQueryService>(ReviewQueryService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getRepositories', () => {
    it('should return repositories for a user', async () => {
      const mockRepos = [{ id: 'repo-1', fullName: 'user/repo' }];
      mockRepositoryRepo.find.mockResolvedValue(mockRepos);

      const result = await service.getRepositories('user-1');

      expect(result).toEqual(mockRepos);
      expect(mockRepositoryRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', isActive: true },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('getPullRequests', () => {
    it('should throw NotFoundException if repo not found', async () => {
      mockRepositoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.getPullRequests('repo-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return pull requests for a repository', async () => {
      mockRepositoryRepo.findOne.mockResolvedValue({ id: 'repo-1' });
      const mockPRs = [{ id: 'pr-1', prNumber: 1 }];
      mockPullRequestRepo.find.mockResolvedValue(mockPRs);

      const result = await service.getPullRequests('repo-1', 'user-1');

      expect(result).toEqual(mockPRs);
    });
  });

  describe('getReview', () => {
    it('should throw NotFoundException if review not found', async () => {
      mockReviewRepo.findOne.mockResolvedValue(null);

      await expect(service.getReview('pr-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return review with comments', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'review-1',
        status: ReviewStatus.COMPLETED,
      });
      mockCommentRepo.find.mockResolvedValue([
        { id: 'comment-1', filePath: 'src/app.ts', line: 10 },
      ]);

      const result = await service.getReview('pr-1');

      expect(result.id).toBe('review-1');
      expect(result.comments).toHaveLength(1);
    });
  });
});