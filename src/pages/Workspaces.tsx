// pages/Workspaces.tsx - IMPROVED
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { workspaceService } from '../services/api';
import toast from 'react-hot-toast';

const Workspaces: React.FC = () => {
  const { 
    data: workspaces, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">😵</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load workspaces
        </h3>
        <p className="text-gray-500 mb-4">
          {error instanceof Error ? error.message : 'Please try refreshing the page'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        <Link
          to="/workspaces/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Workspace
        </Link>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces?.map((workspace) => (
          <Link
            key={workspace.id}
            to={`/workspaces/${workspace.id}`}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 block"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{workspace.name}</h3>
              <span className="text-2xl">🏢</span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {workspace.description || 'No description provided'}
            </p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{workspace.members?.length || 0} members</span>
              <span>{new Date(workspace.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>

      {(!workspaces || workspaces.length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-500 mb-4">Create your first workspace to get started</p>
          <Link
            to="/workspaces/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Workspace
          </Link>
        </div>
      )}
    </div>
  );
};

export default Workspaces;