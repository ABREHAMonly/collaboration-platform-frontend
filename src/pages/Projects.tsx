import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceService, projectService } from '../services/api';
import type { Workspace, Project } from '../types';

const Projects: React.FC = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');

  const { data: workspaces, isLoading: workspacesLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['workspace-projects', selectedWorkspace],
    queryFn: () => projectService.getWorkspaceProjects(selectedWorkspace),
    enabled: !!selectedWorkspace,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
      </div>

      {/* Workspace Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Workspace
        </label>
        <select
          value={selectedWorkspace}
          onChange={(e) => setSelectedWorkspace(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Choose a workspace</option>
          {workspaces?.map((workspace: Workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </select>
      </div>

      {/* Projects List */}
      {selectedWorkspace && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Projects in {workspaces?.find(w => w.id === selectedWorkspace)?.name}
          </h2>

          {projectsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project: Project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    <span className="text-2xl">📁</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {project.description || 'No description available'}
                  </p>
                  <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
                    <span>{project.tasks?.length || 0} tasks</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {(!projects || projects.length === 0) && !projectsLoading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500">This workspace doesn't have any projects yet</p>
            </div>
          )}
        </div>
      )}

      {!selectedWorkspace && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a workspace</h3>
          <p className="text-gray-500">Choose a workspace to view its projects</p>
        </div>
      )}
    </div>
  );
};

export default Projects;