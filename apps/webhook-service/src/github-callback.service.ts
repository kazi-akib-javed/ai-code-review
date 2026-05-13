import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryEntity, UserEntity } from '@app/shared';

@Injectable()
export class GithubCallbackService {
  private readonly logger = new Logger(GithubCallbackService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repositoryRepository: Repository<RepositoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
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
      repos = await this.fetchInstallationRepos(installationId, user);
      this.logger.log(`Fetched ${repos.length} repos from GitHub`);
    } catch (error) {
      this.logger.error(`Failed to fetch repos: ${error.message}`);
      return;
    }

    for (const repo of repos) {
      const existing = await this.repositoryRepository.findOne({
        where: { githubRepoId: repo.id.toString() },
      });

      if (!existing) {
        const newRepo = this.repositoryRepository.create({
          fullName: repo.full_name,
          githubRepoId: repo.id.toString(),
          isActive: true,
          installationId,
          userId,
        });
        await this.repositoryRepository.save(newRepo);
        this.logger.log(`Registered repository: ${repo.full_name}`);
      } else {
        this.logger.log(`Repository already exists: ${repo.full_name}`);
      }
    }
  }

  private async fetchInstallationRepos(
    installationId: string,
    user: UserEntity,
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
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

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
