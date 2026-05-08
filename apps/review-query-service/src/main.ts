import { NestFactory } from '@nestjs/core';
import { ReviewQueryServiceModule } from './review-query-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ReviewQueryServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
