import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cron from 'node-cron';
import dotenv from 'dotenv';
import connectDB from '../lib/mongodb';
import { User, Service, ServiceMetric, Alert, Notification, Log } from '../lib/models';
import { HealthChecker } from '../lib/health-checker';

dotenv.config({ path: '.env.local' });

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const healthChecker = new HealthChecker();

// Middleware
app.use(cors());
app.use(express.json());

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API Routes

// Get all services
app.get('/api/services', async (req, res) => {
  try {
    const { rows } = await pool.query<Service>(`
      SELECT s.*, u.name as owner_name 
      FROM services s 
      LEFT JOIN users u ON s.owner_id = u.id 
      ORDER BY s.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Add new service
app.post('/api/services', async (req, res) => {
  const { name, url, owner_id } = req.body;
  
  try {
    const { rows } = await pool.query<Service>(
      'INSERT INTO services (name, url, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, url, owner_id || 1] // Default to user 1 if no owner specified
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

// Delete service
app.delete('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// Get latest metrics for all services
app.get('/api/metrics/latest', async (req, res) => {
  try {
    const metrics = await healthChecker.getLatestMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching latest metrics:', error);
    res.status(500).json({ error: 'Failed to fetch latest metrics' });
  }
});

// Get metrics history
app.get('/api/metrics/history', async (req, res) => {
  const { service_id, hours } = req.query;
  
  try {
    const metrics = await healthChecker.getMetricsHistory(
      service_id ? parseInt(service_id as string) : undefined,
      hours ? parseInt(hours as string) : 24
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({ error: 'Failed to fetch metrics history' });
  }
});

// Get dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [servicesResult, metricsResult, alertsResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as total FROM services'),
      pool.query(`
        SELECT 
          COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_services,
          AVG(response_time) as avg_response_time,
          COUNT(*) as total_checks
        FROM service_metrics 
        WHERE last_checked > NOW() - INTERVAL '1 hour'
      `),
      pool.query('SELECT COUNT(*) as total FROM alerts')
    ]);
    
    const totalServices = parseInt(servicesResult.rows[0].total);
    const metrics = metricsResult.rows[0];
    const totalAlerts = parseInt(alertsResult.rows[0].total);
    
    // Calculate uptime percentage
    const offlineServices = parseInt(metrics.offline_services || 0);
    const uptimePercentage = totalServices > 0 
      ? ((totalServices - offlineServices) / totalServices * 100).toFixed(2)
      : '100.00';
    
    res.json({
      totalServices,
      activeAlerts: offlineServices,
      avgResponseTime: Math.round(metrics.avg_response_time || 0),
      uptime: parseFloat(uptimePercentage)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get recent logs
app.get('/api/logs', async (req, res) => {
  const { limit = 50 } = req.query;
  
  try {
    const { rows } = await pool.query(`
      SELECT l.*, s.name as service_name 
      FROM logs l 
      JOIN services s ON l.service_id = s.id 
      ORDER BY l.timestamp DESC 
      LIMIT $1
    `, [limit]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Manual health check trigger
app.post('/api/health-check', async (req, res) => {
  try {
    console.log('Manual health check triggered');
    const results = await healthChecker.checkAllServices();
    await healthChecker.saveMetrics(results);
    
    // Broadcast results to all connected clients
    io.emit('health-check-results', results);
    
    res.json({ message: 'Health check completed', results });
  } catch (error) {
    console.error('Error during manual health check:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Automated health checks
const scheduleHealthChecks = () => {
  // Run every minute for testing, adjust as needed
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('Automated health check starting...');
      const results = await healthChecker.checkAllServices();
      await healthChecker.saveMetrics(results);
      
      // Broadcast results to all connected clients
      io.emit('health-check-results', results);
      
      console.log(`Health check completed for ${results.length} services`);
    } catch (error) {
      console.error('Error during automated health check:', error);
    }
  });
};

// Health check endpoint for the API itself
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database info endpoint
app.get('/api/database/info', async (req, res) => {
  try {
    const tables = await Promise.all([
      pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id'),
      pool.query('SELECT id, name, url, owner_id, created_at FROM services ORDER BY id'),
      pool.query(`
        SELECT sm.id, s.name as service_name, sm.status, sm.response_time, 
               sm.cpu_usage, sm.memory_usage, sm.last_checked 
        FROM service_metrics sm 
        JOIN services s ON sm.service_id = s.id 
        ORDER BY sm.last_checked DESC 
        LIMIT 20
      `),
      pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM services) as total_services,
          (SELECT COUNT(*) FROM service_metrics) as total_metrics,
          (SELECT COUNT(*) FROM alerts) as total_alerts,
          (SELECT COUNT(*) FROM notifications) as total_notifications
      `)
    ]);

    res.json({
      users: tables[0].rows,
      services: tables[1].rows,
      recent_metrics: tables[2].rows,
      statistics: tables[3].rows[0]
    });
  } catch (error) {
    console.error('Error fetching database info:', error);
    res.status(500).json({ error: 'Failed to fetch database information' });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Monitoring API server running on port ${PORT}`);
  console.log(`📊 WebSocket server ready for real-time updates`);
  
  // Test database connection
  pool.query('SELECT NOW()').then(() => {
    console.log('✅ Database connected successfully');
    
    // Start automated health checks
    scheduleHealthChecks();
    console.log('⏰ Automated health checks scheduled');
  }).catch((err) => {
    console.error('❌ Database connection failed:', err);
  });
});

export default app;
