'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/axios';
import { Repository } from '@/types';

export default function DashboardPage() {
  const { data: repositories, isLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const response = await api.get<Repository[]>('/repositories');
      return response.data;
    },
  });

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
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">Overview of your repositories and reviews</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Total repositories</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {repositories?.length ?? 0}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Repositories</h3>
          <Link
            href="/repositories"
            className="text-sm text-blue-600 hover:underline"
          >
            View all
          </Link>
        </div>

        {repositories?.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No repositories connected yet.</p>
            <p className="text-gray-400 text-sm mt-1">
              Install the GitHub App to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {repositories?.map((repo) => (
              <Link
                key={repo.id}
                href={`/repositories/${repo.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{repo.fullName}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      repo.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {repo.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}