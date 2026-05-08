import { Injectable, Logger, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  private readonly services: Record<string, string>;

  constructor(private readonly configService: ConfigService) {
    this.services = {
      auth: `http://localhost:${configService.get('AUTH_SERVICE_PORT') || 3001}`,
      webhook: `http://localhost:${configService.get('WEBHOOK_SERVICE_PORT') || 3002}`,
      reviewQuery: `http://localhost:${configService.get('REVIEW_QUERY_SERVICE_PORT') || 3003}`,
    };
  }

  async forward(
    service: keyof typeof this.services,
    path: string,
    method: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<unknown> {
    const url = `${this.services[service]}/api/v1/${path}`;
    this.logger.log(`Forwarding ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new HttpException(data, response.status);
    }

    return data;
  }
}