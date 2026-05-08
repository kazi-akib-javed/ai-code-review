import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule);

  const port = process.env.NOTIFICATION_WORKER_PORT || 3005;
  await app.listen(port);
  console.log(`Notification worker running on port ${port}`);
}

bootstrap();