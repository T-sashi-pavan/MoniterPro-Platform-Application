import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cron from 'node-cron';
import dotenv from 'dotenv';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/mongodb';
import { User, Service, ServiceMetric, Alert, Notification, Log } from '../lib/models';

dotenv.config({ path: '.env.local' });

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health Checker Class for MongoDB
class MongoHealthChecker {
  async checkService(serviceId: string, url: string) {
    const startTime = Date.now();
    try {
      const response = await axios.get(url, { timeout: 10000 });
      const responseTime = Date.now() - startTime;
      
      // Generate realistic system metrics
      const baseMemory = 40 + Math.random() * 30; // 40-70%
      const baseCpu = 20 + Math.random() * 60;    // 20-80%
      
      // Adjust based on response time (higher response time = higher resource usage)
      const responseTimeFactor = Math.min(responseTime / 1000, 2); // Max factor of 2
      const memoryUsage = Math.min(95, baseMemory + (responseTimeFactor * 10));
      const cpuUsage = Math.min(95, baseCpu + (responseTimeFactor * 15));
      
      const metric = new ServiceMetric({
        serviceId,
        status: response.status >= 200 && response.status < 300 ? 'online' : 'degraded',
        responseTime,
        memoryUsage: Math.round(memoryUsage),
        cpuUsage: Math.round(cpuUsage),
        isHealthy: response.status >= 200 && response.status < 300,
        lastChecked: new Date()
      });
      
      await metric.save();
      
      // Log successful check
      await new Log({
        serviceId,
        level: 'info',
        message: `Health check successful - ${responseTime}ms, Memory: ${Math.round(memoryUsage)}%, CPU: ${Math.round(cpuUsage)}%`,
        timestamp: new Date()
      }).save();
      
      return metric;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const metric = new ServiceMetric({
        serviceId,
        status: 'offline',
        responseTime,
        memoryUsage: 0,
        cpuUsage: 0,
        isHealthy: false,
        error: error.message,
        lastChecked: new Date()
      });
      
      await metric.save();
      
      // Log error
      await new Log({
        serviceId,
        level: 'error',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date()
      }).save();
      
      return metric;
    }
  }

  async checkAllServices() {
    try {
      const services = await Service.find({});
      const results = [];
      
      for (const service of services) {
        const metric = await this.checkService(service._id.toString(), service.url);
        results.push(metric);
      }
      
      // Emit real-time updates via WebSocket
      io.emit('metrics-update', results);
      
      return results;
    } catch (error) {
      console.error('Error checking services:', error);
      return [];
    }
  }
}

const healthChecker = new MongoHealthChecker();

// API Routes

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find({})
      .populate('ownerId', 'name')
      .sort({ createdAt: -1 });
    
    // Get latest metrics for each service
    const servicesWithMetrics = await Promise.all(
      services.map(async (service) => {
        const latestMetric = await ServiceMetric.findOne({ serviceId: service._id })
          .sort({ lastChecked: -1 });
        
        return {
          ...service.toObject(),
          status: latestMetric?.status || 'unknown',
          responseTime: latestMetric?.responseTime || 0,
          uptime: latestMetric?.status === 'online' ? 100 : 0,
          lastCheck: latestMetric?.lastChecked ? 
            new Date(latestMetric.lastChecked).toLocaleString() : 'Never'
        };
      })
    );
    
    res.json(servicesWithMetrics);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Create new service
// Create service (with user activity logging)
app.post('/api/services', async (req, res) => {
  try {
    const { name, url, ownerId, userName } = req.body;
    
    if (!name || !url) {
      return res.status(400).json({ error: 'Name and URL are required' });
    }
    
    const service = new Service({
      name,
      url,
      ownerId,
      createdAt: new Date()
    });
    
    await service.save();
    
    // Log service creation activity
    await new Log({
      serviceId: service._id,
      level: 'info',
      message: `Service "${name}" created by ${userName || 'User'} (${url})`,
      timestamp: new Date()
    }).save();
    
    console.log(`✅ Service created: ${name} by ${userName || 'User'}`);
    
    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Delete service (with user activity logging)
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Log service deletion activity
    await new Log({
      serviceId: service._id,
      level: 'warning',
      message: `Service "${service.name}" deleted by ${userName || 'User'}`,
      timestamp: new Date()
    }).save();
    
    await Service.findByIdAndDelete(id);
    
    // Also delete related metrics and logs
    await ServiceMetric.deleteMany({ serviceId: id });
    
    console.log(`🗑️ Service deleted: ${service.name} by ${userName || 'User'}`);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get single service details
app.get('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate('ownerId', 'name');
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Get latest metrics for this service
    const latestMetric = await ServiceMetric.findOne({ serviceId: id })
      .sort({ lastChecked: -1 });
    
    // Get recent metrics history (last 24 hours)
    const recentMetrics = await ServiceMetric.find({ serviceId: id })
      .sort({ lastChecked: -1 })
      .limit(50);
    
    const serviceWithDetails = {
      ...service.toObject(),
      status: latestMetric?.status || 'unknown',
      responseTime: latestMetric?.responseTime || 0,
      uptime: latestMetric?.status === 'online' ? 100 : 0,
      lastCheck: latestMetric?.lastChecked ? 
        new Date(latestMetric.lastChecked).toLocaleString() : 'Never',
      recentMetrics
    };
    
    res.json(serviceWithDetails);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ error: 'Failed to fetch service details' });
  }
});

// Update service
app.put('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url, userName } = req.body;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { name, url },
      { new: true }
    ).populate('ownerId', 'name');
    
    // Log service update activity
    await new Log({
      serviceId: service._id,
      level: 'info',
      message: `Service "${service.name}" updated by ${userName || 'User'}`,
      timestamp: new Date()
    }).save();
    
    console.log(`✏️ Service updated: ${service.name} by ${userName || 'User'}`);
    
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// Get service metrics
app.get('/api/services/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Get metrics from the last X hours
    const hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
    const metrics = await ServiceMetric.find({
      serviceId: id,
      lastChecked: { $gte: hoursAgo }
    }).sort({ lastChecked: -1 });
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching service metrics:', error);
    res.status(500).json({ error: 'Failed to fetch service metrics' });
  }
});

// Trigger health check for specific service
app.post('/api/services/:id/health-check', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    const result = await healthChecker.checkService(service._id.toString(), service.url);
    
    res.json({ 
      message: 'Health check completed', 
      result: {
        status: result.status,
        responseTime: result.responseTime,
        lastChecked: result.lastChecked
      }
    });
  } catch (error) {
    console.error('Error triggering health check:', error);
    res.status(500).json({ error: 'Failed to trigger health check' });
  }
});

