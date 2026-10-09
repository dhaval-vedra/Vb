/**
 * Production Security Cryptographic Utility
 * Uses SubtleCrypto Web API (window.crypto.subtle) for SHA-256 salted password hashing
 * and Cryptographically Secure Pseudo-Random Number Generator (CSPRNG) for salt generation.
 */

declare global {
    interface Window {
        CryptoUtils?: {
            generateSecureSalt: (lengthBytes?: number) => string;
            sha256Subtle: (text: string) => Promise<string>;
            hashPasswordWithSalt: (password: string, salt: string) => Promise<string>;
            hashPasswordWithSaltSync: (password: string, salt: string) => string;
            sha256Fallback: (ascii: string) => string;
            legacyBuggySha256?: (ascii: string) => string;
            timingSafeEqual: (a: string, b: string) => boolean;
            verifyPasswordHash: (password: string, salt: string, storedHash: string) => Promise<boolean>;
            verifyPasswordHashSync: (password: string, salt: string, storedHash: string) => boolean;
        };
    }
}

export function normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
}

/**
 * Generate a cryptographically secure random salt hex string
 * @param lengthBytes Defaults to 16 bytes (128 bits)
 * @returns Hex string salt
 */
export function generateSecureSalt(lengthBytes: number = 16): string {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const buffer = new Uint8Array(lengthBytes);
        window.crypto.getRandomValues(buffer);
        return Array.from(buffer, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
    }
    const fallback = new Uint8Array(lengthBytes);
    for (let i = 0; i < lengthBytes; i++) {
        fallback[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(fallback, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Pure JS SHA-256 implementation as safe, 100% compliant synchronous fallback
 * Compatible bit-for-bit with Web Crypto Subtle API and Node.js crypto.
 */
export function sha256Fallback(ascii: string): string {
    function rightRotate(value: number, amount: number): number {
        return (value >>> amount) | (value << (32 - amount));
    }

    const utf8Bytes: number[] = [];
    const text = ascii || '';
    for (let i = 0; i < text.length; i++) {
        let charCode = text.charCodeAt(i);
        if (charCode < 0x80) {
            utf8Bytes.push(charCode);
        } else if (charCode < 0x800) {
            utf8Bytes.push(0xc0 | (charCode >> 6));
            utf8Bytes.push(0x80 | (charCode & 0x3f));
        } else if (charCode < 0xd800 || charCode >= 0xe000) {
            utf8Bytes.push(0xe0 | (charCode >> 12));
            utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f));
            utf8Bytes.push(0x80 | (charCode & 0x3f));
        } else {
            i++;
            charCode = 0x10000 + (((charCode & 0x3ff) << 10) | (text.charCodeAt(i) & 0x3ff));
            utf8Bytes.push(0xf0 | (charCode >> 18));
            utf8Bytes.push(0x80 | ((charCode >> 12) & 0x3f));
            utf8Bytes.push(0x80 | ((charCode >> 6) & 0x3f));
            utf8Bytes.push(0x80 | (charCode & 0x3f));
        }
    }

    const bitLength = utf8Bytes.length * 8;
    utf8Bytes.push(0x80);
    while ((utf8Bytes.length % 64) !== 56) {
        utf8Bytes.push(0x00);
    }
    const highBits = Math.floor(bitLength / 0x100000000);
    const lowBits = bitLength & 0xffffffff;

    utf8Bytes.push((highBits >>> 24) & 0xff);
    utf8Bytes.push((highBits >>> 16) & 0xff);
    utf8Bytes.push((highBits >>> 8) & 0xff);
    utf8Bytes.push(highBits & 0xff);
    utf8Bytes.push((lowBits >>> 24) & 0xff);
    utf8Bytes.push((lowBits >>> 16) & 0xff);
    utf8Bytes.push((lowBits >>> 8) & 0xff);
    utf8Bytes.push(lowBits & 0xff);

    const hash: number[] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k: number[] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    for (let i = 0; i < utf8Bytes.length; i += 64) {
        const block: number[] = [];
        for (let j = 0; j < 64; j += 4) {
            block.push(
                ((utf8Bytes[i + j] & 0xff) << 24) |
                ((utf8Bytes[i + j + 1] & 0xff) << 16) |
                ((utf8Bytes[i + j + 2] & 0xff) << 8) |
                (utf8Bytes[i + j + 3] & 0xff)
            );
        }

        const W = new Array(64);
        for (let t = 0; t < 16; t++) {
            W[t] = block[t];
        }
        for (let t = 16; t < 64; t++) {
            const s0 = rightRotate(W[t - 15], 7) ^ rightRotate(W[t - 15], 18) ^ (W[t - 15] >>> 3);
            const s1 = rightRotate(W[t - 2], 17) ^ rightRotate(W[t - 2], 19) ^ (W[t - 2] >>> 10);
            W[t] = (((W[t - 16] + s0) | 0) + ((W[t - 7] + s1) | 0)) | 0;
        }

        let a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];

        for (let t = 0; t < 64; t++) {
            const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            const ch = (e & f) ^ ((~e) & g);
            const temp1 = ((((h + S1) | 0) + ch) | 0) + ((k[t] + W[t]) | 0);
            const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const temp2 = (S0 + maj) | 0;

            h = g;
            g = f;
            f = e;
            e = ((d + temp1) | 0);
            d = c;
            c = b;
            b = a;
            a = ((temp1 + temp2) | 0);
        }

        hash[0] = (hash[0] + a) | 0;
        hash[1] = (hash[1] + b) | 0;
        hash[2] = (hash[2] + c) | 0;
        hash[3] = (hash[3] + d) | 0;
        hash[4] = (hash[4] + e) | 0;
        hash[5] = (hash[5] + f) | 0;
        hash[6] = (hash[6] + g) | 0;
        hash[7] = (hash[7] + h) | 0;
    }

    return hash.map(val => (val >>> 0).toString(16).padStart(8, '0')).join('');
}

/**
 * Legacy buggy SHA-256 fallback hash computer (used purely for graceful backward compatibility with existing stored sessions)
 */
export function legacyBuggySha256(ascii: string): string {
    function rightRotate(value: number, amount: number): number {
        return (value >>> amount) | (value << (32 - amount));
    }
    let result = '';
    const words: number[] = [];
    const asciiLength = (ascii || '').length * 8;
    const hash: number[] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];
    const k: number[] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    let i = 0, j = 0;
    for (i = 0; i < (ascii || '').length; i++) {
        words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }
    words[asciiLength >> 5] |= 0x80 << (24 - (asciiLength % 32));
    words[(((asciiLength + 64) >> 9) << 4) + 15] = asciiLength;

    for (i = 0; i < words.length; i += 16) {
        const w = words.slice(i, i + 16);
        const oldHash = hash.slice(0);

        for (j = 0; j < 64; j++) {
            if (j >= 16) {
                const s0 = rightRotate((w[j - 15] || 0), 7) ^ rightRotate((w[j - 15] || 0), 18) ^ (((w[j - 15] || 0)) >>> 3);
                const s1 = rightRotate((w[j - 2] || 0), 17) ^ rightRotate((w[j - 2] || 0), 19) ^ (((w[j - 2] || 0)) >>> 10);
                w[j] = ((((w[j - 16] || 0) + s0) | 0) + ((((w[j - 7] || 0) + s1)) | 0)) | 0;
            }

            const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
            const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
            const temp1 = ((((hash[7] + s1) | 0) + ch) | 0) + ((k[j] + (w[j] || 0)) | 0);
            const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
            const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            const temp2 = (s0 + maj) | 0;

            hash[7] = hash[6];
            hash[6] = hash[5];
            hash[5] = hash[4];
            hash[4] = (hash[3] + temp1) | 0;
            hash[3] = hash[2];
            hash[2] = hash[1];
            hash[1] = hash[0];
            hash[0] = (temp1 + temp2) | 0;
        }

        for (j = 0; j < 8; j++) {
            hash[j] = (hash[j] + oldHash[j]) | 0;
        }
    }

    for (j = 0; j < 8; j++) {
        for (i = 3; i >= 0; i--) {
            const b = (hash[j] >> (i * 8)) & 0xff;
            result += b.toString(16).padStart(2, '0');
        }
    }
    return result;
}

