import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Port TS de dart_licences_generator/lib/services/license_generator_service.dart
 * Formato: V1-DATA(13)-SALT(13)-SIG(4), charset Base32 RFC4648 (A-Z2-7).
 * El secreto DEBE coincidir con Dart (LICENSE_SECRET). Sin esto las llaves
 * Dart existentes no validan y viceversa.
 */
export const NORMAL_TYPE = 'normal';
export const PREMIUM_TYPE = 'premium';
export const DEFAULT_POS_COUNT = 5;

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function getLicenseSecret(): string {
  return (
    process.env.LICENSE_SECRET || 'INOIDSOFT-POS-K7#mX9$2025!zQw'
  );
}

export function normalizeLicenseType(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase() === PREMIUM_TYPE
    ? PREMIUM_TYPE
    : NORMAL_TYPE;
}

export function normalizePosCount(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) {
    throw new Error('posCount must be >= 1');
  }
  return Math.min(Math.floor(n), 255);
}

export function monthsToDays(months: unknown): number {
  const m = Number(months);
  if (m === 1) return 30;
  if (m === 3) return 90;
  if (m === 6) return 180;
  if (m === 12) return 365;
  if (m <= 0 || !Number.isFinite(m)) return 30;
  return Math.min(Math.floor(m * 30), 9999);
}

// ---------- Base32 RFC4648 (sin padding en salida, como Dart substring(0,13)) ----------
export function base32Encode(bytes: Uint8Array | number[]): string {
  const alphabet = CHARS;
  let bits = 0;
  let value = 0;
  let out = '';
  for (const b of bytes) {
    value = (value << 8) | (b & 0xff);
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += alphabet[(value << (5 - bits)) & 31];
  }
  return out;
}

export function base32Decode(str: string): number[] {
  const clean = String(str).trim().toUpperCase().replace(/=+$/, '');
  const rev = new Map<string, number>();
  for (let i = 0; i < CHARS.length; i++) rev.set(CHARS[i], i);
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const v = rev.get(ch);
    if (v === undefined) throw new Error(`Invalid base32 char: ${ch}`);
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return out;
}

// ---------- Primitivas cripto (idénticas a Dart) ----------
function deriveKey(saltStr: string, secret: string): number[] {
  const digest = createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(Buffer.from(saltStr, 'utf8'))
    .digest();
  return Array.from(digest.subarray(0, 8));
}

function xorWithKey(data: number[], key: number[]): number[] {
  return data.map((b, i) => b ^ key[i % key.length]);
}

function generateHmac(data: string, secret: string): string {
  const digest = createHmac('sha256', Buffer.from(secret, 'utf8'))
    .update(Buffer.from(data, 'utf8'))
    .digest();
  const folded = [0, 0, 0, 0];
  for (let i = 0; i < digest.length; i++) {
    folded[i % 4] ^= digest[i];
  }
  return folded.map((b) => CHARS[b % CHARS.length]).join('');
}

function constantTimeEquals(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function encodePayload(
  days: number,
  date: Date,
  randByte: number,
  licenseType: string,
  posCount: number,
): number[] {
  return [
    (days >> 8) & 0xff,
    days & 0xff,
    normalizeLicenseType(licenseType) === PREMIUM_TYPE ? 2 : 1,
    posCount & 0xff,
    (date.getFullYear() - 2025) & 0xff,
    (date.getMonth() + 1) & 0xff,
    date.getDate() & 0xff,
    randByte & 0xff,
  ];
}

// ---------- API pública ----------
export interface GenerateLicenseInput {
  days: number;
  licenseType?: string;
  posCount?: number;
  now?: Date;
}

export interface GeneratedLicense {
  key: string;
  dataStr: string;
  saltStr: string;
  signature: string;
  days: number;
  licenseType: string;
  posCount: number;
  createdAt: Date;
  expiresAt: Date;
}

export function generateLicenseKey(input: GenerateLicenseInput): GeneratedLicense {
  const secret = getLicenseSecret();
  const days = Math.floor(Number(input.days));
  if (!Number.isFinite(days) || days < 1 || days > 9999) {
    throw new Error('days must be 1..9999');
  }
  const licenseType = normalizeLicenseType(input.licenseType);
  const posCount = normalizePosCount(input.posCount ?? DEFAULT_POS_COUNT);
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const salt = randomBytes(8);
  const saltStr = base32Encode(salt).substring(0, 13);

  const derived = deriveKey(saltStr, secret);
  const raw = encodePayload(
    days,
    now,
    randomBytes(1)[0],
    licenseType,
    posCount,
  );
  const encrypted = xorWithKey(raw, derived);
  const dataStr = base32Encode(Uint8Array.from(encrypted)).substring(0, 13);

  const signature = generateHmac(`${dataStr}-${saltStr}`, secret);
  const key = `V1-${dataStr}-${saltStr}-${signature}`;
  return { key, dataStr, saltStr, signature, days, licenseType, posCount, createdAt: now, expiresAt };
}

/** Retorna días si válida, -1 si inválida (igual que Dart validateLicenseKey). */
export function validateLicenseKey(key: string): number {
  const payload = decodeValidPayload(key);
  if (!payload) return -1;
  const days = (payload[0] << 8) | payload[1];
  const pos = payload[3];
  if (days <= 0 || days > 9999) return -1;
  if (pos < 1) return -1;
  return days;
}

export function getLicenseInfo(key: string): {
  valid: boolean;
  days?: number;
  licenseType?: string;
  posCount?: number;
  message: string;
} {
  const payload = decodeValidPayload(key);
  if (!payload) return { valid: false, message: 'Clave inválida' };
  const days = (payload[0] << 8) | payload[1];
  if (days <= 0 || days > 9999) return { valid: false, message: 'Clave inválida' };
  const posCount = payload[3];
  if (posCount < 1) return { valid: false, message: 'Clave inválida' };
  const licenseType = payload[2] === 2 ? PREMIUM_TYPE : NORMAL_TYPE;
  return { valid: true, days, licenseType, posCount, message: 'Clave válida' };
}

function decodeValidPayload(key: string): number[] | null {
  try {
    if (!key.startsWith('V1-')) return null;
    const body = key.substring(3);
    const parts = body.split('-');
    if (parts.length !== 3) return null;
    const [dataStr, saltStr, signature] = parts;
    if (dataStr.length !== 13 || saltStr.length !== 13 || signature.length !== 4) return null;
    const all = dataStr + saltStr + signature;
    for (const c of all) {
      if (!CHARS.includes(c)) return null;
    }
    const secret = getLicenseSecret();
    const expected = generateHmac(`${dataStr}-${saltStr}`, secret);
    if (!constantTimeEquals(signature, expected)) return null;
    const encrypted = base32Decode(dataStr);
    const decrypted = xorWithKey(encrypted, deriveKey(saltStr, secret));
    return decrypted;
  } catch {
    return null;
  }
}

export function sha256Hex(value: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createHash } = require('node:crypto') as typeof import('node:crypto');
  return createHash('sha256').update(value, 'utf8').digest('hex');
}
