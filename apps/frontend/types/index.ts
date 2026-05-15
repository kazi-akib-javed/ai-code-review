export interface User {
  userId: string;
  email: string;
  accessToken: string;
}

export interface Repository {
  id: string;
  fullName: string;
  githubRepoId: string;
  isActive: boolean;
  installationId: string;
  createdAt: string;
  totalPrs: number;
  openPrs: number;
  mergedPrs: number;
  closedPrs: number;
}

export interface PullRequest {
  id: string;
  prNumber: number;
  title: string;
  authorUsername: string;
  headSha: string;
  baseSha: string;
  status: 'open' | 'closed' | 'merged';
  repositoryId: string;
  repository?: Repository;
  createdAt: string;
  reviewCount: number;
  latestReviewStatus: 'pending' | 'in_progress' | 'completed' | 'failed' | null;
  latestReviewComments: number;
}

export interface ReviewComment {
  id: string;
  filePath: string;
  line: number;
  body: string;
  severity: 'info' | 'warning' | 'error';
  reviewId: string;
  createdAt: string;
}

export interface Review {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  summary: string;
  processingStartedAt: string;
  processingCompletedAt: string;
  pullRequestId: string;
  pullRequest?: PullRequest;
  comments: ReviewComment[];
  createdAt: string;
}

export interface RepositoryStats {
  repositoryId: string;
  totalReviews: number;
  totalComments: number;
  commentsBySeverity: {
    severity: string;
    count: string;
  }[];
}
