import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';

function validateEnv() {
  const MIN_SECRET_LENGTH = 32;
  const required = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  const accessSecret = process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || accessSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_ACCESS_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  if (!refreshSecret || refreshSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_REFRESH_SECRET must be at least ${MIN_SECRET_LENGTH} characters long`,
    );
  }

  const accessBuf = Buffer.from(accessSecret);
  const refreshBuf = Buffer.from(refreshSecret);
  const same =
    accessBuf.length === refreshBuf.length &&
    crypto.timingSafeEqual(accessBuf, refreshBuf);

  if (same) {
    throw new Error(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    );
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(AuthModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
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
