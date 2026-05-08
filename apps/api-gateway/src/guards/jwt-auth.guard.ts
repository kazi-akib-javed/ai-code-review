import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { Request } from 'express';
  
  @Injectable()
  export class JwtAuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    canActivate(context: ExecutionContext): boolean {
      const req = context.switchToHttp().getRequest<Request>();
      const token = this.extractToken(req);
  
      if (!token) {
        throw new UnauthorizedException('Missing access token');
      }
  
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_ACCESS_SECRET'),
        });
        req['user'] = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  
    private extractToken(req: Request): string | null {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }
      return null;
    }
  }