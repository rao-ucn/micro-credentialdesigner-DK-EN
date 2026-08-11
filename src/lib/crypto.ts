import { EncryptedData } from '@/types/course';

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts data with AES-GCM using a password-derived key
 */
export async function encryptData(data: string, password: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt.buffer);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );

  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    data: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

/**
 * Decrypts data with AES-GCM using a password-derived key
 */
export async function decryptData(encrypted: EncryptedData, password: string): Promise<string> {
  const salt = new Uint8Array(encrypted.salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(encrypted.iv.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const data = new Uint8Array(encrypted.data.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const key = await deriveKey(password, salt.buffer);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed - incorrect code');
  }
}

/**
 * Generates a 12-character alphanumeric security code
 * Uses crypto.getRandomValues for secure random generation
 * Excludes ambiguous characters: 0, O, 1, I, L
 * Keyspace: 32^12 = 1.2 × 10^18 combinations (infeasible to brute force)
 */
export function generateSecurityCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 32 unambiguous characters
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars[array[i] % chars.length];
  }
  
  // Format: XXXX-XXXX-XXXX for readability
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`;
}

/**
 * Hashes a security code for storage
 */
export async function hashSecurityCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verifies a security code against a hash
 */
export async function verifySecurityCode(code: string, hash: string): Promise<boolean> {
  const codeHash = await hashSecurityCode(code);
  return codeHash === hash;
}
