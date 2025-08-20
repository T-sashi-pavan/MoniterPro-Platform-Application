import { Schema, model, models, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'developer' | 'viewer';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'developer', 'viewer'], 
    default: 'viewer' 
  },
  createdAt: { type: Date, default: Date.now }
});

// Service Schema
export interface IService extends Document {
  name: string;
  url: string;
  ownerId: Schema.Types.ObjectId;
  createdAt: Date;
}

const ServiceSchema = new Schema<IService>({
  name: { type: String, required: true },
  url: { type: String, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Service Metrics Schema
export interface IServiceMetric extends Document {
  serviceId: Schema.Types.ObjectId;
  status: 'online' | 'offline' | 'degraded';
  responseTime: number;
  cpuUsage?: number;
  memoryUsage?: number;
  isHealthy?: boolean;
  error?: string;
  lastChecked: Date;
}

const ServiceMetricSchema = new Schema<IServiceMetric>({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  status: { 
    type: String, 
    enum: ['online', 'offline', 'degraded'], 
    required: true 
  },
  responseTime: { type: Number },
  cpuUsage: { type: Number },
  memoryUsage: { type: Number },
  isHealthy: { type: Boolean, default: true },
  error: { type: String },
  lastChecked: { type: Date, default: Date.now }
});

// Alert Schema
export interface IAlert extends Document {
  serviceId: Schema.Types.ObjectId;
  ruleType: 'cpu' | 'memory' | 'response_time' | 'status';
  threshold: number;
  comparisonOperator: '>' | '<' | '>=' | '<=';
  notificationMethod: 'email' | 'push';
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
  ruleType: { 
    type: String, 
    enum: ['cpu', 'memory', 'response_time', 'status'], 
    required: true 
  },
  threshold: { type: Number, required: true },
  comparisonOperator: { 
    type: String, 
    enum: ['>', '<', '>=', '<='], 
    required: true 
  },
  notificationMethod: { 
    type: String, 
    enum: ['email', 'push'], 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
export interface INotification extends Document {
  alertId: Schema.Types.ObjectId;
  message: string;
  sentAt: Date;
  status: 'sent' | 'pending' | 'failed';
}

const NotificationSchema = new Schema<INotification>({
  alertId: { type: Schema.Types.ObjectId, ref: 'Alert', required: true },
  message: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['sent', 'pending', 'failed'], 
    default: 'pending' 
  }
});

// Log Schema
export interface ILog extends Document {
  serviceId?: Schema.Types.ObjectId;
  level: 'info' | 'warning' | 'error';
  message: string;
  timestamp: Date;
}

const LogSchema = new Schema<ILog>({
  serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: false },
  level: { 
    type: String, 
    enum: ['info', 'warning', 'error'], 
    required: true 
  },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Export models
export const User = models.User || model<IUser>('User', UserSchema);
export const Service = models.Service || model<IService>('Service', ServiceSchema);
export const ServiceMetric = models.ServiceMetric || model<IServiceMetric>('ServiceMetric', ServiceMetricSchema);
export const Alert = models.Alert || model<IAlert>('Alert', AlertSchema);
export const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);
export const Log = models.Log || model<ILog>('Log', LogSchema);
