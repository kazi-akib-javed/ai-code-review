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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ProxyService } from './proxy/proxy.service';
import { ConfigService } from '@nestjs/config';

@Controller()
@ApiTags('Auth')
export class AppController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly configService: ConfigService,
  ) {}

  @Post('auth/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'password123',
        name: 'John Doe',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() body: unknown, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'auth',
      'auth/register',
      'POST',
      null,
      body,
    );
    return res.json(data);
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'password123',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: unknown, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'auth',
      'auth/login',
      'POST',
      null,
      body,
    );
    return res.json(data);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'auth',
      'auth/refresh',
      'POST',
      req,
    );
    return res.json(data);
  }

  @Post('auth/logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }

  @Get('github/callback')
  @ApiTags('GitHub')
  @ApiOperation({ summary: 'Handle GitHub App installation callback' })
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const url = new URL(
      req.url,
      `http://localhost:${this.configService.get<string>('API_GATEWAY_PORT') || 3000}`,
    );
    const installationId = url.searchParams.get('installation_id');
    const setupAction = url.searchParams.get('setup_action');
    const userId = url.searchParams.get('state');

    if (installationId && userId && setupAction === 'install') {
      try {
        const resp = await fetch(
          `http://localhost:${this.configService.get<string>('WEBHOOK_SERVICE_PORT') || 3002}/api/v1/github/callback?installation_id=${installationId}&setup_action=${setupAction}`,
          {
            headers: {
              'x-user-id': userId,
              'x-internal-secret':
                this.configService.get('INTERNAL_SERVICE_SECRET') || '',
            },
          },
        );
        const text = await resp.text();
        console.log('Webhook callback status:', resp.status, text);
      } catch (error) {
        console.error('Callback error:', error.message);
      }
    }

    return res.redirect(
      `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3006'}/repositories`,
    );
  }

  @Post('webhooks/github')
  @HttpCode(200)
  @ApiTags('Webhooks')
  @ApiOperation({ summary: 'Receive GitHub PR webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook received and queued' })
  @ApiResponse({ status: 401, description: 'Invalid GitHub signature' })
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
      null,
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
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Repositories')
  @ApiOperation({ summary: 'Get all repositories for authenticated user' })
  @ApiResponse({ status: 200, description: 'List of repositories' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRepositories(@Req() req: Request, @Res() res: Response) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      'repositories',
      'GET',
      req,
    );
    return res.json(data);
  }

  @Get('repositories/:id/pull-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Repositories')
  @ApiOperation({ summary: 'Get pull requests for a repository' })
  @ApiResponse({ status: 200, description: 'List of pull requests' })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async getPullRequests(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `repositories/${id}/pull-requests`,
      'GET',
      req,
    );
    return res.json(data);
  }

  @Get('pull-requests/:prId/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Reviews')
  @ApiOperation({ summary: 'Get AI review for a pull request' })
  @ApiResponse({ status: 200, description: 'Review with comments' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(
    @Param('prId') prId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `pull-requests/${prId}/review`,
      'GET',
      req,
    );
    return res.json(data);
  }

  @Get('repositories/:id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Repositories')
  @ApiOperation({ summary: 'Get review statistics for a repository' })
  @ApiResponse({
    status: 200,
    description: 'Repository stats with severity breakdown',
  })
  @ApiResponse({ status: 404, description: 'Repository not found' })
  async getRepositoryStats(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const data = await this.proxyService.forward(
      'reviewQuery',
      `repositories/${id}/stats`,
      'GET',
      req,
    );
    return res.json(data);
  }
}
