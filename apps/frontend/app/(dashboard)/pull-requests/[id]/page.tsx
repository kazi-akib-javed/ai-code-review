'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import api from '@/lib/axios';
import { Review, ReviewComment } from '@/types';
import { useReviewSocket } from '@/hooks/useReviewSocket';

const severityColors = {
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const severityBadge = {
  error: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const [liveReview, setLiveReview] = useState<Partial<Review> | null>(null);

  const { data: review, isLoading, refetch } = useQuery({
    queryKey: ['review', id],
    queryFn: async () => {
      const response = await api.get<Review>(`/pull-requests/${id}/review`);
      return response.data;
    },
  });

  const onReviewCompleted = useCallback(
    (data: Partial<Review>) => {
      setLiveReview(data);
      refetch();
    },
    [refetch],
  );

  const onReviewStarted = useCallback(() => {
    refetch();
  }, [refetch]);

  useReviewSocket(
    review?.pullRequest?.repository?.fullName ?? null,
    onReviewCompleted,
    onReviewStarted,
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Review not found.</p>
      </div>
    );
  }

  const displayReview = liveReview || review;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Review</h2>
          <p className="text-gray-600 mt-1">
            Pull request #{review.pullRequest?.prNumber ?? ''}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
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
      </div>

      {review.status === 'in_progress' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700 text-sm">
          AI review in progress — results will appear automatically when complete.
        </div>
      )}

      {review.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-700 text-sm">
          Review is queued and will begin shortly.
        </div>
      )}

      {displayReview.summary && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
          <p className="text-gray-700 leading-relaxed">{displayReview.summary}</p>
        </div>
      )}

      {review.comments && review.comments.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">
            Comments ({review.comments.length})
          </h3>
          {review.comments.map((comment: ReviewComment) => (
            <div
              key={comment.id}
              className={`rounded-xl border p-4 ${severityColors[comment.severity]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm">
                  {comment.filePath}:{comment.line}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${severityBadge[comment.severity]}`}
                >
                  {comment.severity}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{comment.body}</p>
            </div>
          ))}
        </div>
      )}

      {review.status === 'completed' && review.comments?.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">No issues found</p>
          <p className="text-green-600 text-sm mt-1">
            The AI review found no issues with this pull request.
          </p>
        </div>
      )}
    </div>
  );
}