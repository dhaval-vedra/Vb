import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityManager, SessionTimeoutManager } from '../../src/js/auth/securityManager.ts';

describe('SecurityManager Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should generate random salts', () => {
    const salt = SecurityManager.generateSalt();
    expect(salt).toBeDefined();
    expect(salt.length).toBe(32);
  });

  it('should check if account ID is available', () => {
    expect(SecurityManager.isAccountIdAvailable('@analyst')).toBe(true);
    expect(SecurityManager.isAccountIdAvailable('ab')).toBe(false); // Too short
  });

  it('should save and verify 8-digit security PIN profile', () => {
    const email = 'user@example.com';
    const accountId = '@john_doe';
    const pin = '12345678';

    const profile = SecurityManager.saveSecurityProfile(email, accountId, pin);
    expect(profile).toBeDefined();
    expect(profile.accountId).toBe('@john_doe');
    expect(profile.pinHash).toBeDefined();
    expect(profile.salt).toBeDefined();

    expect(SecurityManager.isConfigured(email)).toBe(true);
    expect(SecurityManager.verifyPin(email, '12345678')).toBe(true);
    expect(SecurityManager.verifyPin(email, '87654321')).toBe(false);
  });

  it('should reject invalid PIN lengths or duplicate account IDs', () => {
    const email = 'user2@example.com';
    expect(() => {
      SecurityManager.saveSecurityProfile(email, '@valid_id', '1234'); // 4 digits instead of 8
    }).toThrow();

    SecurityManager.saveSecurityProfile('user1@example.com', '@taken_id', '12345678');
    expect(() => {
      SecurityManager.saveSecurityProfile('user2@example.com', '@taken_id', '12345678');
    }).toThrow();
  });

  it('should mark and verify session status in localStorage', () => {
    const email = 'session_user@example.com';
    SecurityManager.saveSecurityProfile(email, '@session_user', '11223344');

    localStorage.setItem('vedrabi_current_user', JSON.stringify({ email }));
    SecurityManager.markSessionVerified(email);

    expect(SecurityManager.isSessionVerified()).toBe(true);
  });

  it('should track activity timestamp in SessionTimeoutManager', () => {
    SessionTimeoutManager.updateActivity(1700000000000);
    const stored = localStorage.getItem('vedrabi_last_activity');
    expect(stored).toBe('1700000000000');
  });
});
