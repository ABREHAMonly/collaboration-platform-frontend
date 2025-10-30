//pages\WorkspaceDetail.tsx
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceService, projectService } from '../services/api';
import toast from 'react-hot-toast';
import AIService from '../components/AIService';
import type { Workspace, Project } from '../types';

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'members' | 'ai'>('projects');
  const queryClient = useQueryClient();

  const { data: workspace, isLoading: workspaceLoading } = useQuery<Workspace>({
    queryKey: ['workspace', id],
    queryFn: () => workspaceService.getWorkspace(id!),
    enabled: !!id,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['workspace-projects', id],
    queryFn: () => projectService.getWorkspaceProjects(id!),
    enabled: !!id,
  });

  const createProjectMutation = useMutation({
    mutationFn: () => projectService.createProject(projectName, projectDescription, id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-projects', id] });
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
      toast.success('Project created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast.error('Project name is required');
      return;
    }
    createProjectMutation.mutate();
  };

  if (workspaceLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Workspace not found</h2>
        <Link to="/workspaces" className="text-blue-600 hover:text-blue-500">
          Back to workspaces
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
            <p className="text-gray-600 mt-2">{workspace.description}</p>
            <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
              <span>Created: {new Date(workspace.createdAt).toLocaleDateString()}</span>
              <span>{workspace.members.length} members</span>
              <span>{projects?.length || 0} projects</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['projects', 'members', 'ai'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + New Project
                </button>
              </div>

              {projectsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects?.map((project) => (
                    <Link
                      key={project.id}
                      to="#"
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow block"
                    >
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                        <span>{project.tasks?.length || 0} tasks</span>
                        <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {(!projects || projects.length === 0) && !projectsLoading && (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-500">No projects in this workspace yet</p>
                  <button
                    onClick={() => setShowCreateProject(true)}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create First Project
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Members</h2>
              <div className="space-y-3">
                {workspace.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {member.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user.email}</p>
                        <p className="text-sm text-gray-500 capitalize">{member.role.toLowerCase()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Tab */}
          {activeTab === 'ai' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant</h2>
              <AIService />
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter project description"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateProject(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;