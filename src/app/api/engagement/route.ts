import { NextRequest, NextResponse } from 'next/server';
import { query, getAll } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, event_type, duration_seconds = 0, metadata } = body;

    if (!property_id || !event_type) {
      return NextResponse.json({ error: 'property_id and event_type required' }, { status: 400 });
    }

    const validTypes = ['view_half', 'view_complete', 'like', 'unlike', 'share', 'click_details', 'click_whatsapp', 'click_buy'];
    if (!validTypes.includes(event_type)) {
      return NextResponse.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    await query(
      `INSERT INTO engagement_events (user_id, property_id, event_type, duration_seconds, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, property_id, event_type, duration_seconds, metadata ? JSON.stringify(metadata) : null]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording engagement:', error);
    return NextResponse.json({ error: 'Failed to record engagement' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const propertyId = request.nextUrl.searchParams.get('property_id');

    let events;
    if (propertyId) {
      events = await getAll(
        'SELECT * FROM engagement_events WHERE user_id = $1 AND property_id = $2 ORDER BY created_at DESC',
        [user.id, Number(propertyId)]
      );
    } else {
      events = await getAll(
        'SELECT * FROM engagement_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100',
        [user.id]
      );
    }

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching engagement:', error);
    return NextResponse.json({ error: 'Failed to fetch engagement' }, { status: 500 });
  }
}
