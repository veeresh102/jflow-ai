import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

export const projectsApi = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
}

export const tasksApi = {
  getByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export const aiApi = {
  chat: (projectId, message) => api.post(`/ai/chat/${projectId}`, { message }),
  getHistory: (projectId) => api.get(`/ai/history/${projectId}`),
  clearHistory: (projectId) => api.delete(`/ai/history/${projectId}`),
}

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (payload) => api.post('/auth/register', payload),
}

export default api
