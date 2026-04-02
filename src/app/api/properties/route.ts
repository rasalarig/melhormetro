import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAlertsForProperty } from '@/lib/alerts';

export async function GET() {
  try {
    const properties = db
      .prepare(
        `SELECT p.*,
          (SELECT json_group_array(json_object(
            'id', pi.id,
            'filename', pi.filename,
            'original_name', pi.original_name,
            'is_cover', pi.is_cover
          )) FROM property_images pi WHERE pi.property_id = p.id) as images
        FROM properties p
        WHERE p.status = 'active'
        ORDER BY p.created_at DESC`
      )
      .all();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (properties as any[]).map((p: Record<string, unknown>) => ({
      ...p,
      characteristics: p.characteristics ? JSON.parse(p.characteristics as string) : [],
      details: p.details ? JSON.parse(p.details as string) : {},
      images: p.images ? JSON.parse(p.images as string) : [],
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
    } = body;

    if (!title || !description || !price || !area || !type || !address || !city) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = db
      .prepare(
        `INSERT INTO properties (title, description, price, area, type, address, city, state, neighborhood, characteristics, details, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
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
        longitude || null
      );

    const property = db
      .prepare('SELECT * FROM properties WHERE id = ?')
      .get(result.lastInsertRowid);

    // Check all active search alerts against the new property
    try {
      checkAlertsForProperty(Number(result.lastInsertRowid));
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
