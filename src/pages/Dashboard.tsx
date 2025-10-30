//pages\Dashboard.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { workspaceService, taskService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Workspace, Task } from '../types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: workspaces, isLoading: workspacesLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyAssignedTasks(),
  });

  const todoTasks = tasks?.filter((task: Task) => task.status === 'TODO') || [];
  const inProgressTasks = tasks?.filter((task: Task) => task.status === 'IN_PROGRESS') || [];
  const doneTasks = tasks?.filter((task: Task) => task.status === 'DONE') || [];

  if (workspacesLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.email}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Workspaces</p>
              <p className="text-2xl font-bold text-gray-900">{workspaces?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks To Do</p>
              <p className="text-2xl font-bold text-gray-900">{todoTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{doneTasks.length}</p>
            </div>
          </div>
        </div>
      </div>
{/* AI Quick Access */}
<div className="bg-white shadow rounded-lg p-6">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
    <Link
      to="/ai-dashboard"
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
    >
      Open AI Dashboard
    </Link>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-2">Task Summarization</h3>
      <p className="text-sm text-gray-600 mb-3">Get AI-powered summaries of complex tasks</p>
      <Link
        to="/ai-dashboard"
        className="text-purple-600 hover:text-purple-500 text-sm font-medium"
      >
        Try it now →
      </Link>
    </div>
    <div className="p-4 border border-gray-200 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-2">Task Generation</h3>
      <p className="text-sm text-gray-600 mb-3">Generate tasks automatically from project descriptions</p>
      <Link
        to="/ai-dashboard"
        className="text-purple-600 hover:text-purple-500 text-sm font-medium"
      >
        Generate tasks →
      </Link>
    </div>
  </div>
</div>

      {/* Recent Workspaces */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Workspaces</h2>
          <Link
            to="/workspaces"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-4">
          {workspaces?.slice(0, 3).map((workspace: Workspace) => (
            <div key={workspace.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                <p className="text-sm text-gray-500">
                  {workspace.members.length} members • {workspace.description}
                </p>
              </div>
              <Link
                to={`/workspaces/${workspace.id}`}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </Link>
            </div>
          ))}
          {(!workspaces || workspaces.length === 0) && (
            <p className="text-center text-gray-500 py-4">No workspaces yet</p>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">My Tasks</h2>
          <Link
            to="/tasks"
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            View all
          </Link>
        </div>
        <div className="space-y-3">
        {tasks?.slice(0, 5).map((task: Task) => (
        <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
                task.status === 'DONE' ? 'bg-green-500' :
                task.status === 'IN_PROGRESS' ? 'bg-yellow-500' : 'bg-gray-300'
            }`}></div>
            <div>
                <h4 className="font-medium text-gray-900">{task.title}</h4>
                <p className="text-sm text-gray-500">
                {/* Use workspaceId instead of workspace object if available */}
                {task.project?.workspaceId ? `Workspace: ${task.project.workspaceId}` : 'No workspace'}
                </p>
            </div>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
            task.status === 'DONE' ? 'bg-green-100 text-green-800' :
            task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
            }`}>
            {task.status.replace('_', ' ')}
            </span>
        </div>
        ))}
          {(!tasks || tasks.length === 0) && (
            <p className="text-center text-gray-500 py-4">No tasks assigned</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;