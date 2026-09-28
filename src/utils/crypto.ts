export async function generateKeyPair(): Promise<CryptoKeyPair> {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Browser Anda memblokir fitur kriptografi. Pastikan Anda menggunakan koneksi HTTPS atau 'localhost' (Bukan IP Address HTTP).");
  }
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"]
  );

  return keyPair as CryptoKeyPair;
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  const exportedAsBase64 = window.btoa(exportedAsString);
  return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
}

export async function exportPrivateKey(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("pkcs8", key);
  const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(exported)));
  const exportedAsBase64 = window.btoa(exportedAsString);
  return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;
}

export async function importPublicKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDerString = window.atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer.buffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["verify"]
  );
}

export async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  ).replace(/\s/g, '');
  
  const binaryDerString = window.atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"]
  );
}

export async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}

export async function signData(privateKey: CryptoKey, dataStr: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(dataStr);
  const signature = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    data
  );
  
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureBase64 = window.btoa(String.fromCharCode.apply(null, signatureArray));
  return signatureBase64;
}

export async function verifySignature(publicKey: CryptoKey, signatureBase64: string, dataStr: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(dataStr);
    
    const signatureString = window.atob(signatureBase64);
    const signatureArray = new Uint8Array(signatureString.length);
    for (let i = 0; i < signatureString.length; i++) {
      signatureArray[i] = signatureString.charCodeAt(i);
    }
    
    const isValid = await window.crypto.subtle.verify(
      {
        name: "ECDSA",
        hash: { name: "SHA-256" },
      },
      publicKey,
      signatureArray.buffer,
      data
    );
    
    return isValid;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}

export interface EncryptedPrivateKey {
  version: number;
  algorithm: string;
  kdf: string;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
}

const ITERATIONS = 100000;

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      salt: salt as any,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptPrivateKey(pem: string, password: string): Promise<string> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(password, salt);
  const encoder = new TextEncoder();
  
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encoder.encode(pem)
  );
  
  const ciphertextArray = Array.from(new Uint8Array(ciphertextBuffer));
  const ciphertext = window.btoa(String.fromCharCode.apply(null, ciphertextArray));
  const saltArray = Array.from(salt);
  const saltBase64 = window.btoa(String.fromCharCode.apply(null, saltArray));
  const ivArray = Array.from(iv);
  const ivBase64 = window.btoa(String.fromCharCode.apply(null, ivArray));
  
  const encryptedData: EncryptedPrivateKey = {
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2",
    iterations: ITERATIONS,
    salt: saltBase64,
    iv: ivBase64,
    ciphertext: ciphertext
  };
  
  return JSON.stringify(encryptedData);
}

export async function decryptPrivateKey(encryptedDataStr: string, password: string): Promise<string> {
  const data: EncryptedPrivateKey = JSON.parse(encryptedDataStr);
  if (data.version !== 1 || data.algorithm !== "AES-GCM" || data.kdf !== "PBKDF2") {
    throw new Error("Unsupported encryption format");
  }
  
  const saltString = window.atob(data.salt);
  const salt = new Uint8Array(saltString.length);
  for (let i = 0; i < saltString.length; i++) salt[i] = saltString.charCodeAt(i);

  const ivString = window.atob(data.iv);
  const iv = new Uint8Array(ivString.length);
  for (let i = 0; i < ivString.length; i++) iv[i] = ivString.charCodeAt(i);

  const ciphertextString = window.atob(data.ciphertext);
  const ciphertext = new Uint8Array(ciphertextString.length);
  for (let i = 0; i < ciphertextString.length; i++) ciphertext[i] = ciphertextString.charCodeAt(i);
  
  const key = await deriveKey(password, salt);
  
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error("Password salah atau Private Key tidak dapat dibuka.");
  }
}
