import { describe, it, expect } from 'vitest';
import {
  generateKeyPair,
  exportPrivateKey,
  calculateSHA256,
  signData,
  verifySignature,
  encryptPrivateKey,
  decryptPrivateKey
} from './crypto';
import crypto from 'node:crypto';

// Polyfill for Web Crypto API in Node.js
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.crypto = crypto as any;
}
if (!globalThis.window) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.window = {} as any;
}
if (!globalThis.window.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.window.crypto = crypto as any;
}
if (!globalThis.window.btoa) {
  globalThis.window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
if (!globalThis.window.atob) {
  globalThis.window.atob = (b64: string) => Buffer.from(b64, 'base64').toString('binary');
}

// Polyfill File for Node.js
if (!globalThis.File) {
  globalThis.File = class File extends Blob {
    name: string;
    lastModified: number;
    constructor(fileBits: BlobPart[], fileName: string, options?: BlobPropertyBag & { lastModified?: number }) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options?.lastModified || Date.now();
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('Crypto Utils (SignVerify)', () => {

  it('TEST 1 — SHA-256: Should calculate consistent SHA-256 hashes', async () => {
    const content = "Hello Digital Signature";
    const file1 = new File([content], "test.txt", { type: "text/plain" });
    const file2 = new File([content], "test.txt", { type: "text/plain" });
    
    const hash1 = await calculateSHA256(file1);
    const hash2 = await calculateSHA256(file2);
    
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 produces 256 bits = 64 hex chars
  });

  it('TEST 2 — ECDSA KEY GENERATION: Should generate ECDSA P-256 key pair', async () => {
    const keyPair = await generateKeyPair();
    
    expect(keyPair).toBeDefined();
    expect(keyPair.publicKey).toBeDefined();
    expect(keyPair.privateKey).toBeDefined();
    expect(keyPair.publicKey.algorithm.name).toBe("ECDSA");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((keyPair.publicKey.algorithm as any).namedCurve).toBe("P-256");
  });

  it('TEST 3 — VALID SIGNATURE: Should successfully sign and verify data', async () => {
    const keyPair = await generateKeyPair();
    const data = JSON.stringify({ message: "Test valid signature" });
    
    const signature = await signData(keyPair.privateKey, data);
    const isValid = await verifySignature(keyPair.publicKey, signature, data);
    
    expect(isValid).toBe(true);
  });

  it('TEST 4 — WRONG PUBLIC KEY: Should fail verification with wrong public key', async () => {
    const keyPairA = await generateKeyPair();
    const keyPairB = await generateKeyPair(); // Wrong key pair
    const data = JSON.stringify({ message: "Test wrong public key" });
    
    const signatureA = await signData(keyPairA.privateKey, data);
    
    // Verify using B's public key
    const isValid = await verifySignature(keyPairB.publicKey, signatureA, data);
    
    expect(isValid).toBe(false);
  });

  it('TEST 5 — TAMPERED DATA: Should fail verification if data is modified', async () => {
    const keyPair = await generateKeyPair();
    const originalData = JSON.stringify({ amount: 1000 });
    const tamperedData = JSON.stringify({ amount: 9000 });
    
    const signature = await signData(keyPair.privateKey, originalData);
    
    const isValid = await verifySignature(keyPair.publicKey, signature, tamperedData);
    
    expect(isValid).toBe(false);
  });

  it('TEST 6 — SIGNATURE MODIFIED: Should fail verification if signature is modified', async () => {
    const keyPair = await generateKeyPair();
    const data = JSON.stringify({ message: "Test modified signature" });
    
    const signature = await signData(keyPair.privateKey, data);
    
    // Corrupt the base64 signature slightly by changing a character
    const modifiedSignature = signature.substring(0, signature.length - 2) + (signature.endsWith('A') ? 'B' : 'A') + signature.substring(signature.length - 1);
    
    const isValid = await verifySignature(keyPair.publicKey, modifiedSignature, data);
    
    expect(isValid).toBe(false);
  });

  it('TEST 7 — HASH DIFFERENT: Different data should produce different hashes', async () => {
    const file1 = new File(["Data A"], "a.txt", { type: "text/plain" });
    const file2 = new File(["Data B"], "b.txt", { type: "text/plain" });
    
    const hash1 = await calculateSHA256(file1);
    const hash2 = await calculateSHA256(file2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('TEST 8 — PRIVATE KEY ENCRYPTION: Should encrypt and decrypt private key', async () => {
    const keyPair = await generateKeyPair();
    const privKeyPem = await exportPrivateKey(keyPair.privateKey);
    const password = "SecurePassword123!";
    
    // Encrypt
    const encryptedJsonStr = await encryptPrivateKey(privKeyPem, password);
    const parsed = JSON.parse(encryptedJsonStr);
    
    expect(parsed.version).toBe(1);
    expect(parsed.algorithm).toBe("AES-GCM");
    expect(parsed.kdf).toBe("PBKDF2");
    expect(parsed.ciphertext).toBeDefined();
    
    // The plaintext should not be inside the encrypted json
    expect(encryptedJsonStr).not.toContain("BEGIN PRIVATE KEY");
    
    // Decrypt with correct password
    const decryptedPem = await decryptPrivateKey(encryptedJsonStr, password);
    expect(decryptedPem).toBe(privKeyPem);
    
    // Decrypt with wrong password should throw
    await expect(decryptPrivateKey(encryptedJsonStr, "WrongPassword!")).rejects.toThrow();
  });
});
