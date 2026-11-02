import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://bribeshield:bribeshield_secure_pass@localhost:5432/bribeshield_db',

  // JWT Auth & RBAC
  jwt: {
    secret: process.env.JWT_SECRET || 'bribeshield-dev-jwt-secret-do-not-use-in-production-32bytes',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'bribeshield-dev-refresh-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // Encryption (AES-256-GCM)
  encryption: {
    // 32-byte hex key for AES-256
    key: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    algorithm: 'aes-256-gcm',
    ivLength: 16,
    saltLength: 32
  },

  // File Upload & Storage (Cloud-ready abstraction)
  storage: {
    provider: process.env.STORAGE_PROVIDER || 'LOCAL_ENCRYPTED', // LOCAL_ENCRYPTED or S3_COMPATIBLE
    uploadDir: path.resolve(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedMimes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'video/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg'
    ],
    s3: {
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      bucket: process.env.S3_BUCKET || 'bribeshield-evidence',
      region: process.env.S3_REGION || 'us-east-1',
      accessKey: process.env.S3_ACCESS_KEY || '',
      secretKey: process.env.S3_SECRET_KEY || ''
    }
  },

  // Email Notifications
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'BribeShield AI <alerts@bribeshield.org>'
  },

  // Data Retention & Anonymization
  retention: {
    complaintRetentionDays: parseInt(process.env.COMPLAINT_RETENTION_DAYS || '365', 10),
    auditRetentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '730', 10),
    autoPurgeEnabled: process.env.AUTO_PURGE_ENABLED === 'true'
  },

  // External Grievance API Integration
  externalGrievance: {
    apiKey: process.env.EXTERNAL_API_KEY || 'bsai-dev-external-partner-key-98234',
    signatureSecret: process.env.EXTERNAL_HMAC_SECRET || 'bsai-hmac-shared-secret-for-grievance-systems',
    institutions: [
      { id: 'CPGRAMS', name: 'Centralized Public Grievance Redress and Monitoring System' },
      { id: 'LOKAYUKTA', name: 'State Lokayukta Anti-Corruption Ombudsman' },
      { id: 'CVC', name: 'Central Vigilance Commission' }
    ]
  }
};

