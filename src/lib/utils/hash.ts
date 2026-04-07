import * as bcrypt from 'bcryptjs';

/** デフォルトのソルトラウンド数 */
export const DEFAULT_SALT_ROUNDS = 10;

/**
 * パスワードを非同期でハッシュ化します。
 * @param password 平文パスワード
 * @param rounds ソルトラウンド数（デフォルトは `DEFAULT_SALT_ROUNDS`）
 */
export async function hashPassword(password: string, rounds = DEFAULT_SALT_ROUNDS): Promise<string> {
	return bcrypt.hash(password, rounds);
}

/** 同期版ハッシュ化（必要なときのみ使用） */
export function hashPasswordSync(password: string, rounds = DEFAULT_SALT_ROUNDS): string {
	return bcrypt.hashSync(password, rounds);
}

/**
 * プレーンテキストとハッシュを比較して検証します（非同期）。
 * @returns マッチする場合は `true`
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

/** 同期版の比較関数 */
export function comparePasswordSync(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash);
}

// -------------------------
// SHA-256 / HMAC-SHA256 utils
// -------------------------

async function subtleDigest(algorithm: string, data: Uint8Array): Promise<ArrayBuffer> {
	// crypto.subtle.digest に渡す際は ArrayBuffer を明示的に渡す
	return crypto.subtle.digest(algorithm, data.buffer as ArrayBuffer);
}

function toUint8(input: string): Uint8Array {
	return new TextEncoder().encode(input);
}

function toHex(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-256 のハッシュを 16 進文字列で返します（非同期）。
 */
export async function sha256Hex(input: string): Promise<string> {
	const data = toUint8(input);
	const hash = await subtleDigest('SHA-256', data);
	return toHex(hash);
}

/**
 * HMAC-SHA256 を計算して 16 進文字列で返します（非同期）。
 * @param key HMAC に使うキー（文字列）
 * @param data 対象データ
 */
export async function hmacSha256Hex(key: string, data: string): Promise<string> {
	const keyData = toUint8(key);
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		keyData.buffer as ArrayBuffer,
		{ name: 'HMAC', hash: { name: 'SHA-256' } },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, toUint8(data).buffer as ArrayBuffer);
	return toHex(signature);
}

export default {
	DEFAULT_SALT_ROUNDS,
	hashPassword,
	hashPasswordSync,
	comparePassword,
	comparePasswordSync,
	sha256Hex,
	hmacSha256Hex,
};

