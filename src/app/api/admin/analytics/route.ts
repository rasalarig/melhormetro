import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAll, getOne } from "@/lib/db";

export const dynamic = "force-dynamic";

const UMAMI_API = "https://api.umami.is/v1";

async function umamiGet(path: string) {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!apiKey || !websiteId) {
    return null;
  }
  const res = await fetch(`${UMAMI_API}/websites/${websiteId}${path}`, {
    headers: { "x-umami-api-key": apiKey, "Accept": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  // Admin auth check
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "stats";

  // Handle users type — queries DB directly, no Umami needed
  if (type === "users") {
    try {
      const [
        totalRow,
        todayRow,
        weekRow,
        monthRow,
        byProfile,
        byProvider,
        recentUsers,
        mostActive,
      ] = await Promise.all([
        getOne(`SELECT COUNT(*) as count FROM users`),
        getOne(`SELECT COUNT(*) as count FROM users WHERE created_at >= CURRENT_DATE`),
        getOne(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
        getOne(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`),
        getAll(`SELECT profile_type as type, COUNT(*) as count FROM user_profiles GROUP BY profile_type ORDER BY count DESC`),
        getAll(`SELECT COALESCE(provider, 'local') as provider, COUNT(*) as count FROM users GROUP BY provider ORDER BY count DESC`),
        getAll(`SELECT u.id, u.name, u.email, u.provider, u.is_premium, u.created_at, COALESCE(array_agg(DISTINCT up.profile_type) FILTER (WHERE up.profile_type IS NOT NULL), '{}') as profiles FROM users u LEFT JOIN user_profiles up ON up.user_id = u.id GROUP BY u.id ORDER BY u.created_at DESC LIMIT 10`),
        getAll(`SELECT u.id, u.name, u.email, COUNT(ee.id) as event_count, COALESCE(SUM(CASE ee.event_type WHEN 'view_half' THEN 10 WHEN 'view_complete' THEN 25 WHEN 'like' THEN 15 WHEN 'share' THEN 20 WHEN 'click_details' THEN 30 WHEN 'click_whatsapp' THEN 35 WHEN 'click_buy' THEN 50 ELSE 0 END), 0) as score FROM users u JOIN engagement_events ee ON ee.user_id = u.id WHERE ee.created_at >= NOW() - INTERVAL '30 days' GROUP BY u.id ORDER BY score DESC LIMIT 10`),
      ]);

      return NextResponse.json({
        totalUsers: parseInt(totalRow?.count ?? "0", 10),
        newToday: parseInt(todayRow?.count ?? "0", 10),
        newThisWeek: parseInt(weekRow?.count ?? "0", 10),
        newThisMonth: parseInt(monthRow?.count ?? "0", 10),
        byProfile: byProfile.map((r) => ({ type: r.type, count: parseInt(r.count, 10) })),
        byProvider: byProvider.map((r) => ({ provider: r.provider, count: parseInt(r.count, 10) })),
        recentUsers,
        mostActive: mostActive.map((r) => ({ ...r, event_count: parseInt(r.event_count, 10), score: parseInt(r.score, 10) })),
      });
    } catch (err) {
      console.error("Users analytics error:", err);
      return NextResponse.json({ error: "Erro ao consultar usuários" }, { status: 500 });
    }
  }

  // For all Umami-based types, check config first
  if (!process.env.UMAMI_API_KEY || !process.env.UMAMI_WEBSITE_ID) {
    return NextResponse.json(
      { error: "Analytics não configurado. Adicione UMAMI_API_KEY e UMAMI_WEBSITE_ID nas variáveis de ambiente." },
      { status: 503 }
    );
  }

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const startAt = searchParams.get("startAt") || String(thirtyDaysAgo);
  const endAt = searchParams.get("endAt") || String(now);
  const unit = searchParams.get("unit") || "day";

  let data;
  switch (type) {
    case "active":
      data = await umamiGet("/active");
      break;
    case "stats":
      data = await umamiGet(`/stats?startAt=${startAt}&endAt=${endAt}`);
      break;
    case "pageviews":
      data = await umamiGet(`/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=America/Sao_Paulo`);
      break;
    case "pages":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=url`);
      break;
    case "referrers":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=referrer`);
      break;
    case "devices":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=device`);
      break;
    case "browsers":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=browser`);
      break;
    case "os":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=os`);
      break;
    case "countries":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=country`);
      break;
    case "cities":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=city`);
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (data === null) {
    return NextResponse.json({ error: "Falha ao consultar analytics" }, { status: 502 });
  }

  return NextResponse.json(data);
}
