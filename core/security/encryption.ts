import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import type { EncryptionEngine } from './types';

export class DefaultEncryptionEngine implements EncryptionEngine {
  private readonly keyMaterial = createHash('sha256').update('9ja-security-platform').digest();

  async encrypt(scope: string, plaintext: string): Promise<string> {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.keyMaterial, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return `${scope}:${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  async decrypt(scope: string, ciphertext: string): Promise<string> {
    const [bucket, ivHex, contentHex] = ciphertext.split(':');
    if (bucket !== scope) throw new Error('Scope mismatch');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = createDecipheriv('aes-256-cbc', this.keyMaterial, iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(contentHex, 'hex')), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
