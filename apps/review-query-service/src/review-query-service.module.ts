import { Module } from '@nestjs/common';
import { ReviewQueryServiceController } from './review-query-service.controller';
import { ReviewQueryServiceService } from './review-query-service.service';

@Module({
  imports: [],
  controllers: [ReviewQueryServiceController],
  providers: [ReviewQueryServiceService],
})
export class ReviewQueryServiceModule {}
