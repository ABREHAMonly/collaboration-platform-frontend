import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workspaceService, projectService } from '../services/api';
import type { Workspace, Project } from '../types';

const WorkspaceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

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

      {/* Members Section */}
      <div className="bg-white shadow rounded-lg p-6">
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

      {/* Projects Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects?.map((project: Project) => (
              <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {project.description || 'No description'}
                </p>
                <div className="flex justify-between items-center mt-3 text-sm text-gray-500">
                  <span>{project.tasks?.length || 0} tasks</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {(!projects || projects.length === 0) && !projectsLoading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📁</div>
            <p className="text-gray-500">No projects in this workspace yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceDetail;