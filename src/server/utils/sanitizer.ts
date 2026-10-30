/**
 * Sensitive Data Sanitizer
 * Redacts BVNs, NINs, Credit Card Numbers, Passwords, and Auth Tokens
 * to ensure regulatory compliance (NDPR, GDPR, PCI-DSS) across transcripts and logs.
 */

// BVN / NIN: 11-digit numbers
const BVN_NIN_REGEX = /\b\d{11}\b/g;

// Payment Card: 13 to 19 digits with optional spaces or dashes
const CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// Common token/secret patterns: bearer tokens, jwt patterns, hex secrets
const AUTH_TOKEN_REGEX = /\b(?:bearer\s+)?[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/gi;
const API_KEY_REGEX = /\b(?:key|secret|token|password)\s*[:=]\s*["']?([A-Za-z0-9_\-+/]{12,})["']?/gi;

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Mask cards first (preserve last 4 digits if 16-digit card)
  sanitized = sanitized.replace(CARD_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
      const last4 = digitsOnly.slice(-4);
      return `[CARD REDACTED ****${last4}]`;
    }
    return match;
  });

  // Mask BVN / NIN (11 digits)
  sanitized = sanitized.replace(BVN_NIN_REGEX, '[IDENTITY/BVN REDACTED]');

  // Mask JWT / Bearer Tokens
  sanitized = sanitized.replace(AUTH_TOKEN_REGEX, '[BEARER TOKEN REDACTED]');

  // Mask inline API keys and passwords
  sanitized = sanitized.replace(API_KEY_REGEX, (_match, _p1) => {
    return 'key=[CREDENTIAL REDACTED]';
  });

  return sanitized;
}

export const sanitizeSensitiveData = sanitizeText;

export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(metadata)) {
    const keyLower = key.toLowerCase();
    if (
      keyLower.includes('password') ||
      keyLower.includes('secret') ||
      keyLower.includes('token') ||
      keyLower.includes('bvn') ||
      keyLower.includes('nin') ||
      keyLower.includes('cvv') ||
      keyLower.includes('pin')
    ) {
      clean[key] = '[REDACTED]';
    } else if (typeof val === 'string') {
      clean[key] = sanitizeText(val);
    } else if (val && typeof val === 'object' && !Array.isArray(val)) {
      clean[key] = sanitizeMetadata(val as Record<string, unknown>);
    } else {
      clean[key] = val;
    }
  }
  return clean;
}
