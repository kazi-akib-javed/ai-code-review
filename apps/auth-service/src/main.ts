import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import * as cookieParser from 'cookie-parser';
import { validateEnv } from './validate-env';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AuthModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // false because GitHub webhook payloads contain many extra fields
      // that don't map to our DTOs — setting true would reject valid webhooks
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: ['metrics'],
  });

  const port = process.env.AUTH_SERVICE_PORT || 3001;
  await app.listen(port);
  console.log(`Auth service running on port ${port}`);
}

bootstrap();
