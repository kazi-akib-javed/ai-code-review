import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { WebhookModule } from './webhook.module';

async function bootstrap() {
  const app = await NestFactory.create(WebhookModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1' ,{
    exclude: ['metrics'],
  });

  const port = process.env.WEBHOOK_SERVICE_PORT || 3002;
  await app.listen(port);
  console.log(`Webhook service running on port ${port}`);
}

bootstrap();