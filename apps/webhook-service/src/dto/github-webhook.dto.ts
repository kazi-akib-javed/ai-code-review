import { IsNumber, IsObject, IsString } from 'class-validator';

export class GithubPullRequestWebhookDto {
  @IsString()
  action: string;

  @IsNumber()
  number: number;

  @IsObject()
  pull_request: {
    title: string;
    head: { sha: string };
    base: { sha: string };
    user: { login: string };
  };

  @IsObject()
  repository: {
    full_name: string;
    id: number;
  };

  @IsObject()
  installation: {
    id: number;
  };
}