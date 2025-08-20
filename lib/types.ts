export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'developer' | 'viewer';
  createdAt?: Date;
  created_at?: Date;
}

export interface Service {
  _id?: string;
  id?: string;
  name: string;
  url: string;
  ownerId?: string;
  owner_id?: string;
  owner_name?: string;
  createdAt?: Date;
  created_at?: Date;
}

export interface ServiceMetric {
  _id?: string;
  id?: string;
  serviceId?: string;
  service_id?: string;
  service_name?: string;
  status: string;
  responseTime?: number | null;
  response_time?: number | null;
  cpuUsage?: number | null;
  cpu_usage?: number | null;
  memoryUsage?: number | null;
  memory_usage?: number | null;
  error?: string;
  lastChecked?: Date;
  last_checked?: Date;
}

export interface Alert {
  _id?: string;
  id?: string;
  serviceId?: string;
  service_id?: string;
  rule_type: 'cpu' | 'memory' | 'response_time' | 'status';
  threshold: number | null;
  comparison_operator: '>' | '<' | '>=' | '<=';
  notification_method: 'email' | 'push';
  created_at: Date;
}

export interface Notification {
  id: number;
  alert_id: number;
  message: string;
  sent_at: Date;
  status: 'sent' | 'failed';
}

export interface Log {
  id: number;
  service_id: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

export interface HealthCheckResult {
  service_id: number;
  status: 'online' | 'offline';
  response_time: number | null;
  error?: string;
}
