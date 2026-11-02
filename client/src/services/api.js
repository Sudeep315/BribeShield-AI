import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bsai_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('bsai_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.data.success) {
            localStorage.setItem('bsai_access_token', res.data.tokens.accessToken);
            localStorage.setItem('bsai_refresh_token', res.data.tokens.refreshToken);
            originalRequest.headers.Authorization = `Bearer ${res.data.tokens.accessToken}`;
            return api(originalRequest);
          }
        } catch {
          localStorage.removeItem('bsai_access_token');
          localStorage.removeItem('bsai_refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const ComplaintAPI = {
  submit: (formData) => api.post('/complaints/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  track: (trackingId) => api.get(`/complaints/track/${trackingId}`),
  list: (params) => api.get('/complaints', { params }),
  getPublicFeed: (params) => api.get('/complaints/public', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, payload) => api.patch(`/complaints/${id}/status`, payload)
};

export const SuspectAPI = {
  search: (params) => api.get('/suspects/search', { params }),
  report: (payload) => api.post('/suspects/report', payload)
};

export const AdvisoryAPI = {
  getAll: () => api.get('/advisories'),
  submitFeedback: (payload) => api.post('/feedback', payload)
};

export const AuthAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me')
};

export const AnalyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getDepartments: () => api.get('/analytics/departments'),
  getAnomalies: () => api.get('/analytics/anomalies'),
  exportData: (format = 'json') => api.get(`/analytics/export?format=${format}`),
  triggerRetentionPurge: () => api.post('/analytics/retention/purge')
};

export const AuditAPI = {
  getLogs: (params) => api.get('/audit', { params }),
  verifyChain: () => api.get('/audit/verify')
};

export const GrievanceAPI = {
  escalate: (complaintId, targetSystem = 'CPGRAMS') => api.post(`/external/escalate/${complaintId}`, { targetSystem })
};

export default api;
