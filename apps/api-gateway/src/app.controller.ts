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

@Controller()
@ApiTags('Auth')
export class AppController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('auth/register')
  @ApiTags('Auth')
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
    const data = await this.proxyService.forward('auth', 'auth/register', 'POST', body);
    return res.json(data);
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiTags('Auth')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      example: {
        email: 'user@example.com',
        password: 'password123',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: unknown, @Res() res: Response) {
    const data = await this.proxyService.forward('auth', 'auth/login', 'POST', body);
    return res.json(data);
  }

  @Post('auth/refresh')
  @HttpCode(200)
  @ApiTags('Auth')
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token returned' })
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
  @ApiTags('Auth')
  @ApiOperation({ summary: 'Logout and clear refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
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
      undefined,
      { authorization: req.headers.authorization },
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
      undefined,
      { authorization: req.headers.authorization },
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
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }

  @Get('repositories/:id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiTags('Repositories')
  @ApiOperation({ summary: 'Get review statistics for a repository' })
  @ApiResponse({ status: 200, description: 'Repository stats with severity breakdown' })
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
      undefined,
      { authorization: req.headers.authorization },
    );
    return res.json(data);
  }
}