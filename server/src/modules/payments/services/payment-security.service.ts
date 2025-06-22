import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class PaymentSecurityService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encryptionKey: Buffer;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  constructor(private readonly configService: ConfigService) {
    // Get encryption key from environment, or generate one if not provided
    const key = this.configService.get<string>('PAYMENT_ENCRYPTION_KEY');
    this.encryptionKey = key 
      ? Buffer.from(key, 'base64')
      : crypto.randomBytes(32); // 256 bits
  }

  /**
   * Encrypt sensitive payment data
   */
  encryptPayload(payload: any): string {
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    // Encrypt the payload
    const payloadString = JSON.stringify(payload);
    const encrypted = Buffer.concat([
      cipher.update(payloadString, 'utf8'),
      cipher.final(),
    ]);

    // Get auth tag
    const tag = cipher.getAuthTag();

    // Combine all pieces
    const result = Buffer.concat([salt, iv, tag, encrypted]);

    // Return as base64
    return result.toString('base64');
  }

  /**
   * Decrypt sensitive payment data
   */
  decryptPayload(encryptedData: string): any {
    const buffer = Buffer.from(encryptedData, 'base64');

    // Extract pieces
    const salt = buffer.subarray(0, this.saltLength);
    const iv = buffer.subarray(this.saltLength, this.saltLength + this.ivLength);
    const tag = buffer.subarray(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength
    );
    const encrypted = buffer.subarray(this.saltLength + this.ivLength + this.tagLength);

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(tag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Hash sensitive data for storage
   */
  hashSensitiveData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Verify payment signature from M-Pesa
   */
  verifyPaymentSignature(payload: any, signature: string): boolean {
    const expectedSignature = this.generatePaymentSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate payment signature for M-Pesa
   */
  private generatePaymentSignature(payload: any): string {
    const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex');
  }
}
