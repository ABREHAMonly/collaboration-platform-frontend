// pages/AIDashboard.tsx - UPDATED with enhanced AI status
import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiService, projectService, workspaceService, taskService } from '../services/api';
import toast from 'react-hot-toast';
import type { Project, Workspace, Task } from '../types';

// Mock AI service status for frontend display
const getAIStatus = () => {
  // In a real implementation, you would fetch this from your backend
  // For now, we'll assume it's working since we see tasks being generated
  return {
    isAvailable: true,
    model: 'gemini-2.5-flash',
    status: 'operational'
  };
};

const AIDashboard: React.FC = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [aiStatus, setAiStatus] = useState(getAIStatus());
  const queryClient = useQueryClient();

  const { data: workspaces, isLoading: workspacesLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['workspace-projects', selectedWorkspace],
    queryFn: () => projectService.getWorkspaceProjects(selectedWorkspace),
    enabled: !!selectedWorkspace,
  });

  // Query to get tasks for the selected project
  const { data: projectTasks, refetch: refetchProjectTasks } = useQuery<Task[]>({
    queryKey: ['project-tasks', selectedProject],
    queryFn: () => taskService.getProjectTasks(selectedProject),
    enabled: !!selectedProject,
  });

  // Refresh AI status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAiStatus(getAIStatus());
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSummarize = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }

    try {
      const result = await aiService.summarizeTask(taskDescription);
      setSummary(result);
      toast.success('Summary generated successfully!');
    } catch (error: any) {
      console.error('AI Summary error:', error);
      toast.error('Failed to generate summary. Please try again.');
    }
  };

  const handleGenerateTasks = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    try {
      const tasks = await aiService.generateTasksFromPrompt(prompt, selectedProject);
      toast.success(`Generated ${tasks.length} tasks successfully!`);
      setPrompt('');
      
      // Refresh the tasks for the current project
      await refetchProjectTasks();
      
      // Also refresh projects to update task counts
      if (selectedWorkspace) {
        await queryClient.invalidateQueries({ 
          queryKey: ['workspace-projects', selectedWorkspace] 
        });
      }
      
      console.log('Tasks generated and data refreshed');
    } catch (error: any) {
      console.error('AI Task generation error:', error);
      
      if (error.message.includes('permission')) {
        toast.error('You do not have permission to create tasks in this project');
      } else if (error.message.includes('temporarily unavailable') || error.message.includes('fallback')) {
        toast.success('AI service unavailable. Fallback tasks generated successfully!');
        setPrompt('');
        
        // Refresh for fallback tasks too
        await refetchProjectTasks();
        if (selectedWorkspace) {
          await queryClient.invalidateQueries({ 
            queryKey: ['workspace-projects', selectedWorkspace] 
          });
        }
      } else {
        toast.error(error.message || 'Failed to generate tasks. Please try again.');
      }
    }
  };

  const getStatusColor = () => {
    return aiStatus.isAvailable 
      ? 'bg-green-50 border-green-200 text-green-800' 
      : 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  const getStatusIcon = () => {
    return aiStatus.isAvailable ? '🤖' : '⚠️';
  };

  const getStatusMessage = () => {
    if (aiStatus.isAvailable) {
      return `AI features are fully operational using ${aiStatus.model}`;
    } else {
      return 'AI service is currently unavailable. Mock tasks will be generated automatically.';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h1>
        <p className="text-gray-600">Use AI to summarize tasks and generate new tasks from prompts</p>
      </div>

      {/* AI Status Indicator - MOVED TO TOP */}
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getStatusIcon()}</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              AI Assistant Status: {aiStatus.isAvailable ? 'Active' : 'Limited'}
            </h3>
            <div className="mt-1 text-sm">
              <p>{getStatusMessage()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Summarization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Summarization</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Description
              </label>
              <textarea
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a detailed task description to get an AI summary..."
              />
            </div>
            <button
              onClick={handleSummarize}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full transition-colors duration-200"
            >
              Generate Summary
            </button>
            
            {summary && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">AI Summary:</h4>
                <p className="text-green-700">{summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Task Generation */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Generation</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Workspace
              </label>
              <select
                value={selectedWorkspace}
                onChange={(e) => {
                  setSelectedWorkspace(e.target.value);
                  setSelectedProject('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a workspace</option>
                {workspaces?.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Project
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={!selectedWorkspace || projectsLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Choose a project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what you want to accomplish (e.g., 'Create a plan for launching a website')"
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about your goals for better AI results
              </p>
            </div>
            <button
              onClick={handleGenerateTasks}
              disabled={!selectedProject}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 w-full transition-colors duration-200"
            >
              Generate Tasks with AI
            </button>
            <p className="text-sm text-gray-500">
              AI will generate 3-5 specific, actionable tasks based on your prompt and add them to the selected project.
            </p>
          </div>
        </div>
      </div>

      {/* Display Generated Tasks */}
      {selectedProject && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tasks in Selected Project</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                {projectTasks?.length || 0} tasks
              </span>
              <button
                onClick={() => refetchProjectTasks()}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors duration-200"
              >
                Refresh
              </button>
            </div>
          </div>
          
          {projectTasks && projectTasks.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projectTasks.map((task) => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      task.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📝</div>
              <p className="text-gray-500">No tasks found in this project.</p>
              <p className="text-sm text-gray-400 mt-1">Use the AI task generator above to create tasks.</p>
            </div>
          )}
        </div>
      )}

      {/* AI Features Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to use AI Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-1">Task Summarization</h4>
            <p>Paste a long task description and get a concise 1-2 sentence summary using Gemini AI.</p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Task Generation</h4>
            <p>Describe a project goal and AI will create structured tasks automatically in your project.</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-1">💡 Pro Tips</h4>
          <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
            <li>Be specific in your prompts for better AI results</li>
            <li>Select the right project before generating tasks</li>
            <li>Review and edit AI-generated tasks as needed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;