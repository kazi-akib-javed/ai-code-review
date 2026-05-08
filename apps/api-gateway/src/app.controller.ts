import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProxyService } from './proxy/proxy.service';

@Controller()
export class AppController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('auth/register')
  async register(@Body() body: unknown, @Res() res: Response) {
    const data = await this.proxyService.forward('auth', 'auth/register', 'POST', body);
    return res.json(data);
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res() res: Response) {
    const data = await this.proxyService.forward('auth', 'auth/login', 'POST', body);
    return res.json(data);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'auth',
      'auth/refresh',
      'POST',
      {},
      { cookie: req.headers.cookie },
    );
    return res.json(data);
  }

  @Post('auth/logout')
  @HttpCode(200)
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }

  @Post('webhooks/github')
  @HttpCode(200)
  async githubWebhook(
    @Body() body: unknown,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') event: string,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'webhook',
      'webhooks/github',
      'POST',
      body,
      {
        'x-hub-signature-256': signature,
        'x-github-event': event,
      },
    );
    return res.json(data);
  }

  @Get('repositories')
  @UseGuards(JwtAuthGuard)
  async getRepositories(@Req() req: Request, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      'repositories',
      'GET',
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }

  @Get('repositories/:id/pull-requests')
  @UseGuards(JwtAuthGuard)
  async getPullRequests(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `repositories/${id}/pull-requests`,
      'GET',
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }

  @Get('pull-requests/:prId/review')
  @UseGuards(JwtAuthGuard)
  async getReview(
    @Param('prId') prId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `pull-requests/${prId}/review`,
      'GET',
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }

  @Get('repositories/:id/stats')
  @UseGuards(JwtAuthGuard)
  async getRepositoryStats(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `repositories/${id}/stats`,
      'GET',
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }
}