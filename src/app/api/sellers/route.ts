import { NextResponse } from 'next/server';
import { getCurrentUser, ensureSellerExists } from '@/lib/auth';
import { getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ seller: null });
    }

    // Auto-create seller if it doesn't exist
    await ensureSellerExists(user.id, user.name, user.email);

    const seller = await getOne(
      'SELECT * FROM sellers WHERE user_id = $1',
      [user.id]
    );

    return NextResponse.json({ seller: seller || null });
  } catch (error) {
    console.error('Sellers GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
