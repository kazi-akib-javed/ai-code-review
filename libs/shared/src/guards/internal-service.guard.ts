import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

export const INTERNAL_SECRET_TOKEN = 'INTERNAL_SECRET_TOKEN';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  constructor(
    @Inject(INTERNAL_SECRET_TOKEN) private readonly internalSecret: string,
  ) {
    if(!internalSecret) {
      throw new Error('INTERNAL_SECRET_TOKEN is not configured');
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const secret = req.headers['x-internal-secret'];

    if (!secret || secret !== this.internalSecret) {
      throw new ForbiddenException(
        'Requests must be routed through the API gateway',
      );
    }

    return true;
  }
}
