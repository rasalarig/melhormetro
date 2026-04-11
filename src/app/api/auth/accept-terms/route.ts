import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await query(
    'UPDATE users SET accepted_seller_terms = TRUE, accepted_seller_terms_at = NOW() WHERE id = $1',
    [user.id]
  );

  return NextResponse.json({ success: true });
}
