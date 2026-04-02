import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import db from './db';

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

export function createSession(userId: number): string {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).run(sessionId, userId, expiresAt);

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

export function getCurrentUser(): User | null {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (!sessionId) return null;

  const row = db.prepare(`
    SELECT u.id, u.name, u.email, u.avatar_url, u.provider, u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).get(sessionId) as User | undefined;

  return row ?? null;
}

export function logout() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionId) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  }

  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export function upsertUser(email: string, name: string): User {
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;

  if (existing) {
    // Update name if provided and different
    if (name && name !== existing.name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, existing.id);
      existing.name = name;
    }
    return existing;
  }

  const result = db.prepare(
    'INSERT INTO users (name, email, provider) VALUES (?, ?, ?)'
  ).run(name, email, 'local');

  return db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as User;
}
