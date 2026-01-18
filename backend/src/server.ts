import http from 'http';
import { createApp } from "./app"
import { configs } from './config/env';
import { connectDB } from './config/database';
import { initializeSocket } from './utils/socket';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('Database connected successfully');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.io
    initializeSocket(server);

    // Start server
    server.listen(configs.PORT, () => {
      console.log(`Server is running on port ${configs.PORT}`);
      console.log(`Environment: ${configs.NODE_ENV}`);
      console.log(`CORS Origin: ${configs.CORS_ORIGIN}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal, closing server...');
      
      server.close(async () => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();