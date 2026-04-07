import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ seller: null });
    }

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

export async function POST(request: NextRequest) {
  try {
    const { name, phone, email, city } = await request.json();

    if (!name || !phone || !email || !city) {
      return NextResponse.json(
        { error: 'Todos os campos sao obrigatorios' },
        { status: 400 }
      );
    }

    // Check if user is logged in (optional - sellers can register without account)
    const user = await getCurrentUser();
    const userId = user?.id || null;

    // If logged in, check if already registered as seller
    if (userId) {
      const existing = await getOne(
        'SELECT id FROM sellers WHERE user_id = $1',
        [userId]
      );
      if (existing) {
        return NextResponse.json(
          { error: 'Voce ja esta cadastrado como vendedor', seller: existing },
          { status: 409 }
        );
      }
    }

    const seller = await getOne(
      `INSERT INTO sellers (user_id, name, phone, email, city)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, name, phone, email, city]
    );

    return NextResponse.json({ seller }, { status: 201 });
  } catch (error) {
    console.error('Sellers POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
