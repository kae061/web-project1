import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kaeapp';

export async function connectDB(): Promise<void> {
  try {
    mongoose.connection.on('connected', () => {
      console.log('✅ Connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    console.log(`🔌 Attempting to connect to MongoDB at: ${MONGODB_URI}`);

    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 2000, // Reduced for faster fallback
        socketTimeoutMS: 45000,
      });
    } catch (localError) {
      console.warn('⚠️ Local MongoDB connection failed. Starting in-memory database...');
      
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      
      console.log(`🧠 In-memory MongoDB started at: ${uri}`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
    }
  } catch (error) {
    console.error('💥 Failed to connect to any MongoDB instance:', error);
    process.exit(1);
  }
}

export default connectDB;
