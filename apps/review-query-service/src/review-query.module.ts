import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewQueryController } from './review-query.controller';
import { ReviewQueryService } from './review-query.service';
import {
  UserEntity,
  RepositoryEntity,
  PullRequestEntity,
  ReviewEntity,
  ReviewCommentEntity,
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
    TypeOrmModule.forFeature([
      RepositoryEntity,
      PullRequestEntity,
      ReviewEntity,
      ReviewCommentEntity,
    ]),
  ],
  controllers: [ReviewQueryController],
  providers: [ReviewQueryService],
})
export class ReviewQueryModule {}