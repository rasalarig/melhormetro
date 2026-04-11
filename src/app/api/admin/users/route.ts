import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAll, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await getAll(
    'SELECT id, name, email, avatar_url, provider, is_admin, is_premium, created_at FROM users ORDER BY created_at DESC'
  );

  return NextResponse.json(users);
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { userId, is_admin } = await request.json();

  if (!userId || typeof is_admin !== 'boolean') {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  // Prevent self-demotion
  if (userId === user.id) {
    return NextResponse.json({ error: 'Você não pode alterar seu próprio status de admin' }, { status: 400 });
  }

  await query('UPDATE users SET is_admin = $1 WHERE id = $2', [is_admin, userId]);

  return NextResponse.json({ success: true, is_admin });
}
