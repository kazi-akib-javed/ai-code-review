import { IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewCommentDto {
  @IsString()
  filePath: string;

  @IsNumber()
  line: number;

  @IsString()
  body: string;

  @IsString()
  severity: string;
}

export class ReviewCompletedDto {
  @IsString()
  reviewId: string;

  @IsString()
  prNumber: number;

  @IsString()
  repoFullName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReviewCommentDto)
  comments: ReviewCommentDto[];

  @IsString()
  summary: string;
}