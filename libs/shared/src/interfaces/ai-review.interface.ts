import { ReviewCommentDto } from "../dto";


export interface IAIReviewService {
    reviewDiff(
      diff: string,
      prTitle: string,
      repoFullName: string,
    ): Promise<{ comments: ReviewCommentDto[]; summary: string }>;
  }

export const AI_REVIEW_SERVICE = 'AI_REVIEW_SERVICE';