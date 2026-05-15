import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AuthModule } from './auth.module';
import * as cookieParser from 'cookie-parser';
import { validateEnv } from './validate-env';

const logger = new Logger('Bootstrap');

async function bootstrap() {
  try {
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
    logger.log(`Auth service running on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start auth service: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
