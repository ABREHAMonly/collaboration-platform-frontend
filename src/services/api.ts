// services/api.ts - COMPLETELY FIXED
import type { User, Workspace, Project, Task } from '../types';

const API_BASE_URL = 'https://collaboration-platform-9ngo.onrender.com';

// Enhanced fetch with timeout and retry logic
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// GraphQL request helper with enhanced error handling
const graphqlRequest = async <T>(query: string, variables?: any): Promise<T> => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        throw new Error('Authentication failed. Please log in again.');
      }
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Handle GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessage = result.errors[0].message;
      
      // Handle specific GraphQL errors
      if (errorMessage.includes('token') || errorMessage.includes('auth')) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        throw new Error('Authentication error. Please log in again.');
      }
      
      throw new Error(errorMessage);
    }
    
    if (!result.data) {
      throw new Error('No data received from server');
    }
    
    return result.data;
  } catch (error: any) {
    console.error('GraphQL request failed:', error);
    
    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
};

// REST API request helper
const restRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('accessToken');
  
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('REST request failed:', error);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
};

export const authService = {
  async login(email: string, password: string): Promise<any> {
    try {
      // Try GraphQL first
      console.log('Attempting GraphQL login...');
      const data = await graphqlRequest<{ login: { accessToken: string; user: User } }>(`
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            accessToken
            refreshToken
            user {
              id
              email
              globalStatus
              createdAt
            }
          }
        }
      `, {
        input: { email, password }
      });
      
      console.log('GraphQL login response:', data);
      return data.login;
    } catch (graphqlError) {
      console.warn('GraphQL login failed, falling back to REST:', graphqlError);
      
      try {
        // Fallback to REST login
        console.log('Attempting REST login fallback...');
        const restResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!restResponse.ok) {
          throw new Error(`REST login failed: ${restResponse.status}`);
        }

        const result = await restResponse.json();
        console.log('REST login response:', result);
        return result;
      } catch (restError) {
        console.error('Both GraphQL and REST login failed:', restError);
        throw new Error('Login failed. Please try again.');
      }
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('accessToken');
  },

  async getMe(): Promise<User> {
    const data = await graphqlRequest<{ me: User }>(`
      query GetMe {
        me {
          id
          email
          globalStatus
          createdAt
        }
      }
    `);
    return data.me;
  },
};

export const workspaceService = {
  async getMyWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await graphqlRequest<{ myWorkspaces: Workspace[] }>(`
        query GetMyWorkspaces {
          myWorkspaces {
            id
            name
            description
            createdAt
            updatedAt
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
      `);
      return data.myWorkspaces || [];
    } catch (error: any) {
      console.error('Failed to fetch workspaces:', error);
      return [];
    }
  },

  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    const data = await graphqlRequest<{ createWorkspace: Workspace }>(`
      mutation CreateWorkspace($input: CreateWorkspaceInput!) {
        createWorkspace(input: $input) {
          id
          name
          description
          createdAt
          updatedAt
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
    `, {
      input: { 
        name, 
        description: description || '' 
      }
    });
    return data.createWorkspace;
  },

  async getWorkspace(id: string): Promise<Workspace> {
    const data = await graphqlRequest<{ workspace: Workspace }>(`
      query GetWorkspace($id: ID!) {
        workspace(id: $id) {
          id
          name
          description
          createdAt
          updatedAt
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
          projects {
            id
            name
            description
            createdAt
          }
        }
      }
    `, { id });
    return data.workspace;
  }
};

export const projectService = {
  async getWorkspaceProjects(workspaceId: string): Promise<Project[]> {
    try {
      const data = await graphqlRequest<{ workspaceProjects: Project[] }>(`
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
            tasks {
              id
              title
              status
            }
          }
        }
      `, { workspaceId });
      return data.workspaceProjects || [];
    } catch (error: any) {
      console.error('Failed to fetch projects:', error);
      return [];
    }
  },

  async createProject(name: string, description: string, workspaceId: string): Promise<Project> {
    const data = await graphqlRequest<{ createProject: Project }>(`
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
    `, {
      input: { 
        name, 
        description, 
        workspaceId 
      }
    });
    return data.createProject;
  }
};

