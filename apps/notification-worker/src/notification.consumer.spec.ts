import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { ReviewGateway } from './gateways/review.gateway';

const mockReviewGateway = {
  emitReviewCompleted: jest.fn(),
  emitReviewStarted: jest.fn(),
};

const mockReviewCompletedDto = {
  reviewId: 'review-1',
  prNumber: 1,
  repoFullName: 'testuser/testrepo',
  comments: [
    {
      filePath: 'src/app.ts',
      line: 10,
      body: 'Consider adding error handling',
      severity: 'warning',
    },
  ],
  summary: 'Looks good overall',
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: ReviewGateway,
          useValue: mockReviewGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('handleReviewCompleted', () => {
    it('should emit review-completed event via Socket.io gateway', async () => {
      await service.handleReviewCompleted(mockReviewCompletedDto);

      expect(mockReviewGateway.emitReviewCompleted).toHaveBeenCalledTimes(1);
      expect(mockReviewGateway.emitReviewCompleted).toHaveBeenCalledWith(
        mockReviewCompletedDto,
      );
    });

    it('should emit to correct repo room', async () => {
      await service.handleReviewCompleted(mockReviewCompletedDto);

      expect(mockReviewGateway.emitReviewCompleted).toHaveBeenCalledWith(
        expect.objectContaining({
          repoFullName: 'testuser/testrepo',
        }),
      );
    });
  });
});