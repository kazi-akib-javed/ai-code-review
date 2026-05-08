import { Test, TestingModule } from '@nestjs/testing';
import { ReviewQueryServiceController } from './review-query-service.controller';
import { ReviewQueryServiceService } from './review-query-service.service';

describe('ReviewQueryServiceController', () => {
  let reviewQueryServiceController: ReviewQueryServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ReviewQueryServiceController],
      providers: [ReviewQueryServiceService],
    }).compile();

    reviewQueryServiceController = app.get<ReviewQueryServiceController>(ReviewQueryServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(reviewQueryServiceController.getHello()).toBe('Hello World!');
    });
  });
});