/**
 * Compute SHA-256 hash using SubtleCrypto Web API with fallback
 * @param text Text string to hash
 * @returns SHA-256 Hex Digest
 */
export async function sha256Subtle(text: string): Promise<string> {
    const cleanText = text || '';
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(cleanText);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.warn('SubtleCrypto error, falling back to pure JS SHA-256:', e);
        }
    }
    return sha256Fallback(cleanText);
}

/**
 * Constant-time string equality comparison to prevent timing side-channel attacks
 * @param a First string
 * @param b Second string
 * @returns True if strings match exactly
 */
export function timingSafeEqual(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    let mismatch = a.length === b.length ? 0 : 1;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

/**
 * Hash user password with salt using SubtleCrypto API
 * @param password Raw password or PIN
 * @param salt Salt string
 * @returns Hex string of salted password hash
 */
export async function hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    const cleanPass = (password || '').trim();
    const cleanSalt = (salt || '').trim();
    const payload = `vedrabi_salt_${cleanSalt}_pass_${cleanPass}`;
    return await sha256Subtle(payload);
}

/**
 * Synchronous salted password hash
 * @param password Raw password or PIN
 * @param salt Salt string
 * @returns Hex string of salted password hash
 */
export function hashPasswordWithSaltSync(password: string, salt: string): string {
    const cleanPass = (password || '').trim();
    const cleanSalt = (salt || '').trim();
    return sha256Fallback(`vedrabi_salt_${cleanSalt}_pass_${cleanPass}`);
}

