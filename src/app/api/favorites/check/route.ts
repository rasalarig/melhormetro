import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json({ error: 'property_id is required' }, { status: 400 });
    }

    const likesCount = db.prepare(
      'SELECT COUNT(*) as count FROM favorites WHERE property_id = ?'
    ).get(Number(propertyId)) as { count: number };

    const user = getCurrentUser();
    let favorited = false;

    if (user) {
      const existing = db.prepare(
        'SELECT id FROM favorites WHERE user_id = ? AND property_id = ?'
      ).get(user.id, Number(propertyId)) as { id: number } | undefined;
      favorited = !!existing;
    }

    return NextResponse.json({
      favorited,
      likes_count: likesCount.count,
    });
  } catch (error) {
    console.error('Favorites check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
