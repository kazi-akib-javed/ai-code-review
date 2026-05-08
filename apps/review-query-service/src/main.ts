import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ReviewQueryModule } from './review-query.module';

async function bootstrap() {
  const app = await NestFactory.create(ReviewQueryModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const port = process.env.REVIEW_QUERY_SERVICE_PORT || 3003;
  await app.listen(port);
  console.log(`Review query service running on port ${port}`);
}

bootstrap();