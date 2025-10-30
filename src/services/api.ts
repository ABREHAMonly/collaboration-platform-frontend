// services/api.ts - COMPLETELY FIXED
import axios from 'axios';
import type { User, Workspace, Project, Task } from '../types';

const API_BASE_URL = 'https://collaboration-platform-9ngo.onrender.com';

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

interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

export const authService = {
  async login(email: string, password: string): Promise<any> {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async getMe(): Promise<User> {
    const response = await api.post<GraphQLResponse<{ me: User }>>('/graphql', {
      query: `
        query GetMe {
          me {
            id
            email
            globalStatus
          }
        }
      `
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.me;
  },
};

export const workspaceService = {
  async getMyWorkspaces(): Promise<Workspace[]> {
    const response = await api.post<GraphQLResponse<{ myWorkspaces: Workspace[] }>>('/graphql', {
      query: `
        query GetMyWorkspaces {
          myWorkspaces {
            id
            name
            description
            createdAt
            createdBy {
              id
              email
            }
            members {
              id
              user {
                id
                email
              }
              role
            }
          }
        }
      `
    });
    
    if (response.data.errors) {
      console.error('GraphQL Errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.myWorkspaces || [];
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    const response = await api.post<GraphQLResponse<{ createWorkspace: Workspace }>>('/graphql', {
      query: `
        mutation CreateWorkspace($input: CreateWorkspaceInput!) {
          createWorkspace(input: $input) {
            id
            name
            description
            createdAt
            createdBy {
              id
              email
            }
          }
        }
      `,
      variables: {
        input: { 
          name, 
          description: description || '' 
        }
      }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
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
            createdBy {
              id
              email
            }
            members {
              id
              user {
                id
                email
              }
              role
            }
          }
        }
      `,
      variables: { id }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
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
            createdBy {
              id
              email
            }
          }
        }
      `,
      variables: { workspaceId }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.workspaceProjects || [];
  },

  async createProject(name: string, description: string, workspaceId: string): Promise<Project> {
    const response = await api.post<GraphQLResponse<{ createProject: Project }>>('/graphql', {
      query: `
        mutation CreateProject($input: CreateProjectInput!) {
          createProject(input: $input) {
            id
            name
            description
            createdAt
            createdBy {
              id
              email
            }
          }
        }
      `,
      variables: {
        input: { 
          name, 
          description, 
          workspaceId 
        }
      }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.createProject;
  }
};

export const taskService = {
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
      variables: status ? { status } : {}
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.myAssignedTasks || [];
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
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
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
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.generateTasksFromPrompt || [];
  }
};

export const adminService = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    const response = await api.post<GraphQLResponse<{ getAllWorkspaces: Workspace[] }>>('/graphql', {
      query: `
        query GetAllWorkspaces {
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
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.getAllWorkspaces || [];
  },

  async getAuditLogs(filters?: any): Promise<any[]> {
    const response = await api.post<GraphQLResponse<{ getAuditLogs: any[] }>>('/graphql', {
      query: `
        query GetAuditLogs($limit: Int) {
          getAuditLogs(limit: $limit) {
            id
            timestamp
            level
            userId
            ipAddress
            action
            details
            message
          }
        }
      `,
      variables: { limit: 50 }
    });
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.getAuditLogs || [];
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
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
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
    
    if (response.data.errors) {
      throw new Error(response.data.errors[0].message);
    }
    
    return response.data.data.adminResetPassword;
  }
};

export default api;