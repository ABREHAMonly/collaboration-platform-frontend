import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  async logout() {
    await api.post('/api/auth/logout');
  },

  async getMe() {
    const response = await api.post('/graphql', {
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

  async refreshToken() {
    const response = await api.post('/api/auth/refresh-token');
    return response.data;
  }
};

export const workspaceService = {
  async getMyWorkspaces() {
    const response = await api.post('/graphql', {
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

  async createWorkspace(name: string, description?: string) {
    const response = await api.post('/graphql', {
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

  async getWorkspace(id: string) {
    const response = await api.post('/graphql', {
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
  async getWorkspaceProjects(workspaceId: string) {
    const response = await api.post('/graphql', {
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

  async createProject(name: string, description: string, workspaceId: string) {
    const response = await api.post('/graphql', {
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
  async getProjectTasks(projectId: string) {
    const response = await api.post('/graphql', {
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

  async getMyAssignedTasks(status?: string) {
    const response = await api.post('/graphql', {
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

  async createTask(input: any) {
    const response = await api.post('/graphql', {
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

  async updateTask(input: any) {
    const response = await api.post('/graphql', {
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

export const adminService = {
  async getAllWorkspaces() {
    const response = await api.post('/graphql', {
      query: `
        query {
          getAllWorkspaces {
            id
            name
            description
            createdAt
            createdBy {
              email
            }
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
    return response.data.data.getAllWorkspaces;
  },

  async banUser(userId: string) {
    const response = await api.post('/graphql', {
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
  }
};

export default api;