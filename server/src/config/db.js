import { PrismaClient } from '@prisma/client';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import { grievanceService } from '../services/grievance.service.js';
import { analyticsService } from '../services/analytics.service.js';
import { retentionService } from '../services/retention.service.js';

let prisma;

export const initDatabase = async () => {
  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
    });

    await prisma.$connect();
    console.log('✅ PostgreSQL connected successfully via Prisma ORM');

    // Inject database client into dependent enterprise services
    auditService.setPrisma(prisma);
    notificationService.setPrisma(prisma);
    grievanceService.setPrisma(prisma);
    analyticsService.setPrisma(prisma);
    retentionService.setPrisma(prisma);

    return prisma;
  } catch (error) {
    console.error('⚠️ Database connection warning:', error.message);
    console.log('ℹ️ Tip: To run PostgreSQL with Docker, execute: docker-compose up -d');
    // Still assign so references don't crash
    auditService.setPrisma(prisma);
    notificationService.setPrisma(prisma);
    grievanceService.setPrisma(prisma);
    analyticsService.setPrisma(prisma);
    retentionService.setPrisma(prisma);
    return prisma;
  }
};

export const getPrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
};

