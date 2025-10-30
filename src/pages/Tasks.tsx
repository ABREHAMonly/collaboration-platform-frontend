// pages/Tasks.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

const Tasks: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => taskService.getMyAssignedTasks(),
    enabled: !!user, // Only fetch if user is authenticated
    retry: 1,
  });

  // Fixed updateTask mutation using GraphQL
  const updateTaskMutation = useMutation({
    mutationFn: async (input: { taskId: string; status: string }) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://collaboration-platform-9ngo.onrender.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: `
            mutation UpdateTask($input: UpdateTaskInput!) {
              updateTask(input: $input) {
                id
                title
                description
                status
                dueDate
                project {
                  id
                  name
                  workspace {
                    id
                    name
                  }
                }
              }
            }
          `,
          variables: {
            input: {
              taskId: input.taskId,
              status: input.status
            }
          }
        }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }
      
      if (!result.data || !result.data.updateTask) {
        throw new Error('Failed to update task');
      }
      
      return result.data.updateTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      toast.success('Task updated successfully!');
    },
    onError: (error: any) => {
      console.error('Update task error:', error);
      if (error.message.includes('token') || error.message.includes('auth')) {
        toast.error('Authentication error. Please log in again.');
        // Redirect to login or refresh token
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      } else {
        toast.error(error.message || 'Failed to update task');
      }
    },
  });

  const filteredTasks = tasks?.filter(task => 
    statusFilter === 'ALL' || task.status === statusFilter
  );

  const handleStatusChange = (taskId: string, newStatus: string) => {
    if (!user) {
      toast.error('Please log in to update tasks');
      return;
    }
    updateTaskMutation.mutate({
      taskId,
      status: newStatus
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'DONE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading tasks</h3>
          <p className="text-gray-500 mb-4">{(error as Error).message}</p>
          <button 
            onClick={() => queryClient.refetchQueries({ queryKey: ['my-tasks'] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow rounded-lg">
        <div className="divide-y divide-gray-200">
          {filteredTasks?.map((task: any) => (
            <div key={task.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                  <p className="text-gray-600 mt-1">{task.description || 'No description'}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Project: {task.project?.name}</span>
                    <span>Workspace: {task.project?.workspace?.name}</span>
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    className={`px-3 py-1 text-sm rounded-full border-0 focus:ring-2 focus:ring-blue-500 ${getStatusColor(task.status)}`}
                    disabled={updateTaskMutation.isPending}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                  {updateTaskMutation.isPending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!filteredTasks || filteredTasks.length === 0) && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">
              {statusFilter === 'ALL' 
                ? "You don't have any tasks assigned yet."
                : `No tasks with status "${statusFilter}"`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;