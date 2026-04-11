import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAll, getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const violations = await getAll(
    `SELECT cv.*, u.name as user_name, u.email as user_email,
      c.property_id,
      (SELECT title FROM properties WHERE id = c.property_id) as property_title
    FROM contact_violations cv
    JOIN users u ON cv.user_id = u.id
    JOIN conversations c ON cv.conversation_id = c.id
    ORDER BY cv.created_at DESC
    LIMIT 100`
  );

  const count = await getOne(
    'SELECT COUNT(*) as count FROM contact_violations'
  );

  return NextResponse.json({ violations, total: parseInt(count?.count || '0') });
}
