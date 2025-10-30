import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/api';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  globalStatus: string;
  createdAt: string;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'workspaces' | 'audit'>('users');
  const [resetPasswordData, setResetPasswordData] = useState({ userId: '', newPassword: '' });
  const queryClient = useQueryClient();

  const { data: allWorkspaces, isLoading: workspacesLoading } = useQuery({
    queryKey: ['admin-workspaces'],
    queryFn: adminService.getAllWorkspaces,
  });

  const { data: auditLogs, isLoading: auditLogsLoading, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => adminService.getAuditLogs({ limit: 50 }),
    enabled: activeTab === 'audit',
  });

  const banMutation = useMutation({
    mutationFn: adminService.banUser,
    onSuccess: () => {
      toast.success('User banned successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      refetchAuditLogs(); // Refresh audit logs to see the ban action
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to ban user');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (input: { userId: string; newPassword: string }) => 
      adminService.adminResetPassword(input),
    onSuccess: () => {
      toast.success('Password reset successfully');
      setResetPasswordData({ userId: '', newPassword: '' });
      refetchAuditLogs(); // Refresh audit logs
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    },
  });

  // Extract all users from workspaces
  const allUsers = React.useMemo(() => {
    if (!allWorkspaces) return [];
    const usersMap = new Map();
    
    allWorkspaces.forEach(workspace => {
      // Add workspace creator
      if (workspace.createdBy) {
        usersMap.set(workspace.createdBy.id, {
          ...workspace.createdBy,
          lastActive: workspace.createdAt
        });
      }
      
      // Add workspace members
      workspace.members.forEach(member => {
        usersMap.set(member.user.id, {
          ...member.user,
          lastActive: workspace.createdAt
        });
      });
    });
    
    return Array.from(usersMap.values());
  }, [allWorkspaces]);

  const handleBanUser = (userId: string) => {
    if (window.confirm('Are you sure you want to ban this user?')) {
      banMutation.mutate(userId);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordData.userId || !resetPasswordData.newPassword) {
      toast.error('Please fill all fields');
      return;
    }
    resetPasswordMutation.mutate(resetPasswordData);
  };

  if (workspacesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, workspaces, and system settings</p>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['users', 'workspaces', 'audit'].map((tab) => (
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
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">User Management</h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                    <div>Email</div>
                    <div>Status</div>
                    <div>Last Active</div>
                    <div>Actions</div>
                  </div>
                  {allUsers.map((user: any) => (
                    <div key={user.id} className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 items-center">
                      <div className="font-medium">{user.email}</div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.globalStatus === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800'
                            : user.globalStatus === 'BANNED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.globalStatus}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Unknown'}
                      </div>
                      <div className="space-x-2">
                        {user.globalStatus !== 'BANNED' && user.globalStatus !== 'ADMIN' && (
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Ban
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Password Reset Form */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Reset User Password</h3>
                <form onSubmit={handleResetPassword} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={resetPasswordData.userId}
                      onChange={(e) => setResetPasswordData(prev => ({ ...prev, userId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter user ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={resetPasswordData.newPassword}
                      onChange={(e) => setResetPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Workspaces Tab */}
          {activeTab === 'workspaces' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">All Workspaces</h2>
              <div className="space-y-4">
                {allWorkspaces?.map((workspace) => (
                  <div key={workspace.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{workspace.name}</h3>
                        <p className="text-gray-600 text-sm">{workspace.description}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(workspace.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Created by: {workspace.createdBy?.email}</p>
                      <p>Members: {workspace.members.length}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h2>
              {auditLogsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-6 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm">
                    <div>Timestamp</div>
                    <div>Level</div>
                    <div>User</div>
                    <div>Action</div>
                    <div>IP</div>
                    <div>Details</div>
                  </div>
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200 text-sm">
                      <div className="text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.level === 'error' ? 'bg-red-100 text-red-800' :
                          log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                          log.level === 'security' ? 'bg-purple-100 text-purple-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {log.level}
                        </span>
                      </div>
                      <div className="text-gray-600">{log.userId || 'System'}</div>
                      <div className="text-gray-600">{log.action}</div>
                      <div className="text-gray-500">{log.ipAddress || 'N/A'}</div>
                      <div className="text-gray-500 truncate" title={JSON.stringify(log.details)}>
                        {JSON.stringify(log.details).substring(0, 50)}...
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 p-8 text-center rounded-lg">
                  <div className="text-4xl mb-2">📊</div>
                  <p className="text-gray-500">No audit logs found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Audit logs will appear here when users perform actions like creating workspaces, banning users, etc.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;