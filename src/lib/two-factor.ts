/**
 * Two-Factor Authentication (2FA) Utilities
 * TOTP-based 2FA implementation for SUPER_ADMIN accounts
 */

import * as crypto from 'crypto';

/**
 * Generate a random base32 secret for TOTP
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate TOTP code from secret
 * @param secret - Base32 encoded secret
 * @param timeStep - Time step in seconds (default: 30)
 */
export function generateTOTPCode(secret: string, timeStep: number = 30): string {
  const time = Math.floor(Date.now() / 1000 / timeStep);
  const secretBytes = base32Decode(secret);
  
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(time));
  
  const hmac = crypto.createHmac('sha1', secretBytes);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  );
  
  return String(code % 1000000).padStart(6, '0');
}

/**
 * Verify TOTP code against secret
 * @param code - 6-digit code from authenticator app
 * @param secret - Base32 encoded secret
 * @param window - Number of time steps to check before/after (default: 1)
 */
export function verifyTOTPCode(
  code: string,
  secret: string,
  window: number = 1
): boolean {
  const normalizedCode = code.replace(/\s/g, '');
  
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }
  
  // Check current time and window
  for (let i = -window; i <= window; i++) {
    const timeStep = Math.floor(Date.now() / 1000 / 30) + i;
    const expectedCode = generateTOTPCodeAtTime(secret, timeStep);
    
    if (normalizedCode === expectedCode) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate TOTP code at specific time step
 */
function generateTOTPCodeAtTime(secret: string, timeStep: number): string {
  const secretBytes = base32Decode(secret);
  
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));
  
  const hmac = crypto.createHmac('sha1', secretBytes);
  hmac.update(timeBuffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  );
  
  return String(code % 1000000).padStart(6, '0');
}

/**
 * Generate QR code URL for authenticator apps
 */
export function generateTOTPQRCodeURL(
  secret: string,
  email: string,
  issuer: string = 'Our Family Table'
): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Base32 encoding (RFC 4648)
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  
  return output;
}

/**
 * Base32 decoding (RFC 4648)
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = Buffer.alloc(Math.ceil(encoded.length * 5 / 8));
  
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toUpperCase();
    const charValue = alphabet.indexOf(char);
    
    if (charValue === -1) continue;
    
    value = (value << 5) | charValue;
    bits += 5;
    
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  
  return output.slice(0, index);
}

/**
 * Encrypt secret for database storage
 */
export function encryptSecret(secret: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set');
  }
  
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt secret from database
 */
export function decryptSecret(encryptedSecret: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY not set');
  }
  
  const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
  
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if 2FA verification is still valid (5 minutes)
 */
export function is2FAVerificationValid(verifiedAt: Date | null): boolean {
  if (!verifiedAt) return false;
  
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return verifiedAt > fiveMinutesAgo;
}