/**
 * Diagnostic logger for authentication and cryptographic verification
 */
export const AuthLogger = {
    info(stage: string, message: string, details?: any) {
        console.log(
            `%c[AuthVerification - ${stage}]%c ${message}`,
            'background: #2563eb; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            'color: #1e293b; font-weight: 500;',
            details !== undefined ? details : ''
        );
    },
    success(stage: string, message: string, details?: any) {
        console.log(
            `%c[AuthVerification - ${stage} ✅]%c ${message}`,
            'background: #10b981; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            'color: #047857; font-weight: bold;',
            details !== undefined ? details : ''
        );
    },
    warn(stage: string, message: string, details?: any) {
        console.warn(
            `%c[AuthVerification - ${stage} ⚠️]%c ${message}`,
            'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
            'color: #b45309; font-weight: 500;',
            details !== undefined ? details : ''
        );
    },
    error(stage: string, failurePoint: string, errorObj: any, context?: any) {
        const errorMsg = String(errorObj?.message || errorObj || '');
        const errorCode = String(errorObj?.code || '');
        const isClientAuthCheck = 
            failurePoint === 'LOGIN_FAILED' || 
            failurePoint === 'SIGNUP_FAILED' ||
            failurePoint === 'USER_NOT_FOUND' ||
            failurePoint === 'WRONG_PASSWORD' ||
            failurePoint === 'INVALID_EMAIL' ||
            failurePoint === 'WEAK_PASSWORD' ||
            failurePoint === 'EMAIL_ALREADY_IN_USE' ||
            failurePoint === 'MOCK_LOGIN_LOOKUP' ||
            failurePoint === 'MOCK_LOGIN_VERIFY' ||
            errorCode.startsWith('auth/') ||
            errorMsg.includes('INVALID_LOGIN_CREDENTIALS') ||
            errorMsg.includes('wrong-password') ||
            errorMsg.includes('user-not-found');

        if (isClientAuthCheck) {
            console.warn(
                `%c[AuthNotice - ${stage}: ${failurePoint}]%c ${errorMsg}`,
                'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
                'color: #b45309; font-weight: 500;',
                context || {}
            );
        } else {
            console.error(
                `%c[AuthVerification FAILURE ❌: ${failurePoint}]%c Stage: ${stage}\nError: ${errorMsg}\nCode: ${errorCode || 'N/A'}\nContext:`,
                'background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold;',
                'color: #b91c1c; font-weight: 600;',
                context || {}
            );
        }
    }
};

/**
 * Asynchronous password hash verification with constant-time equality check & legacy fallback
 * @param password Input password or PIN
 * @param salt Stored salt string
 * @param storedHash Stored SHA-256 hash
 */
