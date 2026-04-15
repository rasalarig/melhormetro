import { NextRequest, NextResponse } from "next/server";
import { getOne } from "@/lib/db";
import { calculateValuationScore, ScoredProperty } from "@/lib/valuation-score";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const row = await getOne(
      `SELECT p.type, p.area, p.price, p.city, p.state, p.neighborhood,
              p.latitude, p.longitude, p.description, p.characteristics,
              p.details, p.condominium_id, p.facade_orientation,
              COALESCE(
                (SELECT json_agg(json_build_object('filename', pi.filename))
                 FROM property_images pi WHERE pi.property_id = p.id),
                '[]'::json
              ) AS images
       FROM properties p
       WHERE p.id = $1`,
      [params.id]
    ) as Record<string, unknown> | null;

    if (!row) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const property: ScoredProperty = {
      type: row.type as string,
      area: Number(row.area) || 0,
      price: Number(row.price) || 0,
      city: row.city as string,
      state: row.state as string,
      neighborhood: row.neighborhood as string | null,
      latitude: row.latitude != null ? Number(row.latitude) : null,
      longitude: row.longitude != null ? Number(row.longitude) : null,
      description: row.description as string | null,
      characteristics: row.characteristics as string | null,
      details: row.details as string | null,
      condominium_id: row.condominium_id != null ? Number(row.condominium_id) : null,
      facade_orientation: row.facade_orientation as string | null,
      images: Array.isArray(row.images)
        ? (row.images as { filename: string }[])
        : typeof row.images === "string"
        ? JSON.parse(row.images)
        : [],
    };

    const result = calculateValuationScore(property);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating valuation score:", error);
    return NextResponse.json(
      { error: "Failed to calculate valuation score" },
      { status: 500 }
    );
  }
}
