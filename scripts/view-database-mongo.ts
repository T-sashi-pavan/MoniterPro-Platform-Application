import connectDB from '../lib/mongodb';
import { User, Service, ServiceMetric, Alert, Notification, Log } from '../lib/models';

async function viewDatabase() {
  try {
    console.log('🔍 MONGODB MONITORING DATABASE OVERVIEW');
    console.log('=' .repeat(50));
    
    // Connect to MongoDB
    await connectDB();
    
    // Users collection
    console.log('\n📊 USERS COLLECTION:');
    const users = await User.find({}, '-password').sort({ createdAt: 1 });
    if (users.length === 0) {
      console.log('No users found');
    } else {
      console.table(users.map(user => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.createdAt?.toISOString()
      })));
    }
    
    // Services collection
    console.log('\n🔧 SERVICES COLLECTION:');
    const services = await Service.find({}).populate('ownerId', 'name').sort({ createdAt: 1 });
    if (services.length === 0) {
      console.log('No services found');
    } else {
      console.table(services.map(service => ({
        id: service._id.toString(),
        name: service.name,
        url: service.url,
        owner: (service.ownerId as any)?.name || 'Unknown',
        created_at: service.createdAt?.toISOString()
      })));
    }
    
    // Recent metrics
    console.log('\n📈 RECENT SERVICE METRICS (Last 10):');
    const metrics = await ServiceMetric.find({})
      .populate('serviceId', 'name')
      .sort({ lastChecked: -1 })
      .limit(10);
    
    if (metrics.length === 0) {
      console.log('No metrics found');
    } else {
      console.table(metrics.map(metric => ({
        id: metric._id.toString(),
        service_name: (metric.serviceId as any)?.name || 'Unknown',
        status: metric.status,
        response_time: metric.responseTime ? `${metric.responseTime}ms` : 'N/A',
        last_checked: metric.lastChecked?.toISOString()
      })));
    }
    
    // Recent logs
    console.log('\n📝 RECENT LOGS (Last 10):');
    const logs = await Log.find({})
      .populate('serviceId', 'name')
      .sort({ timestamp: -1 })
      .limit(10);
    
    if (logs.length === 0) {
      console.log('No logs found');
    } else {
      console.table(logs.map(log => ({
        id: log._id.toString(),
        service_name: (log.serviceId as any)?.name || 'Unknown',
        level: log.level,
        message: log.message,
        timestamp: log.timestamp?.toISOString()
      })));
    }
    
    // Alerts
    console.log('\n🚨 ALERTS:');
    const alerts = await Alert.find({})
      .populate('serviceId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    if (alerts.length === 0) {
      console.log('No alerts found');
    } else {
      console.table(alerts.map(alert => ({
        id: alert._id.toString(),
        service_name: (alert.serviceId as any)?.name || 'Unknown',
        rule_type: alert.ruleType,
        threshold: alert.threshold,
        operator: alert.comparisonOperator,
        notification: alert.notificationMethod,
        created_at: alert.createdAt?.toISOString()
      })));
    }
    
    // Notifications
    console.log('\n📬 NOTIFICATIONS:');
    const notifications = await Notification.find({})
      .populate({
        path: 'alertId',
        populate: {
          path: 'serviceId',
          select: 'name'
        }
      })
      .sort({ sentAt: -1 })
      .limit(5);
    
    if (notifications.length === 0) {
      console.log('No notifications found');
    } else {
      console.table(notifications.map(notification => ({
        id: notification._id.toString(),
        message: notification.message,
        status: notification.status,
        sent_at: notification.sentAt?.toISOString()
      })));
    }
    
    // Database statistics
    console.log('\n📊 DATABASE STATISTICS:');
    const stats = await Promise.all([
      User.countDocuments({}),
      Service.countDocuments({}),
      ServiceMetric.countDocuments({}),
      Alert.countDocuments({}),
      Notification.countDocuments({}),
      Log.countDocuments({})
    ]);
    
    console.table([{
      total_users: stats[0],
      total_services: stats[1],
      total_metrics: stats[2],
      total_alerts: stats[3],
      total_notifications: stats[4],
      total_logs: stats[5]
    }]);
    
    // Connection info
    console.log('\n🔗 CONNECTION INFO:');
    console.log(`MongoDB URI: ${process.env.MONGODB_URI}`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log('Status: ✅ Connected');
    
  } catch (error) {
    console.error('❌ Error viewing database:', error);
  } finally {
    process.exit(0);
  }
}

viewDatabase();
