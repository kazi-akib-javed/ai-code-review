import { Test, TestingModule } from '@nestjs/testing';
import { AiReviewWorkerController } from './ai-review-worker.controller';
import { AiReviewWorkerService } from './ai-review-worker.service';

describe('AiReviewWorkerController', () => {
  let aiReviewWorkerController: AiReviewWorkerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AiReviewWorkerController],
      providers: [AiReviewWorkerService],
    }).compile();

    aiReviewWorkerController = app.get<AiReviewWorkerController>(AiReviewWorkerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(aiReviewWorkerController.getHello()).toBe('Hello World!');
    });
  });
});
