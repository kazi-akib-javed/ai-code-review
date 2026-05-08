import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);

  constructor(private readonly configService: ConfigService) {}

  async getPullRequestDiff(
    repoFullName: string,
    prNumber: number,
    installationId: string,
  ): Promise<string> {
    this.logger.log(`Fetching diff for PR #${prNumber} in ${repoFullName}`);

    const token = await this.getInstallationToken(installationId);

    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3.diff',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  async postReviewComment(
    repoFullName: string,
    prNumber: number,
    installationId: string,
    body: string,
  ): Promise<void> {
    const token = await this.getInstallationToken(installationId);

    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/issues/${prNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to post GitHub comment: ${response.status}`);
    }
  }

  private async getInstallationToken(installationId: string): Promise<string> {
    const appId = this.configService.get<string>('GITHUB_APP_ID');
    const privateKey = this.configService.get<string>('GITHUB_APP_PRIVATE_KEY');

    const jwt = await this.generateAppJwt(appId, privateKey);

    const response = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to get installation token: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  }

  private async generateAppJwt(
    appId: string,
    privateKey: string,
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    };

    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT' }),
    ).toString('base64url');

    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

    const { createSign } = await import('crypto');
    const sign = createSign('RSA-SHA256');
    sign.update(`${header}.${body}`);
    const signature = sign.sign(privateKey, 'base64url');

    return `${header}.${body}.${signature}`;
  }
}