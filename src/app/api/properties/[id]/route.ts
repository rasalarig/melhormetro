import { NextRequest, NextResponse } from 'next/server';
import { query, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await getOne(
      `SELECT p.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        )) FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as images
      FROM properties p
      WHERE p.id = $1`,
      [params.id]
    ) as Record<string, unknown> | null;

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const parsed = {
      ...property,
      characteristics: property.characteristics
        ? JSON.parse(property.characteristics as string)
        : [],
      details: property.details ? JSON.parse(property.details as string) : {},
      images: typeof property.images === 'string' ? JSON.parse(property.images as string) : (property.images || []),
    };

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}

async function verifyOwnership(propertyId: string): Promise<{ error?: NextResponse; sellerId?: number }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }) };
  }

  const seller = await getOne('SELECT id FROM sellers WHERE user_id = $1', [user.id]);
  if (!seller) {
    return { error: NextResponse.json({ error: 'Vendedor nao encontrado' }, { status: 404 }) };
  }

  const property = await getOne(
    'SELECT * FROM properties WHERE id = $1',
    [propertyId]
  );

  if (!property) {
    return { error: NextResponse.json({ error: 'Imovel nao encontrado' }, { status: 404 }) };
  }

  if (property.seller_id !== seller.id) {
    return { error: NextResponse.json({ error: 'Voce nao tem permissao para modificar este imovel' }, { status: 403 }) };
  }

  return { sellerId: seller.id };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownership = await verifyOwnership(params.id);
    if (ownership.error) return ownership.error;

    const body = await request.json();
    const {
      title,
      description,
      price,
      area,
      type,
      address,
      city,
      state,
      neighborhood,
      status,
      characteristics,
      details,
      latitude,
      longitude,
    } = body;

    await query(
      `UPDATE properties SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        area = COALESCE($4, area),
        type = COALESCE($5, type),
        address = COALESCE($6, address),
        city = COALESCE($7, city),
        state = COALESCE($8, state),
        neighborhood = COALESCE($9, neighborhood),
        status = COALESCE($10, status),
        characteristics = COALESCE($11, characteristics),
        details = COALESCE($12, details),
        latitude = COALESCE($13, latitude),
        longitude = COALESCE($14, longitude),
        updated_at = NOW()
      WHERE id = $15`,
      [
        title || null,
        description || null,
        price || null,
        area || null,
        type || null,
        address || null,
        city || null,
        state || null,
        neighborhood || null,
        status || null,
        characteristics ? JSON.stringify(characteristics) : null,
        details ? JSON.stringify(details) : null,
        latitude !== undefined ? latitude : null,
        longitude !== undefined ? longitude : null,
        params.id,
      ]
    );

    const updated = await getOne('SELECT * FROM properties WHERE id = $1', [params.id]);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating property:', error);
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ownership = await verifyOwnership(params.id);
    if (ownership.error) return ownership.error;

    await query('DELETE FROM properties WHERE id = $1', [params.id]);

    return NextResponse.json({ message: 'Imovel excluido com sucesso' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
