import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { workspaceService } from '../services/api';
import toast from 'react-hot-toast';

const Workspaces: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
  });

  const createMutation = useMutation({
    mutationFn: () => workspaceService.createWorkspace(workspaceName, workspaceDescription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      setShowCreateModal(false);
      setWorkspaceName('');
      setWorkspaceDescription('');
      toast.success('Workspace created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create workspace');
    },
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Workspace
        </button>
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
              {workspace.description || 'No description'}
            </p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{workspace.members.length} members</span>
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
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Workspace
          </button>
        </div>
      )}

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Workspace</h2>
            <form onSubmit={handleCreateWorkspace}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Workspace Name *
                  </label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={workspaceDescription}
                    onChange={(e) => setWorkspaceDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter workspace description"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workspaces;