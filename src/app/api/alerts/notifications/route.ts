import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getOne, query, getAll } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ unseen_count: 0 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";

    if (unreadOnly) {
      // Return only the count of unread matches
      const result = (await getOne(
        `SELECT COUNT(*) as unseen_count
        FROM alert_matches am
        JOIN search_alerts sa ON am.alert_id = sa.id
        WHERE sa.user_id = $1 AND am.read_at IS NULL`,
        [user.id]
      )) as { unseen_count: string };

      return NextResponse.json({
        unseen_count: parseInt(result?.unseen_count ?? "0", 10),
      });
    }

    // Return full notification list
    const matches = await getAll(
      `SELECT am.id, am.alert_id, am.property_id, am.score, am.reasons,
              am.read_at, am.created_at,
              sa.profile_name, sa.prompt,
              p.title, p.price, p.area, p.type, p.city, p.state, p.neighborhood,
              COALESCE(
                (SELECT tm.media_url FROM tour_media tm
                 JOIN property_tours pt ON tm.tour_id = pt.id
                 WHERE pt.property_id = p.id AND pt.is_original = TRUE AND pt.status = 'active'
                   AND tm.media_type = 'image'
                 ORDER BY tm.display_order ASC LIMIT 1),
                (SELECT pi.filename FROM property_images pi
                 WHERE pi.property_id = p.id
                 ORDER BY pi.is_cover DESC, pi.id ASC LIMIT 1)
              ) AS cover_image
      FROM alert_matches am
      JOIN search_alerts sa ON am.alert_id = sa.id
      JOIN properties p ON am.property_id = p.id
      WHERE sa.user_id = $1
      ORDER BY am.created_at DESC
      LIMIT 50`,
      [user.id]
    );

    return NextResponse.json({
      unseen_count: matches.filter((m: Record<string, unknown>) => !m.read_at).length,
      matches: (matches as Record<string, unknown>[]).map((m) => ({
        ...m,
        reasons: m.reasons ? JSON.parse(m.reasons as string) : [],
        is_new: !m.read_at,
      })),
    });
  } catch (error) {
    console.error("Error fetching alert notifications:", error);
    return NextResponse.json({ unseen_count: 0 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { match_ids } = body;

    if (!Array.isArray(match_ids) || match_ids.length === 0) {
      return NextResponse.json(
        { error: "match_ids array is required" },
        { status: 400 }
      );
    }

    // Only mark matches belonging to this user's alerts
    await query(
      `UPDATE alert_matches am
       SET read_at = NOW()
       FROM search_alerts sa
       WHERE am.alert_id = sa.id
         AND sa.user_id = $1
         AND am.id = ANY($2::int[])
         AND am.read_at IS NULL`,
      [user.id, match_ids]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking matches as read:", error);
    return NextResponse.json(
      { error: "Failed to mark matches as read" },
      { status: 500 }
    );
  }
}
