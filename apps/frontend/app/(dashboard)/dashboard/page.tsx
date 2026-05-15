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

  const totalPrs =
    repositories?.reduce((sum, r) => sum + (r.totalPrs ?? 0), 0) ?? 0;
  const openPrs =
    repositories?.reduce((sum, r) => sum + (r.openPrs ?? 0), 0) ?? 0;
  const mergedPrs =
    repositories?.reduce((sum, r) => sum + (r.mergedPrs ?? 0), 0) ?? 0;
  const closedPrs =
    repositories?.reduce((sum, r) => sum + (r.closedPrs ?? 0), 0) ?? 0;

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
        <p className="text-gray-600 mt-1">
          Overview of your repositories and reviews
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Accounts connected</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">1</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Repositories</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {repositories?.length ?? 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Total PRs</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalPrs}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <p className="text-sm text-gray-500">Open PRs</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{openPrs}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Connected account
            </h3>
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
              G
            </div>
            <div>
              <p className="font-medium text-gray-900">GitHub</p>
              <p className="text-sm text-gray-500">
                {repositories?.length ?? 0} repositor
                {repositories?.length === 1 ? 'y' : 'ies'} connected
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href="/repositories"
              className="text-sm text-blue-600 hover:underline"
            >
              Manage repositories →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            PR summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Open</span>
              <span className="text-sm font-semibold text-green-600">
                {openPrs}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Merged</span>
              <span className="text-sm font-semibold text-gray-900">
                {mergedPrs}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Closed</span>
              <span className="text-sm font-semibold text-gray-900">
                {closedPrs}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
