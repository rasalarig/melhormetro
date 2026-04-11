import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = parseInt(params.id);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  // Verify user is part of conversation
  const conversation = await getOne(
    'SELECT * FROM conversations WHERE id = $1 AND (seller_user_id = $2 OR buyer_user_id = $2)',
    [conversationId, user.id]
  );

  if (!conversation) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
  }

  if (conversation.intermediation_status === 'active') {
    return NextResponse.json({ error: 'Intermediação já está ativa' }, { status: 400 });
  }

  await query(
    'UPDATE conversations SET intermediation_status = $1, intermediation_started_at = NOW(), intermediation_notes = $2 WHERE id = $3',
    ['active', `Solicitado por ${user.name} (${user.email})`, conversationId]
  );

  // Insert a system message so both users see the request
  await query(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)',
    [conversationId, user.id, '🤝 Solicitou intermediação do MelhorMetro para esta conversa.']
  );

  await query('UPDATE conversations SET updated_at = NOW() WHERE id = $1', [conversationId]);

  return NextResponse.json({ success: true, intermediation_status: 'active' });
}
