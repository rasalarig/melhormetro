import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getOne, query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const seller = await getOne(
      'SELECT * FROM sellers WHERE user_id = $1',
      [user.id]
    );

    if (!seller) {
      return NextResponse.json({ error: 'Vendedor nao encontrado' }, { status: 404 });
    }

    const { id } = await params;
    const propertyId = parseInt(id, 10);
    if (isNaN(propertyId)) {
      return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
    }

    // Verify property belongs to seller
    const property = await getOne(
      'SELECT * FROM properties WHERE id = $1 AND seller_id = $2',
      [propertyId, seller.id]
    );

    if (!property) {
      return NextResponse.json({ error: 'Imovel nao encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'inactive', 'sold'].includes(status)) {
      return NextResponse.json(
        { error: 'Status invalido. Use: active, inactive ou sold' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, propertyId]
    );

    const updated = await getOne('SELECT * FROM properties WHERE id = $1', [propertyId]);

    return NextResponse.json({ property: updated });
  } catch (error) {
    console.error('Sellers property PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
