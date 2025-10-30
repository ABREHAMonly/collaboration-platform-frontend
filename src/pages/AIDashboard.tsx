//pages\AIDashboard.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiService, projectService, workspaceService } from '../services/api';
import toast from 'react-hot-toast';
import type { Project, Workspace } from '../types';

const AIDashboard: React.FC = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [summary, setSummary] = useState('');

  const { data: workspaces, isLoading: workspacesLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['workspace-projects', selectedWorkspace],
    queryFn: () => projectService.getWorkspaceProjects(selectedWorkspace),
    enabled: !!selectedWorkspace,
  });

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
      if (error.message?.includes('AI service not available')) {
        toast.error('AI features are currently unavailable');
      } else {
        toast.error('Failed to generate summary. Please try again.');
      }
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
    } catch (error: any) {
      console.error('AI Task generation error:', error);
      if (error.message?.includes('AI service not available')) {
        toast.error('AI features are currently unavailable');
      } else {
        toast.error('Failed to generate tasks. Please try again.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h1>
        <p className="text-gray-600">Use AI to summarize tasks and generate new tasks from prompts</p>
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
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 w-full"
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
            </div>
            <button
              onClick={handleGenerateTasks}
              disabled={!selectedProject}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 w-full"
            >
              Generate Tasks with AI
            </button>
            <p className="text-sm text-gray-500">
              AI will generate 3-8 specific, actionable tasks based on your prompt and add them to the selected project.
            </p>
          </div>
        </div>
      </div>

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
      </div>
   {/* AI Status Indicator */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-yellow-400 text-lg">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              AI Features Status
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                AI features require a valid Gemini API key. Some functionality may be limited.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;