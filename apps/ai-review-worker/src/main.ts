import { NestFactory } from '@nestjs/core';
import { AiReviewWorkerModule } from './ai-review-worker.module';

async function bootstrap() {
  const app = await NestFactory.create(AiReviewWorkerModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
