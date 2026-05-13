import {
    Controller,
    Get,
    Query,
    Req,
    Res,
    UnauthorizedException,
  } from '@nestjs/common';
  import { Response, Request } from 'express';
  import { GithubCallbackService } from './github-callback.service';
  
  @Controller('github')
  export class GithubCallbackController {
    constructor(
      private readonly githubCallbackService: GithubCallbackService,
    ) {}
  
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
        process.env.GITHUB_APP_CALLBACK_URL?.replace(
          '/github/callback',
          '/repositories',
        ) || 'http://localhost:3006/repositories';
  
      return res.redirect(frontendUrl);
    }
  }