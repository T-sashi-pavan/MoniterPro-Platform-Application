import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function clearDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
    
    // Clear all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📋 Found collections:', collections.map(c => c.name));
    
    for (const collection of collections) {
      await mongoose.connection.db.dropCollection(collection.name);
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }
    
    console.log('✅ Database cleared successfully');
    console.log('🎯 Database is now empty and ready for real user data');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearDatabase();
