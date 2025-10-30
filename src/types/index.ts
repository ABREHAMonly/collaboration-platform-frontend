export interface User {
  id: string;
  email: string;
  globalStatus: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: WorkspaceMember[];
  projects?: Project[];
}

export interface WorkspaceMember {
  id: string;
  user: User;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  workspace?: Workspace;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  createdAt: string;
  assignedTo: User[];
  project?: Project;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  status: string;
  createdAt: string;
}