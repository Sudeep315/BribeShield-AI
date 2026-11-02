import crypto from 'crypto';
import { config } from '../config/index.js';

// Parse or derive 32-byte key from config hex string
const getKey = () => {
  const hexKey = config.encryption.key;
  if (/^[0-9a-fA-F]{64}$/.test(hexKey)) {
    return Buffer.from(hexKey, 'hex');
  }
  // Fallback: derive 32 bytes using SHA-256
  return crypto.createHash('sha256').update(hexKey).digest();
};

/**
 * Encrypt plain text using AES-256-GCM
 * Returns payload string format: iv:authTag:ciphertext (all hex encoded)
 */
export const encryptText = (plainText) => {
  if (plainText === null || plainText === undefined || plainText === '') {
    return null;
  }
  const key = getKey();
  const iv = crypto.randomBytes(config.encryption.ivLength);
  const cipher = crypto.createCipheriv(config.encryption.algorithm, key, iv);

  let encrypted = cipher.update(String(plainText), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypt cipher text (iv:authTag:ciphertext) using AES-256-GCM
 */
export const decryptText = (payload) => {
  if (!payload || typeof payload !== 'string' || !payload.includes(':')) {
    return payload;
  }
  try {
    const parts = payload.split(':');
    if (parts.length !== 3) {
      return payload; // not in expected encrypted format
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(config.encryption.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return '[ENCRYPTED_DATA_PROTECTED]';
  }
};

/**
 * Encrypt a binary buffer (for evidence files) using AES-256-GCM
 */
export const encryptBuffer = (buffer) => {
  const key = getKey();
  const iv = crypto.randomBytes(config.encryption.ivLength);
  const cipher = crypto.createCipheriv(config.encryption.algorithm, key, iv);

  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer,
    ivHex: iv.toString('hex'),
    authTagHex: authTag.toString('hex'),
    checksum: crypto.createHash('sha256').update(buffer).digest('hex')
  };
};

/**
 * Decrypt a binary buffer using AES-256-GCM
 */
export const decryptBuffer = (encryptedBuffer, ivHex, authTagHex) => {
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(config.encryption.algorithm, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

/**
 * Compute SHA-256 hash of arbitrary content
 */
export const sha256 = (data) => {
  return crypto.createHash('sha256').update(typeof data === 'string' ? data : JSON.stringify(data)).digest('hex');
};

/**
 * One-way salted hash for IP address to preserve privacy while preventing spam
 */
export const hashIpAddress = (ip, salt = 'bribeshield-privacy-salt') => {
  if (!ip) return '0000000000000000';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex').substring(0, 16);
};

/**
 * Generate human-friendly, high-entropy complaint tracking ID
 * Format: BSAI-YYYY-XXXX-XXXX
 */
export const generateTrackingId = () => {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(4).toString('hex').toUpperCase();
  const part1 = randomChars.substring(0, 4);
  const part2 = randomChars.substring(4, 8);
  return `BSAI-${year}-${part1}-${part2}`;
};

