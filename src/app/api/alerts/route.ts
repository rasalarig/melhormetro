import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, getOne, getAll } from "@/lib/db";
import {
  runAlertAgainstAllProperties,
  runProfileAlertAgainstAllProperties,
} from "@/lib/alerts";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await getAll(
      `SELECT sa.*,
        (SELECT COUNT(*) FROM alert_matches am WHERE am.alert_id = sa.id AND am.read_at IS NULL) as unseen_count,
        (SELECT COUNT(*) FROM alert_matches am WHERE am.alert_id = sa.id) as total_matches
      FROM search_alerts sa
      WHERE sa.user_id = $1
      ORDER BY sa.created_at DESC`,
      [user.id]
    );

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      prompt,
      profile_name,
      property_type,
      max_price,
      min_area,
      city,
      state,
      min_bedrooms,
      must_have_characteristics,
    } = body;

    // At least a prompt or one structured field must be provided
    const hasPrompt = prompt && typeof prompt === "string" && prompt.trim().length > 0;
    const hasStructured =
      profile_name || property_type || max_price || min_area || city || state ||
      min_bedrooms || (Array.isArray(must_have_characteristics) && must_have_characteristics.length > 0);

    if (!hasPrompt && !hasStructured) {
      return NextResponse.json(
        { error: "Provide a search description or at least one interest profile field" },
        { status: 400 }
      );
    }

    const trimmedPrompt = hasPrompt ? (prompt as string).trim() : "";

    // Sanitize must_have_characteristics
    const chars =
      Array.isArray(must_have_characteristics) && must_have_characteristics.length > 0
        ? must_have_characteristics.filter((c: unknown) => typeof c === "string")
        : null;

    const result = await getOne(
      `INSERT INTO search_alerts
        (user_id, prompt, profile_name, property_type, max_price, min_area, city, state, min_bedrooms, must_have_characteristics)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        user.id,
        trimmedPrompt,
        profile_name || null,
        property_type || null,
        max_price != null ? Number(max_price) : null,
        min_area != null ? Number(min_area) : null,
        city || null,
        state || null,
        min_bedrooms != null ? Number(min_bedrooms) : null,
        chars,
      ]
    );

    const alertId = Number(result.id);

    // Run matching against existing properties
    let matchCount = 0;
    if (hasStructured) {
      const alertRow = {
        id: alertId,
        user_id: user.id,
        prompt: trimmedPrompt,
        is_active: 1,
        created_at: new Date().toISOString(),
        profile_name: profile_name || null,
        property_type: property_type || null,
        max_price: max_price != null ? Number(max_price) : null,
        min_area: min_area != null ? Number(min_area) : null,
        city: city || null,
        state: state || null,
        min_bedrooms: min_bedrooms != null ? Number(min_bedrooms) : null,
        must_have_characteristics: chars,
      };
      matchCount = await runProfileAlertAgainstAllProperties(alertId, alertRow);
    } else {
      matchCount = await runAlertAgainstAllProperties(alertId, trimmedPrompt);
    }

    const alert = await getOne("SELECT * FROM search_alerts WHERE id = $1", [alertId]);

    return NextResponse.json(
      { ...(alert as Record<string, unknown>), initial_matches: matchCount },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating alert:", error);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      alert_id,
      profile_name,
      prompt,
      property_type,
      max_price,
      min_area,
      city,
      state,
      min_bedrooms,
      must_have_characteristics,
      is_active,
    } = body;

    if (!alert_id) {
      return NextResponse.json({ error: "alert_id is required" }, { status: 400 });
    }

    // Check ownership
    const existing = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1 AND user_id = $2",
      [alert_id, user.id]
    );

    if (!existing) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const chars =
      Array.isArray(must_have_characteristics) && must_have_characteristics.length > 0
        ? must_have_characteristics.filter((c: unknown) => typeof c === "string")
        : must_have_characteristics === null
        ? null
        : undefined;

    await query(
      `UPDATE search_alerts SET
        profile_name = COALESCE($1, profile_name),
        prompt = COALESCE($2, prompt),
        property_type = COALESCE($3, property_type),
        max_price = COALESCE($4, max_price),
        min_area = COALESCE($5, min_area),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        min_bedrooms = COALESCE($8, min_bedrooms),
        must_have_characteristics = COALESCE($9, must_have_characteristics),
        is_active = COALESCE($10, is_active)
       WHERE id = $11`,
      [
        profile_name !== undefined ? profile_name : null,
        prompt !== undefined ? prompt.trim() : null,
        property_type !== undefined ? property_type : null,
        max_price !== undefined ? (max_price != null ? Number(max_price) : null) : null,
        min_area !== undefined ? (min_area != null ? Number(min_area) : null) : null,
        city !== undefined ? city : null,
        state !== undefined ? state : null,
        min_bedrooms !== undefined ? (min_bedrooms != null ? Number(min_bedrooms) : null) : null,
        chars !== undefined ? chars : null,
        is_active !== undefined ? (is_active ? 1 : 0) : null,
        alert_id,
      ]
    );

    const updated = await getOne("SELECT * FROM search_alerts WHERE id = $1", [alert_id]);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating alert:", error);
    return NextResponse.json(
      { error: "Failed to update alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { alert_id } = body;

    if (!alert_id) {
      return NextResponse.json(
        { error: "alert_id is required" },
        { status: 400 }
      );
    }

    // Check ownership
    const alert = await getOne(
      "SELECT * FROM search_alerts WHERE id = $1 AND user_id = $2",
      [alert_id, user.id]
    );

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    await query("DELETE FROM search_alerts WHERE id = $1", [alert_id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
