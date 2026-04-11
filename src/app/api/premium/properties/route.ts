import { NextResponse } from 'next/server';
import { getAll, getOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const properties = await getAll(
      "SELECT * FROM properties WHERE status = 'active' AND is_premium = true AND (approved = 'approved' OR approved IS NULL) ORDER BY price DESC"
    );

    const propertiesWithImages = [];
    for (const p of properties as any[]) {
      const coverImage = await getOne(
        "SELECT filename FROM property_images WHERE property_id = $1 ORDER BY is_cover DESC LIMIT 1",
        [p.id]
      ) as { filename: string } | null;
      propertiesWithImages.push({ ...p, coverImage: coverImage?.filename });
    }

    return NextResponse.json(propertiesWithImages);
  } catch (error) {
    console.error('Error fetching premium properties:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
