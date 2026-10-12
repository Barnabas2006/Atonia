import crypto from 'crypto';
import { getConfig } from '../config.ts';
import type { User } from '../../types/index.ts';

export interface TokenPayload {
  sub: string;
  email: string;
  role: string;
  businessAccess: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf8');
}

export class AuthService {
  private getSecret(): string {
    const config = getConfig();
    return config.jwtSecret || config.sessionSecret || 'dev-ephemeral-secret';
  }

  createToken(user: User, expiresInSeconds = 86400): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      businessAccess: Array.isArray(user.businessAccess) ? user.businessAccess.join(',') : user.businessAccess,
      iat: now,
      exp: now + expiresInSeconds
    };

    const headerEncoded = base64UrlEncode(JSON.stringify(header));
    const payloadEncoded = base64UrlEncode(JSON.stringify(payload));
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;

    const signature = crypto
      .createHmac('sha256', this.getSecret())
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${headerEncoded}.${payloadEncoded}.${signature}`;
  }

  verifyToken(token: string): TokenPayload | null {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureProvided] = parts;
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.getSecret())
      .update(dataToSign)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Constant-time comparison to prevent timing attacks
    if (signatureProvided.length !== expectedSignature.length) return null;
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(signatureProvided),
      Buffer.from(expectedSignature)
    );

    if (!isSignatureValid) return null;

    try {
      const payload: TokenPayload = JSON.parse(base64UrlDecode(payloadEncoded));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        // Expired
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
