import { getPrisma } from '../config/db.js';
import { storageService } from '../services/storage.service.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

export const downloadEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;
    const authHeader = req.headers.authorization;

    let isAuthorized = false;

    // Check 1: Valid signed temporary access token (for anonymous citizens tracking their case)
    if (token) {
      const verified = storageService.verifySignedAccessToken(token);
      if (verified && verified.evidenceId === id) {
        isAuthorized = true;
      }
    }

    // Check 2: Valid Bearer JWT session for staff
    if (!isAuthorized && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret);
        if (decoded && ['SUPER_ADMIN', 'ADMIN', 'INVESTIGATOR'].includes(decoded.role)) {
          isAuthorized = true;
        }
      } catch {
        // Bearer token invalid
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Evidence files are encrypted and access-controlled. Valid signed token or staff authorization required.'
      });
    }

    const prisma = getPrisma();
    const evidence = await prisma.evidence.findUnique({
      where: { id }
    });

    if (!evidence) {
      return res.status(404).json({ success: false, message: 'Evidence record not found.' });
    }

    // Decrypt evidence on the fly
    const { buffer, mimeType, filename } = await storageService.getDecryptedEvidenceStream(evidence);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    return res.end(buffer);
  } catch (error) {
    console.error('Evidence stream error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

