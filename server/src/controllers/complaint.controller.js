import { getPrisma } from '../config/db.js';
import {
  encryptText,
  decryptText,
  sha256,
  hashIpAddress,
  generateTrackingId
} from '../utils/crypto.util.js';
import { nlpService } from '../services/nlp.service.js';
import { storageService } from '../services/storage.service.js';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';
import { config } from '../config/index.js';

export const submitComplaint = async (req, res) => {
  try {
    const {
      department,
      category,
      incidentDate,
      incidentLocation,
      city,
      state,
      description,
      bribeAmount,
      accusedOfficial,
      contactEmail,
      contactPhone,
      notificationChannel = 'NONE',
      isAnonymous = true,
      consentAgreed = true,
      languageCode = 'en'
    } = req.body;

    if (!department || !category || !incidentDate || !incidentLocation || !city || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing: department, category, incidentDate, incidentLocation, city, and description.'
      });
    }

    if (consentAgreed !== 'true' && consentAgreed !== true) {
      return res.status(400).json({
        success: false,
        message: 'You must review and agree to the whistleblowing privacy and accuracy consent notice.'
      });
    }

    const prisma = getPrisma();
    const uploadedFiles = req.files || [];

    // 1. Run Machine Learning & NLP Risk Analysis Engine
    const nlpResult = nlpService.analyzeComplaint({
      description,
      statedBribeAmount: bribeAmount,
      department,
      category,
      evidenceCount: uploadedFiles.length
    });

    // 2. Generate secure tracking ID and search hash
    const trackingId = generateTrackingId();
    const trackingCodeHash = sha256(trackingId);

    // 3. Encrypt sensitive fields with AES-256-GCM
    const encryptedDescription = encryptText(description);
    const encryptedBribeAmount = bribeAmount ? encryptText(String(bribeAmount)) : null;
    const encryptedAccused = accusedOfficial ? encryptText(accusedOfficial) : null;
    const encryptedContactInfo = (contactEmail || contactPhone)
      ? encryptText(JSON.stringify({ email: contactEmail || null, phone: contactPhone || null }))
      : null;

    // 4. Calculate automated retention expiry date (e.g. 365 days from now)
    const retentionExpiryDate = new Date(Date.now() + config.retention.complaintRetentionDays * 24 * 60 * 60 * 1000);

    // 5. Store in PostgreSQL via Prisma
    const complaint = await prisma.complaint.create({
      data: {
        trackingId,
        trackingCodeHash,
        status: 'SUBMITTED',
        priority: nlpResult.riskLevel,
        department,
        category,
        incidentDate: new Date(incidentDate),
        incidentLocation,
        city,
        state: state || null,
        encryptedDescription,
        encryptedBribeAmount,
        bribeAmountNumeric: nlpResult.nlpInsights.financialAnalysis.amount || (bribeAmount ? parseFloat(bribeAmount) : null),
        encryptedAccused,
        encryptedContactInfo,
        notificationChannel: notificationChannel || (contactEmail ? 'EMAIL' : 'NONE'),
        isAnonymous: isAnonymous === 'true' || isAnonymous === true,
        consentAgreed: true,
        ipHash: hashIpAddress(req.ip),
        riskScore: nlpResult.score,
        riskLevel: nlpResult.riskLevel,
        riskFactors: JSON.stringify(nlpResult.factors),
        nlpAnalysis: JSON.stringify(nlpResult.nlpInsights),
        languageCode: languageCode || 'en',
        retentionExpiryDate
      }
    });

    // 6. Encrypt and save evidence files
    const evidenceRecords = [];
    for (const file of uploadedFiles) {
      const savedEvidenceMeta = await storageService.saveEvidenceFile({
        file,
        complaintId: complaint.id
      });

      const evRecord = await prisma.evidence.create({
        data: {
          complaintId: complaint.id,
          ...savedEvidenceMeta
        }
      });
      evidenceRecords.push(evRecord);
    }

    // 7. Create Genesis Timeline entry
    await prisma.timeline.create({
      data: {
        complaintId: complaint.id,
        newStatus: 'SUBMITTED',
        remarks: 'Complaint securely registered and encrypted in the repository. AI risk classification applied.',
        isPublic: true
      }
    });

    // 8. Log to Tamper-Evident Hash Chain
    await auditService.logEvent({
      entityType: 'COMPLAINT',
      entityId: complaint.id,
      action: 'COMPLAINT_SUBMISSION',
      user: null,
      ipAddressHash: hashIpAddress(req.ip),
      details: {
        trackingId: complaint.trackingId,
        department: complaint.department,
        riskLevel: complaint.riskLevel,
        riskScore: complaint.riskScore,
        evidenceCount: evidenceRecords.length
      }
    });

    // 9. Dispatch Email Confirmation if permitted
    if (contactEmail && (notificationChannel === 'EMAIL' || !notificationChannel)) {
      notificationService.notifySubmission({
        complaintId: complaint.id,
        trackingId: complaint.trackingId,
        recipientEmail: contactEmail,
        department: complaint.department,
        category: complaint.category
      }).catch(err => console.warn('Email dispatch background notice:', err.message));
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted anonymously and securely.',
      trackingId: complaint.trackingId,
      riskAssessment: {
        score: nlpResult.score,
        level: nlpResult.riskLevel,
        summary: nlpResult.nlpInsights.summary
      },
      evidenceAttached: evidenceRecords.length
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public Anonymous Complaint Tracking by Tracking ID
 */
export const trackComplaint = async (req, res) => {
  try {
    const { trackingId } = req.params;
    if (!trackingId) {
      return res.status(400).json({ success: false, message: 'Tracking ID is required.' });
    }

    const prisma = getPrisma();
    const complaint = await prisma.complaint.findUnique({
      where: { trackingId: trackingId.trim().toUpperCase() },
      include: {
        timelines: {
          where: { isPublic: true },
          orderBy: { createdAt: 'desc' }
        },
        evidences: {
          select: {
            id: true,
            originalFilename: true,
            mimeType: true,
            fileSizeBytes: true,
            uploadedAt: true
          }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'No complaint found matching this Tracking ID. Please verify and try again.'
      });
    }

    // Generate signed download tokens for attached evidence so citizen can view their submitted evidence
    const evidencesWithTokens = complaint.evidences.map(ev => ({
      ...ev,
      downloadToken: storageService.generateSignedAccessToken(ev.id, complaint.trackingId, 3600).token
    }));

    return res.json({
      success: true,
      complaint: {
        trackingId: complaint.trackingId,
        status: complaint.status,
        priority: complaint.priority,
        department: complaint.department,
        category: complaint.category,
        incidentDate: complaint.incidentDate,
        city: complaint.city,
        state: complaint.state,
        riskLevel: complaint.riskLevel,
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
        timelines: complaint.timelines,
        evidences: evidencesWithTokens
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Staff / Admin: List all complaints with pagination, filtering, search
 */
export const listComplaints = async (req, res) => {
  try {
    const prisma = getPrisma();
    const {
      status,
      riskLevel,
      department,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (department) where.department = department;

    // Filter by investigator's own department if restricted
    if (req.user.role === 'INVESTIGATOR' && req.user.department) {
      where.department = req.user.department;
    }

    if (search) {
      where.OR = [
        { trackingId: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [total, rawComplaints] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.findMany({
        where,
        skip,
        take,
        include: {
          evidences: {
            select: { id: true, originalFilename: true, mimeType: true, fileSizeBytes: true }
          },
          timelines: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: [
          { riskScore: 'desc' },
          { createdAt: 'desc' }
        ]
      })
    ]);

    // Decrypt fields for authorized roles
    const complaints = rawComplaints.map(c => {
      let description = '[ENCRYPTED_ANALYST_VIEW]';
      let accused = null;
      let contactInfo = null;

      // Only SUPER_ADMIN, ADMIN, and INVESTIGATOR can decrypt full allegations
      if (['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR'].includes(req.user.role)) {
        description = decryptText(c.encryptedDescription);
        accused = decryptText(c.encryptedAccused);
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN') {
          contactInfo = c.encryptedContactInfo ? JSON.parse(decryptText(c.encryptedContactInfo) || '{}') : null;
        }
      }

      return {
        id: c.id,
        trackingId: c.trackingId,
        status: c.status,
        priority: c.priority,
        department: c.department,
        category: c.category,
        incidentDate: c.incidentDate,
        incidentLocation: c.incidentLocation,
        city: c.city,
        state: c.state,
        bribeAmount: c.bribeAmountNumeric,
        description,
        accusedOfficial: accused,
        contactInfo,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        riskFactors: JSON.parse(c.riskFactors || '[]'),
        nlpAnalysis: JSON.parse(c.nlpAnalysis || '{}'),
        isAnonymous: c.isAnonymous,
        evidenceCount: c.evidences.length,
        evidences: c.evidences,
        lastTimeline: c.timelines[0] || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      };
    });

    return res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / take),
      complaints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Single Complaint details for authorized investigator/admin
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getPrisma();

    const c = await prisma.complaint.findUnique({
      where: { id },
      include: {
        evidences: true,
        timelines: {
          include: { updatedBy: { select: { fullName: true, role: true } } },
          orderBy: { createdAt: 'desc' }
        },
        grievanceSyncs: true
      }
    });

    if (!c) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const description = decryptText(c.encryptedDescription);
    const accused = decryptText(c.encryptedAccused);
    const bribeAmountText = decryptText(c.encryptedBribeAmount);
    let contactInfo = null;

    if (['SUPER_ADMIN', 'ADMIN'].includes(req.user.role) && c.encryptedContactInfo) {
      try {
        contactInfo = JSON.parse(decryptText(c.encryptedContactInfo));
      } catch {
        contactInfo = null;
      }
    }

    // Attach short-lived download tokens for each evidence file
    const evidencesWithTokens = c.evidences.map(ev => ({
      id: ev.id,
      originalFilename: ev.originalFilename,
      mimeType: ev.mimeType,
      fileSizeBytes: ev.fileSizeBytes,
      checksumSha256: ev.checksumSha256,
      storageProvider: ev.storageProvider,
      uploadedAt: ev.uploadedAt,
      downloadToken: storageService.generateSignedAccessToken(ev.id, req.user.id, 1800).token
    }));

    return res.json({
      success: true,
      complaint: {
        id: c.id,
        trackingId: c.trackingId,
        status: c.status,
        priority: c.priority,
        department: c.department,
        category: c.category,
        incidentDate: c.incidentDate,
        incidentLocation: c.incidentLocation,
        city: c.city,
        state: c.state,
        description,
        accusedOfficial: accused,
        bribeAmount: c.bribeAmountNumeric || (bribeAmountText ? Number(bribeAmountText) : null),
        contactInfo,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        riskFactors: JSON.parse(c.riskFactors || '[]'),
        nlpAnalysis: JSON.parse(c.nlpAnalysis || '{}'),
        isAnonymous: c.isAnonymous,
        languageCode: c.languageCode,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        evidences: evidencesWithTokens,
        timelines: c.timelines,
        grievanceSyncs: c.grievanceSyncs
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Complaint Status & Append Investigation Remarks
 */
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, isPublic = true } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const prisma = getPrisma();
    const complaint = await prisma.complaint.findUnique({
      where: { id }
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const oldStatus = complaint.status;

    // Update status
    const updated = await prisma.complaint.update({
      where: { id },
      data: { status }
    });

    // Create timeline entry
    await prisma.timeline.create({
      data: {
        complaintId: id,
        oldStatus,
        newStatus: status,
        remarks: remarks || `Status changed from ${oldStatus} to ${status}.`,
        updatedById: req.user.id,
        isPublic: isPublic === true || isPublic === 'true'
      }
    });

    // Cryptographic audit log
    await auditService.logEvent({
      entityType: 'COMPLAINT',
      entityId: id,
      action: 'STATUS_TRANSITION',
      user: req.user,
      ipAddressHash: hashIpAddress(req.ip),
      details: {
        trackingId: complaint.trackingId,
        oldStatus,
        newStatus: status,
        remarks
      }
    });

    // Send email notification if complainant provided email
    if (complaint.encryptedContactInfo) {
      try {
        const contact = JSON.parse(decryptText(complaint.encryptedContactInfo));
        if (contact && contact.email) {
          notificationService.notifyStatusChange({
            complaintId: complaint.id,
            trackingId: complaint.trackingId,
            recipientEmail: contact.email,
            oldStatus,
            newStatus: status,
            remarks
          }).catch(err => console.warn('Email notify error:', err.message));
        }
      } catch (err) {
        console.warn('Could not parse contact for email notify:', err.message);
      }
    }

    return res.json({
      success: true,
      message: `Status updated to ${status}`,
      complaint: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

