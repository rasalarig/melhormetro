import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = db
      .prepare("SELECT * FROM search_alerts WHERE id = ? AND user_id = ?")
      .get(alertId, user.id) as Record<string, unknown> | undefined;

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    // Get matches with property data
    const matches = db
      .prepare(
        `SELECT am.*, p.title, p.description, p.price, p.area, p.type,
          p.address, p.city, p.state, p.neighborhood, p.characteristics,
          p.details, p.status as property_status,
          (SELECT pi.filename FROM property_images pi WHERE pi.property_id = p.id AND pi.is_cover = 1 LIMIT 1) as cover_image,
          (SELECT pi.filename FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as first_image
        FROM alert_matches am
        JOIN properties p ON am.property_id = p.id
        WHERE am.alert_id = ?
        ORDER BY am.score DESC`
      )
      .all(alertId);

    // Mark all matches as seen
    db.prepare("UPDATE alert_matches SET seen = 1 WHERE alert_id = ?").run(
      alertId
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
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = db
      .prepare("SELECT * FROM search_alerts WHERE id = ? AND user_id = ?")
      .get(alertId, user.id);

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    const body = await request.json();
    const { is_active } = body;

    if (typeof is_active !== "boolean") {
      return NextResponse.json(
        { error: "is_active must be a boolean" },
        { status: 400 }
      );
    }

    db.prepare("UPDATE search_alerts SET is_active = ? WHERE id = ?").run(
      is_active ? 1 : 0,
      alertId
    );

    const updated = db
      .prepare("SELECT * FROM search_alerts WHERE id = ?")
      .get(alertId);

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
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alertId = parseInt(params.id);
    if (isNaN(alertId)) {
      return NextResponse.json({ error: "Invalid alert ID" }, { status: 400 });
    }

    // Check ownership
    const alert = db
      .prepare("SELECT * FROM search_alerts WHERE id = ? AND user_id = ?")
      .get(alertId, user.id);

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    db.prepare("DELETE FROM search_alerts WHERE id = ?").run(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: "Failed to delete alert" },
      { status: 500 }
    );
  }
}
