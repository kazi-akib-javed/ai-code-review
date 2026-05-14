import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RepositoryEntity,
  UserEntity,
  PrStatus,
  PullRequestEntity,
} from '@app/shared';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubCallbackService {
  private readonly logger = new Logger(GithubCallbackService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repositoryRepository: Repository<RepositoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(PullRequestEntity)
    private readonly pullRequestRepository: Repository<PullRequestEntity>,
    private readonly configService: ConfigService,
  ) {}

  async handleInstallation(
    installationId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(
      `Handling GitHub App installation ${installationId} for user ${userId}`,
    );

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      return;
    }

    this.logger.log(`User found: ${user.email}`);

    let repos;
    try {
      repos = await this.fetchInstallationRepos(installationId);
      this.logger.log(`Fetched ${repos.length} repos from GitHub`);
    } catch (error) {
      this.logger.error(`Failed to fetch repos: ${error.message}`);
      return;
    }

    for (const repo of repos) {
      let repoEntity = await this.repositoryRepository.findOne({
        where: { githubRepoId: repo.id.toString() },
      });

      if (!repoEntity) {
        repoEntity = this.repositoryRepository.create({
          fullName: repo.full_name,
          githubRepoId: repo.id.toString(),
          isActive: true,
          installationId,
          userId,
        });
        await this.repositoryRepository.save(repoEntity);
        this.logger.log(`Registered repository: ${repo.full_name}`);
      } else {
        this.logger.log(`Repository already exists: ${repo.full_name}`);
      }

      await this.backfillOpenPullRequests(
        repo.full_name,
        repoEntity.id,
        installationId,
      );
    }
  }

  private async fetchInstallationRepos(
    installationId: string,
  ): Promise<{ id: number; full_name: string }[]> {
    const token = await this.getInstallationToken(installationId);

    const response = await fetch(
      'https://api.github.com/installation/repositories',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.status}`);
    }

    const data = await response.json();
    return data.repositories;
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

  private async backfillOpenPullRequests(
    repoFullName: string,
    repositoryId: string,
    installationId: string,
  ): Promise<void> {
    this.logger.log(`Backfilling open PRs for ${repoFullName}`);

    try {
      const token = await this.getInstallationToken(installationId);

      const response = await fetch(
        `https://api.github.com/repos/${repoFullName}/pulls?state=open&per_page=20`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(
          `Failed to fetch PRs for ${repoFullName}: ${response.status}`,
        );
        return;
      }

      const prs = await response.json();
      this.logger.log(`Found ${prs.length} open PRs for ${repoFullName}`);

      for (const pr of prs) {
        const existing = await this.pullRequestRepository.findOne({
          where: { prNumber: pr.number, repositoryId },
        });

        if (!existing) {
          const newPr = this.pullRequestRepository.create({
            prNumber: pr.number,
            title: pr.title,
            authorUsername: pr.user.login,
            headSha: pr.head.sha,
            baseSha: pr.base.sha,
            status: PrStatus.OPEN,
            repositoryId,
          });
          await this.pullRequestRepository.save(newPr);
          this.logger.log(`Backfilled PR #${pr.number}: ${pr.title}`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to backfill PRs: ${error.message}`);
    }
  }
}
