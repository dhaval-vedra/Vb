import { describe, it, expect } from 'vitest';
import { 
  generateSecureSalt,
  sha256Fallback,
  sha256Subtle,
  hashPasswordWithSalt,
  hashPasswordWithSaltSync,
  verifyPasswordHash,
  verifyPasswordHashSync,
  timingSafeEqual
} from '../../src/js/auth/cryptoUtils.ts';

describe('CryptoUtils Module', () => {
  it('should generate secure random salt of correct length', () => {
    const salt1 = generateSecureSalt(16);
    const salt2 = generateSecureSalt(16);
    
    expect(salt1).toBeDefined();
    expect(salt2).toBeDefined();
    expect(salt1.length).toBe(32); // 16 bytes = 32 hex characters
    expect(salt2.length).toBe(32);
    expect(salt1).not.toBe(salt2); // CSPRNG uniqueness
  });

  it('should compute deterministic SHA-256 hash using fallback', () => {
    const text = 'VedraBISecurityTest';
    const hash1 = sha256Fallback(text);
    const hash2 = sha256Fallback(text);
    
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('should compute SHA-256 hash using SubtleCrypto/fallback', async () => {
    const text = 'AsyncHashString';
    const hash = await sha256Subtle(text);
    
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
  });

  it('should hash and verify password with salt asynchronously', async () => {
    const password = 'SecretPassword123!';
    const salt = generateSecureSalt(16);
    
    const hash = await hashPasswordWithSalt(password, salt);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);

    const isMatch = await verifyPasswordHash(password, salt, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPasswordHash('WrongPassword!', salt, hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should hash and verify password with salt synchronously', () => {
    const password = 'SyncPassword888';
    const salt = generateSecureSalt(16);
    
    const hash = hashPasswordWithSaltSync(password, salt);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64);

    const isMatch = verifyPasswordHashSync(password, salt, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = verifyPasswordHashSync('BadPassword', salt, hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should perform timing-safe string comparison', () => {
    expect(timingSafeEqual('abcdef', 'abcdef')).toBe(true);
    expect(timingSafeEqual('abcdef', 'abcdeg')).toBe(false);
    expect(timingSafeEqual('abcdef', 'abc')).toBe(false);
  });
});
