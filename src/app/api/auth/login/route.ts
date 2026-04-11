import { NextRequest, NextResponse } from 'next/server';
import { upsertUser, loginWithPassword, createSession, setSessionCookie, ensureSellerExists } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email e obrigatorio' }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    let user;

    if (password) {
      // Password-based login
      try {
        user = await loginWithPassword(trimmedEmail, password);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (msg === 'INVALID_CREDENTIALS') {
          return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
        }
        if (msg === 'USE_GOOGLE') {
          return NextResponse.json({ error: 'Esta conta usa login com Google. Use o botao "Entrar com Google".' }, { status: 401 });
        }
        throw err;
      }
    } else {
      // Legacy email-only login (auto-create user) - keep for backwards compat
      const userName = name?.trim() || trimmedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      user = await upsertUser(trimmedEmail, userName);
    }

    // Ensure seller record exists
    await ensureSellerExists(user.id, user.name, user.email);

    const sessionId = await createSession(user.id);
    setSessionCookie(sessionId);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        accepted_seller_terms: user.accepted_seller_terms || false,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
