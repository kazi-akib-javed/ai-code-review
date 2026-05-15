import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class TokenService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
    });
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const hash = this.hashToken(token);
    const key = `refresh_token:${userId}`;
    await this.redis.setex(key, this.REFRESH_TOKEN_TTL, hash);
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const hash = this.hashToken(token);
    const key = `refresh_token:${userId}`;
    const stored = await this.redis.get(key);
    return stored === hash;
  }

  async revokeRefreshToken(userId: string): Promise<void> {
    const key = `refresh_token:${userId}`;
    await this.redis.del(key);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}