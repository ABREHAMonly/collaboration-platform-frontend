import axios from 'axios';
import type { User, Workspace, Project, Task } from '../types';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://collaboration-platform-9ngo.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.post<GraphQLResponse<{ me: User }>>('/graphql', {
      query: `
        query {
          me {
            id
            email
            globalStatus
          }
        }
      `
    });
    return response.data.data.me;
  },
};

export const workspaceService = {
  async getMyWorkspaces(): Promise<Workspace[]> {
    const response = await api.post<GraphQLResponse<{ myWorkspaces: Workspace[] }>>('/graphql', {
      query: `
        query {
          myWorkspaces {
            id
            name
            description
            createdAt
            members {
              user {
                email
              }
              role
            }
          }
        }
      `
    });
    return response.data.data.myWorkspaces;
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    const response = await api.post<GraphQLResponse<{ createWorkspace: Workspace }>>('/graphql', {
      query: `
        mutation CreateWorkspace($input: CreateWorkspaceInput!) {
          createWorkspace(input: $input) {
            id
            name
            description
          }
        }
      `,
      variables: {
        input: { name, description }
      }
    });
    return response.data.data.createWorkspace;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const response = await api.post<GraphQLResponse<{ workspace: Workspace }>>('/graphql', {
      query: `
        query GetWorkspace($id: ID!) {
          workspace(id: $id) {
            id
            name
            description
            createdAt
            members {
              id
              user {
                id
                email
              }
              role
            }
            projects {
              id
              name
              description
              createdAt
            }
          }
        }
      `,
      variables: { id }
    });
    return response.data.data.workspace;
  }
};

export const projectService = {
  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    const response = await api.post<GraphQLResponse<{ workspaceProjects: Project[] }>>('/graphql', {
      query: `
        query GetWorkspaceProjects($workspaceId: ID!) {
          workspaceProjects(workspaceId: $workspaceId) {
            id
            name
            description
            createdAt
            tasks {
              id
              title
              status
            }
          }
        }
      `,
      variables: { workspaceId }
    });
    return response.data.data.workspaceProjects;
  },

  async createProject(name: string, description: string, workspaceId: string): Promise<Project> {
    const response = await api.post<GraphQLResponse<{ createProject: Project }>>('/graphql', {
      query: `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            name
            description
          }
        }
      `,
      variables: {
        input: { name, description, workspaceId }
      }
    });
    return response.data.data.createProject;
  }
};

export const taskService = {
  async getProjectTasks(projectId: string): Promise<Task[]> {
    const response = await api.post<GraphQLResponse<{ projectTasks: Task[] }>>('/graphql', {
      query: `
        query GetProjectTasks($projectId: ID!) {
          projectTasks(projectId: $projectId) {
            id
            title
            description
            status
            dueDate
            createdAt
            assignedTo {
              id
              email
            }
          }
        }
      `,
      variables: { projectId }
    });
    return response.data.data.projectTasks;
  },

  async getMyAssignedTasks(status?: string): Promise<Task[]> {
    const response = await api.post<GraphQLResponse<{ myAssignedTasks: Task[] }>>('/graphql', {
      query: `
        query GetMyAssignedTasks($status: TaskStatus) {
          myAssignedTasks(status: $status) {
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
      variables: { status }
    });
    return response.data.data.myAssignedTasks;
  },

  async createTask(input: { title: string; description?: string; projectId: string; assignedToIds?: string[]; dueDate?: string }): Promise<Task> {
    const response = await api.post<GraphQLResponse<{ createTask: Task }>>('/graphql', {
      query: `
        mutation CreateTask($input: CreateTaskInput!) {
          createTask(input: $input) {
            id
            title
            description
            status
          }
        }
      `,
      variables: { input }
    });
    return response.data.data.createTask;
  },

  async updateTask(input: { taskId: string; title?: string; description?: string; status?: string; assignedToIds?: string[]; dueDate?: string }): Promise<Task> {
    const response = await api.post<GraphQLResponse<{ updateTask: Task }>>('/graphql', {
      query: `
        mutation UpdateTask($input: UpdateTaskInput!) {
          updateTask(input: $input) {
            id
            title
            status
          }
        }
      `,
      variables: { input }
    });
    return response.data.data.updateTask;
  }
};

export const aiService = {
  async summarizeTask(taskDescription: string): Promise<string> {
    const response = await api.post<GraphQLResponse<{ summarizeTask: string }>>('/graphql', {
      query: `
        query SummarizeTask($input: AISummarizeInput!) {
          summarizeTask(input: $input)
        }
      `,
      variables: {
        input: { taskDescription }
      }
    });
    return response.data.data.summarizeTask;
  },

  async generateTasksFromPrompt(prompt: string, projectId: string): Promise<any[]> {
    const response = await api.post<GraphQLResponse<{ generateTasksFromPrompt: any[] }>>('/graphql', {
      query: `
        mutation GenerateTasksFromPrompt($input: AIGenerateTasksInput!) {
          generateTasksFromPrompt(input: $input) {
            id
            title
            description
            status
          }
        }
      `,
      variables: {
        input: { prompt, projectId }
      }
    });
    return response.data.data.generateTasksFromPrompt;
  }
};

// SINGLE adminService declaration with all methods
export const adminService = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    const response = await api.post<GraphQLResponse<{ getAllWorkspaces: Workspace[] }>>('/graphql', {
      query: `
        query {
          getAllWorkspaces {
            id
            name
            description
            createdAt
            createdBy {
              id
              email
            }
            members {
              user {
                id
                email
                globalStatus
              }
              role
            }
          }
        }
      `
    });
    return response.data.data.getAllWorkspaces;
  },

  async banUser(userId: string): Promise<User> {
    const response = await api.post<GraphQLResponse<{ userBan: User }>>('/graphql', {
      query: `
        mutation BanUser($userId: ID!) {
          userBan(userId: $userId) {
            id
            email
            globalStatus
          }
        }
      `,
      variables: { userId }
    });
    return response.data.data.userBan;
  },

  async adminResetPassword(input: { userId: string; newPassword: string }): Promise<boolean> {
    const response = await api.post<GraphQLResponse<{ adminResetPassword: boolean }>>('/graphql', {
      query: `
        mutation AdminResetPassword($input: AdminResetPasswordInput!) {
          adminResetPassword(input: $input)
        }
      `,
      variables: { input }
    });
    return response.data.data.adminResetPassword;
  }
};

export default api;