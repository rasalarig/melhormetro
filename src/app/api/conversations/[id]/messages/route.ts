import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne, getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

function containsContactInfo(text: string): { blocked: boolean; reason: string } {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // Email pattern
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
    return { blocked: true, reason: 'Compartilhar emails não é permitido. Use o chat da plataforma.' };
  }

  // Phone patterns (Brazilian formats)
  // Matches: (11) 99999-9999, 11 99999-9999, 11999999999, +5511999999999, 9 9999-9999, etc.
  const phonePatterns = [
    /\(?\d{2}\)?\s*9?\s*\d{4}[-.\s]?\d{4}/,  // (11) 99999-9999 or 11 99999-9999
    /\+?\d{2,3}\s*\d{2}\s*9?\d{4}[-.\s]?\d{4}/, // +55 11 99999-9999
    /\b\d{10,11}\b/, // 11999999999
    /\b\d{4,5}[-.\s]\d{4}\b/, // 99999-9999 or 9999-9999
  ];

  for (const pattern of phonePatterns) {
    if (pattern.test(text)) {
      return { blocked: true, reason: 'Compartilhar números de telefone não é permitido. Use o chat da plataforma.' };
    }
  }

  // WhatsApp / messaging app mentions
  const whatsappPatterns = /\b(whatsapp|whats\s*app|wpp|wats|zap|zapzap|whats|whatss)\b/i;
  if (whatsappPatterns.test(normalized)) {
    return { blocked: true, reason: 'Mencionar WhatsApp ou apps de mensagem não é permitido. Use o chat da plataforma.' };
  }

  // Social media mentions
  const socialPatterns = /\b(instagram|insta|telegram|face\s*book|linkedin)\b/i;
  if (socialPatterns.test(normalized)) {
    return { blocked: true, reason: 'Mencionar redes sociais não é permitido. Use o chat da plataforma.' };
  }

  // @ handles (but not if it's just @ in a sentence without a handle format)
  if (/@[a-zA-Z0-9._]{3,}/.test(text)) {
    return { blocked: true, reason: 'Compartilhar perfis de redes sociais não é permitido.' };
  }

  // Direct contact attempts in Portuguese
  const contactAttempts = /\b(meu\s*(numero|número|email|e-mail|telefone|cel|celular|contato|zap|whats|fone)|me\s*(liga|chama|add|adiciona)|liga\s*(pra|para)\s*mim|chama\s*no|fala\s*no|manda\s*(msg|mensagem)\s*(no|pelo|via)|te\s*passo\s*(meu|o)|anota\s*(meu|o)|pega\s*(meu|o))\b/i;
  if (contactAttempts.test(normalized)) {
    return { blocked: true, reason: 'Trocar contatos diretamente não é permitido. Toda comunicação deve ser pela plataforma.' };
  }

  // "tel:" or "fone:" prefix
  if (/\b(tel|fone|celular|numero|número)\s*[:]\s*\S+/i.test(normalized)) {
    return { blocked: true, reason: 'Compartilhar informações de contato não é permitido.' };
  }

  return { blocked: false, reason: '' };
}

// GET /api/conversations/[id]/messages — Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = parseInt(params.id);
  if (isNaN(conversationId)) {
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Verify user is part of conversation
  const conversation = await getOne(
    'SELECT * FROM conversations WHERE id = $1 AND (seller_user_id = $2 OR buyer_user_id = $2)',
    [conversationId, user.id]
  );

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Mark unread messages from the other user as read
  await query(
    'UPDATE messages SET read_at = NOW() WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL',
    [conversationId, user.id]
  );

  const messages = await getAll(
    'SELECT id, sender_id, content, read_at, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
    [conversationId]
  );

  return NextResponse.json({ messages });
}

// POST /api/conversations/[id]/messages — Send a message
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
    return NextResponse.json({ error: 'Invalid conversation ID' }, { status: 400 });
  }

  // Verify user is part of conversation
  const conversation = await getOne(
    'SELECT * FROM conversations WHERE id = $1 AND (seller_user_id = $2 OR buyer_user_id = $2)',
    [conversationId, user.id]
  );

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const body = await request.json();
  const { content } = body;

  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  // Check for contact information
  const contactCheck = containsContactInfo(content.trim());
  if (contactCheck.blocked) {
    // Log violation for admin review
    try {
      await query(
        'INSERT INTO contact_violations (user_id, conversation_id, attempted_message, violation_type) VALUES ($1, $2, $3, $4)',
        [user.id, conversationId, content.trim(), contactCheck.reason]
      );
    } catch (e) {
      console.error('[Violations] Failed to log violation:', e);
    }

    return NextResponse.json(
      { error: contactCheck.reason, blocked: true },
      { status: 422 }
    );
  }

  const message = await getOne(
    'INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id, sender_id, content, read_at, created_at',
    [conversationId, user.id, content.trim()]
  );

  // Update conversation's updated_at
  await query(
    'UPDATE conversations SET updated_at = NOW() WHERE id = $1',
    [conversationId]
  );

  return NextResponse.json({ message });
}
