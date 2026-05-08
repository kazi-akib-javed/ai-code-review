import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewWorkerConsumer } from './review-worker.consumer';
import { ReviewWorkerService } from './review-worker.service';
import { ClaudeService } from './services/claude.service';
import { GithubService } from './services/github.service';
import {
  UserEntity,
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
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
        entities: [
          UserEntity,
          RepositoryEntity,
          PullRequestEntity,
          ReviewEntity,
          ReviewCommentEntity,
        ],
        synchronize: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ReviewEntity, ReviewCommentEntity]),
  ],
  controllers: [ReviewWorkerConsumer],
  providers: [ReviewWorkerService, ClaudeService, GithubService],
})
export class AiReviewWorkerModule {}