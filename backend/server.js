const app = require('./app');
const env = require('./config/env');
const { startScheduler } = require('./services/scheduler.service');

// Validate environment variables
try {
  env.validate();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Start server
const server = app.listen(env.PORT, () => {
  console.log(`
🚀 Money Manager API Server Started!
   Environment: ${env.NODE_ENV}
   Port: ${env.PORT}
   Base URL: ${env.BASE_URL}
   Time: ${new Date().toISOString()}
  `);
  
  // Start notification scheduler in production
  if (env.NODE_ENV === 'production') {
    startScheduler();
    console.log('✓ Notification scheduler started');
  }
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
