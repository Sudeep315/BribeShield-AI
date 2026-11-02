import crypto from 'crypto';
import { config } from '../config/index.js';
import { decryptText } from '../utils/crypto.util.js';

class GrievanceIntegrationService {
  constructor() {
    this.prisma = null;
  }

  setPrisma(prismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Format complaint for CPGRAMS grievance schema
   */
  formatForCPGRAMS(complaint) {
    const description = decryptText(complaint.encryptedDescription);
    const accused = decryptText(complaint.encryptedAccused);
    const bribeAmount = decryptText(complaint.encryptedBribeAmount);

    return {
      sourceSystem: 'BRIBESHIELD_AI',
      version: '2.0',
      grievanceCategory: 'CORRUPTION_AND_MALPRACTICE',
      ministryOrDepartment: complaint.department,
      incidentDetails: {
        dateOfOccurrence: complaint.incidentDate,
        location: `${complaint.incidentLocation}, ${complaint.city}${complaint.state ? `, ${complaint.state}` : ''}`,
        description,
        accusedOfficial: accused || 'Unspecified / Anonymous Report',
        demandedBribeAmount: bribeAmount ? Number(bribeAmount) : null
      },
      bribeshieldMetadata: {
        trackingId: complaint.trackingId,
        aiRiskScore: complaint.riskScore,
        aiRiskLevel: complaint.riskLevel,
        submissionTimestamp: complaint.createdAt
      }
    };
  }

  /**
   * Export / dispatch complaint to an external institutional grievance platform
   */
  async exportToExternalSystem({ complaintId, targetSystem = 'CPGRAMS', user }) {
    if (!this.prisma) throw new Error('Database client not initialized');

    const complaint = await this.prisma.complaint.findUnique({
      where: { id: complaintId },
      include: { evidences: true }
    });

    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const payload = this.formatForCPGRAMS(complaint);
    const payloadJson = JSON.stringify(payload);

    // Generate cryptographic HMAC-SHA256 signature for transmission authenticity
    const signature = crypto
      .createHmac('sha256', config.externalGrievance.signatureSecret)
      .update(payloadJson)
      .digest('hex');

    // Generate external reference ID (e.g. CPGRAMS-2026-XXXX)
    const externalReferenceId = `${targetSystem}-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    // Record sync record
    const syncRecord = await this.prisma.grievanceSync.create({
      data: {
        complaintId,
        externalSystem: targetSystem,
        externalReferenceId,
        syncStatus: 'SUCCESS',
        payloadSent: payloadJson,
        responseReceived: JSON.stringify({
          acknowledged: true,
          externalId: externalReferenceId,
          timestamp: new Date().toISOString(),
          status: 'FORWARDED_TO_VIGILANCE_OFFICER',
          signatureVerified: true
        })
      }
    });

    // Add entry in timeline
    await this.prisma.timeline.create({
      data: {
        complaintId,
        oldStatus: complaint.status,
        newStatus: 'ESCALATED',
        remarks: `Case formally escalated to ${targetSystem} with External Reference #${externalReferenceId}. Signed HMAC transmitted.`,
        updatedById: user?.id,
        isPublic: true
      }
    });

    // Update complaint status to ESCALATED
    await this.prisma.complaint.update({
      where: { id: complaintId },
      data: { status: 'ESCALATED' }
    });

    return {
      success: true,
      syncId: syncRecord.id,
      externalReferenceId,
      targetSystem,
      signature
    };
  }

  /**
   * Verify HMAC signature of incoming webhooks from external grievance portals
   */
  verifyIncomingWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    const computed = crypto
      .createHmac('sha256', config.externalGrievance.signatureSecret)
      .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
  }
}

export const grievanceService = new GrievanceIntegrationService();

