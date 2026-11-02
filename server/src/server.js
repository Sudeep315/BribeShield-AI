import app from './app.js';
import { config } from './config/index.js';
import { initDatabase, getPrisma } from './config/db.js';
import { retentionService } from './services/retention.service.js';

const startServer = async () => {
  try {
    console.log('🛡️  Starting BribeShield AI Server v2.0...');

    // Initialize PostgreSQL Database connection
    await initDatabase();

    // Setup periodic Data Retention Purge check (runs every 24 hours in background)
    if (config.retention.autoPurgeEnabled) {
      setInterval(async () => {
        try {
          console.log('[RetentionService] Running automated privacy compliance purge...');
          const result = await retentionService.purgeExpiredRecords();
          console.log(`[RetentionService] Purged ${result.purged} expired whistleblower records.`);
        } catch (e) {
          console.warn('[RetentionService] Auto-purge run skipped:', e.message);
        }
      }, 24 * 60 * 60 * 1000);
    }

    const server = app.listen(config.port, () => {
      console.log(`🚀 BribeShield AI Server is running on port ${config.port}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/health`);
      console.log(`🔒 AES-256 Encryption: ACTIVE`);
      console.log(`⛓️  Tamper-Evident Audit Chains: ACTIVE`);
      console.log(`🧠 NLP Risk Classification Engine: READY`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          const prisma = getPrisma();
          if (prisma) await prisma.$disconnect();
          console.log('Database connections closed cleanly.');
          process.exit(0);
        } catch (err) {
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

