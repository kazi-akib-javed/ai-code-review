'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import api from '@/lib/axios';
import { PullRequest, RepositoryStats } from '@/types';
import { useReviewSocket } from '@/hooks/useReviewSocket';

export default function RepositoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [processingPrs, setProcessingPrs] = useState<number[]>([]);

  const { data: pullRequests, isLoading, refetch } = useQuery({
    queryKey: ['pull-requests', id],
    queryFn: async () => {
      const response = await api.get<PullRequest[]>(
        `/repositories/${id}/pull-requests`,
      );
      return response.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['stats', id],
    queryFn: async () => {
      const response = await api.get<RepositoryStats>(
        `/repositories/${id}/stats`,
      );
      return response.data;
    },
  });

  const onReviewCompleted = useCallback(() => {
    refetch();
    setProcessingPrs([]);
  }, [refetch]);

  const onReviewStarted = useCallback((data: { prNumber: number }) => {
    setProcessingPrs((prev) => [...prev, data.prNumber]);
  }, []);

  const repoFullName = pullRequests?.[0]?.repository?.fullName ?? null;

  useReviewSocket(repoFullName, onReviewCompleted, onReviewStarted);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pull Requests</h2>
        <p className="text-gray-600 mt-1">AI reviews for your pull requests</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Total reviews</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.totalReviews}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Total comments</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {stats.totalComments}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500">Issues found</p>
            <div className="flex gap-2 mt-2">
              {stats.commentsBySeverity.map((s) => (
                <span
                  key={s.severity}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    s.severity === 'error'
                      ? 'bg-red-100 text-red-700'
                      : s.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {s.severity}: {s.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {pullRequests?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No pull requests found.</p>
          <p className="text-gray-400 text-sm mt-1">
            Open a PR on this repository to trigger an AI review.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pullRequests?.map((pr) => (
            <Link
              key={pr.id}
              href={`/pull-requests/${pr.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">#{pr.prNumber}</span>
                    <p className="font-semibold text-gray-900">{pr.title}</p>
                    {processingPrs.includes(pr.prNumber) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                        Reviewing...
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    by {pr.authorUsername}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    pr.status === 'open'
                      ? 'bg-green-100 text-green-700'
                      : pr.status === 'merged'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {pr.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}