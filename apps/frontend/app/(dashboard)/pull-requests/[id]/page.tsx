'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import api from '@/lib/axios';
import { Review, ReviewComment } from '@/types';
import { useReviewSocket } from '@/hooks/useReviewSocket';

const severityColors: Record<string, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const severityBadge: Record<string, string> = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

const SEVERITY_FILTERS = ['all', 'error', 'warning', 'info'] as const;
type SeverityFilter = typeof SEVERITY_FILTERS[number];

function ReviewCard({
  review,
  index,
  isLatest,
}: {
  review: Review;
  index: number;
  isLatest: boolean;
}) {
  const [expanded, setExpanded] = useState(isLatest);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  const allComments = review.comments ?? [];
  const filteredComments = allComments.filter((c) =>
    severityFilter === 'all' ? true : c.severity === severityFilter,
  );

  const errorCount = allComments.filter((c) => c.severity === 'error').length;
  const warningCount = allComments.filter((c) => c.severity === 'warning').length;
  const infoCount = allComments.filter((c) => c.severity === 'info').length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">
            Review #{index + 1}
          </span>
          {isLatest && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              Latest
            </span>
          )}
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              review.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : review.status === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : review.status === 'failed'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {review.status}
          </span>
          {allComments.length > 0 && (
            <span className="text-xs text-gray-500">
              {errorCount > 0 && (
                <span className="text-red-600 mr-1">{errorCount} error{errorCount > 1 ? 's' : ''}</span>
              )}
              {warningCount > 0 && (
                <span className="text-yellow-600 mr-1">{warningCount} warning{warningCount > 1 ? 's' : ''}</span>
              )}
              {infoCount > 0 && (
                <span className="text-blue-600">{infoCount} suggestion{infoCount > 1 ? 's' : ''}</span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {review.processingCompletedAt && (
            <span className="text-xs text-gray-400">
              {new Date(review.processingCompletedAt).toLocaleString()}
            </span>
          )}
          <span className="text-gray-400 text-sm">
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-100">
          {review.summary && (
            <div className="pt-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Summary</p>
              <p className="text-gray-600 leading-relaxed text-sm">{review.summary}</p>
            </div>
          )}

          {allComments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Comments ({allComments.length})
                </p>
                <div className="flex gap-1">
                  {SEVERITY_FILTERS.map((f) => {
                    const count = f === 'all' ? allComments.length
                      : f === 'error' ? errorCount
                      : f === 'warning' ? warningCount
                      : infoCount;
                    return (
                      <button
                        key={f}
                        onClick={() => setSeverityFilter(f)}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                          severityFilter === f
                            ? f === 'error' ? 'bg-red-600 text-white'
                              : f === 'warning' ? 'bg-yellow-500 text-white'
                              : f === 'info' ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {f} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {filteredComments.map((comment: ReviewComment) => (
                <div
                  key={comment.id}
                  className={`rounded-xl border p-4 ${severityColors[comment.severity]}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs">
                      {comment.filePath}:{comment.line}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadge[comment.severity]}`}>
                      {comment.severity}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.body}</p>
                </div>
              ))}
            </div>
          )}

          {review.status === 'completed' && allComments.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <p className="text-green-700 text-sm font-medium">No issues found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();

  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ['reviews', id],
    queryFn: async () => {
      const response = await api.get<Review[]>(`/pull-requests/${id}/reviews`);
      return response.data;
    },
  });

  const onReviewCompleted = useCallback(() => {
    refetch();
  }, [refetch]);

  const onReviewStarted = useCallback(() => {
    refetch();
  }, [refetch]);

  const latestReview = reviews?.[0];

  useReviewSocket(
    latestReview?.pullRequest?.repository?.fullName ?? null,
    onReviewCompleted,
    onReviewStarted,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading reviews...</div>
      </div>
    );
  }

  if (!reviews?.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No reviews found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Review Timeline</h2>
          <p className="text-gray-600 mt-1">
            PR #{latestReview?.pullRequest?.prNumber ?? ''} —{' '}
            {latestReview?.pullRequest?.title ?? ''}
          </p>
        </div>
        <span className="text-sm text-gray-500">
          {reviews.length} review{reviews.length > 1 ? 's' : ''}
        </span>
      </div>

      {reviews.map((review, index) => (
        <ReviewCard
          key={review.id}
          review={review}
          index={reviews.length - 1 - index}
          isLatest={index === 0}
        />
      ))}
    </div>
  );
}