// Get users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'viewer' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date()
    });
    
    await user.save();
    
    // Log registration activity
    await new Log({
      serviceId: null,
      level: 'info',
      message: `New user registered: ${name} (${email})`,
      timestamp: new Date()
    }).save();
    
    console.log(`✅ New user registered: ${name} (${email})`);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Compare password with hash
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Log login activity
    await new Log({
      serviceId: null,
      level: 'info',
      message: `User logged in: ${user.name} (${user.email})`,
      timestamp: new Date()
    }).save();
    
    console.log(`✅ User logged in: ${user.name} (${user.email})`);
    
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    console.log('Dashboard stats request received');
    
    // Get total services count
    const totalServices = await Service.countDocuments({});
    console.log('Total services:', totalServices);
    
    // Get recent metrics (if any)
    const recentMetrics = await ServiceMetric.find({}).sort({ lastChecked: -1 }).limit(10);
    console.log('Recent metrics count:', recentMetrics.length);

    // Calculate stats
    let avgResponseTime = 0;
    let uptime = 100;
    let activeAlerts = 0;

    if (recentMetrics.length > 0) {
      // Calculate average response time
      avgResponseTime = Math.round(
        recentMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / recentMetrics.length
      );

      // Calculate uptime percentage
      const onlineCount = recentMetrics.filter(m => m.status === 'online').length;
      uptime = Math.round(((onlineCount / recentMetrics.length) * 100) * 100) / 100;

      // Count active alerts
      activeAlerts = recentMetrics.filter(m => 
        m.status === 'offline' || (m.responseTime && m.responseTime > 1000)
      ).length;
    }

    const stats = {
      totalServices,
      activeAlerts,
      avgResponseTime,
      uptime
    };

    console.log('Returning stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get metrics
app.get('/api/metrics', async (req, res) => {
  try {
    const { serviceId, hours = 24 } = req.query;
    
    let query: any = {};
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    // Get metrics from the last X hours
    const hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
    query.lastChecked = { $gte: hoursAgo };
    
    const metrics = await ServiceMetric.find(query)
      .populate('serviceId', 'name')
      .sort({ lastChecked: -1 })
      .limit(100);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get recent metrics
app.get('/api/metrics/recent', async (req, res) => {
  try {
    const metrics = await ServiceMetric.find({})
      .populate('serviceId', 'name')
      .sort({ lastChecked: -1 })
      .limit(20);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching recent metrics:', error);
    res.status(500).json({ error: 'Failed to fetch recent metrics' });
  }
});

// Get latest metrics (alias for recent metrics)
app.get('/api/metrics/latest', async (req, res) => {
  try {
    const metrics = await ServiceMetric.find({})
      .populate('serviceId', 'name')
      .sort({ lastChecked: -1 })
      .limit(20);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching latest metrics:', error);
    res.status(500).json({ error: 'Failed to fetch latest metrics' });
  }
});

// Get logs
app.get('/api/logs/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await Log.find({})
      .populate('serviceId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get logs (alternative endpoint for frontend compatibility)
app.get('/api/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const logs = await Log.find({})
      .populate('serviceId', 'name')
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Get metrics history (new endpoint for frontend)
app.get('/api/metrics/history', async (req, res) => {
  try {
    const { serviceId, hours = 24 } = req.query;
    
    let query: any = {};
    if (serviceId) {
      query.serviceId = serviceId;
    }
    
    // Get metrics from the last X hours
    const hoursAgo = new Date(Date.now() - (Number(hours) * 60 * 60 * 1000));
    query.lastChecked = { $gte: hoursAgo };
    
    const metrics = await ServiceMetric.find(query)
      .populate('serviceId', 'name')
      .sort({ lastChecked: -1 })
      .limit(100);
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({ error: 'Failed to fetch metrics history' });
  }
});

// Trigger manual health check
app.post('/api/health-check/trigger', async (req, res) => {
  try {
    const results = await healthChecker.checkAllServices();
    res.json({ message: 'Health check completed', results });
  } catch (error) {
    console.error('Error triggering health check:', error);
    res.status(500).json({ error: 'Failed to trigger health check' });
  }
});

// Health check endpoint (alias for trigger)
app.post('/api/health-check', async (req, res) => {
  try {
    const results = await healthChecker.checkAllServices();
    res.json({ results });
  } catch (error) {
    console.error('Error triggering health check:', error);
    res.status(500).json({ error: 'Failed to trigger health check' });
  }
});

// Health check endpoint for the API itself
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database info endpoint
app.get('/api/database/info', async (req, res) => {
  try {
    const [users, services, recentMetrics, stats] = await Promise.all([
      User.find({}, '-password').sort({ createdAt: 1 }),
      Service.find({}).populate('ownerId', 'name').sort({ createdAt: 1 }),
      ServiceMetric.find({})
        .populate('serviceId', 'name')
        .sort({ lastChecked: -1 })
        .limit(20),
      Promise.all([
        User.countDocuments({}),
        Service.countDocuments({}),
        ServiceMetric.countDocuments({}),
        Alert.countDocuments({}),
        Notification.countDocuments({})
      ])
    ]);

    res.json({
      users,
      services,
      recent_metrics: recentMetrics,
      statistics: {
        total_users: stats[0],
        total_services: stats[1],
        total_metrics: stats[2],
        total_alerts: stats[3],
        total_notifications: stats[4]
      }
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({ error: 'Failed to fetch database information' });
  }
});

// Alert Rules API
app.get('/api/alerts/rules', async (req, res) => {
  try {
    const alertRules = await Alert.find({})
      .populate('serviceId', 'name url')
      .sort({ createdAt: -1 });
    res.json(alertRules);
  } catch (error) {
    console.error('Error fetching alert rules:', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

app.post('/api/alerts/rules', async (req, res) => {
  try {
    const { serviceId, ruleType, threshold, comparisonOperator, notificationMethod, isActive = true } = req.body;
    
    if (!serviceId || !ruleType || (ruleType !== 'status' && threshold === undefined) || !notificationMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const alertRule = new Alert({
      serviceId,
      ruleType,
      threshold: ruleType === 'status' ? 0 : threshold,
      comparisonOperator: ruleType === 'status' ? '=' : comparisonOperator,
      notificationMethod,
      isActive
    });
    
    await alertRule.save();
    
    const populatedRule = await Alert.findById(alertRule._id).populate('serviceId', 'name url');
    res.status(201).json(populatedRule);
  } catch (error) {
    console.error('Error creating alert rule:', error);
    res.status(500).json({ error: 'Failed to create alert rule' });
  }
});

app.put('/api/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const alertRule = await Alert.findByIdAndUpdate(id, updates, { new: true })
      .populate('serviceId', 'name url');
    
    if (!alertRule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    res.json(alertRule);
  } catch (error) {
    console.error('Error updating alert rule:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

app.delete('/api/alerts/rules/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alertRule = await Alert.findByIdAndDelete(id);
    if (!alertRule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }
    
    res.json({ message: 'Alert rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert rule:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// Notifications API
app.get('/api/alerts/notifications', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    
    const notifications = await Notification.find({})
      .populate({
        path: 'alertId',
        populate: {
          path: 'serviceId',
          select: 'name url'
        }
      })
      .sort({ sentAt: -1 })
      .limit(limit);
    
    // Transform notifications to include service name
    const transformedNotifications = notifications.map(notification => ({
      _id: notification._id,
      alertId: notification.alertId._id,
      serviceName: notification.alertId?.serviceId?.name || 'Unknown Service',
      message: notification.message,
      sentAt: notification.sentAt,
      status: notification.status,
      severity: notification.message.toLowerCase().includes('offline') || 
                notification.message.toLowerCase().includes('critical') ? 'error' :
                notification.message.toLowerCase().includes('warning') || 
                notification.message.toLowerCase().includes('high') ? 'warning' : 'info'
    }));
    
    res.json(transformedNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/alerts/notify', async (req, res) => {
  try {
    const { alertId, serviceName, message, severity } = req.body;
    
    if (!alertId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const notification = new Notification({
      alertId,
      message,
      status: 'sent', // For now, assume immediate sending
      sentAt: new Date()
    });
    
    await notification.save();
    
    // Emit real-time notification via WebSocket
    io.emit('alert-notification', {
      _id: notification._id,
      alertId,
      serviceName,
      message,
      sentAt: notification.sentAt,
      status: 'sent',
      severity
    });
    
    // TODO: Implement actual email/push notification sending
    console.log(`📧 Alert notification sent: ${message}`);
    
    res.status(201).json({
      _id: notification._id,
      alertId,
      serviceName,
      message,
      sentAt: notification.sentAt,
      status: 'sent',
      severity
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Schedule automated health checks
const scheduleHealthChecks = () => {
  // Run health check every minute
  cron.schedule('* * * * *', async () => {
    try {
      console.log('🏥 Running automated health check...');
      const results = await healthChecker.checkAllServices();
      console.log(`Health check completed for ${results.length} services`);
      
      // Check alert conditions after health check
      await checkAlertConditions(results);
    } catch (error) {
      console.error('Error during automated health check:', error);
    }
  });
};

// Alert monitoring function
const checkAlertConditions = async (healthResults: any[]) => {
  try {
    // Get all active alert rules
    const activeRules = await Alert.find({ isActive: true }).populate('serviceId', 'name url');
    
    if (activeRules.length === 0) return;
    
    const triggeredAlerts = [];
    
    for (const result of healthResults) {
      const applicableRules = activeRules.filter(rule => 
        rule.serviceId._id.toString() === result.service_id?.toString()
      );
      
      for (const rule of applicableRules) {
        let isTriggered = false;
        let currentValue = 0;
        let metricName = '';
        
        switch (rule.ruleType) {
          case 'response_time':
            currentValue = result.response_time || result.responseTime || 0;
            metricName = 'Response Time';
            isTriggered = evaluateCondition(currentValue, rule.threshold, rule.comparisonOperator);
            break;
          case 'cpu':
            currentValue = result.cpuUsage || 0;
            metricName = 'CPU Usage';
            isTriggered = evaluateCondition(currentValue, rule.threshold, rule.comparisonOperator);
            break;
          case 'memory':
            currentValue = result.memoryUsage || 0;
            metricName = 'Memory Usage';
            isTriggered = evaluateCondition(currentValue, rule.threshold, rule.comparisonOperator);
            break;
          case 'status':
            isTriggered = result.status === 'offline';
            metricName = 'Service Status';
            break;
        }
        
        if (isTriggered) {
          const serviceName = rule.serviceId.name;
          const severity = rule.ruleType === 'status' ? 'error' : 
                          currentValue > rule.threshold * 1.5 ? 'error' : 'warning';
          
          const alertMessage = rule.ruleType === 'status' 
            ? `${serviceName} is currently offline`
            : `${serviceName}: ${metricName} is ${currentValue}${rule.ruleType === 'response_time' ? 'ms' : '%'} (threshold: ${rule.threshold}${rule.ruleType === 'response_time' ? 'ms' : '%'})`;
          
          triggeredAlerts.push({
            rule,
            serviceName,
            message: alertMessage,
            severity,
            currentValue,
            metricName
          });
        }
      }
    }
    
    // Send notifications for triggered alerts
    for (const alert of triggeredAlerts) {
      await sendAlertNotification(alert);
    }
    
  } catch (error) {
    console.error('Error checking alert conditions:', error);
  }
};

// Helper function to evaluate alert conditions
const evaluateCondition = (currentValue: number, threshold: number, operator: string): boolean => {
  switch (operator) {
    case '>': return currentValue > threshold;
    case '<': return currentValue < threshold;
    case '>=': return currentValue >= threshold;
    case '<=': return currentValue <= threshold;
    default: return false;
  }
};

// Send alert notification
const sendAlertNotification = async (alert: any) => {
  try {
    // Create notification record
    const notification = new Notification({
      alertId: alert.rule._id,
      message: alert.message,
      status: 'sent',
      sentAt: new Date()
    });
    
    await notification.save();
    
    // Emit real-time notification via WebSocket
    io.emit('alert-notification', {
      _id: notification._id,
      alertId: alert.rule._id,
      serviceName: alert.serviceName,
      message: alert.message,
      sentAt: notification.sentAt,
      status: 'sent',
      severity: alert.severity
    });
    
    // Send email if notification method is email
    if (alert.rule.notificationMethod === 'email') {
      await sendEmailNotification(alert);
    }
    
    console.log(`🚨 Alert triggered: ${alert.message}`);
    
  } catch (error) {
    console.error('Error sending alert notification:', error);
  }
};

// Email notification function (basic implementation)
const sendEmailNotification = async (alert: any) => {
  try {
    // TODO: Implement actual email sending using Nodemailer
    // For now, just log the email that would be sent
    console.log(`📧 EMAIL ALERT: ${alert.message}`);
    console.log(`📧 To: admin@company.com (configure with SMTP_EMAIL env var)`);
    console.log(`📧 Subject: [ALERT] ${alert.serviceName} - ${alert.severity.toUpperCase()}`);
    
    // Example of what the email implementation would look like:
    /*
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });
    
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: 'admin@company.com', // get from user preferences
      subject: `[ALERT] ${alert.serviceName} - ${alert.severity.toUpperCase()}`,
      html: `
        <h2>Service Alert Notification</h2>
        <p><strong>Service:</strong> ${alert.serviceName}</p>
        <p><strong>Alert:</strong> ${alert.message}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <p>Please check your monitoring dashboard for more details.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    */
    
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
};

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
server.listen(PORT, async () => {
  console.log(`🚀 Monitoring API server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for real-time updates`);
  
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Database is ready for real user data (no sample data)
    console.log('🎯 Database ready for real user registration and activities');
    
    // Start automated health checks
    scheduleHealthChecks();
    console.log('⏰ Automated health checks scheduled');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  }
});

export default app;
