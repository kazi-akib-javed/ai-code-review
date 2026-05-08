import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationConsumer } from './notification.consumer';
import { NotificationService } from './notification.service';
import { ReviewGateway } from './gateways/review.gateway';
import { RABBITMQ_QUEUES } from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL')],
            queue: RABBITMQ_QUEUES.REVIEW_COMPLETED,
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [NotificationConsumer],
  providers: [NotificationService, ReviewGateway],
})
export class NotificationModule {}