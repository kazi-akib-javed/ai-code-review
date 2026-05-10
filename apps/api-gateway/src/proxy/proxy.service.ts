import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '@app/shared';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly services: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.services = {
      auth: `http://localhost:${configService.get('AUTH_SERVICE_PORT') || 3001}`,
      webhook: `http://localhost:${configService.get('WEBHOOK_SERVICE_PORT') || 3002}`,
      reviewQuery: `http://localhost:${configService.get('REVIEW_QUERY_SERVICE_PORT') || 3003}`,
      aiWorker: `http://localhost:${configService.get('AI_REVIEW_WORKER_PORT') || 3004}`,
      notification: `http://localhost:${configService.get('NOTIFICATION_WORKER_PORT') || 3005}`,
    };
  }

  async forward(
    service: keyof typeof this.services,
    path: string,
    method: string,
    req?: Request,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<unknown> {
    const url = `${this.services[service]}/api/v1/${path}`;
    this.logger.log(`Forwarding ${method} ${url}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (req) {
      if (req.headers.authorization) {
        headers['authorization'] = req.headers.authorization;
      }
      if (req.headers.cookie) {
        headers['cookie'] = req.headers.cookie;
      }
      const user = req.user;
      if (user['sub']) {
        headers['x-user-id'] = user['sub'];
      }
    }

    if (extraHeaders) {
      Object.assign(headers, extraHeaders);
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new HttpException(data, response.status);
    }

    return data;
  }
}