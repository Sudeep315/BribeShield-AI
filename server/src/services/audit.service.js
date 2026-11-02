import { sha256 } from '../utils/crypto.util.js';

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class AuditService {
  constructor() {
    this.prisma = null;
  }

  setPrisma(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Calculate block hash for tamper-evident chain
   */
  calculateBlockHash({ prevHash, sequenceNumber, entityType, entityId, action, performedById, createdAt, details }) {
    const canonicalString = [
      prevHash,
      sequenceNumber,
      entityType,
      entityId,
      action,
      performedById || 'ANONYMOUS_OR_SYSTEM',
      new Date(createdAt).toISOString(),
      typeof details === 'string' ? details : JSON.stringify(details)
    ].join('|');

    return sha256(canonicalString);
  }

  /**
   * Log an audit event with cryptographic link to previous entry
   */
  async logEvent({ entityType, entityId, action, user, ipAddressHash, details = {} }, tx = null) {
    const db = tx || this.prisma;
    if (!db) {
      console.warn('Prisma client not yet initialized for audit logging');
      return null;
    }

    try {
      // Find latest audit record to get previous hash and next sequence number
      const latestRecord = await db.auditLog.findFirst({
        orderBy: { sequenceNumber: 'desc' }
      });

      const sequenceNumber = latestRecord ? latestRecord.sequenceNumber + 1 : 1;
      const prevHash = latestRecord ? latestRecord.hash : GENESIS_HASH;
      const createdAt = new Date();

      const detailsString = typeof details === 'string' ? details : JSON.stringify(details);

      const hash = this.calculateBlockHash({
        prevHash,
        sequenceNumber,
        entityType,
        entityId,
        action,
        performedById: user?.id,
        createdAt,
        details: detailsString
      });

      const record = await db.auditLog.create({
        data: {
          sequenceNumber,
          prevHash,
          hash,
          entityType,
          entityId,
          action,
          performedById: user?.id || null,
          performedByName: user?.fullName || (user ? 'Admin Staff' : 'System/Anonymous'),
          ipAddressHash: ipAddressHash || null,
          details: detailsString,
          createdAt
        }
      });

      return record;
    } catch (error) {
      console.error('Audit logging failed:', error.message);
      // In production, we should handle audit failure gracefully or throw based on compliance policy
      return null;
    }
  }

  /**
   * Mathematically verify the entire audit log chain integrity
   * Detects any altered records, deleted entries, or broken chains
   */
  async verifyChainIntegrity() {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized');
    }

    const logs = await this.prisma.auditLog.findMany({
      orderBy: { sequenceNumber: 'asc' }
    });

    if (logs.length === 0) {
      return {
        isValid: true,
        totalRecords: 0,
        message: 'Audit chain is empty. Genesis state intact.'
      };
    }

    let expectedPrevHash = GENESIS_HASH;
    const errors = [];

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];
      const expectedSequence = i + 1;

      // 1. Check sequence ordering
      if (record.sequenceNumber !== expectedSequence) {
        errors.push({
          recordId: record.id,
          sequenceNumber: record.sequenceNumber,
          error: `Sequence gap detected: expected #${expectedSequence}, got #${record.sequenceNumber}`
        });
      }

      // 2. Check previous hash reference
      if (record.prevHash !== expectedPrevHash) {
        errors.push({
          recordId: record.id,
          sequenceNumber: record.sequenceNumber,
          error: `Broken link: record prevHash "${record.prevHash}" does not match previous block hash "${expectedPrevHash}"`
        });
      }

      // 3. Recalculate block hash
      const calculatedHash = this.calculateBlockHash({
        prevHash: record.prevHash,
        sequenceNumber: record.sequenceNumber,
        entityType: record.entityType,
        entityId: record.entityId,
        action: record.action,
        performedById: record.performedById,
        createdAt: record.createdAt,
        details: record.details
      });

      if (calculatedHash !== record.hash) {
        errors.push({
          recordId: record.id,
          sequenceNumber: record.sequenceNumber,
          error: `Tampering detected: calculated hash "${calculatedHash}" does not match stored hash "${record.hash}"`
        });
      }

      expectedPrevHash = record.hash;
    }

    return {
      isValid: errors.length === 0,
      totalRecords: logs.length,
      latestHash: expectedPrevHash,
      errors,
      verifiedAt: new Date().toISOString()
    };
  }
}

export const auditService = new AuditService();

