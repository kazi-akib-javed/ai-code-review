'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import api from '@/lib/axios';
import { PullRequest, RepositoryStats } from '@/types';
import { useReviewSocket } from '@/hooks/useReviewSocket';

const STATUS_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Merged', value: 'merged' },
  { label: 'Closed', value: 'closed' },
] as const;

type StatusFilter = 'all' | 'open' | 'merged' | 'closed';

const statusColors: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  merged: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
};

export default function RepositoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [processingPrs, setProcessingPrs] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const {
    data: pullRequests,
    isLoading,
    refetch,
  } = useQuery({
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

  const filtered =
    pullRequests?.filter((pr) =>
      activeTab === 'all' ? true : pr.status === activeTab,
    ) ?? [];

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <div className="flex gap-2 mt-2 flex-wrap">
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

      <div className="flex gap-1 border-b border-gray-200">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? (pullRequests?.length ?? 0)
              : (pullRequests?.filter((pr) => pr.status === tab.value).length ??
                0);
          return (
            <button
              key={tab.value}
              onClick={() => {
                setActiveTab(tab.value);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">
            No {activeTab === 'all' ? '' : activeTab} pull requests found.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((pr) => (
            <Link
              key={pr.id}
              href={`/pull-requests/${pr.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">
                      #{pr.prNumber}
                    </span>
                    <p className="font-semibold text-gray-900">{pr.title}</p>
                    {processingPrs.includes(pr.prNumber) && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 animate-pulse">
                        Reviewing...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">
                      by {pr.authorUsername}
                    </span>
                    {pr.reviewCount > 0 && (
                      <span className="text-xs text-gray-400">
                        {pr.reviewCount} review{pr.reviewCount > 1 ? 's' : ''}
                      </span>
                    )}
                    {pr.latestReviewStatus && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          pr.latestReviewStatus === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : pr.latestReviewStatus === 'failed'
                              ? 'bg-red-100 text-red-700'
                              : pr.latestReviewStatus === 'in_progress'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pr.latestReviewStatus === 'completed'
                          ? `✓ ${pr.latestReviewComments} comment${pr.latestReviewComments !== 1 ? 's' : ''}`
                          : pr.latestReviewStatus}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[pr.status] || 'bg-gray-100 text-gray-600'}`}
                >
                  {pr.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 text-sm font-medium rounded-lg ${
                  page === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
