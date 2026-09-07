import { signQrPayload, verifyQrPayload } from './qr-sign.util';

describe('qr-sign.util', () => {
  it('firma y verifica un payload válido', () => {
    const signed = signQrPayload({ payment_id: 'abc', amount: 29.99 });
    const { valid, payload } = verifyQrPayload(signed);
    expect(valid).toBe(true);
    expect(payload.payment_id).toBe('abc');
  });

  it('rechaza payload manipulado', () => {
    const signed = signQrPayload({ payment_id: 'abc', amount: 29.99 });
    const tampered = signed.replace('29.99', '0.01');
    expect(verifyQrPayload(tampered).valid).toBe(false);
  });

  it('rechaza payload sin firma', () => {
    expect(
      verifyQrPayload(JSON.stringify({ payment_id: 'abc' })).valid,
    ).toBe(false);
  });
});