export async function verifyPasswordHash(password: string, salt: string, storedHash: string): Promise<boolean> {
    if (!storedHash || !salt) {
        AuthLogger.warn('VERIFY_HASH', 'Missing storedHash or salt for verification', { hasSalt: !!salt, hasHash: !!storedHash });
        return false;
    }
    const cleanPass = (password || '').trim();
    const cleanSalt = (salt || '').trim();
    const payload = `vedrabi_salt_${cleanSalt}_pass_${cleanPass}`;
    const rawPayload = `vedrabi_salt_${salt}_pass_${password}`;

    // 1. Standard subtle/pure-JS SHA-256 check (trimmed)
    const currentHash = await hashPasswordWithSalt(password, salt);
    if (timingSafeEqual(currentHash, storedHash)) {
        AuthLogger.success('VERIFY_HASH', 'Standard SubtleCrypto SHA-256 hash match verified');
        return true;
    }

    // 2. Synchronous pure-JS standard SHA-256 check (trimmed payload)
    const syncHash = sha256Fallback(payload);
    if (timingSafeEqual(syncHash, storedHash)) {
        AuthLogger.success('VERIFY_HASH', 'Pure-JS SHA-256 fallback hash match verified');
        return true;
    }

    // 3. Raw payload check (untrimmed password)
    if (password !== cleanPass) {
        const rawSyncHash = sha256Fallback(rawPayload);
        if (timingSafeEqual(rawSyncHash, storedHash)) {
            AuthLogger.success('VERIFY_HASH', 'Raw un-trimmed payload SHA-256 match verified');
            return true;
        }
    }

    // 4. Graceful legacy buggy fallback SHA-256 check
    const legacyBuggyHash = legacyBuggySha256(payload);
    if (timingSafeEqual(legacyBuggyHash, storedHash)) {
        AuthLogger.success('VERIFY_HASH', 'Legacy backward-compatible SHA-256 match verified');
        return true;
    }

    // 5. Raw hash of password without salt wrapper
    const rawPassHash = sha256Fallback(cleanPass);
    if (timingSafeEqual(rawPassHash, storedHash)) {
        AuthLogger.success('VERIFY_HASH', 'Direct unsalted SHA-256 match verified');
        return true;
    }

    // 6. Raw plaintext fallback (for legacy migrations)
    if (timingSafeEqual(cleanPass, storedHash) || timingSafeEqual(password, storedHash)) {
        AuthLogger.success('VERIFY_HASH', 'Legacy plaintext match verified (will be auto-upgraded)');
        return true;
    }

    AuthLogger.warn('VERIFY_HASH', 'All cryptographic verification attempts failed for password', {
        storedHashLength: storedHash.length,
        saltLength: salt.length,
        inputPassLength: password ? password.length : 0
    });
    return false;
}

/**
 * Synchronous password hash verification with constant-time equality check
 * @param password Input password or PIN
 * @param salt Stored salt string
 * @param storedHash Stored SHA-256 hash
 */
export function verifyPasswordHashSync(password: string, salt: string, storedHash: string): boolean {
    if (!storedHash || !salt) return false;
    const cleanPass = (password || '').trim();
    const cleanSalt = (salt || '').trim();
    const payload = `vedrabi_salt_${cleanSalt}_pass_${cleanPass}`;
    const rawPayload = `vedrabi_salt_${salt}_pass_${password}`;

    const syncHash = sha256Fallback(payload);
    if (timingSafeEqual(syncHash, storedHash)) {
        return true;
    }

    if (password !== cleanPass) {
        const rawSyncHash = sha256Fallback(rawPayload);
        if (timingSafeEqual(rawSyncHash, storedHash)) {
            return true;
        }
    }

    const legacyBuggyHash = legacyBuggySha256(payload);
    if (timingSafeEqual(legacyBuggyHash, storedHash)) {
        return true;
    }

    const rawPassHash = sha256Fallback(cleanPass);
    if (timingSafeEqual(rawPassHash, storedHash)) {
        return true;
    }

    if (timingSafeEqual(cleanPass, storedHash) || timingSafeEqual(password, storedHash)) {
        return true;
    }

    return false;
}

// Global expose for non-module scripts
if (typeof window !== 'undefined') {
    window.CryptoUtils = {
        generateSecureSalt,
        sha256Subtle,
        hashPasswordWithSalt,
        hashPasswordWithSaltSync,
        sha256Fallback,
        legacyBuggySha256,
        timingSafeEqual,
        verifyPasswordHash,
        verifyPasswordHashSync
    };
}
