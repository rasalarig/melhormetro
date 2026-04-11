import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, getOne } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || !user.is_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const propertyId = parseInt(params.id);
  if (isNaN(propertyId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  const property = await getOne('SELECT id FROM properties WHERE id = $1', [propertyId]);
  if (!property) {
    return NextResponse.json({ error: 'Imóvel não encontrado' }, { status: 404 });
  }

  const { approved } = await request.json();
  if (!['approved', 'rejected', 'pending'].includes(approved)) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
  }

  await query('UPDATE properties SET approved = $1 WHERE id = $2', [approved, propertyId]);

  return NextResponse.json({ approved });
}
