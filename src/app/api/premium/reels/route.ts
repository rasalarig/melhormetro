import { NextResponse } from 'next/server';
import { getAll } from '@/lib/db';

export async function GET() {
  try {
    const properties = await getAll(
      `SELECT p.*,
        COALESCE((SELECT json_agg(json_build_object(
          'id', pi.id,
          'filename', pi.filename,
          'original_name', pi.original_name,
          'is_cover', pi.is_cover
        )) FROM property_images pi WHERE pi.property_id = p.id), '[]'::json) as images
      FROM properties p
      WHERE p.status = 'active' AND p.is_premium = true AND (p.approved = 'approved' OR p.approved IS NULL)
      ORDER BY RANDOM()`
    );

    const parsed = (properties as any[]).map((p: Record<string, unknown>) => ({
      ...p,
      characteristics: p.characteristics ? JSON.parse(p.characteristics as string) : [],
      details: p.details ? JSON.parse(p.details as string) : {},
      images: typeof p.images === 'string' ? JSON.parse(p.images as string) : (p.images || []),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching premium reels:', error);
    return NextResponse.json({ error: 'Failed to fetch premium reels' }, { status: 500 });
  }
}
