import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json({ unseen_count: 0 });
    }

    const result = db
      .prepare(
        `SELECT COUNT(*) as unseen_count
        FROM alert_matches am
        JOIN search_alerts sa ON am.alert_id = sa.id
        WHERE sa.user_id = ? AND am.seen = 0`
      )
      .get(user.id) as { unseen_count: number };

    return NextResponse.json({ unseen_count: result.unseen_count });
  } catch (error) {
    console.error("Error fetching alert notifications:", error);
    return NextResponse.json({ unseen_count: 0 });
  }
}
