/**
 * Security utilities and helpers
 * CRITICAL: These functions help prevent common security vulnerabilities
 */

import { z } from "zod";

/**
 * Sanitize user input to prevent XSS attacks
 * Note: This is a basic implementation. For rich text, use a library like DOMPurify
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 1000); // Limit length to prevent DoS
};

/**
 * Validate email format with additional security checks
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email is too long" })
  .refine(
    (email) => !email.includes('..'), // Prevent email with consecutive dots
    { message: "Invalid email format" }
  );

/**
 * Validate password with strong security requirements
 */
export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(72, { message: "Password is too long" }) // bcrypt limit
  .regex(/[A-Z]/, { message: "Password must contain an uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain a lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain a number" })
  .refine(
    (password) => !/\s/.test(password),
    { message: "Password cannot contain spaces" }
  );

/**
 * Validate text input for general use
 */
export const textInputSchema = (maxLength: number = 500) =>
  z
    .string()
    .trim()
    .min(1, { message: "This field is required" })
    .max(maxLength, { message: `Text is too long (max ${maxLength} characters)` })
    .refine(
      (text) => !/<script|javascript:|on\w+=/i.test(text),
      { message: "Invalid content detected" }
    );

/**
 * Validate URL input
 */
export const urlSchema = z
  .string()
  .trim()
  .url({ message: "Invalid URL" })
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    { message: "Only HTTP and HTTPS URLs are allowed" }
  );

/**
 * Rate limiting helper (client-side)
 * Note: This is only a UX improvement. Server-side rate limiting is required for security
 */
export class ClientRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now > record.resetAt) {
      this.attempts.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }

    if (record.count >= maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingTime(key: string): number {
    const record = this.attempts.get(key);
    if (!record) return 0;
    return Math.max(0, record.resetAt - Date.now());
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Check if a file type is allowed
 */
export const isAllowedFileType = (
  mimeType: string,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.replace('/*', ''));
    }
    return mimeType === type;
  });
};

/**
 * Check if file size is within limits
 */
export const isValidFileSize = (
  sizeInBytes: number,
  maxSizeInMB: number
): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return sizeInBytes <= maxSizeInBytes;
};

/**
 * Generate a secure random string (for CSRF tokens, etc.)
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Validate JSON input to prevent prototype pollution
 */
export const parseJSONSafely = <T = unknown>(json: string): T | null => {
  try {
    const parsed = JSON.parse(json);
    // Check for prototype pollution attempts
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.error('Security: Detected prototype pollution attempt');
        return null;
      }
    }
    return parsed as T;
  } catch {
    return null;
  }
};

/**
 * Debounce function to prevent rapid submissions
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Security headers recommendations for deployment
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/**
 * Log security events (in development)
 */
export const logSecurityEvent = (
  event: string,
  details?: Record<string, any>
): void => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Security Event]', event, details);
  }
  // In production, this should send to a logging service
};
