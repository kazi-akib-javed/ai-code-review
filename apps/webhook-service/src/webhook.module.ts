import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { GithubCallbackController } from './github-callback.controller';
import { GithubCallbackService } from './github-callback.service';
import {
  UserEntity,
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  RABBITMQ_QUEUES,
} from '@app/shared';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [UserEntity, RepositoryEntity, PullRequestEntity, ReviewEntity],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      UserEntity,
      RepositoryEntity,
      PullRequestEntity,
      ReviewEntity,
    ]),
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_CLIENT',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL')],
            queue: RABBITMQ_QUEUES.REVIEW_REQUESTED,
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  controllers: [WebhookController, GithubCallbackController],
  providers: [WebhookService, GithubCallbackService],
})
export class WebhookModule {}