import { NextResponse } from 'next/server';
import db from '@/lib/db';

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
        ORDER BY RANDOM()`
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
    console.error('Error fetching reels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}
