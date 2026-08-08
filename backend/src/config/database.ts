import mongoose from 'mongoose';
import { env } from './environment';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`📡 MongoDB connected successfully to cluster: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Handle process termination events to cleanly disconnect from MongoDB
const handleShutdown = async (signal: string) => {
  try {
    await mongoose.disconnect();
    console.log(`🔌 MongoDB disconnected cleanly via ${signal}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
