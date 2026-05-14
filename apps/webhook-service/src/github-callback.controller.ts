import {
    Controller,
    Get,
    Query,
    Req,
    Res,
    UnauthorizedException,
    UseGuards,
  } from '@nestjs/common';
  import { Response, Request } from 'express';
  import { GithubCallbackService } from './github-callback.service';
import { InternalServiceGuard } from '@app/shared';
import { ConfigService } from '@nestjs/config';
  
  @Controller('github')
  export class GithubCallbackController {
    constructor(
      private readonly githubCallbackService: GithubCallbackService,
      private readonly configService: ConfigService,
    ) {}
  
    @UseGuards(InternalServiceGuard)
    @Get('callback')
    async handleCallback(
      @Query('installation_id') installationId: string,
      @Query('setup_action') setupAction: string,
      @Req() req: Request,
      @Res() res: Response,
    ) {
      const userId = req.headers['x-user-id'] as string;
  
      if (!userId) {
        throw new UnauthorizedException('User not authenticated');
      }
  
      if (setupAction === 'install' && installationId) {
        await this.githubCallbackService.handleInstallation(
          installationId,
          userId,
        );
      }
  
      const frontendUrl =
        this.configService.get<string>('GITHUB_APP_CALLBACK_URL')?.replace(
          '/github/callback',
          '/repositories',
        ) || 'http://localhost:3006/repositories';
  
      return res.redirect(frontendUrl);
    }
  }