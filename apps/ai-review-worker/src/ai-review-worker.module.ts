import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { ReviewWorkerConsumer } from './review-worker.consumer';
import { ReviewWorkerService } from './review-worker.service';
import { ClaudeAIService } from './services/claude-ai.service';
import { GroqAIService } from './services/groq-ai.service';
import { GithubService } from './services/github.service';
import { MetricsController } from './metrics.controller';
import { AI_REVIEW_SERVICE } from '@app/shared';
import {
  UserEntity,
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
} from '@app/shared';
import { DiffSanitizerService } from './services/diff-sanitizer.service';

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
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ReviewEntity, ReviewCommentEntity]),
    PrometheusModule.register({
      controller: MetricsController,
    }),
  ],
  controllers: [ReviewWorkerConsumer],
  providers: [
    ReviewWorkerService,
    DiffSanitizerService,
    GithubService,
    {
      provide: AI_REVIEW_SERVICE,
      useFactory: (config: ConfigService) => {
        const provider = config.get('AI_PROVIDER') || 'claude';
        if (provider === 'groq') {
          return new GroqAIService(config);
        }
        return new ClaudeAIService(config);
      },
      inject: [ConfigService],
    },
    makeCounterProvider({
      name: 'reviews_processed_total',
      help: 'Total number of reviews processed',
      labelNames: ['status'],
    }),
    makeHistogramProvider({
      name: 'review_processing_duration_ms',
      help: 'Review processing duration in milliseconds',
      labelNames: ['status'],
      buckets: [100, 500, 1000, 3000, 5000, 10000, 30000],
    }),
    makeCounterProvider({
      name: 'claude_api_calls_total',
      help: 'Total number of AI API calls',
      labelNames: ['status', 'provider'],
    }),
    makeHistogramProvider({
      name: 'claude_api_latency_ms',
      help: 'AI API call latency in milliseconds',
      labelNames: ['provider'],
      buckets: [500, 1000, 2000, 5000, 10000, 20000],
    }),
  ],
})
export class AiReviewWorkerModule {}