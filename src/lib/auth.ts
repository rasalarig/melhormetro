import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { query, getOne } from './db';

const COOKIE_NAME = 'session_id';
const SESSION_DURATION_DAYS = 7;

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  provider: string;
  created_at: string;
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
  cookieStore.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const row = await getOne(
    `SELECT u.id, u.name, u.email, u.avatar_url, u.provider, u.created_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > NOW()`,
    [sessionId]
  );

  return row as User | null;
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
  return user;
}
