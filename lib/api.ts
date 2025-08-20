import axios from 'axios';
import { Service, ServiceMetric, HealthCheckResult } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// Mock data for offline mode
const MOCK_SERVICES: Service[] = [
  { id: '1', name: 'Web API', url: 'https://api.example.com' },
  { id: '2', name: 'Database', url: 'postgres://localhost:5432' },
  { id: '3', name: 'Redis Cache', url: 'redis://localhost:6379' },
  { id: '4', name: 'CDN', url: 'https://cdn.example.com' }
];

const generateMockMetrics = (): ServiceMetric[] => {
  const metrics: ServiceMetric[] = [];
  const now = new Date();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
    
    MOCK_SERVICES.forEach(service => {
      metrics.push({
        id: `${service.id}-${i}`,
        serviceId: service.id,
        lastChecked: timestamp,
        responseTime: Math.floor(Math.random() * 200) + 50,
        status: Math.random() > 0.1 ? 'online' : 'offline',
        cpuUsage: Math.floor(Math.random() * 80) + 10,
        memoryUsage: Math.floor(Math.random() * 70) + 20
      });
    });
  }
  
  return metrics.sort((a, b) => new Date(b.lastChecked!).getTime() - new Date(a.lastChecked!).getTime());
};

const MOCK_METRICS = generateMockMetrics();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Utility function to sanitize API responses and convert Date objects to strings
const sanitizeApiResponse = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map(sanitizeApiResponse);
  }
  
  if (data && typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    // Convert Date objects to ISO strings
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key] instanceof Date) {
        sanitized[key] = sanitized[key].toISOString();
      } else if (sanitized[key] && typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeApiResponse(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Services API
export const servicesApi = {
  getAll: async (): Promise<Service[]> => {
    try {
      const { data } = await api.get('/api/services');
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock services data');
      return MOCK_SERVICES;
    }
  },

  create: async (service: Omit<Service, 'id' | 'created_at'>): Promise<Service> => {
    try {
      const { data } = await api.post('/api/services', service);
      return sanitizeApiResponse(data);
    } catch (error) {
      return {
        id: Date.now().toString(),
        name: service.name,
        url: service.url
      } as Service;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/api/services/${id}`);
    } catch (error) {
      console.log('Mock delete operation');
    }
  },
};

// Metrics API
export const metricsApi = {
  getLatest: async (): Promise<ServiceMetric[]> => {
    try {
      const { data } = await api.get('/api/metrics/latest');
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock metrics data');
      return MOCK_METRICS.slice(0, 20);
    }
  },

  getHistory: async (serviceId?: number, hours: number = 24): Promise<ServiceMetric[]> => {
    try {
      const params = new URLSearchParams();
      if (serviceId) params.append('service_id', serviceId.toString());
      params.append('hours', hours.toString());
      
      const { data } = await api.get(`/api/metrics/history?${params}`);
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock metrics history');
      const filtered = serviceId 
        ? MOCK_METRICS.filter(m => m.serviceId === serviceId.toString())
        : MOCK_METRICS;
      return filtered.slice(0, Math.min(hours * 4, filtered.length));
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<{
    totalServices: number;
    avgResponseTime: number;
    uptime: number;
  }> => {
    try {
      const { data } = await api.get('/api/dashboard/stats');
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock dashboard stats');
      const totalServices = MOCK_SERVICES.length;
      const latestMetrics = MOCK_METRICS.slice(0, totalServices);
      const avgResponseTime = latestMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / latestMetrics.length;
      const onlineCount = latestMetrics.filter(m => m.status === 'online').length;
      const uptime = (onlineCount / totalServices) * 100;
      
      return {
        totalServices,
        avgResponseTime: Math.round(avgResponseTime),
        uptime: Math.round(uptime * 100) / 100
      };
    }
  },
};

// Logs API
export const logsApi = {
  getRecent: async (limit: number = 50): Promise<any[]> => {
    try {
      const { data } = await api.get(`/api/logs?limit=${limit}`);
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock logs data');
      return [];
    }
  },
};

// Health Check API
export const healthCheckApi = {
  trigger: async (): Promise<{ results: HealthCheckResult[] }> => {
    try {
      const { data } = await api.post('/api/health-check');
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock health check');
      return {
        results: MOCK_SERVICES.map(service => ({
          service_id: parseInt(service.id!),
          status: Math.random() > 0.2 ? 'online' : 'offline',
          response_time: Math.floor(Math.random() * 200) + 50
        }))
      };
    }
  },
  
  status: async (): Promise<{ status: string; timestamp: string }> => {
    try {
      const { data } = await api.get('/api/health');
      return sanitizeApiResponse(data);
    } catch (error) {
      console.log('Using mock health status');
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    }
  },
};

export default api;
