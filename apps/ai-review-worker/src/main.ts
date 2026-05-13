import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AiReviewWorkerModule } from './ai-review-worker.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AiReviewWorkerModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
        queue: 'review.requested',
        queueOptions: { durable: true },
        noAck: false,
      },
    },
  );

  await app.listen();
  console.log('AI review worker listening on RabbitMQ');
}

bootstrap();