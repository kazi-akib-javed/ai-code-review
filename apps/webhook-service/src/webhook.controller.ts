import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { GithubWebhookGuard } from './guards/github-webhook.guard';
import { GithubPullRequestWebhookDto } from './dto';

@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('github')
  @HttpCode(200)
  @UseGuards(GithubWebhookGuard)
  async handleGithubWebhook(
    @Headers('x-github-event') event: string,
    @Body() body: unknown,
  ) {
    if (event === 'pull_request') {
      return this.webhookService.handlePullRequestEvent(
        body as GithubPullRequestWebhookDto,
      );
    }

    return { ignored: true };
  }
}
