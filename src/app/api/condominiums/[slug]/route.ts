import { NextRequest, NextResponse } from 'next/server';
import { getOne, getAll, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const condo = await getOne(
      'SELECT * FROM condominiums WHERE slug = $1',
      [params.slug]
    );

    if (!condo) {
      return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 404 });
    }

    const properties = await getAll(
      `SELECT p.*,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', pi.id,
            'filename', pi.filename,
            'original_name', pi.original_name,
            'is_cover', pi.is_cover
          ) ORDER BY pi.is_cover DESC, pi.id ASC)
          FROM property_images pi WHERE pi.property_id = p.id
        ), '[]'::json) as images
      FROM properties p
      WHERE p.condominium_id = $1
        AND p.status = 'active'
        AND p.approved = 'approved'
      ORDER BY p.created_at DESC`,
      [condo.id]
    );

    const parsedProperties = properties.map((p: Record<string, unknown>) => ({
      ...p,
      characteristics: p.characteristics ? JSON.parse(p.characteristics as string) : [],
      details: p.details ? JSON.parse(p.details as string) : {},
      images: typeof p.images === 'string' ? JSON.parse(p.images as string) : (p.images || []),
    }));

    return NextResponse.json({ condominium: condo, properties: parsedProperties });
  } catch (error) {
    console.error('Error fetching condominium:', error);
    return NextResponse.json({ error: 'Failed to fetch condominium' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado' }, { status: 401 });
    }

    const condo = await getOne('SELECT * FROM condominiums WHERE slug = $1', [params.slug]);
    if (!condo) {
      return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, city, state, neighborhood, amenities, lat, lng, cover_image_url } = body;

    const updated = await getOne(
      `UPDATE condominiums SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        city = COALESCE($3, city),
        state = COALESCE($4, state),
        neighborhood = COALESCE($5, neighborhood),
        amenities = COALESCE($6, amenities),
        lat = COALESCE($7, lat),
        lng = COALESCE($8, lng),
        cover_image_url = COALESCE($9, cover_image_url),
        updated_at = NOW()
      WHERE slug = $10
      RETURNING *`,
      [
        name || null,
        description !== undefined ? description : null,
        city || null,
        state || null,
        neighborhood || null,
        amenities && Array.isArray(amenities) ? amenities : null,
        lat != null ? lat : null,
        lng != null ? lng : null,
        cover_image_url !== undefined ? cover_image_url : null,
        params.slug,
      ]
    );

    return NextResponse.json({ condominium: updated });
  } catch (error) {
    console.error('Error updating condominium:', error);
    return NextResponse.json({ error: 'Failed to update condominium' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado' }, { status: 401 });
    }

    const condo = await getOne('SELECT * FROM condominiums WHERE slug = $1', [params.slug]);
    if (!condo) {
      return NextResponse.json({ error: 'Condomínio não encontrado' }, { status: 404 });
    }

    // Check if there are properties linked
    const linked = await getOne(
      'SELECT COUNT(*) as count FROM properties WHERE condominium_id = $1',
      [condo.id]
    ) as { count: string };

    if (parseInt(linked.count, 10) > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir um condomínio que possui imóveis vinculados' },
        { status: 409 }
      );
    }

    await query('DELETE FROM condominiums WHERE id = $1', [condo.id]);

    return NextResponse.json({ message: 'Condomínio excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting condominium:', error);
    return NextResponse.json({ error: 'Failed to delete condominium' }, { status: 500 });
  }
}
