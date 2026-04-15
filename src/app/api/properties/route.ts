import { NextRequest, NextResponse } from 'next/server';
import { getOne, getAll } from '@/lib/db';
import { checkAlertsForProperty } from '@/lib/alerts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const allowResaleFilter = searchParams.get('allow_resale');

    const whereClause = allowResaleFilter === 'true'
      ? `WHERE p.status = 'active' AND (p.approved = 'approved' OR p.approved IS NULL) AND p.allow_resale = TRUE`
      : `WHERE p.status = 'active' AND (p.approved = 'approved' OR p.approved IS NULL)`;

    const properties = await getAll(
      `SELECT p.*,
        s.user_id as seller_user_id,
        COALESCE((SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        )) FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as images
      FROM properties p
      LEFT JOIN sellers s ON p.seller_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (properties as any[]).map((p: Record<string, unknown>) => ({
      ...p,
      characteristics: p.characteristics ? JSON.parse(p.characteristics as string) : [],
      details: p.details ? JSON.parse(p.details as string) : {},
      images: typeof p.images === 'string' ? JSON.parse(p.images as string) : (p.images || []),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      price,
      area,
      type,
      address,
      city,
      state = 'SP',
      neighborhood,
      characteristics,
      details,
      latitude,
      longitude,
      seller_id,
    } = body;

    if (!title || !description || !price || !area || !type || !address || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await getOne(
      `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, latitude, longitude, seller_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING id`,
      [
        title,
        description,
        price,
        area,
        type,
        address,
        city,
        state,
        neighborhood || null,
        characteristics ? JSON.stringify(characteristics) : null,
        details ? JSON.stringify(details) : null,
        latitude || null,
        longitude || null,
        seller_id || null,
      ]
    );

    const property = await getOne('SELECT * FROM properties WHERE id = $1', [result.id]);

    // Check all active search alerts against the new property
    try {
      await checkAlertsForProperty(Number(result.id));
    } catch (err) {
      console.error('Error checking alerts for new property:', err);
    }

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Error creating property:', error);
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    );
  }
}
