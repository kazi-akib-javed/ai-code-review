import { Controller, Get } from '@nestjs/common';
import { ReviewQueryServiceService } from './review-query-service.service';

@Controller()
export class ReviewQueryServiceController {
  constructor(private readonly reviewQueryServiceService: ReviewQueryServiceService) {}

  @Get()
  getHello(): string {
    return this.reviewQueryServiceService.getHello();
  }
}
