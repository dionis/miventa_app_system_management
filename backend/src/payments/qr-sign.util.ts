import * as crypto from 'crypto';

function hmacSecret(): string {
  const s =
    process.env.PAYMENTS_QR_SECRET ||
    process.env.JWT_SECRET ||
    'missing-secret';
  return s;
}

/** Firma el payload del QR para detectar manipulación (P1). */
export function signQrPayload(payload: Record<string, unknown>): string {
  const body = JSON.stringify(payload);
  const sig = crypto
    .createHmac('sha256', hmacSecret())
    .update(body)
    .digest('hex');
  return JSON.stringify({ ...payload, sig });
}

/** Verifica la firma HMAC del payload del QR. */
export function verifyQrPayload(raw: string): {
  valid: boolean;
  payload?: any;
} {
  try {
    const parsed = JSON.parse(raw);
    const { sig, ...body } = parsed;
    if (!sig) return { valid: false };
    const expected = crypto
      .createHmac('sha256', hmacSecret())
      .update(JSON.stringify(body))
      .digest('hex');
    const a = Buffer.from(sig, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return { valid: false };
    return {
      valid: crypto.timingSafeEqual(a, b),
      payload: body,
    };
  } catch {
    return { valid: false };
  }
}
