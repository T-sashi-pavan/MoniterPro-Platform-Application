import connectDB from '../lib/mongodb';
import { User, Service, ServiceMetric, Alert, Notification, Log } from '../lib/models';

async function seedDatabase() {
  try {
    console.log('🌱 Starting MongoDB database seeding...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await Promise.all([
      ServiceMetric.deleteMany({}),
      Log.deleteMany({}),
      Notification.deleteMany({}),
      Alert.deleteMany({}),
      Service.deleteMany({}),
      User.deleteMany({})
    ]);
    
    // Create users
    console.log('👥 Creating users...');
    const users = await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      },
      {
        name: 'Developer User',
        email: 'dev@example.com',
        password: 'password123',
        role: 'developer'
      },
      {
        name: 'Viewer User',
        email: 'viewer@example.com',
        password: 'password123',
        role: 'viewer'
      }
    ]);
    
    console.log(`✅ Created ${users.length} users`);
    
    // Create services
    console.log('🔧 Creating services...');
    const services = await Service.insertMany([
      {
        name: 'Google',
        url: 'https://www.google.com',
        ownerId: users[0]._id
      },
      {
        name: 'GitHub',
        url: 'https://github.com',
        ownerId: users[0]._id
      },
      {
        name: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        ownerId: users[1]._id
      },
      {
        name: 'MDN Docs',
        url: 'https://developer.mozilla.org',
        ownerId: users[1]._id
      },
      {
        name: 'JSON Placeholder API',
        url: 'https://jsonplaceholder.typicode.com',
        ownerId: users[0]._id
      },
      {
        name: 'Example API',
        url: 'https://httpbin.org/status/200',
        ownerId: users[2]._id
      }
    ]);
    
    console.log(`✅ Created ${services.length} services`);
    
    // Create some sample metrics
    console.log('📊 Creating sample metrics...');
    const sampleMetrics = [];
    for (const service of services) {
      // Create 5 sample metrics for each service
      for (let i = 0; i < 5; i++) {
        sampleMetrics.push({
          serviceId: service._id,
          status: Math.random() > 0.1 ? 'online' : 'offline',
          responseTime: Math.floor(Math.random() * 2000) + 100,
          lastChecked: new Date(Date.now() - (i * 60 * 1000)) // Every minute back
        });
      }
    }
    
    const metrics = await ServiceMetric.insertMany(sampleMetrics);
    console.log(`✅ Created ${metrics.length} sample metrics`);
    
    // Create sample logs
    console.log('📝 Creating sample logs...');
    const sampleLogs = [];
    for (const service of services) {
      sampleLogs.push(
        {
          serviceId: service._id,
          level: 'info',
          message: `Service ${service.name} is healthy`,
          timestamp: new Date()
        },
        {
          serviceId: service._id,
          level: 'warning',
          message: `High response time detected for ${service.name}`,
          timestamp: new Date(Date.now() - 30 * 60 * 1000)
        }
      );
    }
    
    const logs = await Log.insertMany(sampleLogs);
    console.log(`✅ Created ${logs.length} sample logs`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Services: ${services.length}`);
    console.log(`- Metrics: ${metrics.length}`);
    console.log(`- Logs: ${logs.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
