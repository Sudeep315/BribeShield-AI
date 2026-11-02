import fs from 'fs';
import { config } from '../config/index.js';
import { auditService } from './audit.service.js';

class RetentionService {
  constructor() {
    this.prisma = null;
  }

  setPrisma(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Run automated retention purge for complaints older than retention policy threshold
   */
  async purgeExpiredRecords() {
    if (!this.prisma) return { purged: 0, errors: [] };

    const retentionCutoff = new Date(Date.now() - config.retention.complaintRetentionDays * 24 * 60 * 60 * 1000);
    const expiredComplaints = await this.prisma.complaint.findMany({
      where: {
        OR: [
          { retentionExpiryDate: { lte: new Date() } },
          { createdAt: { lte: retentionCutoff }, status: { in: ['RESOLVED', 'REJECTED'] } }
        ]
      },
      include: { evidences: true }
    });

    let purgedCount = 0;
    const errors = [];

    for (const complaint of expiredComplaints) {
      try {
        // 1. Delete associated physical evidence files
        for (const evidence of complaint.evidences) {
          if (fs.existsSync(evidence.storagePath)) {
            fs.unlinkSync(evidence.storagePath);
          }
        }

        // 2. Log tamper-evident audit record BEFORE deletion
        await auditService.logEvent({
          entityType: 'COMPLAINT',
          entityId: complaint.id,
          action: 'AUTOMATED_PRIVACY_RETENTION_PURGE',
          user: null,
          details: {
            trackingId: complaint.trackingId,
            reason: 'Data retention lifespan exceeded statutory limit. Whistleblower records wiped.'
          }
        });

        // 3. Remove complaint from DB
        await this.prisma.complaint.delete({
          where: { id: complaint.id }
        });

        purgedCount += 1;
      } catch (err) {
        errors.push({ complaintId: complaint.id, error: err.message });
      }
    }

    return {
      purged: purgedCount,
      errors,
      executedAt: new Date().toISOString()
    };
  }
}

export const retentionService = new RetentionService();

