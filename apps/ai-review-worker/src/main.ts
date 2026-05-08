import { NestFactory } from '@nestjs/core';
import { AiReviewWorkerModule } from './ai-review-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(AiReviewWorkerModule);

  const port = process.env.AI_REVIEW_WORKER_PORT || 3004;
  await app.listen(port);
  console.log(`AI review worker running on port ${port}`);
}

bootstrap();