import app from './app';
import { env } from './config/environment';
import { connectDatabase } from './config/database';

// Handle uncaught exceptions globally
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const startServer = async () => {
  // Connect to MongoDB Atlas
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  });

  // Handle unhandled promise rejections globally
  process.on('unhandledRejection', (err: Error) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
    console.error(err.name, err.message, err.stack);
    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();
