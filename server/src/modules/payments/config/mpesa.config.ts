import { registerAs } from '@nestjs/config';

export default registerAs('mpesa', () => ({
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passkey: process.env.MPESA_PASSKEY,
  shortcode: process.env.MPESA_SHORTCODE,
  environment: process.env.MPESA_ENVIRONMENT || 'sandbox',
  callbackUrl: process.env.MPESA_CALLBACK_URL,
  validationUrl: process.env.MPESA_VALIDATION_URL,
  confirmationUrl: process.env.MPESA_CONFIRMATION_URL,
  maxRetries: parseInt(process.env.MAX_PAYMENT_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.PAYMENT_RETRY_DELAY || '5000', 10),
  // Timeouts
  tokenExpiryMinutes: 58, // Token expires in 1 hour, refresh at 58 minutes
  stkPushTimeout: 60000, // 1 minute timeout for STK push
  // Validation
  minimumAmount: 1,
  maximumAmount: 150000, // Standard M-Pesa maximum
}));
