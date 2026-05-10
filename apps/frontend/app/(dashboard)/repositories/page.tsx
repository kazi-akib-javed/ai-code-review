'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/axios';
import { Repository } from '@/types';

export default function RepositoriesPage() {
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
        <h2 className="text-2xl font-bold text-gray-900">Repositories</h2>
        <p className="text-gray-600 mt-1">
          Manage your connected GitHub repositories
        </p>
      </div>

      {repositories?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No repositories connected
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Install the GitHub App on your repositories to start getting AI
            code reviews.
          </p>
          <a
            href="https://github.com/apps/your-app-name/installations/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium text-sm"
          >
            Install GitHub App
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {repositories?.map((repo) => (
            <Link
              key={repo.id}
              href={`/repositories/${repo.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{repo.fullName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Installation ID: {repo.installationId}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
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
  );
}