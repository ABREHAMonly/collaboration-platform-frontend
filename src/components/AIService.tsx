//components\AIService.tsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiService } from '../services/api';
import toast from 'react-hot-toast';

interface AIServiceProps {
  projectId?: string;
  onTasksGenerated?: (tasks: any[]) => void;
}

const AIService: React.FC<AIServiceProps> = ({ projectId, onTasksGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [summary, setSummary] = useState('');

  const summarizeMutation = useMutation({
    mutationFn: (description: string) => aiService.summarizeTask(description),
    onSuccess: (result) => {
      setSummary(result);
    },
    onError: (error: any) => {
      toast.error('Failed to generate summary');
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: (input: { prompt: string; projectId: string }) => 
      aiService.generateTasksFromPrompt(input.prompt, input.projectId),
    onSuccess: (tasks) => {
      toast.success(`Generated ${tasks.length} tasks successfully!`);
      setPrompt('');
      if (onTasksGenerated) {
        onTasksGenerated(tasks);
      }
    },
    onError: (error: any) => {
      toast.error('Failed to generate tasks');
    },
  });

  const handleSummarize = () => {
    if (!taskDescription.trim()) {
      toast.error('Please enter a task description');
      return;
    }
    summarizeMutation.mutate(taskDescription);
  };

  const handleGenerateTasks = () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    if (!projectId) {
      toast.error('Project ID is required');
      return;
    }
    generateTasksMutation.mutate({ prompt, projectId });
  };

  return (
    <div className="space-y-6">
      {/* Task Summarization */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Task Summarization</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <textarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter a detailed task description to get an AI summary..."
            />
          </div>
          <button
            onClick={handleSummarize}
            disabled={summarizeMutation.isPending}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {summarizeMutation.isPending ? 'Generating Summary...' : 'Generate Summary'}
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
      {projectId && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Task Generation</h3>
          <div className="space-y-4">
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
              disabled={generateTasksMutation.isPending}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {generateTasksMutation.isPending ? 'Generating Tasks...' : 'Generate Tasks with AI'}
            </button>
            <p className="text-sm text-gray-500">
              AI will generate 3-8 specific, actionable tasks based on your prompt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIService;