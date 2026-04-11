import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne, getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/conversations — List conversations for current user
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversations = await getAll(
    `SELECT c.*,
      p.title as property_title,
      p.city as property_city,
      CASE WHEN c.seller_user_id = $1 THEN c.buyer_user_id ELSE c.seller_user_id END as other_user_id
    FROM conversations c
    JOIN properties p ON c.property_id = p.id
    WHERE c.seller_user_id = $1 OR c.buyer_user_id = $1
    ORDER BY c.updated_at DESC`,
    [user.id]
  );

  const result = [];
  for (const conv of conversations) {
    const otherUser = await getOne(
      'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
      [conv.other_user_id]
    );

    const lastMessage = await getOne(
      'SELECT id, sender_id, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1',
      [conv.id]
    );

    const unreadRow = await getOne(
      'SELECT COUNT(*)::int as count FROM messages WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
      [conv.id, user.id]
    );

    result.push({
      id: conv.id,
      property_id: conv.property_id,
      property_title: conv.property_title,
      property_city: conv.property_city,
      other_user: otherUser,
      last_message: lastMessage || null,
      unread_count: unreadRow?.count || 0,
      updated_at: conv.updated_at,
      intermediation_status: conv.intermediation_status,
    });
  }

  return NextResponse.json({ conversations: result });
}

// POST /api/conversations — Create or get existing conversation
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { property_id, other_user_id } = body;

  if (!property_id || !other_user_id) {
    return NextResponse.json({ error: 'property_id and other_user_id are required' }, { status: 400 });
  }

  // Get property to determine seller
  const property = await getOne(
    `SELECT p.id, p.title, s.user_id as seller_user_id
     FROM properties p
     LEFT JOIN sellers s ON p.seller_id = s.id
     WHERE p.id = $1`,
    [property_id]
  );

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Determine seller and buyer
  let seller_user_id: number;
  let buyer_user_id: number;

  if (property.seller_user_id === user.id) {
    seller_user_id = user.id;
    buyer_user_id = other_user_id;
  } else if (property.seller_user_id === other_user_id) {
    seller_user_id = other_user_id;
    buyer_user_id = user.id;
  } else {
    // Current user is the buyer, other is seller
    seller_user_id = other_user_id;
    buyer_user_id = user.id;
  }

  // Check existing
  let conversation = await getOne(
    'SELECT * FROM conversations WHERE property_id = $1 AND seller_user_id = $2 AND buyer_user_id = $3',
    [property_id, seller_user_id, buyer_user_id]
  );

  if (!conversation) {
    conversation = await getOne(
      'INSERT INTO conversations (property_id, seller_user_id, buyer_user_id) VALUES ($1, $2, $3) RETURNING *',
      [property_id, seller_user_id, buyer_user_id]
    );
  }

  const otherUser = await getOne(
    'SELECT id, name, email, avatar_url FROM users WHERE id = $1',
    [other_user_id]
  );

  const lastMessage = await getOne(
    'SELECT id, sender_id, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1',
    [conversation.id]
  );

  const unreadRow = await getOne(
    'SELECT COUNT(*)::int as count FROM messages WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
    [conversation.id, user.id]
  );

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      property_id: conversation.property_id,
      property_title: property.title,
      other_user: otherUser,
      last_message: lastMessage || null,
      unread_count: unreadRow?.count || 0,
      updated_at: conversation.updated_at,
    }
  });
}