export const taskService = {
  async getMyAssignedTasks(status?: string): Promise<Task[]> {
    try {
      const data = await graphqlRequest<{ myAssignedTasks: Task[] }>(`
        query GetMyAssignedTasks($status: TaskStatus) {
          myAssignedTasks(status: $status) {
            id
            title
            description
            status
            dueDate
            createdAt
            project {
              id
              name
              workspace {
                id
                name
              }
            }
            createdBy {
              id
              email
            }
            assignedTo {
              id
              email
            }
          }
        }
      `, status ? { status } : {});
      return data.myAssignedTasks || [];
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error);
      return [];
    }
  },

  async updateTask(taskId: string, updates: any): Promise<Task> {
    const data = await graphqlRequest<{ updateTask: Task }>(`
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
    `, {
      input: {
        taskId,
        ...updates
      }
    });
    return data.updateTask;
  }
};

// In services/api.ts - Update aiService section
export const aiService = {
  async summarizeTask(taskDescription: string): Promise<string> {
    try {
      const data = await graphqlRequest<{ summarizeTask: string }>(`
        query SummarizeTask($input: AISummarizeInput!) {
          summarizeTask(input: $input)
        }
      `, {
        input: { taskDescription }
      });
      return data.summarizeTask || 'No summary available.';
    } catch (error: any) {
      console.error('AI summarize error:', error);
      // Return a simple fallback summary
      return `Summary: ${taskDescription.substring(0, 100)}...`;
    }
  },

  async generateTasksFromPrompt(prompt: string, projectId: string): Promise<any[]> {
    try {
      const data = await graphqlRequest<{ generateTasksFromPrompt: any[] }>(`
        mutation GenerateTasksFromPrompt($input: AIGenerateTasksInput!) {
          generateTasksFromPrompt(input: $input) {
            id
            title
            description
            status
          }
        }
      `, {
        input: { prompt, projectId }
      });
      
      if (data.generateTasksFromPrompt && data.generateTasksFromPrompt.length > 0) {
        return data.generateTasksFromPrompt;
      } else {
        throw new Error('No tasks were generated');
      }
    } catch (error: any) {
      console.error('AI task generation error:', error);
      
      // Check if it's a permission error vs AI service error
      if (error.message.includes('permissions') || error.message.includes('access')) {
        throw new Error('You do not have permission to create tasks in this project');
      } else if (error.message.includes('No tasks were generated')) {
        throw new Error('The AI service could not generate tasks for this prompt. Please try a different prompt.');
      } else {
        throw new Error('Task generation service is temporarily unavailable. Please try again later.');
      }
    }
  }
};

export const adminService = {
  async getAllWorkspaces(): Promise<Workspace[]> {
    const data = await graphqlRequest<{ getAllWorkspaces: Workspace[] }>(`
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
    `);
    return data.getAllWorkspaces || [];
  },

  async getAuditLogs(filters?: any): Promise<any[]> {
    const data = await graphqlRequest<{ getAuditLogs: any[] }>(`
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
    `, { limit: 50 });
    return data.getAuditLogs || [];
  },

  async banUser(userId: string): Promise<User> {
    const data = await graphqlRequest<{ userBan: User }>(`
      mutation BanUser($userId: ID!) {
        userBan(userId: $userId) {
          id
          email
          globalStatus
        }
      }
    `, { userId });
    return data.userBan;
  },

  async adminResetPassword(input: { userId: string; newPassword: string }): Promise<boolean> {
    const data = await graphqlRequest<{ adminResetPassword: boolean }>(`
      mutation AdminResetPassword($input: AdminResetPasswordInput!) {
        adminResetPassword(input: $input)
      }
    `, { input });
    return data.adminResetPassword;
  }
};