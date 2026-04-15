import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, getOne, getAll } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1 AND user_id = $2",
      [alertId, user.id]
    ) as Record<string, unknown> | null;

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Get matches with property data
    const matches = await getAll(
      `SELECT am.*, p.title, p.description, p.price, p.area, p.type,
        p.address, p.city, p.state, p.neighborhood, p.characteristics,
        p.details, p.status as property_status,
        (SELECT pi.filename FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
        (SELECT pi.filename FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as first_image
      FROM alert_matches am
      JOIN properties p ON am.property_id = p.id
      WHERE am.alert_id = $1
      ORDER BY am.score DESC`,
      [alertId]
    );

    // Mark all matches as read
    await query(
      "UPDATE alert_matches SET read_at = NOW() WHERE alert_id = $1 AND read_at IS NULL",
      [alertId]
    );

    return NextResponse.json({
      alert,
      matches: (matches as Record<string, unknown>[]).map((m) => ({
        ...m,
        characteristics: m.characteristics
          ? JSON.parse(m.characteristics as string)
          : [],
        details: m.details ? JSON.parse(m.details as string) : {},
        reasons: m.reasons ? JSON.parse(m.reasons as string) : [],
        image: m.cover_image || m.first_image || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching alert details:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1 AND user_id = $2",
      [alertId, user.id]
    );

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      is_active,
      profile_name,
      prompt,
      property_type,
      max_price,
      min_area,
      city,
      state,
      min_bedrooms,
      must_have_characteristics,
    } = body;

    // Build update query dynamically
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(is_active ? 1 : 0);
    }
    if (profile_name !== undefined) {
      setClauses.push(`profile_name = $${paramIndex++}`);
      values.push(profile_name);
    }
    if (prompt !== undefined) {
      setClauses.push(`prompt = $${paramIndex++}`);
      values.push(prompt);
    }
    if (property_type !== undefined) {
      setClauses.push(`property_type = $${paramIndex++}`);
      values.push(property_type);
    }
    if (max_price !== undefined) {
      setClauses.push(`max_price = $${paramIndex++}`);
      values.push(max_price != null ? Number(max_price) : null);
    }
    if (min_area !== undefined) {
      setClauses.push(`min_area = $${paramIndex++}`);
      values.push(min_area != null ? Number(min_area) : null);
    }
    if (city !== undefined) {
      setClauses.push(`city = $${paramIndex++}`);
      values.push(city);
    }
    if (state !== undefined) {
      setClauses.push(`state = $${paramIndex++}`);
      values.push(state);
    }
    if (min_bedrooms !== undefined) {
      setClauses.push(`min_bedrooms = $${paramIndex++}`);
      values.push(min_bedrooms != null ? Number(min_bedrooms) : null);
    }
    if (must_have_characteristics !== undefined) {
      setClauses.push(`must_have_characteristics = $${paramIndex++}`);
      values.push(
        Array.isArray(must_have_characteristics) ? must_have_characteristics : null
      );
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    values.push(alertId);
    await query(
      `UPDATE search_alerts SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    const updated = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1",
      [alertId]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1 AND user_id = $2",
      [alertId, user.id]
    );

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await query("DELETE FROM search_alerts WHERE id = $1", [alertId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
