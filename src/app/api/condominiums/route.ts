import { NextRequest, NextResponse } from 'next/server';
import { getAll, getOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function GET() {
  try {
    const condominiums = await getAll(`
      SELECT
        c.*,
        COUNT(p.id) FILTER (WHERE p.status = 'active' AND p.approved = 'approved') AS property_count,
        MIN(p.price) FILTER (WHERE p.status = 'active' AND p.approved = 'approved') AS min_price,
        MAX(p.price) FILTER (WHERE p.status = 'active' AND p.approved = 'approved') AS max_price
      FROM condominiums c
      LEFT JOIN properties p ON p.condominium_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ condominiums });
  } catch (error) {
    console.error('Error fetching condominiums:', error);
    return NextResponse.json({ error: 'Failed to fetch condominiums' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Você precisa estar logado' }, { status: 401 });
    }
    if (!user.is_admin) {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, city, state, neighborhood, amenities, lat, lng, cover_image_url } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }

    const baseSlug = slugify(name);
    // Ensure slug uniqueness by appending random suffix if needed
    let slug = baseSlug;
    const existing = await getOne('SELECT id FROM condominiums WHERE slug = $1', [slug]);
    if (existing) {
      slug = `${baseSlug}-${Date.now()}`;
    }

    const condo = await getOne(
      `INSERT INTO condominiums (name, slug, description, city, state, neighborhood, amenities, lat, lng, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        slug,
        description || null,
        city || null,
        state || null,
        neighborhood || null,
        amenities && Array.isArray(amenities) ? amenities : null,
        lat != null ? lat : null,
        lng != null ? lng : null,
        cover_image_url || null,
      ]
    );

    return NextResponse.json({ condominium: condo }, { status: 201 });
  } catch (error) {
    console.error('Error creating condominium:', error);
    return NextResponse.json({ error: 'Failed to create condominium' }, { status: 500 });
  }
}
