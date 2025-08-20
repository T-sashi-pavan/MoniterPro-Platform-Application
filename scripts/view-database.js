const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function viewDatabase() {
  try {
    console.log('🔍 MONITORING DATABASE OVERVIEW');
    console.log('=' .repeat(50));
    
    // Users table
    console.log('\n📊 USERS TABLE:');
    const users = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY id');
    console.table(users.rows);
    
    // Services table
    console.log('\n🔧 SERVICES TABLE:');
    const services = await pool.query('SELECT id, name, url, owner_id, created_at FROM services ORDER BY id');
    console.table(services.rows);
    
    // Recent metrics
    console.log('\n📈 RECENT SERVICE METRICS (Last 10):');
    const metrics = await pool.query(`
      SELECT sm.id, s.name as service_name, sm.status, sm.response_time, 
             sm.cpu_usage, sm.memory_usage, sm.last_checked 
      FROM service_metrics sm 
      JOIN services s ON sm.service_id = s.id 
      ORDER BY sm.last_checked DESC 
      LIMIT 10
    `);
    console.table(metrics.rows);
    
    // Alerts
    console.log('\n🚨 ALERTS TABLE:');
    const alerts = await pool.query(`
      SELECT a.id, s.name as service_name, a.rule_type, a.threshold, 
             a.comparison_operator, a.notification_method, a.created_at 
      FROM alerts a 
      JOIN services s ON a.service_id = s.id 
      ORDER BY a.created_at DESC 
      LIMIT 5
    `);
    console.table(alerts.rows);
    
    // Notifications
    console.log('\n� RECENT NOTIFICATIONS:');
    const notifications = await pool.query(`
      SELECT n.id, a.rule_type, n.message, n.sent_at, n.status 
      FROM notifications n 
      JOIN alerts a ON n.alert_id = a.id 
      ORDER BY n.sent_at DESC 
      LIMIT 5
    `);
    console.table(notifications.rows);
    
    // Database stats
    console.log('\n📊 DATABASE STATISTICS:');
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM services) as total_services,
        (SELECT COUNT(*) FROM service_metrics) as total_metrics,
        (SELECT COUNT(*) FROM alerts) as total_alerts,
        (SELECT COUNT(*) FROM notifications) as total_notifications
    `);
    console.table(stats.rows);
    
  } catch (error) {
    console.error('❌ Error viewing database:', error.message);
  } finally {
    await pool.end();
  }
}

viewDatabase();
