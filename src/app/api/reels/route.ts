import { NextRequest, NextResponse } from 'next/server';
import { getAll } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const allowResaleFilter = searchParams.get('allow_resale');

    const extraWhere = allowResaleFilter === 'true' ? `AND p.allow_resale = TRUE` : '';

    const tours = await getAll(
      `SELECT
        pt.id AS tour_id,
        pt.title AS tour_title,
        pt.description AS tour_description,
        pt.is_original,
        pt.created_at AS tour_created_at,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', tm.id,
            'media_url', tm.media_url,
            'media_type', tm.media_type,
            'display_order', tm.display_order
          ) ORDER BY tm.display_order ASC)
          FROM tour_media tm WHERE tm.tour_id = pt.id),
          '[]'::json
        ) AS tour_media,
        p.id,
        p.title,
        p.description,
        p.price,
        p.area,
        p.type,
        p.city,
        p.state,
        p.neighborhood,
        p.address,
        p.characteristics,
        p.details,
        p.seller_id,
        p.approved,
        p.status,
        p.allow_resale,
        p.resale_commission_percent
      FROM property_tours pt
      JOIN properties p ON p.id = pt.property_id
      WHERE pt.status = 'active'
        AND pt.moderation_status = 'approved'
        AND p.status = 'active'
        AND (p.media_status = 'ready' OR p.media_status IS NULL)
        AND (p.approved = 'approved' OR p.approved IS NULL)
        ${extraWhere}
      ORDER BY RANDOM()`
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = (tours as any[]).map((row: Record<string, unknown>) => {
      const tourMedia = typeof row.tour_media === 'string'
        ? JSON.parse(row.tour_media as string)
        : (row.tour_media || []);

      // Build a backward-compatible images array from tour_media for PropertyReel
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const images = tourMedia.map((m: any, idx: number) => ({
        id: m.id,
        filename: m.media_url,
        original_name: m.media_url,
        is_cover: idx === 0 ? 1 : 0,
      }));

      return {
        // Tour info
        tour_id: row.tour_id,
        tour_title: row.tour_title,
        tour_description: row.tour_description,
        is_original: row.is_original,
        tour_media: tourMedia,
        // Property info
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        area: row.area,
        type: row.type,
        city: row.city,
        state: row.state,
        neighborhood: row.neighborhood,
        characteristics: row.characteristics
          ? JSON.parse(row.characteristics as string)
          : [],
        details: row.details
          ? JSON.parse(row.details as string)
          : {},
        // Backward-compatible images array
        images,
        // Resale fields
        allow_resale: row.allow_resale,
        resale_commission_percent: row.resale_commission_percent,
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}
