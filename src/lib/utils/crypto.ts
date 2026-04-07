import bcrypt from "bcryptjs";

// Utilities for Cloudflare Workers (Web Crypto API)
const deriveAesKey = async (secret: string): Promise<CryptoKey> => {
    const enc = new TextEncoder();
    const secretBytes = enc.encode(secret);
    // Derive fixed-length key via SHA-256, then import as raw AES key (256-bit)
    const hash = await crypto.subtle.digest('SHA-256', secretBytes);
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

const toBase64 = (u8: Uint8Array) => btoa(String.fromCharCode(...u8));
const fromBase64 = (b64: string) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

const encrypt = async (text: string, secret: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const key = await deriveAesKey(secret);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const encryptedBytes = new Uint8Array(encrypted);
    // Prepend IV so decrypt can extract it
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv, 0);
    combined.set(encryptedBytes, iv.length);
    return toBase64(combined);
}

const decrypt = async (encryptedB64: string, secret: string): Promise<string> => {
    const combined = fromBase64(encryptedB64);
    const iv = combined.slice(0, 12);
    const encryptedBytes = combined.slice(12);
    const key = await deriveAesKey(secret);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encryptedBytes.buffer);
    return new TextDecoder().decode(decrypted);
}

const passwordHash = async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 10);
}

const passwordCompare = async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
}

export { encrypt, decrypt, passwordHash, passwordCompare };