import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';

export const SESSION_COOKIE = 'honey_session';
const enc = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) { let value = ''; for (const byte of bytes) value += String.fromCharCode(byte); return btoa(value); }
function base64ToBytes(value: string) { return Uint8Array.from(atob(value), char => char.charCodeAt(0)); }
export function randomToken(size = 32) { return bytesToBase64(crypto.getRandomValues(new Uint8Array(size))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', ''); }
export async function sha256(value: string) { const hash = await crypto.subtle.digest('SHA-256', enc.encode(value)); return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join(''); }
export async function hashPassword(password: string, saltValue?: string) { const salt = saltValue ? base64ToBytes(saltValue) : crypto.getRandomValues(new Uint8Array(16)); const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']); const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, key, 256); return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) }; }
export async function verifyPassword(password: string, salt: string, expected: string) { const { hash } = await hashPassword(password, salt); if (hash.length !== expected.length) return false; let diff = 0; for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i); return diff === 0; }

export type AuthUser = { id: string; email: string; name: string; role: 'ADMIN' | 'STAFF'; active: number };
export type AppEnv = { DB: D1Database; MEDIA?: R2Bucket; CORS_ORIGIN?: string; APP_URL?: string; RESEND_API_KEY?: string; RESEND_FROM?: string };
export type AppVariables = { user: AuthUser };

export async function requireAuth(c: Context<{ Bindings: AppEnv; Variables: AppVariables }>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE); if (!token) return c.json({ message: 'Authentication required' }, 401);
  const hash = await sha256(token);
  const row = await c.env.DB.prepare(`SELECT u.id,u.email,u.name,u.role,u.active FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`).bind(hash, new Date().toISOString()).first<AuthUser>();
  if (!row) return c.json({ message: 'Session expired' }, 401);
  c.set('user', row); await next();
}
export async function requireAdmin(c: Context<{ Bindings: AppEnv; Variables: AppVariables }>, next: Next) { if (c.get('user')?.role !== 'ADMIN') return c.json({ message: 'Admin role required' }, 403); await next(); }
export function validOrigin(c: Context<{ Bindings: AppEnv; Variables: AppVariables }>) { const origin = c.req.header('Origin'); return !origin || origin === c.env.CORS_ORIGIN || origin === c.env.APP_URL; }
