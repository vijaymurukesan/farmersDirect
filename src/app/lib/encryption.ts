import crypto from 'crypto';

// Encryption key - in production, use a strong environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is 32 bytes for AES-256
const getKey = () => {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  return key;
};

/**
 * Encrypt email address
 * @param email - Plain text email
 * @returns Encrypted email string with IV prepended
 */
export function encryptEmail(email: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(email.toLowerCase().trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Prepend IV to encrypted data (separated by :)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt email address
 * @param encryptedEmail - Encrypted email string with IV
 * @returns Decrypted email string
 */
export function decryptEmail(encryptedEmail: string): string {
  const parts = encryptedEmail.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Create a searchable hash of email for duplicate checking
 * This allows us to check for existing emails without decrypting all entries
 */
export function hashEmailForSearch(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase().trim())
    .digest('hex');
}
