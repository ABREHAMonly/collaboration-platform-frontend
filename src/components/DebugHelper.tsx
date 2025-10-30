// components/DebugHelper.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { workspaceService } from '../services/api';

export const DebugHelper: React.FC = () => {
  const { data, error, isLoading } = useQuery({
    queryKey: ['debug-workspaces'],
    queryFn: workspaceService.getMyWorkspaces,
    retry: false
  });

  if (isLoading) return <div>Debug: Loading...</div>;
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
        <h3 className="text-red-800 font-medium">Debug Error:</h3>
        <p className="text-red-600 text-sm">{error.message}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-red-600 text-sm">Show Details</summary>
          <pre className="text-xs mt-2 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
      <h3 className="text-green-800 font-medium">Debug: Success!</h3>
      <p className="text-green-600 text-sm">
        Found {data?.length || 0} workspaces
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-green-600 text-sm">Show Data</summary>
        <pre className="text-xs mt-2 whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};