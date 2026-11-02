import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { encryptBuffer, decryptBuffer } from '../utils/crypto.util.js';

class StorageService {
  constructor() {
    this.uploadDir = config.storage.uploadDir;
    this.ensureUploadDir();
  }

  ensureUploadDir() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Save uploaded file with AES-256-GCM encryption
   */
  async saveEvidenceFile({ file, complaintId }) {
    this.ensureUploadDir();

    const fileBuffer = fs.readFileSync(file.path);
    // 1. Encrypt buffer
    const { encryptedBuffer, ivHex, authTagHex, checksum } = encryptBuffer(fileBuffer);

    // 2. Generate secure stored filename: complaintUUID_timestamp_random.enc
    const fileExt = path.extname(file.originalname);
    const safeBase = path.basename(file.originalname, fileExt).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFilename = `${complaintId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.enc`;
    const destinationPath = path.join(this.uploadDir, storedFilename);

    // 3. Write encrypted content to disk (or push to S3 bucket if S3_COMPATIBLE is enabled)
    fs.writeFileSync(destinationPath, encryptedBuffer);

    // 4. Clean up Multer temporary file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } catch (err) {
      console.warn('Could not clean up temp file:', err.message);
    }

    return {
      originalFilename: file.originalname,
      storedFilename,
      mimeType: file.mimetype,
      fileSizeBytes: file.size,
      checksumSha256: checksum,
      encryptionIv: `${ivHex}:${authTagHex}`,
      storageProvider: config.storage.provider,
      storagePath: destinationPath,
      isSensitive: true
    };
  }

  /**
   * Read and decrypt evidence file for authorized viewing
   */
  async getDecryptedEvidenceStream(evidenceRecord) {
    const filePath = evidenceRecord.storagePath || path.join(this.uploadDir, evidenceRecord.storedFilename);

    if (!fs.existsSync(filePath)) {
      throw new Error('Evidence file not found on storage server');
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const [ivHex, authTagHex] = evidenceRecord.encryptionIv.split(':');

    const decryptedBuffer = decryptBuffer(encryptedBuffer, ivHex, authTagHex);

    // Verify SHA-256 checksum to ensure file integrity
    const calculatedChecksum = crypto.createHash('sha256').update(decryptedBuffer).digest('hex');
    if (evidenceRecord.checksumSha256 && calculatedChecksum !== evidenceRecord.checksumSha256) {
      throw new Error('Integrity violation: Evidence file checksum mismatch! Possible tampering.');
    }

    return {
      buffer: decryptedBuffer,
      mimeType: evidenceRecord.mimeType,
      filename: evidenceRecord.originalFilename
    };
  }

  /**
   * Generate short-lived signed token for evidence download (Access Control)
   */
  generateSignedAccessToken(evidenceId, userIdOrTrackingId, expiresInSeconds = 300) {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${evidenceId}:${userIdOrTrackingId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', config.jwt.secret).update(payload).digest('hex');

    const token = Buffer.from(`${payload}:${hmac}`).toString('base64url');
    return {
      token,
      expiresAt: new Date(expiresAt * 1000).toISOString()
    };
  }

  /**
   * Validate signed access token
   */
  verifySignedAccessToken(tokenString) {
    try {
      const decoded = Buffer.from(tokenString, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) return null;

      const [evidenceId, principalId, expiresAtStr, hmac] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);

      if (Date.now() / 1000 > expiresAt) {
        return null; // Expired
      }

      const expectedPayload = `${evidenceId}:${principalId}:${expiresAt}`;
      const expectedHmac = crypto.createHmac('sha256', config.jwt.secret).update(expectedPayload).digest('hex');

      if (hmac !== expectedHmac) {
        return null; // Invalid signature
      }

      return { evidenceId, principalId };
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();

