import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import * as crypto from 'crypto';
  
  @Injectable()
  export class GithubWebhookGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) {}
  
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest();
      const signature = req.headers['x-hub-signature-256'];
  
      if (!signature) {
        throw new UnauthorizedException('Missing GitHub signature');
      }
  
      const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');
      const payload = JSON.stringify(req.body);
      const hmac = crypto.createHmac('sha256', secret);
      const digest = 'sha256=' + hmac.update(payload).digest('hex');
  
      const signatureBuffer = Buffer.from(signature);
      const digestBuffer = Buffer.from(digest);
  
      if (
        signatureBuffer.length !== digestBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
      ) {
        throw new UnauthorizedException('Invalid GitHub signature');
      }
  
      return true;
    }
  }