'use client';

import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { PullRequest } from '@/types';

function PullRequestsList() {
  const searchParams = useSearchParams();
  const repositoryId = searchParams.get('repositoryId');

  const { data: pullRequests, isLoading } = useQuery({
    queryKey: ['pull-requests', repositoryId],
    queryFn: async () => {
      const response = await api.get<PullRequest[]>(
        `/repositories/${repositoryId}/pull-requests`,
      );
      return response.data;
    },
    enabled: !!repositoryId,
  });

  if (!repositoryId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No repository selected.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {pullRequests?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No pull requests found.</p>
          <p className="text-gray-400 text-sm mt-1">
            Open a PR on your connected repository to trigger a review.
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
    </>
  );
}

export default function PullRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pull Requests</h2>
        <p className="text-gray-600 mt-1">AI reviews for your pull requests</p>
      </div>
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <PullRequestsList />
      </Suspense>
    </div>
  );
}