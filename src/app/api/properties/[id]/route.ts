import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = db
      .prepare(
        `SELECT p.*,
          (SELECT json_group_array(json_object(
            'id', pi.id,
            'filename', pi.filename,
            'original_name', pi.original_name,
            'is_cover', pi.is_cover
          )) FROM property_images pi WHERE pi.property_id = p.id) as images
        FROM properties p
        WHERE p.id = ?`
      )
      .get(params.id) as Record<string, unknown> | undefined;

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
      images: property.images ? JSON.parse(property.images as string) : [],
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = db
      .prepare('SELECT * FROM properties WHERE id = ?')
      .get(params.id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

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

    db.prepare(
      `UPDATE properties SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        area = COALESCE(?, area),
        type = COALESCE(?, type),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        neighborhood = COALESCE(?, neighborhood),
        status = COALESCE(?, status),
        characteristics = COALESCE(?, characteristics),
        details = COALESCE(?, details),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
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
      params.id
    );

    const updated = db
      .prepare('SELECT * FROM properties WHERE id = ?')
      .get(params.id);

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
    const existing = db
      .prepare('SELECT * FROM properties WHERE id = ?')
      .get(params.id);

    if (!existing) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    db.prepare('DELETE FROM properties WHERE id = ?').run(params.id);

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Error deleting property:', error);
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
