import {
  base32Decode,
  base32Encode,
  generateLicenseKey,
  getLicenseInfo,
  monthsToDays,
  validateLicenseKey,
} from './license.crypto';

describe('license.crypto (port Dart)', () => {
  it('genera formato V1-13-13-4 y valida', () => {
    const gen = generateLicenseKey({ days: 30, licenseType: 'normal', posCount: 5 });
    expect(gen.key).toMatch(/^V1-[A-Z2-7]{13}-[A-Z2-7]{13}-[A-Z2-7]{4}$/);
    expect(validateLicenseKey(gen.key)).toBe(30);
    const info = getLicenseInfo(gen.key);
    expect(info).toMatchObject({ valid: true, days: 30, licenseType: 'normal', posCount: 5 });
  });

  it('premium + posCount se preservan', () => {
    const gen = generateLicenseKey({ days: 365, licenseType: 'premium', posCount: 12 });
    expect(getLicenseInfo(gen.key)).toMatchObject({ valid: true, days: 365, licenseType: 'premium', posCount: 12 });
  });

  it('detecta manipulación de 1 char', () => {
    const gen = generateLicenseKey({ days: 90, licenseType: 'normal', posCount: 5 });
    const tampered = gen.key.slice(0, 5) + (gen.key[5] === 'A' ? 'B' : 'A') + gen.key.slice(6);
    expect(validateLicenseKey(tampered)).toBe(-1);
    expect(getLicenseInfo(tampered).valid).toBe(false);
  });

  it('base32 round-trip 8 bytes -> 13 chars (compat Dart substring)', () => {
    const bytes = [1, 2, 3, 4, 5, 6, 7, 8];
    const enc = base32Encode(bytes);
    expect(enc.substring(0, 13)).toHaveLength(13);
    expect(base32Decode(enc.substring(0, 13))).toEqual(bytes);
  });

  it('monthsToDays mapea planes actuales', () => {
    expect(monthsToDays(1)).toBe(30);
    expect(monthsToDays(3)).toBe(90);
    expect(monthsToDays(6)).toBe(180);
    expect(monthsToDays(12)).toBe(365);
  });
});
