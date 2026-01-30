import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Request API calls
export const requestApi = {
  create: (data) => api.post('/requests', data),
  getMyRequests: (params) => api.get('/requests/my-requests', { params }),
  getTeamRequests: (params) => api.get('/requests/team-requests', { params }),
  getAllRequests: (params) => api.get('/requests/all', { params }),
  getById: (id) => api.get(`/requests/${id}`),
  approve: (id, comment) => api.post(`/requests/${id}/approve`, { comment }),
  reject: (id, comment) => api.post(`/requests/${id}/reject`, { comment }),
  resubmit: (id, query) => api.post(`/requests/${id}/resubmit`, { query }),
};

// User API calls
export const userApi = {
  getTeamLeads: () => api.get('/users/team-leads'),
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  updateRole: (id, data) => api.patch(`/users/${id}/role`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// DB Instance API calls
export const dbInstanceApi = {
  getAll: (params) => api.get('/db-instances', { params }),
  getById: (id) => api.get(`/db-instances/${id}`),
  create: (data) => api.post('/db-instances', data),
  update: (id, data) => api.put(`/db-instances/${id}`, data),
  delete: (id) => api.delete(`/db-instances/${id}`),
  testConnection: (data) => api.post('/db-instances/test-connection', data),
};
