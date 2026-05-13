import { IsNumber, IsString } from 'class-validator';

export class ReviewRequestedDto {
  @IsString()
  reviewId: string;

  @IsNumber()
  prNumber: number;

  @IsString()
  repoFullName: string;

  @IsString()
  installationId: string;

  @IsString()
  headSha: string;

  @IsString()
  baseSha: string;

  @IsString()
  prTitle: string;

  @IsString()
  authorUsername: string;
}