import { describe, it, expect, vi } from 'vitest';
import { getFriendlyAuthErrorMessage } from '../../src/js/auth/firebaseAuthService.ts';
import { AuthLogger } from '../../src/js/auth/cryptoUtils.ts';

describe('Auth Error Handling & Normalization', () => {
  it('should translate INVALID_LOGIN_CREDENTIALS into friendly messages', () => {
    const res = getFriendlyAuthErrorMessage('auth/invalid-login-credentials');
    expect(res.en).toContain('Incorrect email or password');
    expect(res.hi).toContain('अमान्य ईमेल या पासवर्ड');

    const resFromRaw = getFriendlyAuthErrorMessage(
      'auth/internal-error',
      JSON.stringify({ error: { code: 400, message: 'INVALID_LOGIN_CREDENTIALS' } })
    );
    expect(resFromRaw.en).toContain('Incorrect email or password');
  });

  it('should route expected authentication validation errors to console.warn instead of console.error', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    AuthLogger.error('AUTH_EXECUTION', 'LOGIN_FAILED', {
      code: 'auth/internal-error',
      message: '{"error":{"code":400,"message":"INVALID_LOGIN_CREDENTIALS"}}'
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
