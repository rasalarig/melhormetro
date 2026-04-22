import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { query, getOne, getAll } from './db';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'session_id';
const SESSION_DURATION_DAYS = 7;

export interface UserProfile {
  profile_type: string;
  creci?: string | null;
  trade_name?: string | null;
  cnpj?: string | null;
  area_of_operation?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string | null;
  avatar_url: string | null;
  provider: string;
  is_premium: boolean;
  is_admin: boolean;
  accepted_seller_terms: boolean;
  created_at: string;
  profiles: UserProfile[];
}

export function generateSessionId(): string {
  return randomUUID();
}

export async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  await query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionId, userId, expiresAt]
  );

  return sessionId;
}

export function setSessionCookie(sessionId: string) {
  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    secure: isProd,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const row = await getOne(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.provider, u.is_premium, u.is_admin, u.accepted_seller_terms, u.created_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );

  if (!row) return null;

  const profiles = await getAll(
    `SELECT profile_type, creci, trade_name, cnpj, area_of_operation
     FROM user_profiles
     WHERE user_id = $1 AND is_active = TRUE`,
    [row.id]
  );

  return { ...(row as User), profiles: profiles as UserProfile[] };
}

export async function logout() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId) {
    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);
  }

  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function upsertUser(email: string, name: string, avatarUrl?: string, provider?: string): Promise<User> {
  const existing = await getOne('SELECT * FROM users WHERE email = $1', [email]) as User | null;

  if (existing) {
    const updates: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (name && name !== existing.name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (avatarUrl && avatarUrl !== existing.avatar_url) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(avatarUrl);
    }
    if (provider && provider !== existing.provider) {
      updates.push(`provider = $${paramIndex++}`);
      values.push(provider);
    }

    if (updates.length > 0) {
      values.push(existing.id);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);
      if (name) existing.name = name;
      if (avatarUrl) existing.avatar_url = avatarUrl;
      if (provider) existing.provider = provider;
    }
    return existing;
  }

  const result = await getOne(
    'INSERT INTO users (name, email, avatar_url, provider) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, avatarUrl || null, provider || 'local']
  );

  const user = await getOne('SELECT * FROM users WHERE id = $1', [result.id]) as User;

  // Auto-create seller record for new users
  await ensureSellerExists(user.id, user.name, user.email);

  return user;
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const existing = await getOne('SELECT * FROM users WHERE email = $1', [email]) as User | null;

  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  const result = await getOne(
    'INSERT INTO users (name, email, password_hash, provider) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, email, passwordHash, 'local']
  );

  const user = await getOne('SELECT * FROM users WHERE id = $1', [result.id]) as User;

  // Auto-create seller record
  await ensureSellerExists(user.id, user.name, user.email);

  return user;
}

export async function loginWithPassword(email: string, password: string): Promise<User> {
  const user = await getOne('SELECT * FROM users WHERE email = $1', [email]) as User | null;

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  if (!user.password_hash) {
    throw new Error('USE_GOOGLE');
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }

  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (!user.is_admin) {
    throw new Error('FORBIDDEN');
  }
  return user;
}

export async function ensureSellerExists(userId: number, name: string, email: string): Promise<void> {
  const existing = await getOne('SELECT id FROM sellers WHERE user_id = $1', [userId]);
  if (!existing) {
    await query(
      'INSERT INTO sellers (user_id, name, phone, email, city) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, '', email, '']
    );
  }
}

export async function ensureCompradorProfile(userId: number): Promise<void> {
  await query(
    `INSERT INTO user_profiles (user_id, profile_type)
     VALUES ($1, 'comprador')
     ON CONFLICT (user_id, profile_type) DO NOTHING`,
    [userId]
  );
}
