import axios, { AxiosError, AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiClient.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  me: () => apiClient.get('/auth/me'),
};

// Faces API
export const facesApi = {
  register: (name: string, rollNumber: string, descriptor: number[]) =>
    apiClient.post('/faces/register', { name, rollNumber, descriptor }),
  getAll: () => apiClient.get('/faces'),
  getByUser: (userId: string) => apiClient.get(`/faces/user/${userId}`),
  delete: (faceId: string) => apiClient.delete(`/faces/${faceId}`),
};

// Attendance API
export const attendanceApi = {
  mark: (personId: string, personName: string, descriptor: number[]) =>
    apiClient.post('/attendance/mark', { personId, personName, descriptor }),
  getRecords: (startDate?: string, endDate?: string, limit?: number, offset?: number) =>
    apiClient.get('/attendance/records', {
      params: { startDate, endDate, limit, offset },
    }),
  getStats: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/stats', { params: { startDate, endDate } }),
  update: (recordId: string, status: 'present' | 'absent' | 'late') =>
    apiClient.patch(`/attendance/${recordId}`, { status }),
  exportCsv: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/export/csv', {
      params: { startDate, endDate },
      responseType: 'blob',
    }),
};

// Users API
export const usersApi = {
  getAll: () => apiClient.get('/users'),
  getById: (userId: string) => apiClient.get(`/users/${userId}`),
  update: (userId: string, data: any) => apiClient.patch(`/users/${userId}`, data),
  delete: (userId: string) => apiClient.delete(`/users/${userId}`),
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public originalError?: AxiosError,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (
      error.response?.data?.error ||
      error.message ||
      'An error occurred'
    );
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
