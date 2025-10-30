// types.ts - UPDATED
export interface User {
  id: string;
  email: string;
  globalStatus: 'ACTIVE' | 'BANNED' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: User;
  members: WorkspaceMember[];
  projects?: Project[];
}

export interface WorkspaceMember {
  id: string;
  user: User;
  role: 'OWNER' | 'MEMBER' | 'VIEWER';
  joinedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  workspace?: Workspace;
  createdAt: string;
  updatedAt?: string;
  createdBy: User;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  user: User;
  role: 'PROJECT_LEAD' | 'CONTRIBUTOR' | 'VIEWER';
  joinedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  projectId: string;
  project?: Project;
  createdBy: User;
  assignedTo: User[];
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  status: 'DELIVERED' | 'SEEN';
  relatedEntityId?: string;
  entityType?: string;
  createdAt: string;
  readAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'security';
  userId?: string;
  ipAddress?: string;
  action: string;
  details: any;
  message?: string;
}